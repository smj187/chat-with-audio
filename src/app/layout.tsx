import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ChakraProvider } from "./providers/chakra-provider"

// no weights required since inter is a variable font
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app"
}

const suppressHydrationWarning = process.env.NODE_ENV === "development"

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        suppressHydrationWarning={suppressHydrationWarning}
      >
        <ChakraProvider>{children}</ChakraProvider>
      </body>
    </html>
  )
}

