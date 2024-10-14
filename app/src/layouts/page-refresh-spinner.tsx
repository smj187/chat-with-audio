import { Box, chakra, Flex, Spinner } from "@chakra-ui/react"

interface Props {}

export const PageRefreshSpinner: React.FC<Props> = () => {
  return (
    <Box h="100vh" w="100%" bg="#171717" color="rgb(250, 250, 250)">
      <Flex direction="column" justify="center" align="center" h="100%">
        <Flex align="enter">
          <chakra.h1 pl="3" fontSize="2rem" fontWeight="600">
            Chat with Audio
          </chakra.h1>
        </Flex>

        <Box pt="16">
          <Spinner thickness="3px" speed="0.5s" color="white" size="xl" />
        </Box>
      </Flex>
    </Box>
  )
}
