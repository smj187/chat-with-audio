import os
import re
import requests
import torch
import tiktoken
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
from pinecone import Pinecone
from langchain.docstore.document import Document
from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_community.embeddings import OpenAIEmbeddings


load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if not os.getenv("PINECONE_API_KEY"):
    print("ERROR")

pinecone_api_key = os.environ.get("PINECONE_API_KEY")

pc = Pinecone(api_key=pinecone_api_key)
index_name = "chatbot"
pinecone_index = pc.Index(
    index_name,
)


embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")
model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")


class Sentence(BaseModel):
    text: str
    start: float
    end: float


class Paragraph(BaseModel):
    sentences: List[Sentence]


class UpsertRequestModel(BaseModel):
    url: str
    project_id: str


class ChunkMetadata(BaseModel):
    start: float
    end: float


class Chunk(BaseModel):
    page_content: str
    metadata: ChunkMetadata


@app.post("/upsert")
async def upsert_data(request: UpsertRequestModel):
    max_tokens = 1000  # Maximum tokens per chunk
    overlap_tokens = 100  # Tokens to overlap between chunks

    url = request.url
    response = requests.get(url)
    requestJson = response.json()

    documents = []
    for paragraph in requestJson.get("paragraphs", []):
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

    chunks = []
    current_chunk = []
    current_token_count = 0

    for _, sentence in enumerate(sentences):
        sentence_tokens = sentence["tokens"]
        if current_token_count + sentence_tokens > max_tokens:
            chunk_text = " ".join([s["text"] for s in current_chunk])
            chunk_metadata = {
                "start": current_chunk[0]["metadata"]["start"],
                "end": current_chunk[-1]["metadata"]["end"],
            }
            chunk_doc = Document(page_content=chunk_text, metadata=chunk_metadata)
            chunks.append(chunk_doc)

            # Start new chunk with overlap
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

    print(f"Number of chunks created: {len(chunks)}")
    print(f"Total token count: {current_token_count}")

    # create batch embeddings
    batch_size = 100
    all_embeddings = []
    embeddings = OpenAIEmbeddings(model="text-embedding-ada-002")
    texts = [chunk.page_content for chunk in chunks]
    metadatas = [chunk.metadata for chunk in chunks]
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i : i + batch_size]
        batch_embeddings = embeddings.embed_documents(batch_texts)
        all_embeddings.extend(batch_embeddings)

    # Upsert vectors into Pinecone in batches, specifying the namespace
    vectors = []
    for i, (embedding, metadata) in enumerate(zip(all_embeddings, metadatas)):
        vector_id = f"vec_{i}"
        metadata["text"] = texts[i]
        vectors.append({"id": vector_id, "values": embedding, "metadata": metadata})

    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        pinecone_index.upsert(vectors=batch, namespace=request.project_id)

    print(f"Data successfully inserted into Pinecone for project {request.project_id}.")

    return {
        # "inserted": len(vectors),
        "num_chunks": len(chunks),
        "total_tokens": current_token_count,
        "chunks": chunks,
    }


class AskRequestModel(BaseModel):
    question: str
    url: str
    project_id: str


@app.post("/ask")
async def chat(request: AskRequestModel):

    vectorstore = Pinecone(pinecone_index, embeddings.embed_query, "text")
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

    result = qa_chain(request.question)
    print("Answer:", result["result"])

    print("\n\n---------------------------------------------------------")
    for doc in result["source_documents"]:
        print(f"Text: {doc.page_content[:200]}")
        print(f"Metadata: {doc.metadata}")
        print("---")

    response = requests.get(request.url)
    requestJson = response.json()

    sentences = []
    timestamps = []

    for paragraph in requestJson.get("paragraphs", []):
        for sentence in paragraph.get("sentences", []):
            sentences.append(sentence["text"])
            timestamps.append((sentence["start"], sentence["end"]))

    def split_into_sentences(text):
        return re.split(r"(?<=[.!?])\s+", text)

    answer = result["result"]
    answer_sentences = split_into_sentences(answer)

    text_embeddings = model.encode(sentences, convert_to_tensor=True)

    all_matches = []

    for ans_sentence in answer_sentences:
        ans_embedding = model.encode(ans_sentence, convert_to_tensor=True)
        cosine_scores = util.cos_sim(ans_embedding, text_embeddings)[0]
        top_results = torch.topk(cosine_scores, k=10)

        for idx, score in zip(top_results.indices, top_results.values):
            all_matches.append(
                {
                    "score": score.item(),
                    "start": timestamps[idx][0],
                    "end": timestamps[idx][1],
                }
            )

    all_matches = sorted(all_matches, key=lambda x: x["score"], reverse=True)

    top_matches = all_matches[:10]
    return {
        "answer": answer,
        "matches": top_matches,
    }


@app.get("/")
async def root():
    return {"status": "running"}
