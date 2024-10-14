import { useQuery } from "@tanstack/react-query"
import { client } from "../clients/http-client"

export const useTest = () => {
  return useQuery({
    queryKey: ["test"],
    queryFn: async () => {
      const url = `/`
      const response = await client.get(url)
      return response.data
    }
  })
}
