import { useParams } from "react-router-dom"
import { ProjectLayout } from "../components/project-layout"

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

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()

  const duration = 613.929796
  const regions = [
    {
      start: 240,
      end: 300,
      label: "this i test"
    },
    {
      start: 540,
      end: 600,
      label: "this i test"
    }
  ]

  return (
    <>
      <ProjectLayout url="/audio.mp3" duration={duration} regions={regions} />
    </>
  )
}
export function Component() {
  return <ProjectView />
}

Component.displayName = "ProjectView"
