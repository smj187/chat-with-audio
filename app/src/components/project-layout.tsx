import {
  Flex,
  Button,
  Box,
  Text,
  HStack,
  chakra,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Input
} from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useAskQuestion } from "../api/useAskQuestion"
import { WavesurferAudio } from "./wavesurfer-audio"
import WaveSurfer from "wavesurfer.js"

interface Props {
  audioUrl: string
  transcriptionUrl: string
  projectName: string
  userId: string
  projectId: string
  duration: number
}

interface TranscriptionData {
  transcription: string
  summary: string
  paragraphs: Paragraph[]
}

interface Paragraph {
  sentences: Sentence[]
}

export interface Sentence {
  text: string
  start: number
  end: number
}

interface Match {
  score: number
  start: number
  end: number
}

export const ProjectLayout: React.FC<Props> = ({
  audioUrl,
  transcriptionUrl,
  projectName,
  userId,
  projectId,
  duration
}) => {
  const [transcriptionData, setTranscription] =
    useState<TranscriptionData | null>(null)

  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const handleSeekToTime = (targetTimeInSeconds: number) => {
    if (!wavesurferRef.current) return

    const duration = wavesurferRef.current.getDuration()
    const clampedTime = Math.min(targetTimeInSeconds, duration)
    const normalizedTime = clampedTime / duration
    wavesurferRef.current.seekTo(normalizedTime)
    setCurrentTime(clampedTime)
  }

  useEffect(() => {
    fetch(transcriptionUrl)
      .then(res => res.json())
      .then((data: TranscriptionData) => {
        setTranscription(data)
      })
  }, [])

  const sentenceRefs = useRef<Map<number, HTMLSpanElement | null>>(new Map())
  const [currentTime, setCurrentTime] = useState(0)
  const [segments, setSegments] = useState<Match[]>([])

  const setSentenceRef = (
    paragraphIndex: number,
    sentenceIndex: number,
    element: HTMLSpanElement | null
  ) => {
    const key = paragraphIndex * 1000 + sentenceIndex
    sentenceRefs.current.set(key, element)
  }

  const handleSentenceClick = (startTime: number) => {
    handleSeekToTime(startTime)
  }

  const { mutateAsync } = useAskQuestion(userId, projectId)
  const [messages, setMessages] = useState<
    { message: string; type: "question" | "response" }[]
  >([])
  const [value, setValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const handleAskQuestion = async () => {
    setMessages(prev => [...prev, { type: "question", message: value }])
    setIsLoading(true)
    setValue("")

    try {
      const res = await mutateAsync({ question: value })
      setMessages(prev => [...prev, { type: "response", message: res.answer }])
      setSegments(res.matches)
    } catch (error) {
      console.error("Error fetching segments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const [highlights, setHighlights] = useState<Sentence[]>([])
  const [regions, setRegions] = useState<{ start: number; end: number }[]>([])

  useEffect(() => {
    if (!transcriptionData) return

    const h = transcriptionData.paragraphs
      .flatMap(paragraph => paragraph.sentences)
      .filter(sentence =>
        segments.some(
          range => sentence.start < range.end && sentence.end > range.start
        )
      )
      .sort((a, b) => a.start - b.start)

    setHighlights(h)
    setRegions(h.map(x => ({ start: x.start, end: x.end })))
  }, [segments, transcriptionData])

  return (
    <Flex flexDirection="column" bg="#171717" color="rgb(250, 250, 250)">
      <Flex
        borderBottom="1px solid"
        borderColor="whiteAlpha.300"
        h="64px"
        align="center"
        px="3"
      >
        <HStack>
          <Button as={Link} to={`/`}>
            Back to Dashboard
          </Button>

          <Text>{projectName}</Text>
        </HStack>
      </Flex>
      <Flex flexDirection="column" h="calc(100vh - 64px)">
        <Flex flex="1">
          <Flex
            flexDirection="column"
            h="100%"
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
                <TabPanel
                  px="3"
                  overflow="auto"
                  maxH="calc(100vh - 64px - 100px - 200px)"
                >
                  <Box>
                    {transcriptionData?.paragraphs.map(
                      (paragraph, paragraphIndex) => {
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
                                        bg: isActive
                                          ? "purple.600"
                                          : "whiteAlpha.300",
                                        ring: "1px",
                                        ringColor: "whiteAlpha.100"
                                      }}
                                      p={1}
                                      borderRadius="md"
                                      display="inline-block"
                                    >
                                      {sentence.text + " "}
                                    </chakra.span>
                                  )
                                }
                              )}
                            </Text>
                          </Box>
                        )
                      }
                    )}
                  </Box>
                </TabPanel>
                <TabPanel
                  overflow="auto"
                  maxH="calc(100vh - 64px - 100px - 200px)"
                >
                  <Flex flexDirection="column" gap="5">
                    {highlights.map((highlight, key) => (
                      <Flex w="100%" key={key} gap="3" align="center">
                        <Button
                          onClick={() => handleSentenceClick(highlight.start)}
                        >
                          Play
                        </Button>

                        <Flex flexDirection="column" w="100%">
                          <Text color="whiteAlpha.700">
                            {formatTime(highlight.start)} -{" "}
                            {formatTime(highlight.end)}
                          </Text>
                          <Text>{highlight.text}</Text>
                        </Flex>
                      </Flex>
                    ))}
                  </Flex>
                </TabPanel>
                <TabPanel>
                  <p>{transcriptionData?.summary}</p>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Flex>

          <Flex flexDirection="column" flex="1" maxW="500px">
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
                    fontStyle={
                      message.type === "question" ? "italic" : undefined
                    }
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
                  onClick={handleAskQuestion}
                  isDisabled={value.trim().length === 0}
                  isLoading={isLoading}
                >
                  Ask
                </Button>
              </HStack>
            </Box>
          </Flex>
        </Flex>

        <WavesurferAudio
          duration={duration}
          regions={regions}
          url={audioUrl}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          wavesurferRef={wavesurferRef}
        />

        {/* <Box
          h="250px"
          borderTop="1px solid"
          borderColor="gray.700"
          p="3"
          pos="relative"
        >
          <audio
            ref={audioElementRef}
            controls
            src={audioUrl}
            style={{ width: "100%" }}
          ></audio>
        </Box> */}
      </Flex>
    </Flex>
  )
}

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  const hoursStr = hours > 0 ? String(hours).padStart(2, "0") + ":" : "" // If there are hours, display them
  const minutesStr = String(minutes).padStart(2, "0")
  const secondsStr = String(seconds).padStart(2, "0")

  return `${hoursStr}${minutesStr}:${secondsStr}`
}
