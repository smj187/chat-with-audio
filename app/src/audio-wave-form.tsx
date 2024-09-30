import Peaks, { PeaksInstance, PeaksOptions } from "peaks.js"
import {
  createPointMarker,
  createSegmentLabel,
  createSegmentMarker
} from "./helpers"
import { useCallback, useEffect, useRef, useState } from "react"
import { Box, Button, chakra } from "@chakra-ui/react"

interface Props {
  audioUrl: string
  waveformDataUrl: string
  contentType: string
  audioElementRef: React.RefObject<HTMLAudioElement>
  segments: {
    label: string
    start: number
    end: number
  }[]
}

export const AudioWaveForm: React.FC<Props> = ({
  audioUrl,
  waveformDataUrl,
  contentType,
  audioElementRef,
  segments
}) => {
  const zoomviewWaveformRef = useRef<HTMLDivElement>(null)
  const overviewWaveformRef = useRef<HTMLDivElement>(null)
  const peaksRef = useRef<PeaksInstance | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const initPeaks = useCallback(() => {
    if (!audioElementRef.current) return

    peaksRef.current?.destroy()

    const options: PeaksOptions & { playedWaveformColor: string } = {
      overview: {
        container: overviewWaveformRef.current
      },
      zoomview: {
        container: zoomviewWaveformRef.current
      },
      mediaElement: audioElementRef.current,
      logger: console.error.bind(console),
      createSegmentMarker: createSegmentMarker,
      createSegmentLabel: createSegmentLabel,
      createPointMarker: createPointMarker,
      dataUri: {
        arraybuffer: waveformDataUrl
      },
      keyboard: true,
      playheadColor: "#a8dcfa",
      waveformColor: "rgba(0,0,0,0.2)",
      playedWaveformColor: "#a8dcfa",
      axisGridlineColor: "transparent",
      showPlayheadTime: true
    }

    audioElementRef.current.src = audioUrl

    if (peaksRef.current) {
      peaksRef.current.destroy()
      peaksRef.current = null
    }

    Peaks.init(options, (err, peaks) => {
      if (err) {
        console.error(err)
        return
      }

      if (!peaks) return
      peaksRef.current = peaks
      console.log("Peaks.js is ready")

      segments.map(segments => {
        peaks.segments.add({
          startTime: segments.start,
          endTime: segments.end,
          labelText: segments.label
        })
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    initPeaks()

    return () => {
      if (peaksRef.current) {
        peaksRef.current.destroy()
      }
    }
  }, [initPeaks])

  const zoomIn = () => {
    if (!peaksRef.current) return
    peaksRef.current.zoom.zoomIn()
  }

  const zoomOut = () => {
    if (!peaksRef.current) return
    peaksRef.current.zoom.zoomOut()
  }

  const togglePlayPause = useCallback(() => {
    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause()
      } else {
        audioElementRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [audioElementRef, isPlaying])

  const handleWaveformClick = () => {
    if (audioElementRef.current) {
      audioElementRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === "Space") {
        togglePlayPause()
      } else if (event.code === "KeyA") {
        if (!peaksRef.current) return
        const newTime = Math.max(
          0,
          peaksRef.current.player.getCurrentTime() - 10
        )
        peaksRef.current.player.seek(newTime)
      } else if (event.code === "KeyD") {
        if (!peaksRef.current) return

        const newTime = Math.min(
          peaksRef.current.player.getDuration(),
          peaksRef.current.player.getCurrentTime() + 10
        )
        peaksRef.current.player.seek(newTime)
      }
    },
    [togglePlayPause]
  )

  // useEffect(() => {
  //   window.addEventListener("keydown", handleKeyDown)
  //   return () => {
  //     window.removeEventListener("keydown", handleKeyDown)
  //   }
  // }, [handleKeyDown])

  // **Add Event Listeners for Audio Playback**
  useEffect(() => {
    const audio = audioElementRef.current
    if (!audio) return

    // Handler for when playback starts
    const handlePlay = () => {
      setIsPlaying(true)
    }

    // Handler for when playback is paused
    const handlePause = () => {
      setIsPlaying(false)
    }

    // Handler for time updates

    // Add event listeners
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    // Cleanup event listeners on unmount
    return () => {
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [audioElementRef])

  return (
    <Box w="90%" mx="auto">
      <Box
        ref={zoomviewWaveformRef}
        border="1px solid"
        borderColor="whiteAlpha.200"
        h="200px"
        onClick={handleWaveformClick}
      />
      <Box
        h="70px"
        border="1px solid"
        borderColor="whiteAlpha.200"
        ref={overviewWaveformRef}
        m="0 0 24px 0"
        onClick={handleWaveformClick}
        mt="3"
      />

      <chakra.audio ref={audioElementRef} controls hidden>
        <source src={audioUrl} type={contentType} />
        Your browser does not support the audio element.
      </chakra.audio>

      <>
        <Button onClick={togglePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button onClick={zoomIn}>Zoom in</Button>
        <Button onClick={zoomOut}>Zoom out</Button>
      </>
    </Box>
  )
}
