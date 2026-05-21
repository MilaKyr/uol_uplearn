import React from "react";
import Link from "next/link";
import { List, Group, Avatar, Text } from "@mantine/core";
import { ThemeIcon } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import { NotificationData } from "@/app/types";


const NotificationListItem = (props: {notification: NotificationData }) => {
    console.log(props.notification)
    const themeIconColor = props.notification.seen ? "gray" : "violet";
    return (
        <List.Item
            key={props.notification.id}
            icon={
                <ThemeIcon color={themeIconColor} size={24} radius="xl">
                    <IconBell size={16} />
                </ThemeIcon>
            }
            style={{
                backgroundColor: 'var(--mantine-color-blue-light)', padding: 10,
                borderRadius: 10,
            }}>
            <Group>
                <Link href={`/users/${props.notification.person.id}`} >
                    <Group>
                        <Avatar
                            src={`${props.notification.person.photo}`}
                            name={props.notification.person.name}
                        />
                        <Text>{props.notification.person.name}</Text>
                    </Group>
                </Link>

                <Text>{props.notification.text}</Text>

                <Link href={`/courses/${props.notification.course.id}`} >
                    <Group>
                        <Avatar
                            src={`${props.notification.course.photo}`}
                            name={props.notification.course.title}
                        />
                        <Text>{props.notification.course.title}</Text>
                    </Group>
                </Link> 
                <Group justify="flex-end">
                 <Text size="xs" c="dimmed">({props.notification.created})</Text>
                </Group>
            </Group>
            
        </List.Item>
    )
}

export default function NotificationList(props: { notifications: NotificationData[] }) {

    const notificationComponents = props.notifications.map((notification: NotificationData) =>
        <NotificationListItem key={notification.id} notification={notification}/>
    )

    return (
        <List
            spacing="lg"
            size="lg"
            center
        >
            {notificationComponents}
        </List >

    )
}