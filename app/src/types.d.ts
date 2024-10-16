export interface TranscriptionResponse {
  channels: Channel[]
  utterances: any
  summary: Summary
  sentiments: any
  topics: any
  intents: any
}

export interface Channel {
  search: any
  alternatives: Alterna[]
  detected_language: any
  language_confidence: any
}

export interface Alterna {
  transcript: string
  confidence: number
  words: Word[]
  summaries: any
  paragraphs: Paragraphs
  entities: any
  translations: any
  languages: any
}

export interface Word {
  word: string
  start: number
  end: number
  confidence: number
  punctuated_word: string
  speaker: any
  language: any
  speaker_confidence: any
  sentiment: any
  sentiment_score: any
}

export interface Paragraphs {
  transcript: string
  paragraphs: Paragraph[]
}

export interface Paragraph {
  sentences: Sentence[]
  start: number
  end: number
  num_words: number
  speaker: any
  sentiment: any
  sentiment_score: any
}

export interface Sentence {
  text: string
  start: number
  end: number
  sentiment: any
  sentiment_score: any
}

export interface Summary {
  result: string
  short: string
}

export interface ProjectResponseModel {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string | null
}

export interface ProjectDetailResponseModel {
  id: string
  name: string
  user_id: string
  audio_file_url: string
  transcription_file_url: string
  created_at: string
  updated_at: string | null
  duration: number
}

export interface AskQuestionResponseModel {
  answer: string
  matches: AskQuestionMatch[]
}

export interface AskQuestionMatch {
  score: number
  start: number
  end: number
}
