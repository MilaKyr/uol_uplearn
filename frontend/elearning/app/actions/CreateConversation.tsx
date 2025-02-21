import React from "react";
import { IconExclamationCircle } from "@tabler/icons-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { notifications } from "@mantine/notifications";


export const createConversation = async (router: AppRouterInstance, recipientId: number) => {
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