// HomeLayout.tsx
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  useToast
} from "@chakra-ui/react"
import { useTest } from "../api/useTest"
import { Link } from "react-router-dom"
import { useCreateProject } from "../api/useCreateProject"
import { useState, ChangeEvent } from "react"

interface ProjectResponseModel {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string | null
}

interface Props {
  projects: ProjectResponseModel[]
  userId: string
}

export const HomeLayout: React.FC<Props> = ({ projects, userId }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const { mutateAsync, isLoading } = useCreateProject(userId)
  const [name, setName] = useState("")
  const [audio, setAudio] = useState<File | null>(null)
  const [errors, setErrors] = useState<{ name?: string; audio?: string }>({})

  // Handler for project name input
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }))
    }
  }

  // Handler for audio file input
  const handleAudioChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudio(e.target.files[0])
      if (errors.audio) {
        setErrors(prev => ({ ...prev, audio: undefined }))
      }
    }
  }

  // Handler for form submission
  const handleCreateProject = async () => {
    // Simple validation
    const newErrors: { name?: string; audio?: string } = {}
    if (!name.trim()) {
      newErrors.name = "Project name is required."
    }
    if (!audio) {
      newErrors.audio = "Audio file is required."
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await mutateAsync({ name: name.trim(), audio })
      toast({
        title: "Project created.",
        description: `Project "${name}" has been successfully created.`,
        status: "success",
        duration: 5000,
        isClosable: true
      })
      // Reset form
      setName("")
      setAudio(null)
      setErrors({})
      onClose()
      // Optionally, refetch projects or update state if necessary
    } catch (error: any) {
      toast({
        title: "An error occurred.",
        description:
          error.response?.data?.message || "Unable to create project.",
        status: "error",
        duration: 5000,
        isClosable: true
      })
    }
  }

  return (
    <Container maxW="7xl" w="100%" p={4}>
      <HStack mb={4}>
        <Heading as="h1" size="lg">
          Projects
        </Heading>
        <Button onClick={onOpen} colorScheme="teal">
          Create Project
        </Button>
      </HStack>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isInvalid={!!errors.name} mb={4}>
              <FormLabel>Project Name</FormLabel>
              <Input
                placeholder="Enter project name"
                value={name}
                onChange={handleNameChange}
              />
              {errors.name && (
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.audio}>
              <FormLabel>Upload Audio File</FormLabel>
              <Input
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
              />
              {errors.audio && (
                <FormErrorMessage>{errors.audio}</FormErrorMessage>
              )}
              {audio && (
                <Text mt={2} fontSize="sm" color="gray.500">
                  Selected file: {audio.name}
                </Text>
              )}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateProject}
              isLoading={isLoading}
            >
              Create Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
        {projects.map(project => (
          <Flex
            flexDirection="column"
            key={project.id}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            boxShadow="sm"
            as={Link}
            to={`/projects/${project.id}`}
            _hover={{ boxShadow: "md" }}
          >
            <Heading as="h2" size="md" mb={2}>
              {project.name}
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Created at: {new Date(project.created_at).toLocaleDateString()}
            </Text>
            {project.updated_at && (
              <Text fontSize="sm" color="gray.600">
                Updated at: {new Date(project.updated_at).toLocaleDateString()}
              </Text>
            )}
          </Flex>
        ))}
      </Grid>
    </Container>
  )
}
