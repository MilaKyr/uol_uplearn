import React from "react";
import {
  Grid, Stack, Image, Group, Text,
  Spoiler, Divider, Title, Button, Modal,
  Center,
  Badge,
  TextInput, Textarea,
} from '@mantine/core';
import { IconCalendarWeek, IconCircleCheck, IconHourglassEmpty, IconExclamationCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { CourseEditData, TagData } from "@/app/types";
import { notifications } from "@mantine/notifications";
import {  UseFormReturnType } from '@mantine/form';

export default function CourseMain(props: { 
  course: CourseEditData , 
  updateForm: () => void, 
  courseForm: UseFormReturnType<{ title: string; description: string; }>}) {
  const [expanded, setExpanded] = React.useState(false);
  const [active, setActive] = React.useState(props.course?.is_active);
  const [opened, { open, close }] = useDisclosure(false);
  const router = useRouter();

  const toggleActive = async () => {
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }
    const parsedToken = JSON.parse(token);
    // Validate the token by making an API call
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/edit/${props.course?.id}/`, {
        headers: {
          Authorization: `Bearer ${parsedToken.access}`,
          "Content-Type": "application/json",
        },
        method: "PATCH",
        body: JSON.stringify({ is_active: !active })
      })
      if (!res.ok) {
        if (res.status === 401) {
          notifications.show({
            title: "Session expired",
            message: "Please log in to continue",
            autoClose: 5000,
            icon: <IconExclamationCircle />,
            color: 'red',
          });
          window.sessionStorage.removeItem("jwt");
          router.push('/') // Redirect to login if token validation fails
        } else {
          throw new Error('Something went wrong')
        }
      };
      setActive(!active);
    } catch (error) {
      console.error(error)
    }
  }

  const deleteCourse = async () => {
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }

    const parsedToken = JSON.parse(token);
    // Validate the token by making an API call
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/${props.course?.id}/`, {
        headers: {
          Authorization: `Bearer ${parsedToken.access}`,
        },
        method: "DELETE"
      })
      if (!res.ok) {
        if (res.status === 401) {
          notifications.show({
            title: "Session expired",
            message: "Please log in to continue",
            autoClose: 5000,
            icon: <IconExclamationCircle />,
            color: 'red',
          });
          window.sessionStorage.removeItem("jwt");
          router.push('/') // Redirect to login if token validation fails
        } else {
          throw new Error('Something went wrong')
        }
      };
      notifications.show({
        title: `Success`,
        message: `Course ${props.course.title} has been deleted`,
        color: 'teal',
        icon: <IconCircleCheck />,
        autoClose: 5000,
      })
      router.push('/home')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      <Modal opened={opened} onClose={close} title="Are you sure you want to delete a course?">
        <Center pb={20}><Text c="red" fw={700}>This cannot be undone!</Text></Center>
        <Button size="sm"
          onClick={deleteCourse}
          color={"red"}
        >I want to delete</Button>

      </Modal>

      <Grid py={24}>
        <Grid.Col span="auto"><Image h={248} radius="md" src={`${props.course?.photo}`} /> </Grid.Col>
        <Grid.Col span="auto">

        <TextInput {...props.courseForm.getInputProps('title')} py={6}/>

          <Group py={12} gap={6} justify="flex-start" align="flex-start">
            <IconCalendarWeek color="#868e96" />
            <Text>Start date: {props.course?.start_date}</Text>
          </Group>

          <Group py={12} gap={6} justify="flex-start" align="flex-start">
            <IconHourglassEmpty color="#868e96" />
            <Text>Duration: {props.course?.duration} days</Text>
          </Group>


          <Group gap={6} py={12}>
            {props.course?.tags.map((tag: TagData) => (
              <Badge key={tag.id} variant="outline" color={tag.color}>{tag.name}</Badge>
            ))}
          </Group>

          <Divider py={12} />

          <Group justify="space-between">
            <Button
              variant="outline"
              onClick={open}
              color={"red"}
            >Delete</Button>

            <Button
              onClick={toggleActive}
              color={active ? "gray" : "green"}
            >{active ? "Deactivate" : "Activate"}</Button>

          </Group>

        </Grid.Col>

      </Grid>
      <Stack style={{ backgroundColor: '#f0f8ff', borderRadius: 10 }} my={12} p={12}>
        <Title c="dimmed" order={3}>About</Title>
        <Spoiler expanded={expanded}
          onExpandedChange={setExpanded}
          maxHeight={120}
          showLabel="Show more"
          hideLabel="Hide">
            <Textarea autosize {...props.courseForm.getInputProps('description')} py={6}/>
        </Spoiler>
        <Group justify="flex-end">
        <Button onClick={props.updateForm}>Update</Button>
        </Group>
      </Stack>
    </div>
  )
}