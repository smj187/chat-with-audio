from fastapi import FastAPI, File, UploadFile, Form, Request
from dotenv import load_dotenv
import os
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    PrerecordedOptions,
    FileSource,
)
import httpx
import json
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.docstore.document import Document
from langchain.vectorstores import Pinecone
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
import tiktoken
from pinecone import Pinecone
import os
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


# NOTE: there was an update and now the Pinecone client requires the following simplified setup
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = "chatbot"
index = pc.Index(index_name)


app = FastAPI()
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = DeepgramClientOptions(verbose=0)
deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"), config)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/transcribe")
async def transcribe_audio(key: str = Form(...), file: UploadFile = File(...)):
    audio_bytes = await file.read()
    payload: FileSource = {
        "buffer": audio_bytes,
        "mimetype": file.content_type,
    }

    options = PrerecordedOptions(
        model="nova-2",
        language="en",
        summarize="v2",
        topics=False,  # use this later
        smart_format=True,
        punctuate=True,
        paragraphs=True,
    )

    response = deepgram.listen.prerecorded.v("1").transcribe_file(payload, options)

    summary = response["results"]["summary"]
    return response["results"]


def chunk_paragraphs_func(paragraphs):
    documents = []
    for paragraph in paragraphs:
        for sentence in paragraph.get("sentences", []):
            doc = Document(
                page_content=sentence["text"],
                metadata={
                    "start": sentence["start"],
                    "end": sentence["end"],
                },
            )
            documents.append(doc)

    def count_tokens(text, model_name="text-embedding-ada-002"):
        encoding = tiktoken.encoding_for_model(model_name)
        return len(encoding.encode(text))

    sentences = []
    for doc in documents:
        text = doc.page_content
        tokens = count_tokens(text)
        sentences.append({"text": text, "tokens": tokens, "metadata": doc.metadata})

    max_tokens = 1000
    overlap_tokens = 100
    chunks = []
    current_chunk = []
    current_token_count = 0

    for sentence in sentences:
        sentence_tokens = sentence["tokens"]
        if current_token_count + sentence_tokens > max_tokens:
            chunk_text = " ".join([s["text"] for s in current_chunk])
            chunk_metadata = {
                "start": current_chunk[0]["metadata"]["start"],
                "end": current_chunk[-1]["metadata"]["end"],
            }
            chunk_doc = Document(page_content=chunk_text, metadata=chunk_metadata)
            chunks.append(chunk_doc)

            overlap = []
            overlap_token_count = 0
            i = len(current_chunk) - 1
            while i >= 0 and overlap_token_count < overlap_tokens:
                overlap.insert(0, current_chunk[i])
                overlap_token_count += current_chunk[i]["tokens"]
                i -= 1
            current_chunk = overlap.copy()
            current_token_count = overlap_token_count

        current_chunk.append(sentence)
        current_token_count += sentence_tokens

    if current_chunk:
        chunk_text = " ".join([s["text"] for s in current_chunk])
        chunk_metadata = {
            "start": current_chunk[0]["metadata"]["start"],
            "end": current_chunk[-1]["metadata"]["end"],
        }
        chunk_doc = Document(page_content=chunk_text, metadata=chunk_metadata)
        chunks.append(chunk_doc)

    return chunks


def insert_into_pinecone(chunks):
    embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")
    texts = [chunk.page_content for chunk in chunks]
    metadatas = [chunk.metadata for chunk in chunks]

    batch_size = 100
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i : i + batch_size]
        batch_embeddings = embeddings.embed_documents(batch_texts)
        all_embeddings.extend(batch_embeddings)

    vectors = []
    for i, (embedding, metadata) in enumerate(zip(all_embeddings, metadatas)):
        vector_id = f"vec_{i}"
        metadata["text"] = texts[i]
        vectors.append({"id": vector_id, "values": embedding, "metadata": metadata})

    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        index.upsert(vectors=batch)


def chunk_paragraphs_func_insert_pinecone(paragraphs):
    chunks = chunk_paragraphs_func(paragraphs)
    insert_into_pinecone(chunks)
    return len(chunks)


@app.post("/chunk")
async def chunk_paragraphs(request: Request):
    data = await request.json()
    paragraphs = data.get("paragraphs")
    num_chunks = chunk_paragraphs_func_insert_pinecone(paragraphs)
    return {"num_chunks": num_chunks}


import re
import json
from sentence_transformers import SentenceTransformer, util
import pandas as pd
import torch

from langchain.vectorstores import Pinecone
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA

embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")
vectorstore = Pinecone(index, embeddings.embed_query, "text")
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0)


template = """
The answer should be short, concise and directly related to the question and not contain filler words. 
Given the following information, answer the question. 
Use the information from the documents to support your answer. 
Do not use any external information or make up any information. 
If you don't know the answer, write "I don't know".


Context:
{context}

Question: {question}
Answer:
"""

prompt = PromptTemplate(template=template, input_variables=["context", "question"])

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",  # You can also try "map_reduce" or "refine" if needed
    retriever=retriever,
    return_source_documents=True,
    chain_type_kwargs={"prompt": prompt},
)


@app.post("/ask")
async def chat(request: Request):
    data = await request.json()
    question = data.get("question")

    with open("./data/paragraphs.json", "r", encoding="utf-8") as json_file:
        paragraphs = json.load(json_file)

    result = qa_chain(question)
    print("Answer:", result["result"])

    # Load the sentence transformer model
    model = SentenceTransformer(
        "sentence-transformers/all-mpnet-base-v2"
    )  # Upgraded model

    # Load paragraphs.json
    with open("./data/paragraphs.json", "r", encoding="utf-8") as json_file:
        paragraphs = json.load(json_file)

    # Extract sentences and their timestamps from paragraphs.json
    text_sentences = []
    timestamps = []

    for paragraph in paragraphs:
        for sentence in paragraph["sentences"]:
            text_sentences.append(sentence["text"])
            timestamps.append((sentence["start"], sentence["end"]))

    # Assuming 'result' contains the answer text that you want to find matches for
    answer = result["result"]

    # Split the answer into sentences using a simple regex-based approach
    def split_into_sentences(text):
        # This splits on punctuation that usually ends a sentence followed by space
        return re.split(r"(?<=[.!?])\s+", text)

    # Split the answer into sentences
    answer_sentences = split_into_sentences(answer)

    # Encode sentences from the text once
    text_embeddings = model.encode(text_sentences, convert_to_tensor=True)

    # Prepare a list to hold all matching results
    all_matches = []

    # For each sentence in the answer, find the top 3 most similar sentences in the text
    for ans_sentence in answer_sentences:
        ans_embedding = model.encode(ans_sentence, convert_to_tensor=True)
        # Compute cosine similarities between the answer sentence and all text sentences
        cosine_scores = util.cos_sim(ans_embedding, text_embeddings)[0]
        # Get the top 3 matches
        top_results = torch.topk(cosine_scores, k=3)
        for idx, score in zip(top_results.indices, top_results.values):
            all_matches.append(
                {
                    "matched": text_sentences[idx],
                    "score": score.item(),
                    "start": timestamps[idx][0],
                    "end": timestamps[idx][1],
                }
            )

    all_matches = sorted(all_matches, key=lambda x: x["score"])
    top_matches = all_matches[:10]
    top_matches_json = json.dumps(top_matches, indent=2)
    # print(top_matches_json)
    return {
        "top_matches": top_matches,
        "answer": result["result"],
    }
