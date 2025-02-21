'use client';

import React, { use, Usable } from "react";
import { LoadingOverlay } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import UserGuest from "@/app/components/dashboards/UserGuest";
import { UserGuestData } from "@/app/types";


export default function UserPage({ params }: { params: Usable<{ id: string }> }) {
    const router = useRouter();
    const usedparams: { id: string } = use(params);
    const userId = parseInt(usedparams.id);
    const [opened, { toggle }] = useDisclosure();
    const [isLoading, setLoading] = React.useState(true);
    const [user, setUser] = React.useState<UserGuestData>();

    React.useEffect(() => {
      const getUser = async () => {
        const token = window.sessionStorage.getItem("jwt");
    
        if (!token) {
          router.replace('/') // If no token is found, redirect to login page
          return
        }
    
        const parsedToken = JSON.parse(token);

        try {

        const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/users/${userId}/`, {
            headers: {
              Authorization: `Bearer ${parsedToken.access}`,
              "Content-Type": "application/json"
            },
          });
          if (!res.ok) throw new Error('Spmething went wrong');
          const user = await res.json();
          setUser(user);
          setLoading(false);
        } catch (error) {
          console.error(error)
        }
      }
       
      getUser();

    }, [])

    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

    if (userId) return <UserGuest id={userId} />
}
