import { useMutation } from "@tanstack/react-query"
import { client } from "../clients/http-client"
import { AskQuestionResponseModel } from "../types"

interface RequestBody {
  question: string
}

interface Params {
  question: string
}

export const useAskQuestion = (userId: string, projectId: string) => {
  return useMutation({
    mutationFn: async ({ question }: Params) => {
      const url = `/api/v1/projects/${projectId}/ask`

      const body: RequestBody = {
        question
      }

      const response = await client.post<AskQuestionResponseModel>(url, body, {
        headers: {
          "USER-ID": userId
        }
      })
      return response.data
    }
  })
}
