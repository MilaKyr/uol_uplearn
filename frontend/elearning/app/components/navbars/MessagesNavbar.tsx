'use client';

import React, { useCallback } from 'react';
import { IconExclamationCircle } from '@tabler/icons-react';
import { Badge, Group, Text, UnstyledButton, Stack, Avatar, Indicator, } from '@mantine/core';
import classes from './MessagesNavbar.module.css';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { MessagesNavBarProps, ConversationUserData } from '@/app/types';
import { notifications } from "@mantine/notifications";
import { ConversationData } from "@/app/types";
import UserNameSearch from '../search/UserNameSearch';


export function MessagesNavBar(props: MessagesNavBarProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [selected, setSelected] = React.useState(props?.selected);
    const [conversations, setConversations] = React.useState<ConversationData[] | undefined>();

    React.useEffect(() => {
        const getConversations = async () => {
            const token = window.sessionStorage.getItem("jwt");

            if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
            }

            let parsedToken = JSON.parse(token);
            // Validate the token by making an API call
            try {
                const res = await fetch('http://127.0.0.1:8000/api/chat/', {
                    headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                        "Content-Type": "application/json"
                    },
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
                let convs: ConversationData[] = await res.json();
                setConversations(convs)
            } catch (error) {
                notifications.show({
                    title: "Session expired",
                    message: 'Please login to continue',
                    color: 'red'
                })
                router.replace('/') // Redirect to login if token validation fails
            }
        }

        getConversations();

        if (searchParams.size > 0) {
            let params = searchParams.get("selected");
            if (params) {
                setSelected(params);
            }
        }

    }, [searchParams, pathname])

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set(name, value)

            return params.toString()
        },
        [searchParams]
    );

    const setSeen = async (id: number) => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        let parsedToken = JSON.parse(token);
        let conv: ConversationData | undefined = conversations?.find((conv) => conv.id === id)
        if (conv) {
            // Validate the token by making an API call
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/chat/${conv.id}/seen/`, {
                    headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                        "Content-Type": "application/json"
                    },
                    method: "PUT",
                    body: JSON.stringify({ ids: conv.unread_messages_ids })
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
            } catch (error) {
                notifications.show({
                    title: "Session expired",
                    message: 'Please login to continue',
                    color: 'red'
                })
                router.replace('/') // Redirect to login if token validation fails
            }
        }
        
    }





    const handleClick = async (conversationId: number) => {
        router.push('/messages' + '?' + createQueryString('selected', `${conversationId}`));
        await setSeen(conversationId);
        let newConversations = conversations?.map((conv) => {
            if (conv.id === conversationId) {
                conv.unread_messages = 0;
                conv.unread_messages_ids = [];
            }
            return conv
        });
        console.log("newConversations", newConversations)
        setConversations(newConversations);
        props.onClick(conversationId);
    }




    return (
        <nav className={classes.navbar}>
            <UserNameSearch />

            <div className={classes.section}>
                <div className={classes.mainLinks}>

                    <div className={classes.mainLinks}>
                        {conversations?.map((conversation) => conversation.users?.map((user: ConversationUserData) => {
                            return user.id != props.chatOwnerId && (
                                <UnstyledButton
                                    onClick={() => handleClick(conversation.id)}
                                    key={conversation.id} style={{ alignItems: 'center', width: '100%', padding: 10, height: '100%', display: 'flex', borderBottom: 10 }}>
                                    <Group className={classes.mainLinkInner}>
                                        <Indicator offset={6} position="bottom-end" size={16} color={user.is_online ? "violet.5" : "gray.5"} withBorder >
                                            <Avatar src={`data:image/jpeg;base64,${user.photo}`}
                                                radius="xl" />
                                        </Indicator>
                                        <Stack gap={3} justify='flex-end' align='flex-start'>
                                            <Text c="gray.8" fw={600} size="xs" >{user.first_name} {user.last_name}</Text>
                                            {conversation.last_message.text !== "" && <Text truncate="end" c="dimmed" size="xs" > {conversation.last_message.sender.id === props.chatOwnerId ?
                                                `You: ${conversation.last_message.text}` : `${conversation.last_message.sender.first_name}: ${conversation.last_message.text}`} </Text>}
                                        </Stack>
                                    </Group>
                                    {conversation.unread_messages > 0 && (
                                        <Badge size="sm" variant="filled" className={classes.mainLinkBadge}>
                                            {conversation.unread_messages}
                                        </Badge>
                                    )}



                                </UnstyledButton>
                            )
                        })

                        )}


                    </div>

                </div>
            </div>
        </nav>
    );
}