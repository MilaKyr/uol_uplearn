import React from "react";
import { Modal, Center, Stack, Text, Divider, Title, Timeline, Button, Group, LoadingOverlay, TextInput } from '@mantine/core';
import { IconCheck, IconCircleCheck, IconExclamationCircle } from '@tabler/icons-react';
import { TopicProps } from "@/app/types";
import { useDisclosure } from '@mantine/hooks';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from "@mantine/notifications";
import { useForm, isNotEmpty } from '@mantine/form';
import { api } from "@/app/actions/api";

export default function TopicMain(props: { id: string, courseId: string, onDelete: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [topic, setTopic] = React.useState<TopicProps>();
  const [opened, { open, close }] = useDisclosure(false);
  const [isLoading, setLoading] = React.useState(true);

  const topicForm = useForm({
    mode: 'uncontrolled',
    initialValues: { title: '', n_hours: 0 },
    validateInputOnChange: true,
    validate: {
      title: isNotEmpty('Enter your bio description'),
      n_hours: (value) => (value <= 0 ? "Should be greater than 0" : null)
    },
  });

  const updateTopic = async () => {
    const jsonData = JSON.stringify(topicForm.getValues())
    const { status } = await api.patch(`/api/topics/${props.id}/`, jsonData)
    if (status === 401 || status === 403) {
      notifications.show({
        title: "Session expired",
        message: "Please log in to continue",
        autoClose: 5000,
        icon: <IconExclamationCircle />,
        color: 'red',
      });
      router.push('/')
    }
    notifications.show({
      title: "Success",
      message: "",
      autoClose: 6000,
      icon: <IconCircleCheck />,
      color: 'teal',
    });
  }


  React.useEffect(() => {
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }

    const parsedToken = JSON.parse(token);
    // Validate the token by making an API call
    const getTopic = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/topics/${props.id}/`, {
          headers: {
            Authorization: `Bearer ${parsedToken.access}`,
          },
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
        const data = await res.json();
        setTopic(data);
        setLoading(false);
        topicForm.setValues({ title: data.title, n_hours: data.n_hours });
      } catch (error) {
        console.error(error)
        router.replace('/') // Redirect to login if token validation fails
      }
    }

    getTopic()
  }, [searchParams])


  const deleteTopic = async () => {
    close();
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }

    const parsedToken = JSON.parse(token);
    // Validate the token by making an API call
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/topics/${topic?.id}/`, {
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
      props.onDelete();
      notifications.show({
        title: `Success`,
        message: `Topic ${topic?.title} has been deleted`,
        color: 'teal',
        icon: <IconCircleCheck />,
        autoClose: 5000,
      })
      router.push(`/edit/${props.courseId}`);
    } catch (error) {
      console.error(error)
    }
  }

  if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
  return (
    <Stack>
      <Modal opened={opened} onClose={close} title="Are you sure you want to delete this topic?">
        <Center pb={20}><Text c="red" fw={700}>This cannot be undone!</Text></Center>
        <Button size="sm"
          onClick={deleteTopic}
          color={"red"}
        >I want to delete</Button>

      </Modal>

      <TextInput {...topicForm.getInputProps('title')} py={6} />
      <Group>
        <Text pt={6} c="dimmed">Estimated time demand: </Text>
        <TextInput {...topicForm.getInputProps('n_hours')} py={6} />
        <Text c="dimmed"> hours</Text>
      </Group>

      <Text style={{ textAlign: "justify" }} c="dimmed">{topic?.description}</Text>

      <Divider pb={24} />
      <Title order={4}>Lessons:</Title>
      <Timeline bulletSize={24} my={24}>
        {topic?.lessons.map((lesson) => {
          const deadline = new Date(lesson.deadline).toLocaleString();
          return (
            <Timeline.Item
              key={lesson.id}
              bullet={<IconCheck />}
              title={lesson.title}>
              <Text c="dimmed">Deadline: {deadline}</Text>
            </Timeline.Item>
          )
        })}
      </Timeline>
      <Group justify="flex-end">
        <Button onClick={open} variant="outline" color="red">Delete</Button>
        <Button onClick={updateTopic}>Update</Button>
      </Group>
    </Stack>
  )
}