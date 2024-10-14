// AppLayout.tsx
import { useKindeAuth } from "@kinde-oss/kinde-auth-react"
import { PageRefreshSpinner } from "./page-refresh-spinner"
import { AppShell } from "./app-shell"
import { useEffect, useState } from "react"
import { client } from "../clients/http-client"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { queryClient } from "../clients/query-client"
import { Outlet, useNavigate } from "react-router-dom"

interface Props {}

export const AppLayout: React.FC<Props> = () => {
  const { getToken, isLoading, getUser } = useKindeAuth()
  const [isTokenSet, setIsTokenSet] = useState(false)
  const navigate = useNavigate()
  const user = getUser()

  useEffect(() => {
    let interceptorId: number

    const init = async () => {
      if (!getToken) return

      if (!user) {
        console.log("nav")
        navigate("/")
        return
      }

      const token = await getToken()
      if (!token) return

      console.log(token)

      if (!token) {
        console.log("nav")
        navigate("/")
        return
      }

      // console.log(user.id)

      interceptorId = client.interceptors.request.use(
        config => {
          config.headers.Authorization = `Bearer ${token}`
          return config
        },
        error => Promise.reject(error)
      )

      setIsTokenSet(true)
    }

    init()

    return () => {
      if (interceptorId !== undefined) {
        client.interceptors.request.eject(interceptorId)
      }
    }
  }, [])

  return isLoading || !isTokenSet ? (
    <PageRefreshSpinner />
  ) : (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.MODE !== "production" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}

      <Outlet />
    </QueryClientProvider>
  )
}
