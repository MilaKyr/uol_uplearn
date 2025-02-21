import React from "react";
import {
  Grid, Stack, Image, Group, Text, Pill,
  Spoiler, Divider, Title, Button, Modal,
  Center,
} from '@mantine/core';
import { IconCalendarWeek, IconClockHour8, IconHourglassEmpty, } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import { printDuration } from "@/app/components/utils";
import { CourseEditData, TagData } from "@/app/types";

export default function CourseMain(props: {course: CourseEditData} ) {
  const [expanded, setExpanded] = React.useState(false);
  const [active, setActive] = React.useState(props.course?.is_active);
  const [opened, { open, close }] = useDisclosure(false);
  const router = useRouter();
  const startDate = new Date(props.course?.start_date);
  const date = startDate.toLocaleDateString() || "";
  const time = startDate.toLocaleTimeString() || "";

  const toggleActive = async () => {
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }

    const parsedToken = JSON.parse(token);
    // Validate the token by making an API call
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/${props.course?.id}/active`, {
        headers: {
          Authorization: `Bearer ${parsedToken.access}`,
        },
        method: "POST"
      })
      if (!res.ok) throw new Error('');
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
      if (!res.ok) throw new Error('');
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
        <Grid.Col span="auto"><Image h={255} radius="md" src={`data:image/jpeg;base64,${props.course?.photo}`} /> </Grid.Col>
        <Grid.Col span="auto">

          <Title>{props.course?.title}</Title>

          <Group py={12} gap={6} justify="flex-start" align="flex-start">
            <IconCalendarWeek />
            <Text>Starting date: {date}</Text>
            <IconClockHour8 />
            <Text>at {time}</Text>
          </Group>

          <Group py={12} gap={6} justify="flex-start" align="flex-start">
            <IconHourglassEmpty />
            <Text>Duration: {printDuration(props.course?.duration)}</Text>
          </Group>


          <Group gap={6} py={12}>
            {props.course?.tags.map((tag: TagData) => (
              <Pill key={tag.id} >{tag.name} color={tag.color}</Pill>
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
        <Title order={3}>About</Title>
        <Spoiler expanded={expanded}
          onExpandedChange={setExpanded}
          maxHeight={120}
          showLabel="Show more"
          hideLabel="Hide"><Text>

            {props.course?.description}

          </Text>
        </Spoiler>
      </Stack>
    </div>
  )
}