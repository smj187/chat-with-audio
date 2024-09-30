import { useState, useEffect, useRef } from "react"
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  chakra
} from "@chakra-ui/react"
import { AudioWaveForm } from "./audio-wave-form"
import { throttle } from "lodash"

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

interface ApiAnswerResponse {
  answer: string
  top_matches: {
    matched: string
    score: number
    start: number
    end: number
  }[]
}
interface AudioSegment {
  label: string
  start: number
  end: number
}

function App() {
  const audioElementRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [transcription, setTranscription] = useState<SentenceData[]>([])
  const [segments, setSegments] = useState<AudioSegment[]>([])

  // Ref to store sentence refs
  const sentenceRefs = useRef<Map<number, HTMLSpanElement | null>>(new Map())
  const [messages, setMessages] = useState<
    { message: string; type: "question" | "response" }[]
  >([
    // {
    //   message: "Hello! How can I help you?",
    //   type: "question"
    // },
    // {
    //   message: "Sure just give me a moment to process that...",
    //   type: "response"
    // }
  ])

  // State to track the currently active sentence key
  const [activeSentenceKey, setActiveSentenceKey] = useState<number | null>(
    null
  )

  useEffect(() => {
    fetch("/data.json")
      .then(response => response.json())
      .then((data: SentenceData[]) => {
        setTranscription(data)
      })
  }, [])

  useEffect(() => {
    const audio = audioElementRef.current
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
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = startTime
      audioElementRef.current.play()
    }
  }

  // Function to set refs for sentences
  const setSentenceRef = (
    paragraphIndex: number,
    sentenceIndex: number,
    element: HTMLSpanElement | null
  ) => {
    const key = paragraphIndex * 1000 + sentenceIndex // Assuming max 1000 sentences per paragraph
    sentenceRefs.current.set(key, element)
  }

  useEffect(() => {
    if (!audioElementRef.current) return

    const isPlaying = !audioElementRef.current.paused

    if (!isPlaying) return // Only scroll when audio is playing

    if (transcription.length === 0) return

    const handleScroll = throttle(() => {
      let found = false
      for (let p = 0; p < transcription.length; p++) {
        const paragraph = transcription[p]
        for (let s = 0; s < paragraph.sentences.length; s++) {
          const sentence = paragraph.sentences[s]
          if (currentTime >= sentence.start && currentTime <= sentence.end) {
            const key = p * 1000 + s
            if (activeSentenceKey !== key) {
              setActiveSentenceKey(key)
              const sentenceElement = sentenceRefs.current.get(key)
              if (sentenceElement) {
                sentenceElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center"
                })
              }
            }
            found = true
            break
          }
        }
        if (found) break
      }

      // Optionally, handle cases where no sentence is active
      if (!found && activeSentenceKey !== null) {
        setActiveSentenceKey(null)
      }
    }, 100) // Adjust the throttle delay as needed

    handleScroll()

    return () => {
      handleScroll.cancel()
    }
  }, [currentTime, transcription, activeSentenceKey])

  const [value, setValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const ask = async () => {
    setMessages(prev => [...prev, { type: "question", message: value }])
    setIsLoading(true)
    setValue("")
    const question = value

    try {
      const response = await fetch("http://localhost:8080/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question })
      })

      const data = await response.json()

      const apiResponse = data as ApiAnswerResponse
      console.log(apiResponse)
      setMessages(prev => [
        ...prev,
        { type: "response", message: apiResponse.answer }
      ])

      setSegments(
        apiResponse.top_matches.map(s => ({
          end: s.end,
          start: s.start,
          label: s.matched,
          matched: s.matched,
          score: s.score
        }))
      )

      // Optionally reset the input value
      // setValue("");
    } catch (error) {
      console.error("Error fetching segments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex
      flexDirection="column"
      bg="#171717"
      color="rgb(250, 250, 250)"
      h="100vh"
    >
      <Flex h="100%" overflow="hidden">
        <Flex
          flexDirection="column"
          h="100%"
          overflow="auto"
          flex="1"
          py="6"
          bg="whiteAlpha.50"
        >
          <Tabs px="6">
            <TabList>
              <Tab>Full Text</Tab>
              <Tab>Highlighted Paragraphs</Tab>
              <Tab>Summarization</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px="3">
                <Box h="100%" overflow="auto">
                  {transcription.map((paragraph, paragraphIndex) => {
                    return (
                      <Box key={paragraphIndex} mb={4}>
                        <Text as="p">
                          {paragraph.sentences.map(
                            (sentence, sentenceIndex) => {
                              const isActive =
                                currentTime >= sentence.start &&
                                currentTime <= sentence.end
                              const isHighlighted = segments.some(
                                range =>
                                  sentence.start < range.end &&
                                  sentence.end > range.start
                              )

                              // Determine the background color
                              let bgColor = "transparent"
                              if (isActive) {
                                bgColor = "purple.400"
                              } else if (isHighlighted) {
                                bgColor = "whiteAlpha.400"
                              }

                              return (
                                <chakra.span
                                  key={sentenceIndex}
                                  ref={el =>
                                    setSentenceRef(
                                      paragraphIndex,
                                      sentenceIndex,
                                      el
                                    )
                                  }
                                  cursor="pointer"
                                  onClick={() =>
                                    handleSentenceClick(sentence.start)
                                  }
                                  bg={bgColor}
                                  _hover={{
                                    bg: "whiteAlpha.200",
                                    ring: "1px",
                                    ringColor: "whiteAlpha.100"
                                  }}
                                  p={1}
                                  borderRadius="md"
                                  display="inline-block" // Ensure the span is block-level for scrolling
                                >
                                  {sentence.text + " "}
                                </chakra.span>
                              )
                            }
                          )}
                        </Text>
                      </Box>
                    )
                  })}
                </Box>
              </TabPanel>
              <TabPanel>
                <p>two!</p>
              </TabPanel>
              <TabPanel>
                <p>three!</p>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Flex>

        <Flex flexDirection="column" flex="1" maxW="600px">
          <Flex flexDirection="column" flexGrow="1" p="6" gap="3" w="100%">
            {messages.length === 0 && (
              <Flex justify="center" align="center" w="100%" h="100%">
                No messages yet
              </Flex>
            )}
            {messages.map((message, key) => (
              <Flex
                key={`message_${key}`}
                w="100%"
                justify={message.type === "question" ? "start" : "end"}
              >
                <Box
                  bg="whiteAlpha.100"
                  p="4"
                  rounded="lg"
                  maxW="90%"
                  fontStyle={message.type === "question" ? "italic" : undefined}
                  color={
                    message.type === "question" ? "whiteAlpha.800" : undefined
                  }
                >
                  {message.message}
                </Box>
              </Flex>
            ))}
          </Flex>

          <Box borderTop="1px solid" borderColor="whiteAlpha.300" w="100%">
            <HStack p="6">
              <Input
                placeholder="Ask your question here"
                value={value}
                onChange={e => setValue(e.target.value)}
              />

              <Button
                onClick={ask}
                isDisabled={value.trim().length === 0}
                isLoading={isLoading}
              >
                Ask
              </Button>
            </HStack>
          </Box>
        </Flex>
      </Flex>

      <Flex
        justify="center"
        align="center"
        minH="400px"
        borderTop="1px solid"
        borderColor="whiteAlpha.300"
      >
        <AudioWaveForm
          contentType="audio/mpeg"
          audioUrl="/audio.mp3"
          waveformDataUrl="/audio.dat"
          audioElementRef={audioElementRef}
          segments={segments}
        />
      </Flex>
    </Flex>
  )
}

export default App

