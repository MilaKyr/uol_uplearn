'use client';

import React from "react";
import { AppShell, useMantineTheme,  Text, LoadingOverlay, Center,
 } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { HeaderTabs } from "@/app/components/header/Header2";
import { IconExclamationCircle, IconMessages } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessagesNavBar } from "@/app/components/navbars/MessagesNavbar";
import { notifications } from "@mantine/notifications";
import { ConversationData } from "@/app/types";
import ConversationWindow from "../components/chat/ConversationWindow";

export default function Messages() {
    const theme = useMantineTheme();
    const [opened, { toggle }] = useDisclosure();
    const router = useRouter()
    const searchParams = useSearchParams();

    const [token, setToken] = React.useState<string>();
    const [currentConversation, setCurrentConversation] = React.useState<ConversationData>();
    const [userId, setUserId] = React.useState<number>();
    const [conversations, setConversations] = React.useState<ConversationData[]>();
    const [selected, setSelected] = React.useState(searchParams.get("selected") || "")

    const [isLoading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const getConversations = async () => {
            const token = window.sessionStorage.getItem("jwt");
            
                if (!token) {
                  router.replace('/') // If no token is found, redirect to login page
                  return
                }
            
                let parsedToken = JSON.parse(token);
                setUserId(parsedToken.user.id)
                // Validate the token by making an API call
                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/chat/`, {
                      headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                        "Content-Type": "application/json"
                      },
                    })
            
                    // if (!res.ok) {
                    //   if (res.status === 401) {
                    //     notifications.show({
                    //       title: "Session expired",
                    //       message: "Please log in to continue",
                    //       autoClose: false,
                    //       icon: <IconExclamationCircle />,
                    //       color: 'red',
                    //     });
                    //     window.sessionStorage.removeItem("jwt");
                    //     router.push('/') // Redirect to login if token validation fails
                    //   } else {
                    //     throw new Error('Something went wrong')
                    //   }
                    // };
                    setToken(parsedToken.access);
                    let convs: ConversationData[] = await res.json();
                    setConversations(convs);
                    setLoading(false);

                    if (searchParams.size > 0) {
                      let selectedParam = searchParams.get("selected")
                      if (selectedParam) {
                        let selectedId = parseInt(selectedParam);
                        let selectedConv = convs.find((conv) => conv.id === selectedId)
                        setCurrentConversation(selectedConv)
                      }
                      
                    }
                  } catch (error) {
                    console.log(error)
                }
        }

        getConversations();
    }, [userId])

    const selectConversation = async (conversationId: number) => {
      let selected = conversations?.find((conv) => conv.id === conversationId)
      setCurrentConversation(selected);
    }
    
    

    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
    return (
    <AppShell
    
        header={{ height: 70 }}
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
        >
          <AppShell.Header>
          <HeaderTabs opened={opened} toggle={toggle}/>
          </AppShell.Header>
    
          <AppShell.Navbar>
            {userId && <MessagesNavBar chatOwnerId={userId} selected={selected} onClick={selectConversation}/>}
            </AppShell.Navbar>
    

      <AppShell.Main>

        {currentConversation && userId ? <ConversationWindow messages={currentConversation.messages} conversation={currentConversation} myId={userId} token={token}/> :
        <Center pt={50}><IconMessages color="gray"/><Text fs='italic' c="dimmed">Select a user to chat with</Text></Center>}
            
      </AppShell.Main>
    </AppShell>
  );
}