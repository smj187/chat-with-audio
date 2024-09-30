import React, { useCallback, useEffect, useRef, useState } from "react"
import Peaks, { PeaksInstance, PeaksOptions } from "peaks.js"
import { Button, chakra, Flex } from "@chakra-ui/react"

interface Props {
  audioUrl: string
  waveformUrl: string
  contentType: string
  audioElementRef: React.RefObject<HTMLAudioElement>
  segments: {
    start: number
    end: number
  }[]
}

export const AudioWaveForm: React.FC<Props> = ({
  audioUrl,
  waveformUrl,
  contentType,
  audioElementRef,
  segments
}) => {
  const overviewWaveformRef = useRef<HTMLDivElement>(null)

  const peaksInstance = useRef<PeaksInstance | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const initPeaks = useCallback(() => {
    if (!audioElementRef.current) return

    peaksInstance.current?.destroy()

    const options: PeaksOptions & { playedWaveformColor: string } = {
      overview: {
        container: overviewWaveformRef.current
      },
      dataUri: {
        arraybuffer: waveformUrl
      },
      mediaElement: audioElementRef.current,
      keyboard: true,
      logger: console.error.bind(console),
      playheadColor: "#a8dcfa",
      waveformColor: "rgba(0,0,0,0.2)",
      playedWaveformColor: "#a8dcfa",
      axisLabelColor: "transparent",
      axisGridlineColor: "transparent",
      showPlayheadTime: true
    }

    audioElementRef.current.src = audioUrl

    Peaks.init(options, (err, peaks) => {
      if (err) {
        console.error(err)
        return
      }

      if (!peaks) return
      peaksInstance.current = peaks
      console.log("Peaks.js is ready")

      segments.map(segments => {
        peaks.segments.add({
          startTime: segments.start,
          endTime: segments.end,
          labelText: "Segment"
        })
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioElementRef, waveformUrl, audioUrl])

  useEffect(() => {
    initPeaks()
  }, [initPeaks])

  useEffect(() => {
    return () => {
      peaksInstance.current?.destroy()
    }
  }, [])

  const togglePlaying = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false)
      peaksInstance.current?.player.pause()
    } else {
      setIsPlaying(true)
      peaksInstance.current?.player.play()
    }
  }, [isPlaying])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "Space") {
        togglePlaying()
      } else if (event.code === "KeyA") {
        if (!peaksInstance.current) return
        const newTime = Math.max(
          0,
          peaksInstance.current.player.getCurrentTime() - 10
        )
        peaksInstance.current.player.seek(newTime)
      } else if (event.code === "KeyD") {
        if (!peaksInstance.current) return

        const newTime = Math.min(
          peaksInstance.current.player.getDuration(),
          peaksInstance.current.player.getCurrentTime() + 10
        )
        peaksInstance.current.player.seek(newTime)
      }
    },
    [togglePlaying]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <Flex w="100%" h="100%" justify="center" align="center" pos="relative">
      <Button onClick={togglePlaying}>{isPlaying ? "Pause" : "Play"}</Button>
      <Flex
        flexDirection="column"
        maxW="95%"
        mx="auto"
        w="100%"
        h="100%"
        justify="center"
        align="center"
      >
        <chakra.div
          w="100%"
          h="100px"
          bg="whiteAlpha.50"
          overflow="hidden"
          ref={overviewWaveformRef}
        />

        <chakra.audio ref={audioElementRef} controls w="100%" hidden>
          <source src={audioUrl} type={contentType} />
          Your browser does not support the audio element.
        </chakra.audio>
      </Flex>
    </Flex>
  )
}
