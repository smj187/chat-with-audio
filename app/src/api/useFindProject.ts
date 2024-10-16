import { useQuery } from "@tanstack/react-query"
import { client } from "../clients/http-client"
import { ProjectDetailResponseModel } from "../types"

export const useFindProject = (userId: string, projectId: string) => {
  return useQuery({
    queryKey: ["FIND_PROJECTS", projectId],
    queryFn: async () => {
      const url = `/api/v1/projects/${projectId}`
      const response = await client.get<ProjectDetailResponseModel>(url, {
        headers: {
          "USER-ID": userId
        }
      })
      return response.data
    }
  })
}
