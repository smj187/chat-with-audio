import { FronteggProvider } from "@frontegg/react"
import { AppLayout } from "./app-layout"
import { KindeProvider, useKindeAuth } from "@kinde-oss/kinde-auth-react"
import { Button, Flex } from "@chakra-ui/react"
import { useEffect } from "react"
import { PageRefreshSpinner } from "./page-refresh-spinner"
import { Navigate, Outlet, redirect } from "react-router-dom"

interface Props {}

export const AuthLayout: React.FC<Props> = () => {
  return (
    <KindeProvider
      clientId={import.meta.env.VITE_KINDE_CLIENT_ID}
      domain={import.meta.env.VITE_KINDE_DOMAIN}
      redirectUri={import.meta.env.VITE_BASE_URL_WEB_APP}
      // logoutUri="https://example.com"
      audience="restricted-access"
    >
      <AuthLayoutResult />
    </KindeProvider>
  )
}

const AuthLayoutResult: React.FC = () => {
  const { login } = useKindeAuth()
  const { isAuthenticated, isLoading } = useKindeAuth()

  if (isLoading) {
    return <PageRefreshSpinner />
  }

  if (!isLoading && isAuthenticated) {
    return <AppLayout />
  }

  login({})

  return (
    <Flex
      flexDirection="column"
      justify="center"
      align="center"
      h="100vh"
      gap="3"
    >
      <Button onClick={() => login()}>Log In</Button>
    </Flex>
  )
}
