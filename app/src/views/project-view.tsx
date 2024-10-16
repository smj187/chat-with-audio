import { useParams } from "react-router-dom"
import { ProjectLayout } from "../components/project-layout"
import { useFindProject } from "../api/useFindProject"
import { useKindeAuth } from "@kinde-oss/kinde-auth-react"

const createLabel = (text: string): HTMLElement => {
  const labelContainer = document.createElement("div")
  labelContainer.style.position = "absolute"
  labelContainer.style.top = "0"
  labelContainer.style.left = "0"
  labelContainer.style.display = "flex"

  const labelText = document.createElement("span")
  labelText.innerText = text
  labelText.style.fontSize = "12px"
  labelText.style.color = "#fff"
  labelText.style.pointerEvents = "none"
  labelText.style.whiteSpace = "nowrap"
  labelText.style.overflow = "hidden"
  labelText.style.textOverflow = "ellipsis"
  labelText.style.maxWidth = "50px"

  labelContainer.appendChild(labelText)

  return labelContainer
}

const ProjectView: React.FC<{ userId: string; projectId: string }> = ({
  userId,
  projectId
}) => {
  const { data } = useFindProject(userId, projectId)

  if (!data) return null

  return (
    <>
      <ProjectLayout
        audioUrl={data.audio_file_url}
        transcriptionUrl={data.transcription_file_url}
        projectName={data.name}
        projectId={data.id}
        userId={userId}
        duration={data.duration}
      />
    </>
  )
}
export function Component() {
  const { getUser } = useKindeAuth()
  const user = getUser()

  const { projectId } = useParams<{ projectId: string }>()

  if (!user.id || !projectId) return null

  return <ProjectView userId={user.id} projectId={projectId} />
}

Component.displayName = "ProjectView"
