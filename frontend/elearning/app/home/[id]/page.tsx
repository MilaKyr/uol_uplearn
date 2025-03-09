'use client';

import React, { Suspense } from "react";
import { AppShell, Avatar, } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { Header } from "@/app/components/header/Header";
import UserNavbarSearch from "../../components/navbars/UserNavBar";
import 'dayjs/locale/en';
import { IconExclamationCircle } from "@tabler/icons-react";
import CreateCourse from "@/app/components/CreateCourse";
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import UsersTable from '@/app/components/UsersTable';
import Courses from "../../components/CourseList";
import Dashboard from "../../components/Dashboard";
import Feedbacks from "../../components/Feedbacks";
import Notifications from "../../components/Notifications";
import UserSettings from "../../components/UserSettings";
import { notifications, useNotifications } from '@mantine/notifications';
import useWebSocket from "react-use-websocket";
import { getToken } from "@/app/actions/getAuth";
import { api } from "@/app/actions/api";

export default function UserDashboardSuspensed() {
  return (
    <Suspense>
      <UserDashboard />
    </Suspense>
  )
}

function UserDashboard() {
  const router = useRouter();
  const token = getToken();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const notificationsStore = useNotifications();
  const [opened, { toggle }] = useDisclosure();
  const [componentName, setComponentName] = React.useState(searchParams.get("selected") || "dashboard");
  
  const [socketUrl, setSocketUrl] = React.useState(`${process.env.NEXT_PUBLIC_WS_ADDRESS}/ws/notify?token=${token}`);

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(socketUrl,
    {
      share: true,
      shouldReconnect: () => true,
    }
  );


  React.useEffect(() => {
    setComponentName(searchParams.get("selected") || "dashboard");
  }, [searchParams])


  const getUserAvatar = async (id: string) => {
    const { data, status } = await api.get(`/api/users/avatar/${id}/`)
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
    return data
  }

  const getCourseAvatar = async (id: string) => {
    const { data, status } = await api.get(`/api/courses/${id}/photo`)
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

  const showMessage = async (senderId: string, messageId: string, messageBody: string) => {
    const avatar = await getUserAvatar(senderId);
    notifications.show({
      title: "You have new message!",
      message: messageBody,
      autoClose: 5000,
      icon: <Avatar src={`${avatar.photo}`} />,
      color: 'blue',
      onClose: () => {
        sendJsonMessage({
          event: `public_room_${userId}`,
          data: {
            message_id: messageId,
          }
        });
      },
    });
  }

  const showNotification = async (
    notificationId: string,
    courseId: string,
    senderName: string,
    notificationBody: string,
    courseTitle: string,
  ) => {
    const courseImage = await getCourseAvatar(courseId);
    notifications.show({
      title: `${senderName} ${notificationBody} ${courseTitle}`,
      message: "",
      autoClose: 5000,
      onClose: () => {
        sendJsonMessage({
          event: `public_room_${userId}`,
          data: {
            notification_id: notificationId,
          }
        });
      },
      icon: <Avatar src={`${courseImage.photo}`} />,
      color: 'blue',
    });
  }

  React.useEffect(() => {


    if (lastJsonMessage &&
      typeof lastJsonMessage === 'object' &&
      'id' in lastJsonMessage &&
      'sender_id' in lastJsonMessage &&
      'body' in lastJsonMessage
    ) {
      showMessage(lastJsonMessage.sender_id as string,
        lastJsonMessage.id as string, lastJsonMessage.body as string)
    }

    if (lastJsonMessage &&
      typeof lastJsonMessage === 'object' &&
      'notification_id' in lastJsonMessage &&
      'course_id' in lastJsonMessage &&
      'sender_name' in lastJsonMessage &&
      'course_title' in lastJsonMessage &&
      'body' in lastJsonMessage
    ) {
      showNotification(
        lastJsonMessage.notification_id as string,
        lastJsonMessage.course_id as string,
        lastJsonMessage.sender_name as string,
        lastJsonMessage.body as string,
        lastJsonMessage.course_title as string,
      );
    }

  }, [lastJsonMessage])


  React.useEffect(() => {}, [readyState])

  const onClick = (label: string) => {
    setComponentName(label);
    toggle();
  }

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
        <UserNavbarSearch userId={userId} onClick={onClick} selected={componentName} />
      </AppShell.Navbar>
      <AppShell.Main>
        {
          componentName === "dashboard" ?
            <Dashboard userId={userId} /> :
            componentName === "courses" ? <Courses /> :
              componentName === "feedbacks" ? <Feedbacks /> :
                componentName === "settings" ? <UserSettings userId={userId} /> :
                  componentName === "users" ? <UsersTable /> : componentName === "notifications" ?
                    <Notifications /> : <CreateCourse />
        }


      </AppShell.Main>
    </AppShell>
  );
}
