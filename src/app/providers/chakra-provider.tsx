"use client"

import {
  ChakraProvider as _ChakraProvider,
  ColorModeScript,
  extendTheme,
  ThemeConfig
} from "@chakra-ui/react"
import { PropsWithChildren } from "react"

const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true
}

const theme = extendTheme({ config })

export function ChakraProvider({ children }: PropsWithChildren) {
  return (
    <_ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      {children}
    </_ChakraProvider>
  )
}
