import { useMutation } from "@tanstack/react-query"
import { client } from "../clients/http-client"
import { ProjectDetailResponseModel } from "../types"

interface RequestBody {
  name: string
}

interface Params {
  name: string
}

export const usePatchProjectName = (userId: string, projectId: string) => {
  return useMutation({
    mutationFn: async ({ name }: Params) => {
      const url = `/api/v1/projects/${projectId}`

      const body: RequestBody = {
        name
      }

      const response = await client.patch<ProjectDetailResponseModel>(
        url,
        body,
        {
          headers: {
            "USER-ID": userId
          }
        }
      )
      return response.data
    }
  })
}
