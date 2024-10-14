// src/ProjectsList.tsx
import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Grid,
  GridItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Input,
  VStack,
  Text
} from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { ProjectResponseModel } from "./types"

function ProjectsList() {
  // const { isOpen, onOpen, onClose } = useDisclosure()
  // const [projects, setProjects] = useState<ProjectResponseModel[]>([])
  // const [projectName, setProjectName] = useState("")
  // const [files, setFiles] = useState<FileList | null>(null)
  // const navigate = useNavigate()

  // useEffect(() => {
  //   fetch("http://localhost:8080/projects")
  //     .then(res => res.json())
  //     .then((data: ProjectResponseModel[]) => setProjects(data))
  // }, [])

  // const createProject = () => {
  //   const formData = new FormData()
  //   formData.append("name", projectName)
  //   if (files) {
  //     Array.from(files).forEach(file => {
  //       formData.append("files", file)
  //     })
  //   }

  //   fetch("http://localhost:8080/projects", {
  //     method: "POST",
  //     body: formData
  //   })
  //     .then(res => res.json())
  //     .then((newProject: ProjectResponseModel) => {
  //       setProjects([...projects, newProject])
  //       setProjectName("")
  //       setFiles(null)
  //       onClose()
  //     })
  // }

  // const deleteProject = (id: string) => {
  //   fetch(`http://localhost:8080/projects/${id}`, {
  //     method: "DELETE"
  //   }).then(() => {
  //     setProjects(projects.filter(project => project.id !== id))
  //   })
  // }

  return (
    <Flex flexDirection="column" maxW="6xl" mx="auto" py="12">
      main content
      {/* <Flex justify="space-between" mb="6">
        <Heading>My Projects</Heading>
        <Button onClick={onOpen}>Create Project</Button>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Project</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing="4">
                <Input
                  placeholder="Project Name"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                />
                <Input
                  type="file"
                  multiple
                  onChange={e => setFiles(e.target.files)}
                />
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose} mr={3}>
                Close
              </Button>
              <Button colorScheme="blue" onClick={createProject}>
                Create
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Flex>
      <Divider />
      <Grid
        templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
        gap={6}
        mt="6"
      >
        {projects.map(project => (
          <GridItem
            key={project.id}
            p="5"
            bg="#2D2D2D"
            borderRadius="md"
            cursor="pointer"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <Flex justify="space-between" align="center">
              <Flex flexDirection="column">
                <Text color="whiteAlpha.600">{project.id}</Text>
                <Text my="3">{project.name}</Text>
                <Box>
                  <Button
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      deleteProject(project.id)
                    }}
                    colorScheme="red"
                  >
                    Delete
                  </Button>
                </Box>
              </Flex>
            </Flex>
          </GridItem>
        ))}
      </Grid> */}
    </Flex>
  )
}

export default ProjectsList
