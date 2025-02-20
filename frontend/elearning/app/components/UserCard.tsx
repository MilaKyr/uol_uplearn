'use client';

import React from "react";
import { Image, Group, useMantineTheme, Text, Avatar, Divider, Card, 
 } from "@mantine/core";
import 'dayjs/locale/en';
import { useRouter } from 'next/navigation';
import { UserProfile } from "../types";

export default function UserCard(props: {id: number}) {
    const router = useRouter();
    const theme = useMantineTheme();

    const [user, setUser] = React.useState<UserProfile>();

    React.useEffect(() => {
      const getUser = async () => {
        const token = window.sessionStorage.getItem("jwt");
    
        if (!token) {
          router.replace('/') // If no token is found, redirect to login page
          return
        }
    
        let parsedToken = JSON.parse(token);

        try {

        const res = await fetch(`http://127.0.0.1:8000/api/users/${props.id}/`, {
            headers: {
              Authorization: `Bearer ${parsedToken.access}`,
              "Content-Type": "application/json"
            },
          });
          if (!res.ok) throw new Error('Spmething went wrong');
          let user: UserProfile = await res.json();
          setUser(user);
        } catch (error) {
          console.error(error)
        }
      }
       
      getUser();

    }, [])


    return (
        <Card withBorder padding="xl" radius="md" style={{backgroundColor: 'var(--mantine-color-body)'}}>
          <Card.Section
          >
            <Image style={{height: 140}} src="/student_bk_img.jpg" />

          </Card.Section>
          <Avatar
            src={`data:image/jpeg;base64,${user?.photo}`}
            size={80}
            radius={80}
            mx="auto"
            mt={-30}
            style={{borderWidth: 2, borderColor: 'var(--mantine-color-body)'}}
          />
          <Group gap={4} justify="center" align="center">
          <Text ta="center" fz="lg" fw={500} mt="sm">
            {user?.first_name}
          </Text>
          <Text ta="center" fz="lg" fw={500} mt="sm">
            {user?.last_name}
          </Text>
          </Group>
         <Divider py={12}/>
          <Text ta="center" fz="sm" c="dimmed">
            {user?.role === "teacher" ? user?.bio : user?.status}
          </Text>
        </Card>
  );
}
