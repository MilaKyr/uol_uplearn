import React, { Suspense } from "react";
import { Card, Group, Stack, Center, Textarea, ActionIcon, Avatar, Text, ScrollArea } from "@mantine/core";
import { IconSend, IconExclamationCircle } from "@tabler/icons-react";
import { ConversationWindowProps, Message, ConversationUserData } from "@/app/types";
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from "@mantine/notifications";
import useWebSocket from 'react-use-websocket';
import { getHotkeyHandler } from '@mantine/hooks';
import { api } from "@/app/actions/api";


export default function ConversationWindow(props: ConversationWindowProps) {

    const router = useRouter()
    const lastDate = React.useRef<string>("")
    const searchParams = useSearchParams();
    const messageDiv = React.useRef<HTMLDivElement>(null);
    const me = props.conversation.users?.find((user) => user.id === props.myId);
    const other = props.conversation.users?.find((user) => user.id !== props.myId);
    const [rtMessages, setRTMessages] = React.useState<Message[]>(props.messages);
    const [messageToSend, setMessageToSend] = React.useState<string>('');


    const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(`${process.env.NEXT_PUBLIC_WS_ADDRESS}/ws/${props.conversation.id}?token=${props.token}`,
        {
            share: false,
            shouldReconnect: () => true,
        },
    )

    const getConversation = async () => {
        const { data, status } = await api.get(`/api/chat/conversations/${props.conversation.id}/`)
        if (status === 401 || status === 403) {
            notifications.show({
                title: "Session expired",
                message: "Please log in to continue",
                autoClose: 5000,
                icon: <IconExclamationCircle />,
                color: 'red',
            });
            router.push('/')
        }
        setRTMessages(data.messages);
    }

    React.useEffect(() => {
        getConversation();
    }, [searchParams])

    React.useEffect(() => {
        console.log("Connection status", readyState)
    }, [readyState])

    React.useEffect(() => {
        if (lastJsonMessage &&
            typeof lastJsonMessage === 'object' &&
            'recipient_id' in lastJsonMessage &&
            'body' in lastJsonMessage &&
            'sender_id' in lastJsonMessage &&
            'id' in lastJsonMessage) {
            const recipient = props.conversation.users?.find((user) => user.id === lastJsonMessage.recipient_id);
            const sender = props.conversation.users?.find((user) => user.id === lastJsonMessage.sender_id);
            const message: Message = {
                id: lastJsonMessage.id as string,
                text: lastJsonMessage.body as string,
                recipient: recipient as ConversationUserData,
                sender: sender as ConversationUserData,
                conversationId: props.conversation.id

            }
            setRTMessages((rtMessages) => [...rtMessages, message]);

            if (lastJsonMessage.recipient_id === props.myId) {
                sentSeenStatus(lastJsonMessage.id as number)
            }

        }

        scrollToBottom();
    }, [lastJsonMessage])

    const sentSeenStatus = async (id: number) => {
        if (lastJsonMessage &&
            typeof lastJsonMessage === 'object' &&
            'id' in lastJsonMessage) {
            sendJsonMessage({
                event: 'seen',
                data: {
                    message_id: id,
                }
            });
        }

    }

    const sendMessage = async () => {
        if (messageToSend !== "") {
            sendJsonMessage({
                event: 'chat_message',
                data: {
                    body: messageToSend,
                    recipient_id: other?.id,
                    sender_id: me?.id,
                    conversation_id: props.conversation?.id
                }
            });
            setMessageToSend('');

            setTimeout(() => {
                scrollToBottom()
            }, 50)
        }

    }

    const showDate = (messageCreated: string) => {
        lastDate.current = messageCreated;
        return (
            <Center>
                <Text c="dimmed" size="xs">{messageCreated}</Text>
            </Center>
        )
    }

    const scrollToBottom = () => {
        if (messageDiv.current) {
            messageDiv.current!.scrollTo({ top: messageDiv.current!.scrollHeight, behavior: 'smooth' });
        }
    }

    return (
        <Suspense>
            <Card h={window.innerHeight - window.innerHeight / 4} shadow="sm" padding="lg" radius="md" >
                <ScrollArea.Autosize type={'never'} viewportRef={messageDiv} onLoad={scrollToBottom}>
                    {rtMessages && rtMessages.map((message, index) => (
                        <Stack key={index}>
                            {message.created && message.created !== lastDate.current && showDate(message.created)}
                            {message.recipient.id === props.myId ? (
                                <Group key={index} my={10} pr={15} py={4} style={{ width: "fit-content", backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 20 }} justify={'flex-start'}>
                                    <Avatar src={`${message.sender.photo}`}
                                        radius="xl" />
                                    <Text style={{overflowWrap: 'break-word', wordBreak: 'break-all'}} size="md">{message.text}</Text>
                                </Group>
                            ) : (
                                <Group key={index} my={10} py={4} justify={'flex-end'}>
                                    <Group pl={15} style={{ width: 'fit-content', backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 20 }}>
                                        <Text style={{wordBreak: 'break-all',overflowWrap: 'break-word'}}>{message.text}</Text>
                                        <Avatar src={`${message.sender.photo}`}
                                            radius="xl" />
                                    </Group>
                                </Group>
                            )}
                        </Stack>
                    ))}
                </ScrollArea.Autosize>
            </Card>
            <Group gap={0} my={24} justify="flex-start" align={'flex-end'}>
                <Textarea
                    autosize
                    value={messageToSend}
                    onChange={(e) => setMessageToSend(e.target.value)}
                    onKeyDown={getHotkeyHandler([
                        ['Enter', sendMessage],
                    ])}
                    radius={0}
                    style={{ width: '95%' }} size="md"
                    placeholder="Type your message.."
                ></Textarea>
                <ActionIcon
                    onClick={sendMessage}
                    style={{
                        borderBottomLeftRadius: 0, borderTopLeftRadius: 0,
                        borderTopRightRadius: 10, borderBottomRightRadius: 10
                    }} size='xl'
                >
                    <IconSend /></ActionIcon>
            </Group>
        </Suspense>
    )
}
