import { useMutation } from "@tanstack/react-query"
import { client } from "../clients/http-client"
import { ProjectDetailResponseModel } from "../types"

interface Params {
  name: string
  audio: File
}

export const useCreateProject = (userId: string) => {
  return useMutation({
    mutationFn: async ({ audio, name }: Params) => {
      const url = `/api/v1/projects/create`

      const formData = new FormData()
      formData.append("name", name)
      formData.append("audio_file", audio)

      const response = await client.post<ProjectDetailResponseModel>(
        url,
        formData,
        {
          headers: {
            "USER-ID": userId,
            "Content-Type": "multipart/form-data"
          }
        }
      )
      return response.data
    }
  })
}
