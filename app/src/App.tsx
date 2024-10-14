// src/App.tsx
import { Outlet } from "react-router-dom"
import { Flex, Box } from "@chakra-ui/react"
import { useKindeAuth } from "@kinde-oss/kinde-auth-react"

function App() {
  const { login, register, logout } = useKindeAuth()
  const { user, isAuthenticated, isLoading } = useKindeAuth()

  console.log(user, isAuthenticated)

  return (
    <Flex
      flexDirection="column"
      minH="100vh"
      // p="12"
    >
      <Box w="100%">
        {isAuthenticated ? (
          <>
            <h2>{user?.email}</h2>
            <p>{user?.preferred_email}</p>
            <button onClick={logout} type="button">
              Log Out
            </button>
          </>
        ) : (
          <>
            <button onClick={register} type="button">
              Register
            </button>
            <button onClick={login} type="button">
              Log In
            </button>
          </>
        )}

        {/* {isAuthenticated ? <>
  <div>
          <h2>{user?.first_name}</h2>
          <p>{user?.preferred_email}</p>
        </div> :
<>
<button onClick={register} type="button">
          Register
        </button>
        <button onClick={login} type="button">
          Log In
        </button>
</>} */}
      </Box>
    </Flex>
  )
}

export default App

