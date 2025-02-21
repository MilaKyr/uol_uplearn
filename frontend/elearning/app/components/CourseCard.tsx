import React from "react";
import { IconClockHour3 } from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import { printDuration } from "./utils";
import { Card, Group, Title, Image, UnstyledButton, Divider, Text, Avatar, Badge } from "@mantine/core";
import Rating from "./elements/Rating";
import { LearnMore } from "./buttons/LearnMore";
import { EnrollButton } from "./buttons/EnrollButton";
import { CourseListData } from "../types";

export default function CourseCard(props: {course: CourseListData, showUser: (id: number) => void,
    enroll: () => void
}) {
    const router = useRouter();

    const learnMore = (id: number) => {
        console.log("learn more", id)
        router.push(`/courses/${id}`)
      }
    

      
    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section>
                <Image h={200} alt="Course image" src={`data:image/jpeg;base64,${props.course.photo}`} />
              </Card.Section>

              <Group gap={5}>
                {props.course.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" my={12} color={tag.color}>{tag.name}</Badge>
                ))}
              </Group>
              <Title textWrap="balance" order={2}>{props.course.title}</Title>

              <UnstyledButton py={12} onClick={() => props.showUser(props.course.teacher.id)}>
                <Group gap={7}>
                  <Avatar src={`data:image/jpeg;base64,${props.course.teacher.photo}`}
                    alt={`${props.course.teacher.first_name} ${props.course.teacher.last_name}`}
                    radius="xl" size={42} />
                  <Text size="sm">Created by <Text component={'span'} fw={700}>
                    {props.course.teacher.first_name} props.course.teacher.last_name</Text>
                  </Text>
                </Group>
              </UnstyledButton>
              <Divider py={12} />

              <Group gap={4} justify="space-between" mb="xs">
                <Text size="sm" >Starts {new Date(props.course.start_date).toLocaleDateString()}</Text>
                <Group gap={4} justify="space-between" mb="xs">
                  <IconClockHour3 color='#888a85' strokeWidth={1} />
                  <Text c="dimmed" size="sm" fw={600}>{printDuration(props.course.duration)}</Text>
                </Group>
              </Group>

              <Rating course={props.course} />

              <Group align="flex-start" justify="space-between" mt="md" mb="xs">
                <LearnMore onClick={() => learnMore(props.course.id)} />
                <EnrollButton  onClick={props.enroll}/>
              </Group>

            </Card>
    )
}