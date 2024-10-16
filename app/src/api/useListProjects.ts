import { useQuery } from "@tanstack/react-query"
import { client } from "../clients/http-client"
import { ProjectResponseModel } from "../types"

export const useListProjects = (userId: string) => {
  return useQuery({
    queryKey: ["LIST_PROJECTS"],
    queryFn: async () => {
      const url = `/api/v1/projects/list`
      const response = await client.get<ProjectResponseModel[]>(url, {
        headers: {
          "USER-ID": userId
        }
      })
      return response.data
    }
  })
}
