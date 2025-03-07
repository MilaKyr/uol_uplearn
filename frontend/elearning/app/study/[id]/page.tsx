'use client';

import React, { Suspense } from "react";
import {
  AppShell, LoadingOverlay, Center, Avatar
} from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { HeaderTabs } from "@/app/components/header/Header2";
import { IconExclamationCircle } from '@tabler/icons-react';
import { Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import { Color } from '@tiptap/extension-color';
import TextStyle from "@tiptap/extension-text-style";
import Image from '@tiptap/extension-image';
import FileHandler from '@tiptap-pro/extension-file-handler'
import Youtube from '@tiptap/extension-youtube';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { CourseNavBar } from "@/app/components/navbars/CourseNavbar";
import TopicMain from "@/app/components/study/TopicMain";
import LessonMain from "@/app/components/study/LessonMain";
import { notifications, useNotifications } from "@mantine/notifications";
import { CourseEditData } from "@/app/types";
import { getUser, getToken } from "@/app/actions/getAuth";
import useWebSocket from "react-use-websocket";
import { api } from "@/app/actions/api";

export default function StudyDetail() {
  const [opened, { toggle }] = useDisclosure();
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const user = getUser();
  const token = getToken();
  const notificationsStore = useNotifications();
  const router = useRouter()
  const searchParams = useSearchParams();
  const [course, setCourse] = React.useState<CourseEditData>();

  const [current, setCurrent] = React.useState<string>();
  const [topic, setTopic] = React.useState<string>();
  const [lesson, setLesson] = React.useState<string>();
  const [selected, setSelected] = React.useState(searchParams.get("selected") || "")

  const [isLoading, setLoading] = React.useState(true);

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(`${process.env.NEXT_PUBLIC_WS_ADDRESS}/ws/notify/${user.id}/?token=${token}`,
    {
      share: true,
      shouldReconnect: () => true,
    }
  );

  const getCourse = async () => {
    const { data, status } = await api.get(`/api/courses/study/${courseId}/`)
    if (status === 401 || status === 403) {
      const check_if_exists = notificationsStore.notifications.find((notif) => notif.title === "Session expired")
      if (check_if_exists === undefined) {
        notifications.show({
          title: "Session expired",
          message: "Please log in to continue",
          autoClose: false,
          icon: <IconExclamationCircle />,
          color: 'red',
        });
        router.push('/')
      }
    }
    setCourse(data);
    setLoading(false);
    if (searchParams.size > 0) {
      const params = searchParams.get("selected")
      if (params && params.includes("_")) {
        const [component, id] = params.split("_")
        if (component === "topic") {
          setCurrent("topic");
          setTopic(id);
          setSelected(params)
        } else {
          setCurrent("lesson");
          setLesson(id)
          setSelected(params);
        }
      }
    } else {
      setCurrent("topic")
      const topic = data.topics[0];
      if (topic) {
        setTopic(topic.id);
        setSelected('topic_' + topic.id)
      }
    }
  }

  const getUserAvatar = async (id: string) => {
    const { data, status } = await api.get(`/api/users/avatar/${id}/`)
    if (status === 401 || status === 403) {
      const check_if_exists = notificationsStore.notifications.find((notif) => notif.title === "Session expired")
      if (check_if_exists === undefined) {
        notifications.show({
          title: "Session expired",
          message: "Please log in to continue",
          autoClose: false,
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
      const check_if_exists = notificationsStore.notifications.find((notif) => notif.title === "Session expired")
      if (check_if_exists === undefined) {
        notifications.show({
          title: "Session expired",
          message: "Please log in to continue",
          autoClose: false,
          icon: <IconExclamationCircle />,
          color: 'red',
        });
        router.push('/')
      }
    }
    console.log(data)
    return data
  }

  const showMessage = async (senderId: string, messageId: string, messageBody: string) => {
    const avatar = await getUserAvatar(senderId);
    notifications.show({
      title: "You have new message!",
      message: messageBody,
      autoClose: false,
      icon: <Avatar src={`data:image/jpeg;base64,${avatar.photo}`} />,
      color: 'blue',
      onClose: () => {
        sendJsonMessage({
          event: `public_room_${user.id}`,
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
      autoClose: false,
      onClose: () => {
        sendJsonMessage({
          event: `public_room_${user.id}`,
          data: {
            notification_id: notificationId,
          }
        });
      },
      icon: <Avatar src={`data:image/jpeg;base64,${courseImage.photo}`} />,
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

  React.useEffect(() => {
    getCourse()
  }, [router, searchParams])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextStyle,
      Color,
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Youtube.configure({
        controls: false,
        nocookie: true,
      }),
      FileHandler.configure({
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'],
        onDrop: (currentEditor, files, pos) => {
          files.forEach(file => {
            const fileReader = new FileReader()

            fileReader.readAsDataURL(file)
            fileReader.onload = () => {
              currentEditor.chain().insertContentAt(pos, {
                type: 'image',
                attrs: {
                  src: fileReader.result,
                },
              }).focus().run()
            }
          })
        },
        onPaste: (currentEditor, files, htmlContent) => {
          files.forEach(file => {
            if (htmlContent) {
              // if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
              // you could extract the pasted file from this url string and upload it to a server for example
              console.log(htmlContent)
              return false
            }

            const fileReader = new FileReader()

            fileReader.readAsDataURL(file)
            fileReader.onload = () => {
              currentEditor?.chain().insertContentAt(currentEditor.state.selection.anchor, {
                type: 'image',
                attrs: {
                  src: fileReader.result,
                },
              }).focus().run()
            }
          })
        },
      }),
    ],
    immediatelyRender: false,
    editable: false,
    content: '',
  });

  const onClickTitle = () => {
    router.push(`/courses/${courseId}`)
  }

  const clickTopic = (topicId: string) => {
    setTopic(topicId);
    setCurrent("topic");
  }


  const clickLesson = (topicId: string, lessonId: string) => {
    setLesson(lessonId);
    setCurrent("lesson");
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
          {course && <CourseNavBar selected={selected} course={course} onClickTitle={onClickTitle} onClickTopic={clickTopic} onClickLesson={clickLesson} />}
        </AppShell.Navbar>


        <AppShell.Main>
          <Center>
            {current === "topic" && topic ? <TopicMain id={topic} /> : lesson && <LessonMain id={lesson} editor={editor!} />}

          </Center>


        </AppShell.Main>
      </AppShell>
    </Suspense>
  );
}