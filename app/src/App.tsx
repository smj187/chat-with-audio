import React, { useState, useEffect, useRef } from "react"
import { Box, Divider, Flex, Text, chakra } from "@chakra-ui/react"

interface Metadata {
  text: string
  start: number
  end: number
}

interface SentenceData {
  sentences: Metadata[]
  num_words: number
  start: number
  end: number
}

function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [transcription, setTranscription] = useState<SentenceData[]>([])

  // Define the highlighted time ranges
  const highlighted = [
    { end: 219.455, start: 0.08 },
    { end: 417.705, start: 198.88 },
    { end: 593.72, start: 383.275 }
  ]

  useEffect(() => {
    // Fetch the transcription data from the public folder
    fetch("/data.json")
      .then(response => response.json())
      .then((data: SentenceData[]) => {
        setTranscription(data)
      })
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const timeUpdateHandler = () => {
      setCurrentTime(audio.currentTime)
    }

    audio.addEventListener("timeupdate", timeUpdateHandler)

    return () => {
      audio.removeEventListener("timeupdate", timeUpdateHandler)
    }
  }, [])

  const handleSentenceClick = (startTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime
      audioRef.current.play()
    }
  }

  // Function to check if a sentence is within any highlighted range
  const isSentenceHighlighted = (
    sentenceStart: number,
    sentenceEnd: number
  ) => {
    return highlighted.some(
      range => sentenceStart < range.end && sentenceEnd > range.start
    )
  }

  return (
    <Flex flexDirection="column" bg="#171717" color="white" p={4}>
      <Box h="120px">
        <audio ref={audioRef} controls src="/audio.mp3"></audio>
      </Box>
      <Divider my={4} />

      <Box minH="calc(100vh - 200px)" overflow="auto">
        <Box overflow="auto" h="100%">
          {transcription.map((paragraph, paragraphIndex) => (
            <Box key={paragraphIndex} mb={4}>
              <Text as="p">
                {paragraph.sentences.map((sentence, sentenceIndex) => {
                  const isActive =
                    currentTime >= sentence.start && currentTime <= sentence.end
                  const isHighlighted = isSentenceHighlighted(
                    sentence.start,
                    sentence.end
                  )

                  // Determine the background color
                  let bgColor = "transparent"
                  if (isActive) {
                    bgColor = "whiteAlpha.300"
                  } else if (isHighlighted) {
                    bgColor = "messenger.700"
                  }

                  return (
                    <chakra.span
                      key={sentenceIndex}
                      cursor="pointer"
                      onClick={() => handleSentenceClick(sentence.start)}
                      bg={bgColor}
                      _hover={{
                        bg: "whiteAlpha.200",
                        ring: "1px",
                        ringColor: "whiteAlpha.100"
                      }}
                      p={1}
                      borderRadius="md"
                    >
                      {sentence.text + " "}
                    </chakra.span>
                  )
                })}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Flex>
  )
}

export default App

