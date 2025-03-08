'use client';

import React, { useCallback, Suspense } from 'react';
import { IconExclamationCircle } from '@tabler/icons-react';
import { Badge, Group, Text, UnstyledButton, Stack, Avatar, Indicator, Space, } from '@mantine/core';
import classes from './MessagesNavbar.module.css';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { MessagesNavBarProps, ConversationUserData } from '@/app/types';
import { notifications, useNotifications } from "@mantine/notifications";
import { ConversationData } from "@/app/types";
import UserNameSearch from '../search/UserNameSearch';
import { api } from '@/app/actions/api';
import { getUser } from '@/app/actions/getAuth';

export function MessagesNavBar(props: MessagesNavBarProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const currentUser = getUser();
    const notificationsStore = useNotifications();
    const [selected, setSelected] = React.useState<string>(props?.selected);
    const [conversations, setConversations] = React.useState<ConversationData[] | undefined>();

    const getConversations = async () => {
        const { data, status } = await api.get(`/api/chat/conversations/`)
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
        setConversations(data);
        if (searchParams.size > 0) {
            const params = searchParams.get("selected");
            if (params) {
                setSelected(params);
            }
        }
    }

    React.useEffect(() => {
        getConversations();
    }, [searchParams, pathname, selected])

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set(name, value)

            return params.toString()
        },
        [searchParams]
    );

    const setSeen = async (id: string) => {
        const conv: ConversationData | undefined = conversations?.find((conv) => conv.id === id)
        if (conv) {
            const jsonData = JSON.stringify({ ids: conv.unread_messages_ids })
            const { status } = await api.put(`/api/chat/conversations/${id}/seen`, jsonData)
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
        }
    }

    const handleClick = async (conversationId: string) => {
        router.push('/messages' + '?' + createQueryString('selected', conversationId));
        await setSeen(conversationId);
        const newConversations = conversations?.map((conv) => {
            if (conv.id === conversationId) {
                conv.unread_messages = 0;
                conv.unread_messages_ids = [];
            }
            return conv
        });
        setConversations(newConversations);
        props.onClick(conversationId);
    }


    return (
        <Suspense>
            <nav className={classes.navbar}>
                {currentUser.role === "teacher" ? <UserNameSearch /> : <Space h="xl" />}
                
                <div className={classes.section}>
                    <div className={classes.mainLinks}>

                        <div className={classes.mainLinks}>
                            {conversations?.map((conversation) => conversation.users?.map((user: ConversationUserData) => {
                                const buttonColor = selected === `${conversation.id}` ? '#dbe4ff' : 'transparent';
                                return user.id != props.chatOwnerId && (
                                    <UnstyledButton
                                        onClick={() => handleClick(conversation.id)}
                                        key={conversation.id}
                                        style={{
                                            alignItems: 'center',
                                            borderRadius: 10,
                                            width: '100%', padding: 10, height: '100%',
                                            backgroundColor: buttonColor,
                                            display: 'flex', borderBottom: 10
                                        }}>
                                        <Group className={classes.mainLinkInner} justify='flex-start'>
                                            <Indicator offset={6} position="bottom-end" size={16} color={user.is_online ? "violet.5" : "gray.5"} withBorder >
                                                <Avatar src={`${user.photo}`}
                                                    radius="xl" />
                                            </Indicator>
                                            <Stack gap={3} justify='flex-end' align='flex-start'>
                                                <Text c="gray.8" fw={600} size="xs" >{user.name} </Text>
                                                {conversation.last_message.text !== "" && <Text w={200} truncate="end" c="dimmed" size="xs" > {conversation.last_message.sender.id === props.chatOwnerId ?
                                                    `You: ${conversation.last_message.text}` : `${conversation.last_message.sender.name}: ${conversation.last_message.text}`} </Text>}
                                            </Stack>
                                        
                                        {conversation.unread_messages > 0 &&  (
                                            <Badge size="sm" variant="filled" className={classes.mainLinkBadge}>
                                                {conversation.unread_messages}
                                            </Badge>
                                        )}
                                        </Group>



                                    </UnstyledButton>
                                )
                            })

                            )}


                        </div>

                    </div>
                </div>
            </nav>
        </Suspense>
    );
}