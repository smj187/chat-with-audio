"use client"

import { useState, useRef } from "react"
import {
  Box,
  Button,
  Heading,
  useColorMode,
  VStack,
  Input,
  Text,
  HStack
} from "@chakra-ui/react"
import { Moon, Sun, Upload, PlayCircle } from "lucide-react"
import supabase from "./config/supabase"

export default function Home() {
  const { colorMode, toggleColorMode } = useColorMode()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [fileName, setFileName] = useState("1727389061923-audio.mp3")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type.startsWith("audio/")) {
      setFile(selectedFile)
      setUploadError(null)
      setUploadSuccess(false)
    } else {
      setFile(null)
      setUploadError("Please select a valid audio file.")
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setUploadError("Please select a file to upload.")
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)

    try {
      const { data, error } = await supabase.storage
        .from("chat-with-audio")
        .upload(`${Date.now()}-${file.name}`, file)

      if (error) throw error

      setUploadSuccess(true)
      setFile(null)
    } catch (error) {
      setUploadError("Error uploading file. Please try again.")
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleLoadAudio = async () => {
    setLoadingAudio(true)
    setLoadError(null)
    setAudioUrl(null)

    try {
      const { data, error } = await supabase.storage
        .from("chat-with-audio")
        .createSignedUrl(fileName, 3600) // URL valid for 1 hour

      if (error) throw error

      setAudioUrl(data.signedUrl)
    } catch (error) {
      setLoadError(
        "Error loading audio file. Please check the file name and try again."
      )
      console.error("Load error:", error)
    } finally {
      setLoadingAudio(false)
    }
  }

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Heading mb={4}>Welcome to My Next.js App</Heading>
        <Button
          onClick={toggleColorMode}
          leftIcon={colorMode === "light" ? <Moon /> : <Sun />}
        >
          Toggle {colorMode === "light" ? "Dark" : "Light"} Mode
        </Button>

        <Input type="file" accept="audio/*" onChange={handleFileChange} />
        <Button
          onClick={handleUpload}
          isLoading={uploading}
          loadingText="Uploading..."
          leftIcon={<Upload />}
          isDisabled={!file || uploading}
        >
          Upload Audio
        </Button>

        {uploadError && <Text color="red.500">{uploadError}</Text>}
        {uploadSuccess && (
          <Text color="green.500">File uploaded successfully!</Text>
        )}

        <HStack>
          <Input
            placeholder="Enter file name"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
          />
          <Button
            onClick={handleLoadAudio}
            isLoading={loadingAudio}
            loadingText="Loading..."
            leftIcon={<PlayCircle />}
            isDisabled={loadingAudio || !fileName}
          >
            Load Audio
          </Button>
        </HStack>

        {loadError && <Text color="red.500">{loadError}</Text>}

        {audioUrl && (
          <Box>
            <audio ref={audioRef} controls src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
          </Box>
        )}
      </VStack>
    </Box>
  )
}
