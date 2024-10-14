import { useKindeAuth } from "@kinde-oss/kinde-auth-react"
import axios from "axios"
import { useEffect } from "react"
import { useTest } from "../api/useTest"

interface Props {}

export const HomeLayout: React.FC<Props> = () => {
  const { data } = useTest()

  useEffect(() => {
    if (!data) return
    console.log(data)
  }, [data])

  return <div>home</div>
}
