import { useKindeAuth } from "@kinde-oss/kinde-auth-react"
import { useListProjects } from "../api/useListProjects"
import { HomeLayout } from "../components/home-layout"
import { Spinner } from "@chakra-ui/react"

const HomeView: React.FC<{ userId: string }> = ({ userId }) => {
  const { data } = useListProjects(userId)

  console.log(data)

  return (
    <>{!data ? <Spinner /> : <HomeLayout projects={data} userId={userId} />}</>
  )
}
export function Component() {
  const { getUser } = useKindeAuth()
  const user = getUser()

  if (!user.id) return null
  return <HomeView userId={user.id} />
}

Component.displayName = "HomeView"
