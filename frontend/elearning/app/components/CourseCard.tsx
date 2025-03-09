import React from "react";
import { IconClockHour3, IconExclamationCircle, IconCircleCheck } from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import { Card, Group, Title, Image, UnstyledButton, Divider, Text, Avatar, Badge } from "@mantine/core";
import Rating from "./elements/Rating";
import { LearnMore } from "./buttons/LearnMore";
import { EnrollButton } from "./buttons/EnrollButton";
import { CourseListData } from "../types";
import { notifications } from '@mantine/notifications';

export default function CourseCard(props: {
  course: CourseListData, index: number, showUser: (id: number) => void,
  removeCourse: (index: number) => void
}) {
  console.log(props.course)
  const router = useRouter();

  const learnMore = (id: string) => {
    router.push(`/courses/${id}`)
  }

  const enroll = async (course: CourseListData, index: number) => {
    // Validate the token by making an API call
    try {
      const token = window.sessionStorage.getItem("jwt");

      if (!token) {
        router.replace('/') // If no token is found, redirect to login page
        return
      }

      const parsedToken = JSON.parse(token);

      const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/enrollments/`, {
        headers: {
          Authorization: `Bearer ${parsedToken.access}`,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin":"*"
        },
        method: "POST",
        body: JSON.stringify({course_id: course.id})
      });
      if (res.ok) {
        notifications.show({
          title: "Success",
          message: `You have been enrolled in ${course.title}`,
          autoClose: 9000,
          icon: <IconCircleCheck />,
          color: 'teal',
        });
      } else {
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
    }
    } catch (error) {
      console.error(error)
    }
    props.removeCourse(index)
  }



  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image h={200} alt="Course image" src={`${props.course.photo}`} />
      </Card.Section>

      <Group gap={5}>
        {props.course.tags.map((tag) => (
          <Badge key={tag.id} variant="outline" my={12} color={tag.color}>{tag.name}</Badge>
        ))}
      </Group>
      <Title textWrap="balance" order={2}>{props.course.title}</Title>

      <UnstyledButton py={12} onClick={() => props.showUser(props.course.teacher.id)}>
        <Group gap={7}>
          <Avatar src={`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${props.course.teacher.photo}`}
            alt={props.course.teacher.name}
            radius="xl" size={42} />
          <Text size="sm">Created by <Text component={'span'} fw={700}>
            {props.course.teacher.name}</Text>
          </Text>
        </Group>
      </UnstyledButton>
      <Divider py={12} />

      <Group gap={4} justify="space-between" mb="xs">
        <Text size="sm" >Starts: {props.course.start_date}</Text>
        <Group gap={4} justify="space-between" mb="xs">
          <IconClockHour3 color='#888a85' strokeWidth={1} />
          <Text c="dimmed" size="sm" fw={600}>{props.course.duration} days</Text>
        </Group>
      </Group>

      <Rating course={props.course} />

      <Group align="flex-start" justify="space-between" mt="md" mb="xs">
        <LearnMore onClick={() => learnMore(props.course.id)} />
        <EnrollButton onClick={() => { enroll(props.course, props.index) }} />
      </Group>

    </Card>
  )
}