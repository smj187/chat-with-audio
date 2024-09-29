import { extendTheme } from "@chakra-ui/react"

export const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false
  },
  colors: {
    brand: {
      100: "#f7fafc",
      900: "#1a202c"
    }
  },
  fonts: {
    body: "Inter",
    heading: "Inter"
  }
})
