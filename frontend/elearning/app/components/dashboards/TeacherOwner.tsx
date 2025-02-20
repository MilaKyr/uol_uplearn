'use client';

import React from "react";
import Link from "next/link";
import {
    Group, Title, UnstyledButton, Stack, Text, Avatar,
    Button, Table, Box, BackgroundImage, Divider, Rating, Modal, Spoiler, ActionIcon,
    SimpleGrid, LoadingOverlay,
} from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import 'dayjs/locale/en';
import { useRouter } from 'next/navigation';
import CourseStudentList from "../CourseStudentList";
import { HomeData } from "@/app/types";

export default function TeacherOwner() {
    const router = useRouter();
    const [opened, { open, close }] = useDisclosure(false);
    const [data, setData] = React.useState<HomeData>();
    const [isLoading, setLoading] = React.useState(true);
    const [courseId, setCourseId] = React.useState<number | undefined>();

    React.useEffect(() => {
        const getStudent = async () => {
            const token = window.sessionStorage.getItem("jwt");

            if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
            }

            let parsedToken = JSON.parse(token);
            // Validate the token by making an API call
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/home/`, {
                    headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                    },
                })

                if (!res.ok) throw new Error('Token validation failed');
                let data = await res.json();


                const res2 = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/user/photo`, {
                    headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                    },
                })
                if (res2.status === 200) {
                    let photo = await res2.blob();
                    data.photo = URL.createObjectURL(photo);
                }

                setData(data)
                setLoading(false);
            } catch (error) {
                console.error(error)
                router.replace('/') // Redirect to login if token validation fails
            }
        }
        getStudent();
    }, [])



    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
    return (
        <>
            <Modal opened={opened} onClose={close} title="Students">
                {courseId && <CourseStudentList courseId={courseId} />}
            </Modal>



            <SimpleGrid cols={{ base: 1, sm: 1, md: 1, lg: 1 }} spacing="md">
                <Stack>
                    <Box>
                        <BackgroundImage
                            src="/student_bk_img.jpg"
                            radius="sm" py={24}
                        >
                            <Group m={24} justify="space-between" align="flex-start">
                                <Title> Hello, {data?.first_name} {data?.last_name}!</Title>
                            </Group>
                            <Text mx={24}>Start your teaching journey here!</Text>
                        </BackgroundImage>
                    </Box>


                    <Stack p={24} style={{ backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 10 }}>
                        <Group justify="space-between">
                            <Title c="dimmed" order={3}>About me</Title>
                        </Group>
                        <Spoiler hideLabel="Show less" showLabel="Show more">
                            <Text style={{ whiteSpace: 'pre-line' }}>{data?.bio}</Text>
                        </Spoiler>
                    </Stack>


                    <Divider />

                    {data?.courses && data?.courses.length > 0 ? (
                        <Table
                            highlightOnHover
                            highlightOnHoverColor={'var(--mantine-color-blue-light)'}>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Course</Table.Th>
                                    <Table.Th>Rating</Table.Th>
                                    <Table.Th >Students</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {data?.courses.map((course) => {
                                    let max_students = Math.min(4, course.registered_students?.length);
                                    let first4Students = course.registered_students.slice(0, max_students);
                                    let studentComp = first4Students.map((std) => (
                                        <Avatar key={std.id} name={`${std.first_name} ${std.last_name}`} src={`data:image/jpeg;base64,${std.photo}`} />
                                    ));
                                    return (
                                        <Table.Tr key={course.id}>
                                            <Table.Td>

                                                <Group align="center" gap={36}>
                                                    <ActionIcon component={Link} href={`/edit/${course.id}`} variant="transparent"><IconEdit /></ActionIcon>
                                                    <UnstyledButton component={Link} href={`/courses/${course.id}`}>
                                                        <Group gap={5}>
                                                            <Avatar
                                                                visibleFrom="xs"
                                                                radius="sm"
                                                                name={course.title}
                                                                src={`data:image/jpeg;base64,${course.photo}`} />
                                                            <Text>{course.title}</Text>
                                                        </Group>
                                                    </UnstyledButton>

                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={4} align="flex-start">
                                                    <Rating size="md" defaultValue={course.average_rating} fractions={2} readOnly />
                                                    <Text c="dimmed">({course.n_students})</Text>
                                                </Group>

                                            </Table.Td>
                                            <Table.Td align="left">
                                                <UnstyledButton onClick={() => {
                                                    setCourseId(course.id);
                                                    open()
                                                }}>
                                                    <Group gap={3}>
                                                        {studentComp}
                                                    </Group>
                                                </UnstyledButton>
                                            </Table.Td>
                                        </Table.Tr>
                                    )
                                })}
                            </Table.Tbody>
                        </Table>
                    ) : (
                        <Group justify="center">
                            <Button component={Link} href={{ pathname: '/home', query: { selected: 'addCourse' } }} w={'50%'} variant="outline" color="teal" >
                                <Group align="flex-start" gap={10}>
                                    <IconPlus />
                                    <Text>Create your first course!</Text>
                                </Group>

                            </Button>
                        </Group>

                    )
                    }


                </Stack>

            </SimpleGrid>


        </>
    )
}
