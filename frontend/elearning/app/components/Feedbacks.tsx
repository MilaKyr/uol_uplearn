import React from "react";
import { useDisclosure } from '@mantine/hooks';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
    BackgroundImage, Stack, Title, Text, Modal, Rating,
    Textarea, Button, Table, ActionIcon, Group, Avatar,
    Center,
} from "@mantine/core";
import { IconEdit, IconCirclePlus, IconExclamationCircle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { FeedbackData } from "../types";

export default function Feedbacks() {
    const router = useRouter();
    const [opened, { open, close }] = useDisclosure(false);
    const [courseId, setCourseId] = React.useState<string>();
    const [title, setTitle] = React.useState<string>();
    const [currRating, setCurrRating] = React.useState<number>();
    const [currComment, setCurrComment] = React.useState<string>();
    const [feedbacks, setFeedbacks] = React.useState<FeedbackData []>([]);
    const [method, setMethod] = React.useState("POST");
    const [feedbackId, setFeedbackId] = React.useState<string>();
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const getFeedback = async () => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        const parsedToken = JSON.parse(token);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/feedbacks/`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${parsedToken.access}`,
                },
            });
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
            const thisfeedbacks = await res.json();
            console.log("thisfeedbacks", thisfeedbacks)
            setFeedbacks(thisfeedbacks);
        } catch (error) {
            console.error(error)
        }
    }

    React.useEffect(() => {
        getFeedback();
    }, [router, pathname, searchParams])

    const sendFeedback = async () => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        const parsedToken = JSON.parse(token);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/feedbacks/`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${parsedToken.access}`,
                },
                method: "POST",
                body: JSON.stringify({ course_id: courseId, text: currComment, rating: currRating }),
            });
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
            close();
            window.location.reload();
        } catch (error) {
            console.error(error)
        }
    }

    const updateFeedback = async () => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        
        const parsedToken = JSON.parse(token);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/feedbacks/${feedbackId}/`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${parsedToken.access}`,
                },
                method: "PUT",
                body: JSON.stringify({ course_id: courseId, text: currComment, rating: currRating }),
            });
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
            close();

        } catch (error) {
            console.error(error)
        }
        await getFeedback();
    }
    return (

        <Stack>

            <BackgroundImage mb={24}
                src="/feedback_bk_img.jpg"
                radius="sm" py={24}
            >
                <Stack m={24} justify="space-between" align="flex-start">
                    <Title >Leave a review!</Title>

                    <Text>Your learning experience is very valuable and help us improve.</Text>
                </Stack>
            </BackgroundImage>

            <Modal opened={opened} onClose={close} title={"Rate a course" + title}>
                <Rating size="md" value={currRating} onChange={setCurrRating} />
                <Textarea
                    maxLength={100}
                    pt={24}
                    autosize
                    label="Comment"
                    value={currComment}
                    onChange={(event) => setCurrComment(event.currentTarget.value)}
                    placeholder="This course was..."
                />
                <Text c="dimmed" size="xs"> Maximum 100 characters</Text>
                <Button onClick={() => {
                    if (feedbackId === undefined && method === "POST") {
                        return sendFeedback();
                    }
                    updateFeedback();

                }} mt={24}>Save</Button>
            </Modal>
            
            {feedbacks && feedbacks.length > 0 ? (<Table
                verticalSpacing="lg"
                highlightOnHover
                highlightOnHoverColor={'var(--mantine-color-blue-light)'}>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Course</Table.Th>
                        <Table.Th>Rating</Table.Th>
                        <Table.Th>Comment</Table.Th>
                        <Table.Th></Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {feedbacks.map((courseFeedback, index) => {
                        const icon = courseFeedback.feedback === null || courseFeedback.feedback.rating === 0 ? <IconCirclePlus /> : <IconEdit />;
                        const btnColor = courseFeedback.feedback === null || courseFeedback.feedback.rating === 0 ? "green.7" : "gray.7";
                        const btnType = courseFeedback.feedback === null || courseFeedback.feedback.rating === 0 ? "filled" : "default";
                        const method = courseFeedback.feedback === null || courseFeedback.feedback.rating === 0 ? "POST" : "PUT";
                        console.log(method)
                        return (
                            <Table.Tr key={index}>
                                <Table.Td>
                                    <Group gap={6}>
                                        <Avatar
                                            visibleFrom="xs"
                                            radius="sm"
                                            src={`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${courseFeedback.course.photo}`} />
                                        <Text>{courseFeedback.course.title}</Text>

                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Rating size="md" value={courseFeedback.feedback?.rating || 0} fractions={2} readOnly />
                                </Table.Td>
                                <Table.Td style={{width: '50%'}}> <Text ta={'justify'} style={{wordBreak: 'normal', width: '90%'}} >{courseFeedback.feedback?.text}</Text></Table.Td>
                                
                                <Table.Td align="left">

                                    <ActionIcon variant={btnType} color={btnColor} size="lg" radius="lg" onClick={
                                        () => {
                                            setFeedbackId(courseFeedback.feedback?.id);
                                            setCourseId(courseFeedback.course.id);
                                            setTitle(": " + courseFeedback.course.title);
                                            setCurrRating(courseFeedback.feedback?.rating || 0)
                                            setCurrComment(courseFeedback.feedback?.text || "");
                                            setMethod(method);

                                            open()
                                        }}>
                                        {icon}
                                    </ActionIcon>
                                </Table.Td>
                            </Table.Tr>
                        )
                    })}

                </Table.Tbody>
            </Table>): (
                <Center><Title c="dimmed" order={3}>Once you finish the course, you can leave a feedback</Title></Center>
            )}
            
        </Stack>

    )
}
