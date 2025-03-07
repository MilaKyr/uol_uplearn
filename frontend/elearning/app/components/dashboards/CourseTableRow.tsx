import React from "react";
import Link from "next/link";
import { Table, UnstyledButton, Group, Avatar, Text, Flex, Progress, Button,
    ActionIcon, Rating,
 } from "@mantine/core";
import { IconX, IconEye, IconEyeClosed, IconEdit } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { Course } from "@/app/types";

export function CourseStudentTableRow(props: { course: Course, }) {

    const statusColor = props.course.status === "started" ? 'blue.2' :
        props.course.status === "blocked" ? 'orange.2' :
            props.course.status === "removed" ? 'gray.2' : 'green.2';

    const statusTextColor = props.course.status === "started" ? 'blue.9' :
        props.course.status === "blocked" ? 'orange.9' :
            props.course.status === "removed" ? 'gray.9' : 'green.9';

    const courseLink = props.course.status !== "started" ? `/courses/${props.course.id}` : `/study/${props.course.id}`;

    const courseProgress = props.course.progress ? Math.round(props.course.progress * 100) : 0;
    return (
        <>
            <Table.Tr key={props.course.id}>
                <Table.Td>
                    <UnstyledButton component={Link} href={courseLink} onClick={() => {
                        if (props.course.status !== "started" && props.course.status !== "finished") {
                            notifications.show({
                                title: `Your are ${props.course.status} from the course ${props.course.title}`,
                                message: 'You can no longer access the course',
                                color: 'red',
                                icon: <IconX />,
                                autoClose: false,
                            })
                        }
                    }

                    }>
                        <Group>
                            <Avatar
                                visibleFrom="xs"
                                radius="sm"
                                src={`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${props.course.photo}`} />
                            <Text>{props.course.title}</Text>
                        </Group>
                    </UnstyledButton>
                </Table.Td>
                <Table.Td>
                    <Flex align="center" justify="center">
                        <Text size="xs" pr={3} visibleFrom="xl" c="dimmed">0</Text>
                        <Progress visibleFrom="xl" value={courseProgress} striped style={{ flex: "1" }} />
                        <Text hiddenFrom="xl" fw={600} c="dimmed">{courseProgress}%</Text>
                        <Text size="xs" pl={3} visibleFrom="xl" c="dimmed">100%</Text>
                    </Flex>

                </Table.Td>
                <Table.Td align="right">
                    <Button variant="filled" color={statusColor} size="xs" radius="lg">
                        <Text size="sm" c={statusTextColor} tt="capitalize">{props.course.status}</Text>
                    </Button>
                </Table.Td>
            </Table.Tr>
        </>
    )
}

export function CourseTeacherTableRow(props: { course: Course, onCourseClick: (id: string) => void }) {
    if ( props.course.registered_students) {
        const max_students = Math.min(4, props.course.registered_students.length);
        const first4Students = props.course.registered_students.slice(0, max_students);
        const icon = props.course.is_active ? <IconEye size={26} color={'#12b886'} /> : <IconEyeClosed size={26} color={'#868e96'} />
        const studentComp = first4Students.map((std) => (
            <Avatar key={std.id} name={std.name} src={`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${std.photo}`} />
        ));
        return (
            <Table.Tr key={props.course.id}>
    
                <Table.Td>
                    <Group align="center" gap={36}>
                        {icon}
                        <ActionIcon component={Link} href={`/edit/${props.course.id}`} variant="transparent"><IconEdit /></ActionIcon>
                        <UnstyledButton component={Link} href={`/courses/${props.course.id}`}>
                            <Group gap={5}>
                                <Avatar
                                    visibleFrom="xs"
                                    radius="sm"
                                    name={props.course.title}
                                    src={`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${props.course.photo}`} />
                                <Text>{props.course.title}</Text>
                            </Group>
                        </UnstyledButton>
    
                    </Group>
                </Table.Td>
                <Table.Td>
                    <Group gap={4} align="flex-start">
                        <Rating size="md" defaultValue={props.course.average_rating} fractions={2} readOnly />
                        <Text c="dimmed">({props.course.n_students})</Text>
                    </Group>
    
                </Table.Td>
                <Table.Td align="left">
                    <UnstyledButton onClick={() => {props.onCourseClick(props.course.id)}}>
                        <Group gap={3}>
                            {studentComp}
                        </Group>
                    </UnstyledButton>
                </Table.Td>
            </Table.Tr>
        )
    }
    

}