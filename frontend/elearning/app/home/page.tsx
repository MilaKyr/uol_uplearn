'use client';

import React from "react";
import { AppShell, Avatar, LoadingOverlay, } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { Header } from "@/app/components/header/Header";
import UserNavbarSearch from "../components/navbars/UserNavBar";
import 'dayjs/locale/en';
import { IconExclamationCircle } from "@tabler/icons-react";
import CreateCourse from "@/app/components/CreateCourse";
import { useRouter, useSearchParams } from 'next/navigation';
import UsersTable from '@/app/components/UsersTable';
import Courses from "../components/CourseList";
import Dashboard from "../components/Dashboard";
import Feedbacks from "../components/Feedbacks";
import Notifications from "../components/Notifications";
import UserSettings from "../components/UserSettings";
import { notifications } from '@mantine/notifications';
import { HomeData } from "../types";
import useWebSocket from "react-use-websocket";

export default function UserDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [opened, { toggle }] = useDisclosure();
  const [data, setData] = React.useState<HomeData>();
  const [photo, setPhoto] = React.useState<string>();
  const [isLoading, setLoading] = React.useState<boolean>(true);
  const [componentName, setComponentName] = React.useState(searchParams.get("selected") || "dashboard");
  
  const [socketUrl, setSocketUrl] = React.useState(`${process.env.NEXT_PUBLIC_WS_ADDRESS}/ws`);

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(socketUrl,
    {
      share: true,
      shouldReconnect: () => true,
  }
  );

  React.useEffect(() => {
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }

    const parsedToken = JSON.parse(token);
    setSocketUrl(`${process.env.NEXT_PUBLIC_WS_ADDRESS}/ws/notify/${parsedToken.user.id}/?token=${parsedToken.access}`);


    // Validate the token by making an API call
    const validateToken = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/home/`, {
          headers: {
            Authorization: `Bearer ${parsedToken.access}`,
            "Access-Control-Allow-Origin":"*"
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
        const data: HomeData = await res.json();
        const res2 = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/user/photo`, {
          headers: {
            Authorization: `Bearer ${parsedToken.access}`,
          },
        })
        if (res2.status === 200) {
          const photo: Blob = await res2.blob();
          data.photo = URL.createObjectURL(photo);
          setPhoto(data.photo);
        }
        console.log(data)
        setData(data)
        setLoading(false);

      } catch (error) {
        console.log(error)
      }
    }

    validateToken();
    setComponentName(searchParams.get("selected") || "dashboard");
  }, [router, searchParams])




  React.useEffect(() => {
    console.log("In use Effect", lastJsonMessage)

    const getMessage = async (message: {
      id: number, 
      sender_id: number, 
      recipient_id: number, 
      body: string
    }) => {
      const token = window.sessionStorage.getItem("jwt");
  
      if (!token) {
        router.replace('/') // If no token is found, redirect to login page
        return
      }
  
      const parsedToken = JSON.parse(token);

      if (message.recipient_id === parsedToken.user.id) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/users/${message.sender_id}/avatar`, {
            headers: {
              Authorization: `Bearer ${parsedToken.access}`,
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin":"*"
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
          const avatar: string = await res.json();
          notifications.show({
            title: "You have new message!",
            message: message.body as string,
            autoClose: false,
            icon: <Avatar src={`data:image/jpeg;base64,${avatar}`}/>,
            color: 'blue',
            onClose: () => {
              sendJsonMessage({
                event: `public_room_${parsedToken.user.id}`,
                data: {
                    message_id: message.id,
                }
            });
            },
          });
        } catch (error) {
          console.log(error);
          notifications.show({
            title: "Session expired",
            message: 'Please login to continue',
            color: 'red'
          })
          router.replace('/') // Redirect to login if token validation fails
        }
      }
  
      
    }

    const getCourseNotification = async (notification: {
      notification_id: number,
      recipient_id: number,
      course_id: number,
      sender_first_name: string, 
      sender_last_name: string, 
      course_title: string,
      body: string,
    }) => {
      const token = window.sessionStorage.getItem("jwt");
  
      if (!token) {
        router.replace('/') // If no token is found, redirect to login page
        return
      }
  
      const parsedToken = JSON.parse(token);

      if (notification.recipient_id === parsedToken.user.id) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/${notification.course_id}/photo`, {
            headers: {
              Authorization: `Bearer ${parsedToken.access}`,
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin":"*"
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
          const photo: Blob = await res.blob();
          notifications.show({
            title:  `${notification.sender_first_name} ${notification.sender_last_name} ${notification.body} ${notification.course_title}`,
            message: "",
            autoClose: false,
            onClose: () => {
              sendJsonMessage({
                event: `public_room_${parsedToken.user.id}`,
                data: {
                    notification_id: notification.notification_id,
                }
            });
            },
            icon: <Avatar src={URL.createObjectURL(photo)}/>,
            color: 'blue',
          });
        } catch (error) {
          console.log(error);
          router.replace('/') // Redirect to login if token validation fails
        }
      }
  
      
    }


    if (lastJsonMessage && 
      typeof lastJsonMessage === 'object' && 
      'id' in lastJsonMessage && 
      'sender_id' in lastJsonMessage && 
      'recipient_id' in lastJsonMessage && 
      'body' in lastJsonMessage) {
      getMessage({
        id:lastJsonMessage.id as number,
        recipient_id:lastJsonMessage.recipient_id as number,
        sender_id:lastJsonMessage.sender_id as number,
        body:lastJsonMessage.body as string
      }
        
      );
    }

    if (lastJsonMessage &&
      typeof lastJsonMessage === 'object' &&
      'notification_id' in lastJsonMessage &&
      'recipient_id' in lastJsonMessage &&
      'course_id' in lastJsonMessage &&
      'sender_first_name' in lastJsonMessage &&
      'sender_last_name' in lastJsonMessage &&
      'course_title' in lastJsonMessage &&
      'body' in lastJsonMessage
    ) {
      getCourseNotification({
        notification_id: lastJsonMessage.notification_id as number,
        recipient_id: lastJsonMessage.recipient_id as number,
        course_id: lastJsonMessage.course_id as number,
        sender_first_name: lastJsonMessage.sender_first_name as string, 
        sender_last_name: lastJsonMessage.sender_last_name as string, 
        course_title: lastJsonMessage.course_title as string,
        body: lastJsonMessage.body as string,
      });
     
    }
          
      }, [lastJsonMessage])

    
  React.useEffect(() => {
    console.log("readyState", readyState);
  }, [readyState])

  


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
        <Header opened={opened} toggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar>
        <UserNavbarSearch
          id={data?.id}
          photo={photo}
          role={data?.role}
          first_name={data?.first_name}
          last_name={data?.last_name}
          onClick={setComponentName}
          selected={componentName}
          setLoading={setLoading} />
      </AppShell.Navbar>
      <AppShell.Main>
        {
          componentName === "dashboard" ?
            <Dashboard role={data?.role} /> :
            componentName === "courses" ? <Courses /> :
              componentName === "feedbacks" ? <Feedbacks /> :
                componentName === "settings" && data ? <UserSettings
                  id={data?.id}
                  first_name={data?.first_name}
                  last_name={data?.last_name}
                  email={data?.email}
                  status={data?.status}
                  bio={data?.bio}
                  role={data?.role}
                  photo={data?.photo}
                  onClick={setPhoto} /> :
                  componentName === "users" ? <UsersTable /> : componentName === "notifications" ?
                    <Notifications /> :  <CreateCourse />
        }


      </AppShell.Main>
    </AppShell>
  );
}
