import React from "react";
import Link from "next/link";
import { Table, UnstyledButton, Group, Avatar, Text, Flex, Progress, Button } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { CourseStudentHomeData } from "@/app/types";

export default function CourseStudentTableRow(props: {course: CourseStudentHomeData, setLoading: (value: boolean) => void} ) {

    const statusColor = props.course.status === "started" ? 'blue.2' :
        props.course.status === "blocked" ? 'orange.2' :
            props.course.status === "removed" ? 'gray.2' : 'green.2';

    const statusTextColor = props.course.status === "started" ? 'blue.9' :
        props.course.status === "blocked" ? 'orange.9' :
            props.course.status === "removed" ? 'gray.9' : 'green.9';

    const courseLink = props.course.status !== "started" ? `courses/${props.course.id}` : `study/${props.course.id}`;

    return (
        <>
            <Table.Tr key={props.course.id}>
                <Table.Td>
                    <UnstyledButton component={Link} href={courseLink} onClick={() => {
                        props.setLoading(true);
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
                                src={`data:image/jpeg;base64,${props.course.photo}`} />
                            <Text>{props.course.title}</Text>
                        </Group>
                    </UnstyledButton>
                </Table.Td>
                <Table.Td>
                    <Flex align="center" justify="center">
                        <Text size="xs" pr={3} visibleFrom="xl" c="dimmed">0</Text>
                        <Progress visibleFrom="xl" value={props.course.progress * 100} striped style={{ flex: "1" }} />
                        <Text hiddenFrom="xl" fw={600} c="dimmed">{Math.round(props.course.progress * 100)}%</Text>
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