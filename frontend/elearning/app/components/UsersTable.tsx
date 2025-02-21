'use client';

import React from "react";
import { ScrollArea, Table, Group, 
  Avatar, Text,  Stack, Center,
  Pill,
  ActionIcon} from "@mantine/core";
import { IconExclamationCircle, IconMessageCircle } from "@tabler/icons-react";
import { useRouter } from 'next/navigation'
import UserSearch from "./UserSearch";
import { notifications } from '@mantine/notifications';
import { SearchedUserData } from "../types";

export default function UsersTable () {
    const router = useRouter();
    const [users, setUsers] = React.useState<SearchedUserData []>();

    React.useEffect(() => {

      const getUsers = async () => {
        const token = window.sessionStorage.getItem("jwt");
      
          if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
          }
      
          const parsedToken = JSON.parse(token);
        
          // Validate the token by making an API call
          try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/users/`, {
                headers: {
                  Authorization: `Bearer ${parsedToken.access}`,
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
              const users = await res.json();
              setUsers(users);
            } catch (error) {
              console.error(error)
            }
      }
      getUsers();

    }, [])


    const createConversation = async (recipientId: number) => {
      const token = window.sessionStorage.getItem("jwt");
    
        if (!token) {
          router.replace('/') // If no token is found, redirect to login page
          return
        }
    
        const parsedToken = JSON.parse(token);
      
        // Validate the token by making an API call
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/chat/`, {
              headers: {
                Authorization: `Bearer ${parsedToken.access}`,
                "Content-Type": "application/json"
              },
              method: "POST",
              body: JSON.stringify({"recipient_id": recipientId})
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
            const result = await res.json();
            return result;
          } catch (error) {
            console.error(error)
          }
    }

    const startConversation = async (recipientId: number | undefined) => {
      if (recipientId) {
        const conversationId = await createConversation(recipientId);
        router.push(`/messages?selected=${conversationId.id}`)
      }
    
    }

    return (
    <ScrollArea>
      <Center>
        <Stack>
        <UserSearch onClick={setUsers}/>

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
            {users && users.length > 0 && users.map((user) => (
              <Table.Tr key={user.id}>
              <Table.Td>
              <Group align="center" justify="flex-start">
              <Avatar key={user.id} 
              name={user.first_name + " " + user.last_name} 
              src={`data:image/jpeg;base64,${user.photo}`}/>
              <Text component={'a'} href={"/users/"+user.id}>{user.first_name} {user.last_name}</Text>
              </Group></Table.Td>
              <Table.Td>
              <Pill pt={5} style={{backgroundColor: user.role === "teacher" ? '#d0bfff' : '#b2f2bb'}} size="xl" >
              <Text c={user.role === "teacher" ? 'violet.9' : 'green.8'} tt="capitalize">{user.role}</Text>
              </Pill>
              </Table.Td>
              <Table.Td>
              {user?.status ? <Pill style={{backgroundColor: user?.status === "started" ? '#d0ebff':  user?.status === "finished" ? '#f1f3f5' :  user?.status === "blocked" ? '#ffe8cc': '#ffdeeb'}} size="xl">
                <Text  c={user?.status === "started" ? 'blue.9':  user?.status === "finished" ? 'gray.9' :  user?.status === "blocked" ? 'orange.9': 'red.9'} pt={5} tt={'capitalize'}>{user?.status}</Text></Pill> : null}
              </Table.Td>
              <Table.Td>
              <ActionIcon onClick={() => startConversation(user.id) } variant="transparent"><IconMessageCircle/></ActionIcon>
              </Table.Td>
            </Table.Tr>
            ))}
          </Table.Tbody>
          </Table>
          </Stack>
          </Center>
</ScrollArea>
    )
  }
