'use client';

import React from "react";
import Link from "next/link";
import {
    Image, Group, Title, Stack, Text, Avatar,
    Button, Table, BackgroundImage, Divider, Card, Badge,
    Spoiler, SimpleGrid, Blockquote, Center, CloseButton,
    UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { IconExclamationCircle, IconPacman, } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { HeaderTabs } from "../header/Header2";
import { notifications } from '@mantine/notifications';
import { UserGuestData } from '@/app/types';



export default function UserGuest(props: { id: number }) {
    const router = useRouter();
    const [opened, { toggle }] = useDisclosure();
    const [user, setUser] = React.useState<UserGuestData | null>(null);

    React.useEffect(() => {
        const getUser = async () => {
            const token = window.sessionStorage.getItem("jwt");

            if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
            }

            let parsedToken = JSON.parse(token);

            try {

                const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/users/${props.id}/`, {
                    headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                        "Content-Type": "application/json"
                    },
                });
                if (!res.ok) throw new Error('Spmething went wrong');
                let user = await res.json();
                console.log(user)
                setUser(user);
            } catch (error) {
                console.error(error)
            }
        }

        getUser();

    }, [])

    const onClose = () => {
        router.back()
    }

    const createConversation = async (recipientId: number) => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        let parsedToken = JSON.parse(token);

        // Validate the token by making an API call
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/chat/`, {
                headers: {
                    Authorization: `Bearer ${parsedToken.access}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ "recipient_id": recipientId })
            })

            if (!res.ok) {
                if (res.status === 401) {
                    notifications.show({
                        title: "Session expired",
                        message: "Please log in to continue",
                        autoClose: false,
                        icon: <IconExclamationCircle />,
                        color: 'red',
                    });
                    window.sessionStorage.removeItem("jwt");
                    router.push('/') // Redirect to login if token validation fails
                } else {
                    throw new Error('Something went wrong')
                }
            };
            let result = await res.json()
            return result

        } catch (error) {
            console.error(error)
        }
    }

    const startConversation = async (recipientId: number | undefined) => {
        if (recipientId) {
            let conv = await createConversation(recipientId);
            console.log(conv.id)
            router.push(`/messages?selected=${conv.id}`)
        }
    }


    return (
        <>
            <HeaderTabs opened={opened} toggle={toggle} />
            <Divider />
            <Center style={{ backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 10 }}>
                <Stack p={24} w={{ base: 600, xs: 570, sm: 760, md: 800, lg: 900, xl: 900 }}>
                    <Group justify='flex-end'><CloseButton onClick={onClose} />  </Group>
                    <BackgroundImage
                        src="/student_bk_img.jpg"
                        radius="sm" pb={24} pt={10}
                    >
                        <Group m={24} justify="space-between" align="flex-start">
                            <Stack>
                                <Title >{user?.first_name} {user?.last_name}</Title>
                                {user?.is_online && <Badge
                                    size="lg"
                                    variant="gradient"
                                    gradient={{ from: 'grape', to: 'violet', deg: 90 }}
                                >
                                    Online
                                </Badge>}

                            </Stack>

                            <Avatar
                                style={{ backgroundColor: '#696969' }}
                                size="xl"
                                radius="lg"
                                color="initials"
                                name={user?.first_name + " " + user?.last_name}
                                src={`data:image/jpeg;base64,${user?.photo}`}
                            />
                        </Group>

                    </BackgroundImage>

                    {user?.role === "student" ? (
                        <Blockquote color="indigo" radius="md" iconSize={46} icon={<IconPacman />} mt="lg">
                            {user?.status ? user?.status : "Too busy to write a status 😜"}
                        </Blockquote>) : (<>
                            <Title order={3}>🧊 About me</Title>
                            <Spoiler hideLabel="Show less" showLabel="Show more">
                                <Text style={{ whiteSpace: 'pre-line' }}>{user?.bio}</Text>
                            </Spoiler>
                        </>
                    )
                    }
                    <Group justify="flex-end">

                        <Button onClick={() => startConversation(user?.id)} color={"blue.8"}>
                            Message me
                        </Button>
                    </Group>


                    <Divider />

                    {user?.courses && user?.courses.length > 0 ? (
                        <>
                            <Title order={3}>{user?.role === "student" ? "📚 Currently studying" : "🧑‍🏫 Currently teaching"}</Title>
                            {user?.role === "student" ? (
                                <Table
                                    highlightOnHover
                                    highlightOnHoverColor={'var(--mantine-color-blue-light)'}>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Course</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {user?.courses.map((course) => (
                                            <Table.Tr key={course.id}>
                                                <Table.Td>
                                                    <UnstyledButton component={Link} href={`/courses/${course.id}`}>
                                                        <Group >
                                                            <Avatar
                                                                visibleFrom="xs"
                                                                radius="sm"
                                                                src={`data:image/jpeg;base64,${course.photo}`} />
                                                            <Stack gap={0}>
                                                                <Text>{course.title}</Text>
                                                                <Text size="xs" c="dimmed">{course.duration}</Text>
                                                            </Stack>
                                                        </Group>
                                                    </UnstyledButton>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            ) : (
                                <SimpleGrid
                                    cols={{ base: 1, sm: 2, lg: 3 }}
                                    spacing={{ base: 10, sm: 'xl' }}
                                    verticalSpacing={{ base: 'md', sm: 'xl' }}>
                                    {user?.courses.map((course) => (
                                        <Card key={course.id} shadow="sm" padding="lg" radius="md" withBorder
                                            component={Link}
                                            href={`/courses/${course.id}`}
                                        >
                                            <Card.Section>
                                                <Image h={200} alt="Course image" src={`data:image/jpeg;base64,${course.photo}`} />
                                            </Card.Section>
                                            <Title pt={24} order={3}>{course.title}</Title>
                                        </Card>
                                    ))}
                                </SimpleGrid>
                            )}

                        </>
                    ) : <Text c="dimmed">🔎 Still searching for interesting courses!...</Text>}
                </Stack>
            </Center>
        </>
    )
}
