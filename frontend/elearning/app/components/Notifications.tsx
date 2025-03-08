'use client';

import React from "react";
import { useRouter } from 'next/navigation';
import { Text, ScrollArea, Center, LoadingOverlay } from "@mantine/core";
import { NotificationData } from "../types";
import { notifications as mantineNotifications } from '@mantine/notifications';
import { IconExclamationCircle } from "@tabler/icons-react";
import { api } from "../actions/api";
import NotificationList from "./lists/NotificationList";
import NotificationBanner from "./banners/Notification";

export default function Notifications() {
    const url = `/api/notifications/`;
    const router = useRouter();
    const [notifications, setNotifications] = React.useState<NotificationData[]>([]);
    const [isLoading, setLoading] = React.useState<boolean>(true);

    const getNotifications = async () => {
        const { data, status } = await api.get(url)
        if (status === 401 || status === 403) {
            mantineNotifications.show({
                title: "Session expired",
                message: "Please log in to continue",
                autoClose: 50000,
                icon: <IconExclamationCircle />,
                color: 'red',
            });
            router.push('/')
        }
        console.log("data", data)
        setNotifications(data);
        setLoading(false);
    }

    const handleRouteChange = async () => {
        const ids = notifications.filter((not) => {
            console.log(not.seen);
            return !not.seen
        });
        ids.map(async (id) => {
            const {status} = await api.patch(`${url}${id.id}`, JSON.stringify({ "seen": true }));
            console.log(status)
        })
            
    }

    React.useEffect(() => {
        getNotifications();

        return () => {
            handleRouteChange()
        }
    }, [notifications])

    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

    return (
        <ScrollArea type="scroll" offsetScrollbars scrollHideDelay={0}>
            <NotificationBanner />
            {notifications.length > 0 ?
                <NotificationList notifications={notifications} /> :
                <Center><Text c="dimmed">You have 0 notifications yet...</Text></Center>}
        </ScrollArea>
    )
}