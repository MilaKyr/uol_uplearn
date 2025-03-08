'use client';

import React, { Suspense } from "react";
import {
  AppShell, Text, LoadingOverlay, Center,
} from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { HeaderTabs } from "@/app/components/header/Header2";
import { IconMessages } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessagesNavBar } from "@/app/components/navbars/MessagesNavbar";
import { ConversationData } from "@/app/types";
import ConversationWindow from "../components/chat/ConversationWindow";
import { api } from "../actions/api";
import { notifications, useNotifications } from "@mantine/notifications";
import { IconExclamationCircle } from "@tabler/icons-react";
import { getToken, getUser } from "../actions/getAuth";

export default function MessagesSuspensed() {
  return (
    <Suspense>
      <Messages />
    </Suspense>
  )
}

function Messages() {
  const [opened, { toggle }] = useDisclosure();
  const router = useRouter()
  const user = getUser();
  const token = getToken();
  const notificationsStore = useNotifications()
  const searchParams = useSearchParams();
  const [currentConversation, setCurrentConversation] = React.useState<ConversationData>();
  const [conversations, setConversations] = React.useState<ConversationData[]>();
  const [selected, setSelected] = React.useState<string>(searchParams.get("selected") || "")

  const [isLoading, setLoading] = React.useState(true);

  const getConversations = async () => {
    const { data, status } = await api.get(`/api/chat/conversations/`)
    if (status === 401 || status === 403) {
      const check_if_exists = notificationsStore.notifications.find((notif) => notif.title === "Session expired")
      if (check_if_exists === undefined) {
        notifications.show({
          title: "Session expired",
          message: "Please log in to continue",
          autoClose: 5000,
          icon: <IconExclamationCircle />,
          color: 'red',
        });
        router.push('/')
      }
    }
    setConversations(data);
    setLoading(false);
    if (searchParams.size > 0) {
      const selectedParam = searchParams.get("selected")
      if (selectedParam) {
        setSelected(selectedParam)
        const selectedConv = data.find((conv: ConversationData) => conv.id === selectedParam)
        setCurrentConversation(selectedConv)
      }

    }
  }

  React.useEffect(() => {
    getConversations();

  }, [searchParams])

  const selectConversation = async (conversationId: string) => {
    const selected = conversations?.find((conv) => conv.id === conversationId)
    setSelected(`${conversationId}`);
    setCurrentConversation(selected);
  }



  if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
  return (
    <Suspense>
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
          <HeaderTabs opened={opened} toggle={toggle} />
        </AppShell.Header>

        <AppShell.Navbar>
          <MessagesNavBar chatOwnerId={user.id} selected={selected} onClick={selectConversation} />
        </AppShell.Navbar>


        <AppShell.Main>

          {currentConversation ?
            <ConversationWindow
              messages={currentConversation.messages}
              conversation={currentConversation}
              myId={user.id} token={token} /> :
            <Center pt={50}>
              <IconMessages color="gray" />
              <Text fs='italic' c="dimmed">Select a user to chat with</Text>
            </Center>}

        </AppShell.Main>
      </AppShell>
    </Suspense>
  );
}