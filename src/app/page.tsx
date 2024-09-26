"use client"

import { Box, Button, Heading, useColorMode } from "@chakra-ui/react"
import { Moon, Sun } from "lucide-react"

export default function Home() {
  const { colorMode, toggleColorMode } = useColorMode()
  return (
    <Box p={4}>
      <Heading mb={4}>Welcome to My Next.js App</Heading>
      <Button onClick={toggleColorMode}>
        {colorMode === "light" ? <Moon /> : <Sun />}
      </Button>
    </Box>
  )
}

