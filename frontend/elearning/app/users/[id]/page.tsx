'use client';

import React from "react";
import { Avatar } from "@mantine/core";
import { useParams } from 'next/navigation';
import UserGuest from "@/app/components/dashboards/UserGuest";
import { getUser, getToken } from "@/app/actions/getAuth";
import { useRouter } from "next/navigation";
import { api } from "@/app/actions/api";
import { notifications, useNotifications } from "@mantine/notifications";
import { IconExclamationCircle } from "@tabler/icons-react";
import useWebSocket from "react-use-websocket";

export default function UserPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const userId = params.id;
    const currentUser = getUser();
    const token = getToken();
    const notificationsStore = useNotifications();

    React.useEffect(() => {
        if (currentUser.id === userId) {
            // return to the dashboard
            router.replace(`/home/${userId}`)
        }
    }, [])


    const { sendJsonMessage, lastJsonMessage } = useWebSocket(`${process.env.NEXT_PUBLIC_WS_ADDRESS}/ws/notify/${currentUser.id}/?token=${token}`,
        {
            share: true,
            shouldReconnect: () => true,
        }
    );

    const getUserAvatar = async (id: string) => {
        const { data, status } = await api.get(`/api/users/avatar/${id}/`)
        if (status === 401 || status === 403) {
            const check_if_exists = notificationsStore.notifications.find((notif) => notif.title === "Session expired")
            if (check_if_exists === undefined) {
                notifications.show({
                    title: "Session expired",
                    message: "Please log in to continue",
                    autoClose: false,
                    icon: <IconExclamationCircle />,
                    color: 'red',
                });
                router.push('/')
            }
        }
        return data
    }

    const getCourseAvatar = async (id: string) => {
        const { data, status } = await api.get(`/api/courses/${id}/photo`)
        if (status === 401 || status === 403) {
            const check_if_exists = notificationsStore.notifications.find((notif) => notif.title === "Session expired")
            if (check_if_exists === undefined) {
                notifications.show({
                    title: "Session expired",
                    message: "Please log in to continue",
                    autoClose: false,
                    icon: <IconExclamationCircle />,
                    color: 'red',
                });
                router.push('/')
            }
        }
        console.log(data)
        return data
    }

    const showMessage = async (senderId: string, messageId: string, messageBody: string) => {
        const avatar = await getUserAvatar(senderId);
        notifications.show({
            title: "You have new message!",
            message: messageBody,
            autoClose: false,
            icon: <Avatar src={`${avatar.photo}`} />,
            color: 'blue',
            onClose: () => {
                sendJsonMessage({
                    event: `public_room_${currentUser.id}`,
                    data: {
                        message_id: messageId,
                    }
                });
            },
        });
    }

    const showNotification = async (
        notificationId: string,
        courseId: string,
        senderName: string,
        notificationBody: string,
        courseTitle: string,
    ) => {
        const courseImage = await getCourseAvatar(courseId);
        notifications.show({
            title: `${senderName} ${notificationBody} ${courseTitle}`,
            message: "",
            autoClose: false,
            onClose: () => {
                sendJsonMessage({
                    event: `public_room_${currentUser.id}`,
                    data: {
                        notification_id: notificationId,
                    }
                });
            },
            icon: <Avatar src={`${courseImage.photo}`} />,
            color: 'blue',
        });
    }

    React.useEffect(() => {


        if (lastJsonMessage &&
            typeof lastJsonMessage === 'object' &&
            'id' in lastJsonMessage &&
            'sender_id' in lastJsonMessage &&
            'body' in lastJsonMessage
        ) {
            showMessage(lastJsonMessage.sender_id as string,
                lastJsonMessage.id as string, lastJsonMessage.body as string)
        }

        if (lastJsonMessage &&
            typeof lastJsonMessage === 'object' &&
            'notification_id' in lastJsonMessage &&
            'course_id' in lastJsonMessage &&
            'sender_name' in lastJsonMessage &&
            'course_title' in lastJsonMessage &&
            'body' in lastJsonMessage
        ) {
            showNotification(
                lastJsonMessage.notification_id as string,
                lastJsonMessage.course_id as string,
                lastJsonMessage.sender_name as string,
                lastJsonMessage.body as string,
                lastJsonMessage.course_title as string,
            );
        }

    }, [lastJsonMessage])

    if (currentUser.id !== userId) return <UserGuest id={userId} />
}
