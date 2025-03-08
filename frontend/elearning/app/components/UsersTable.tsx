'use client';

import React from "react";
import {
  ScrollArea, Table, Group,
  Avatar, Text,
  Pill, LoadingOverlay,
  ActionIcon
} from "@mantine/core";
import { IconExclamationCircle, IconMessageCircle } from "@tabler/icons-react";
import { useRouter } from 'next/navigation'
import UserSearch from "./UserSearch";
import { notifications } from '@mantine/notifications';
import { SearchedUserData } from "../types";
import { api } from "../actions/api";

export default function UsersTable() {
  const baseURL = `/api/users/search`;
  const router = useRouter();
  const [users, setUsers] = React.useState<SearchedUserData[]>();
  const [isLoading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getAllUsers();
  }, [])

  const getAllUsers = async () => {
    const { data, status } = await api.get(baseURL)
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
    console.log(data)
    setUsers(data);
    setLoading(false);
  }

  const createConversation = async (recipientId: string) => {
    const jsonData = JSON.stringify({ "recipient_id": recipientId })
    const { data, status } = await api.post(`/api/chat/conversations/new`, jsonData)
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
    return data
  }

  const startConversation = async (recipientId: string) => {
    if (recipientId) {
      const conversationId = await createConversation(recipientId);
      router.push(`/messages?selected=${conversationId.id}`)
    }

  }

  if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

  return (
    <ScrollArea>
      <UserSearch onClick={setUsers} />
      {users && <UserTableBase users={users} onClick={startConversation} />}
    </ScrollArea>
  )
}

const UserTableBase = (props: {
  users: SearchedUserData[],
  onClick: (id: string) => void,
}
) => (
  <Table>
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Name</Table.Th>
        <Table.Th>Role</Table.Th>
        <Table.Th />
        <Table.Th />
      </Table.Tr>

    </Table.Thead>
    <Table.Tbody>
      {props.users.length > 0 && props.users.map((user) => (
        <UserTableRowBase key={user.id} user={user} onClick={props.onClick} />
      ))}
    </Table.Tbody>
  </Table>
)

const UserTableRowBase = (props: {
  user: SearchedUserData,
  onClick: (id: string) => void,
}) => (
  <Table.Tr key={props.user.id}>
    <Table.Td>
      <Group align="center" justify="flex-start">
        <Avatar key={props.user.id}
          name={props.user.name}
          src={`${props.user.photo}`} />
        <Text component={'a'} href={"/users/" + props.user.id}>{props.user.name}</Text>
      </Group></Table.Td>
    <Table.Td>
      <Pill
        pt={5}
        style={{ backgroundColor: props.user.role === "teacher" ? '#d0bfff' : '#b2f2bb' }} size="xl" >
        <Text c={props.user.role === "teacher" ? 'violet.9' : 'green.8'} tt="capitalize">
          {props.user.role}
        </Text>
      </Pill>
    </Table.Td>
    <Table.Td>
      {props.user?.status ? <Pill style={{ backgroundColor: props.user?.status === "started" ? '#d0ebff' : props.user?.status === "finished" ? '#f1f3f5' : props.user?.status === "blocked" ? '#ffe8cc' : '#ffdeeb' }} size="xl">
        <Text
          c={props.user?.status === "started" ? 'blue.9' :
            props.user?.status === "finished" ? 'gray.9' :
              props.user?.status === "blocked" ? 'orange.9' : 'red.9'}
          pt={5} tt={'capitalize'}>{props.user?.status}</Text></Pill> : null}
    </Table.Td>
    <Table.Td>
      <ActionIcon onClick={() => props.onClick(props.user.id)} variant="transparent"><IconMessageCircle /></ActionIcon>
    </Table.Td>
  </Table.Tr>
)
