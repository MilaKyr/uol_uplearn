'use client';

import React from "react";
import { Text, ScrollArea, Center, LoadingOverlay } from "@mantine/core";
import { NotificationData } from "../types";
import { api } from "../actions/api";
import NotificationList from "./lists/NotificationList";
import NotificationBanner from "./banners/Notification";

export default function Notifications() {
    const url = `/api/notifications/`;
    const [notifications, setNotifications] = React.useState<NotificationData[]>([]);
    const [isLoading, setLoading] = React.useState<boolean>(true);

    const getNotifications = async () => {
        const { data } = await api.get(url)
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