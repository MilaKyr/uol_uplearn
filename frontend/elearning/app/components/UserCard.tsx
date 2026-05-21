'use client';

import React from "react";
import { Image, Text, Avatar, Divider, Card, 
 } from "@mantine/core";
import 'dayjs/locale/en';
import { useRouter } from 'next/navigation';
import { UserProfile } from "../types";

export default function UserCard(props: {id: number}) {
    const router = useRouter();

    const [user, setUser] = React.useState<UserProfile>();

    React.useEffect(() => {
      const getUser = async () => {
        const token = window.sessionStorage.getItem("jwt");
    
        if (!token) {
          router.replace('/') // If no token is found, redirect to login page
          return
        }
    
        const parsedToken = JSON.parse(token);

        try {

        const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/teacher/${props.id}/`, {
            headers: {
              Authorization: `Bearer ${parsedToken.access}`,
              "Content-Type": "application/json"
            },
          });
          if (!res.ok) throw new Error('Spmething went wrong');
          const user: UserProfile = await res.json();
          console.log(user)
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
            src={`${user?.user.photo}`}
            size={80}
            radius={80}
            mx="auto"
            mt={-30}
            style={{borderWidth: 2, borderColor: 'var(--mantine-color-body)'}}
          />
          <Text ta="center" fz="lg" fw={500} mt="sm">
            {user?.user.name}
          </Text>
         <Divider py={12}/>
          <Text ta="center" fz="sm" c="dimmed">
            {user?.user.role === "teacher" ? user?.bio : user?.status}
          </Text>
        </Card>
  );
}
