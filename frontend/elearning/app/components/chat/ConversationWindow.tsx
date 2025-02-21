import React from "react";
import { Card, Group, Stack, Center, Textarea, ActionIcon, Avatar, Text, LoadingOverlay, ScrollArea } from "@mantine/core";
import { IconSend, IconExclamationCircle } from "@tabler/icons-react";
import { ConversationWindowProps, Message, ConversationData, ConversationUserData } from "@/app/types";
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from "@mantine/notifications";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { getHotkeyHandler } from '@mantine/hooks';

export default function ConversationWindow(props: ConversationWindowProps) {
    console.log(props)
    const router = useRouter()
    let lastDate = React.useRef<Date>(new Date())
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


    React.useEffect(() => {
        const getConversation = async () => {
            const token = window.sessionStorage.getItem("jwt");
                  
                      if (!token) {
                        router.replace('/') // If no token is found, redirect to login page
                        return
                      }
                  
                      let parsedToken = JSON.parse(token);
                      // Validate the token by making an API call
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/chat/${props.conversation.id}/`, {
                            headers: {
                              Authorization: `Bearer ${parsedToken.access}`,
                              "Content-Type": "application/json",
                              "Access-Control-Allow-Origin":"*"
                            },
                          })
                          if (!res.ok) {
                            if (res.status === 401) {
                                console.log("res STATUS 401")
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
                          let conv: ConversationData = await res.json();
                          setRTMessages(conv.messages);
                        } catch (error) {
                          console.log(error)
                      }
          }
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
            let recipient = props.conversation.users?.find((user) => user.id === lastJsonMessage.recipient_id);
            let sender = props.conversation.users?.find((user) => user.id === lastJsonMessage.sender_id);
            const message: Message = {
                id: lastJsonMessage.id as number,
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
                    message_id: lastJsonMessage.id as number,
                }
            });
        }
        
    }

    const sendMessage = async () => {
        console.log("| props.conversation?.id", props.conversation?.id, "other", other?.id, "me", me?.id)
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

    const showDate = (messageCreated: string) => {
        lastDate.current = new Date(messageCreated);
        return (
            <Center>
                <Text c="dimmed" size="xs">{new Date(
                    messageCreated
                ).toLocaleDateString(
                    "gb-EN",{year: "numeric",day: "numeric",month: "long"})}</Text>
                </Center>
        )
    }

    const scrollToBottom = () => {
        if (messageDiv.current) {
            messageDiv.current!.scrollTo({ top: messageDiv.current!.scrollHeight, behavior: 'smooth' });
        }
    }

    return (
        <>
            <Card  h={900} shadow="sm" padding="lg" radius="md" withBorder>
            <ScrollArea.Autosize type={'never'} viewportRef={messageDiv} onLoad={scrollToBottom}>
                {rtMessages && rtMessages.map((message, index) => (
                <Stack key={index}>
                            {message.created && message.created !== lastDate.current.toDateString() && showDate(message.created)}
                    { message.recipient.id === props.myId ? (
                        <Group key={index} my={24} pr={15} py={4} style={{ width: "fit-content", backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 20 }} justify={'flex-start'}>
                            <Avatar src={`data:image/jpeg;base64,${message.sender.photo}`}
                                radius="xl" />
                            <Text size="md">{message.text}</Text>
                        </Group>
                    ) : (
                        <Group key={index} my={24} py={4} justify={'flex-end'}>
                            <Group pl={15} style={{ width: 'fit-content', backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 20 }}>
                            <Text>{message.text}</Text>
                            <Avatar src={`data:image/jpeg;base64,${message.sender.photo}`}
                                radius="xl" />
                            </Group> 
                        </Group>
                    )}
                    </Stack>
                ))}
            </ScrollArea.Autosize>
            </Card>
            <Group gap={0} pl={15} my={24} justify="flex-end" align={'flex-end'}>
                <Textarea
                    autosize
                    value={messageToSend}
                    onChange={(e) => setMessageToSend(e.target.value)}
                    onKeyDown={getHotkeyHandler([
                        ['Enter', sendMessage],
                      ])}
                    radius={0}
                    style={{ width: '95%', borderTopLefttRadius: 10, borderBottomLeftRadius: 10 }} size="md"
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
        </>
    )
}
