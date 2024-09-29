// TranscriptComposition.tsx
import React, { useEffect, useRef } from "react"
import { Audio, useCurrentFrame, useVideoConfig } from "remotion"
import { chakra, Box } from "@chakra-ui/react"

interface WordData {
  word: string
  start: number
  end: number
  confidence: number
  punctuated_word: string
}

interface TranscriptCompositionProps {
  words: WordData[]
  totalDuration: number
}

const TranscriptComposition: React.FC<TranscriptCompositionProps> = ({
  words,
  totalDuration
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const currentTime = frame / fps

  // Filter words up to the current time
  const displayedWords = words.filter(word => word.start <= currentTime)

  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the latest word
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth
    }
  }, [displayedWords])

  return (
    <>
      <Audio src="/audio.mp3" />
      <Box
        ref={containerRef}
        display="flex"
        flexDirection="row"
        alignItems="center"
        overflowX="auto"
        whiteSpace="nowrap"
        width="100%"
        height="100%"
        p={4}
        boxSizing="border-box"
      >
        {displayedWords.map((word, index) => (
          <chakra.span
            key={index}
            p={1}
            borderRadius="md"
            _hover={{ bg: "whiteAlpha.200" }}
          >
            {word.punctuated_word + " "}
          </chakra.span>
        ))}
      </Box>
    </>
  )
}

export default TranscriptComposition
