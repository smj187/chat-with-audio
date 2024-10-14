import {
  Avatar,
  Box,
  Button,
  chakra,
  Divider,
  Flex,
  HStack,
  Text
} from "@chakra-ui/react"
import { useKindeAuth } from "@kinde-oss/kinde-auth-react"
import { Link, Outlet } from "react-router-dom"

interface Props {}

export const AppShell: React.FC<Props> = () => {
  return (
    <Box h="100vh" w="100%" bg="#171717" color="rgb(250, 250, 250)">
      <Flex w="100%" h="100%">
        <Sidebar />
        <Main />
      </Flex>
    </Box>
  )
}

const Sidebar: React.FC = () => {
  const { user, logout } = useKindeAuth()

  return (
    <Flex
      flexDirection="column"
      h="100vh"
      w="72"
      borderRight="1px solid"
      borderColor="gray.700"
    >
      <Box w="100%" h="100%" flex="1">
        <Flex w="100%" h="20" justify="center" align="center">
          Logo
        </Flex>

        <Box p="3">
          <Flex
            w="100%"
            justify="center"
            align="center"
            border="1px solid"
            borderColor="gray.700"
            flexDirection="column"
            p="3"
          >
            <HStack overflow="hidden" w="100%" gap="3" p="3">
              <Avatar
                boxSize="2rem"
                src={user?.picture ?? ""}
                name={user?.email ?? ""}
              />
              <Text isTruncated w="100%">
                {user?.email}
              </Text>
            </HStack>
            <Divider my="3" />

            <Flex align="center" gap="3">
              <Text>3 / 10 Projects</Text>

              <Button>Upgrade</Button>
            </Flex>
          </Flex>
        </Box>

        <Flex flexDirection="column" px="3" gap="1.5" mt="6">
          <Button as={Link} to={`/`}>
            My Projects
          </Button>
          <Button as={Link} to={`/settings`}>
            Settings
          </Button>
          <Button onClick={logout}>Logout</Button>
        </Flex>
      </Box>
    </Flex>
  )
}

const Main: React.FC = () => {
  return (
    <chakra.main
      w="full"
      h="full"
      bg="rgba(255, 255,255,0.03)"
      transition="all 0.25s ease"
      overflow="auto"
    >
      <Outlet />
    </chakra.main>
  )
}
