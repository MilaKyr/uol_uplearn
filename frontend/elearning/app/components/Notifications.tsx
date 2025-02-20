'use client';

import React from "react";
import { useRouter } from 'next/navigation';
import { Text, ScrollArea, Center, LoadingOverlay } from "@mantine/core";
import { NotificationData } from "../types";
import { notifications as mantineNotifications } from '@mantine/notifications';
import { IconExclamationCircle } from "@tabler/icons-react";
import NotificationList from "./lists/NotificationList";
import NotificationBanner from "./banners/Notification";

export default function Notifications() {
    const router = useRouter();
    const [notifications, setNotifications] = React.useState<NotificationData[]>([]);
    const [isLoading, setLoading] = React.useState<boolean>(true);

    React.useEffect(() => {

        const handleRouteChange = async () => {
            const token = window.sessionStorage.getItem("jwt");

            if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
            }

            let parsedToken = JSON.parse(token);
            let ids = notifications.map((notification) => {
                if (!notification.seen) {
                    return notification.id
                }
            });
            if (ids.length > 0) {
                // Validate the token by making an API call
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/notifications/seen`, {
                        headers: {
                            Authorization: `Bearer ${parsedToken.access}`,
                            "Content-Type": "application/json"
                        },
                        method: "POST",
                        body: JSON.stringify({ "ids": ids })
                    })

                    if (!res.ok) {
                        if (res.status === 401) {
                            mantineNotifications.show({
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
                } catch (error) {
                    console.error(error)
                }
            }

        }

        const getNotifications = async () => {
            const token = window.sessionStorage.getItem("jwt");

            if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
            }

            let parsedToken = JSON.parse(token);
            // Validate the token by making an API call
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/notifications/`, {
                    headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                        "Content-Type": "application/json"
                    },
                    method: "GET",
                })

                if (!res.ok) {
                    if (res.status === 401) {
                        mantineNotifications.show({
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
                let returnedNotifications: NotificationData[] = await res.json();
                setNotifications(returnedNotifications);
            } catch (error) {
                console.error(error)
                router.replace('/') // Redirect to login if token validation fails
            }
        }
        if (notifications.length === 0) {
            getNotifications();
            setLoading(false);
        } else {
            setLoading(false);
        }

        
        return () => {
            handleRouteChange()
        }

    }, [])

    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

    return (
        <ScrollArea type="scroll" offsetScrollbars scrollHideDelay={0}>
            <NotificationBanner/>
            {notifications.length > 0 ?
                <NotificationList notifications={notifications} /> :
                <Center><Text c="dimmed">You have 0 notifications yet...</Text></Center>}
        </ScrollArea>
    )
}