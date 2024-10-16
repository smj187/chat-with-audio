import { Flex, Button, Box, Text, HStack, Spinner } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions"

interface Props {
  url: string
  duration: number
  regions: {
    start: number
    end: number
  }[]
  currentTime: number
  setCurrentTime: (value: React.SetStateAction<number>) => void

  wavesurferRef: React.MutableRefObject<WaveSurfer | null>
}

export const WavesurferAudio: React.FC<Props> = ({
  url,
  duration,
  regions,
  currentTime,
  setCurrentTime,
  wavesurferRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const regionsPluginRef = useRef<RegionsPlugin | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const [zoomLevel, setZoomLevel] = useState<number>(0)

  useEffect(() => {
    if (!containerRef.current || wavesurferRef.current) return

    const regionsPlugin = RegionsPlugin.create()

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(88, 88, 88)",
      progressColor: "#ffffff",
      cursorColor: "#a8dcfa",
      cursorWidth: 3,
      barWidth: 3,
      barRadius: 2,
      height: 120,
      normalize: false,
      plugins: [regionsPlugin],
      width: window.innerWidth - 80
    })

    regionsPluginRef.current = regionsPlugin
    wavesurferRef.current.load(url)

    wavesurferRef.current.on("audioprocess", () => {
      if (!wavesurferRef.current) return

      if (wavesurferRef.current.isPlaying()) {
        setCurrentTime(wavesurferRef.current.getCurrentTime())
      }
    })

    wavesurferRef.current.on("seeking", () => {
      if (!wavesurferRef.current) return

      if (!wavesurferRef.current.isPlaying()) {
        wavesurferRef.current.play()
      }

      requestAnimationFrame(() => {
        if (!wavesurferRef.current) return

        const newTime = wavesurferRef.current.getCurrentTime()
        setCurrentTime(newTime)
      })
    })

    wavesurferRef.current.on("ready", () => {
      if (!wavesurferRef.current) return
      setIsLoaded(true)
    })

    wavesurferRef.current.on("finish", () => {
      setCurrentTime(0)
    })

    return () => {
      wavesurferRef.current?.destroy()
      wavesurferRef.current = null
      regionsPluginRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!wavesurferRef.current) return

    regions.map(region => {
      if (!regionsPluginRef.current) return
      const waveRegion = regionsPluginRef.current.addRegion({
        start: region.start,
        end: region.end,
        color: "rgba(168, 220, 250, 0.3)",
        drag: false,
        resize: false
      })

      // for better UX we only allow one click per region
      let hasClicked = false
      waveRegion.on("click", e => {
        if (hasClicked) return
        e.preventDefault()
        e.stopPropagation()
        waveRegion.play()
        hasClicked = true
      })
      waveRegion.on("leave", () => {
        hasClicked = false
      })
    })

    // regionsPluginRef.current?.addRegion({
    //   start: 400,
    //   end: 401,
    //   color: "rgba(255, 0, 0, 0.7)",
    //   drag: false,
    //   resize: false,
    //   id: "marker-test"
    // })
  }, [regions, isLoaded])

  const handlePlayPause = () => {
    wavesurferRef.current?.playPause()
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`
  }
  const handleZoomIn = () => {
    const newZoom = (zoomLevel || 0) + 5
    setZoomLevel(newZoom)
    wavesurferRef.current?.zoom(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = (zoomLevel || 0) - 5
    const adjustedZoom = newZoom >= 0 ? newZoom : 0
    setZoomLevel(adjustedZoom)
    wavesurferRef.current?.zoom(adjustedZoom)
  }

  return (
    <Box
      h="200px"
      borderTop="1px solid"
      borderColor="gray.700"
      p="3"
      pos="relative"
      pt="6"
    >
      {!isLoaded && (
        <Flex pos="absolute" inset="0" justify="center" align="center">
          <Spinner />
        </Flex>
      )}

      <Box
        opacity={isLoaded ? "1" : "0"}
        pointerEvents={isLoaded ? "auto" : "none"}
      >
        <Flex align="center" px="6" height="100px">
          <Box ref={containerRef} flex="1" bg="whiteAlpha.100" id="container" />
        </Flex>
        <HStack mt="6" justifyContent="space-between" px="6" align="center">
          <HStack>
            <Button onClick={handlePlayPause} colorScheme="blue">
              Play / Pause
            </Button>
            <Button onClick={handleZoomIn} colorScheme="blue">
              Zoom In
            </Button>
            <Button onClick={handleZoomOut} colorScheme="blue">
              Zoom Out
            </Button>
          </HStack>
          <Text>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </HStack>
      </Box>
    </Box>
  )
}
