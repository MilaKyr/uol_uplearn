'use client';

import React from "react";
import {
  AppShell, Stack, Center, LoadingOverlay, Avatar
} from "@mantine/core";
import { IconCircleCheck, IconExclamationCircle } from "@tabler/icons-react";
import { useDisclosure } from '@mantine/hooks';
import { HeaderTabs } from "@/app/components/header/Header2";
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
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation';
import CourseMain from "@/app/components/edit/CourseMain";
import TopicMain from "@/app/components/edit/TopicMain";
import LessonMain from "@/app/components/edit/LessonMain";
import ImageResize from 'tiptap-extension-resize-image';
import { CourseNavBar } from "@/app/components/navbars/CourseNavbar";
import { CourseEditData, LessonEditData } from "@/app/types";
import { notifications, useNotifications } from "@mantine/notifications";
import useWebSocket from "react-use-websocket";
import { getToken, getUser } from "@/app/actions/getAuth";
import { api } from "@/app/actions/api";
import { useForm, isNotEmpty } from '@mantine/form';

const contentPlaceholder: string = '<em>Just start adding your content here. To add an image drag and drop it where you want it to be... That`s all, now you can delete this text and start creating.</em>';

export default function CourseEdit() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const newCourseId = params.id;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const user = getUser();
  const token = getToken();
  const notificationsStore = useNotifications();
  const [course, setCourse] = React.useState<CourseEditData>();
  const [topicId, setTopicId] = React.useState<string>();
  const [lessonId, setLessonId] = React.useState<string>();
  const [opened, { toggle }] = useDisclosure();
  const [current, setCurrent] = React.useState<string>(searchParams.get("selected") || "");

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(`${process.env.NEXT_PUBLIC_WS_ADDRESS}/ws/notify/${user.id}/?token=${token}`,
    {
      share: true,
      shouldReconnect: () => true,
    }
  );

  const courseForm = useForm({
    mode: 'uncontrolled',
    initialValues: { title: '', description: '' },
    validate: {
      title: isNotEmpty('Enter your bio description'),
      description: isNotEmpty('Enter your bio description'),
    },
  });


  const updateForm = async () => {
    const jsonData = JSON.stringify(courseForm.getValues())
    const { status } = await api.patch(`/api/courses/edit/${newCourseId}/`, jsonData)
    if (status === 401 || status === 403) {
      notifications.show({
        title: "Session expired",
        message: "Please log in to continue",
        autoClose: false,
        icon: <IconExclamationCircle />,
        color: 'red',
      });
      router.push('/')
    }
    notifications.show({
      title: "Success",
      message: "",
      autoClose: 6000,
      icon: <IconCircleCheck />,
      color: 'teal',
    });
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
      ImageResize,
      Image.configure({ inline: true, allowBase64: true }),
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
    content: contentPlaceholder,
  });

  const getCourse = async () => {
    const { data, status } = await api.get(`/api/courses/edit/${newCourseId}/`)
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
    setCourse(data);
    courseForm.setValues({ title: data.title, description: data.description });
    if (searchParams.size > 0) {
      const params = searchParams.get("selected")
      if (params && params.includes("_")) {
        const [component, id] = params.split("_")
        if (id !== undefined) {
          if (component === "topic") {
            setCurrent("topic");
            setTopicId(id);
          } else {
            setCurrent("lesson");
            setLessonId(id)
          }
        }
      }
    } else {
      setCurrent("main")
    }
  }


  React.useEffect(() => {
    getCourse()
  }, [searchParams, pathname])


  const clickTopic = (topicId: string) => {
    setTopicId(topicId);
    setCurrent("topic");
  }


  const clickLesson = (topicId: string, lessonId: string) => {
    let selected: LessonEditData;
    course?.topics.map((topic) => {
      if (topic.id === topicId) {
        topic.lessons.map((lesson) => {
          if (lesson.id === lessonId) {
            selected = { ...lesson, topic_id: topicId };
          }
        })
      }
      if (selected.html === null) {
        editor?.commands.setContent(contentPlaceholder)
      } else {
        editor?.commands.setContent(selected.html);
      }
      setLessonId(lessonId);
      setCurrent("lesson");
    })
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
        <HeaderTabs opened={opened} toggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar>
        <CourseNavBar selected={current} course={course!} onClickTitle={() => setCurrent("main")} onClickTopic={clickTopic} onClickLesson={clickLesson} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Center>
          <Stack w={900}>



            {
              current === "main" ? <CourseMain course={course!} updateForm={updateForm} courseForm={courseForm} /> :
                current === "topic" && topicId && course ? <TopicMain id={topicId} courseId={course?.id} /> :
                  (current === "lesson" && editor && lessonId && course) ? <LessonMain
                    id={lessonId}
                    courseId={course?.id}
                    editor={editor} /> :
                    <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            }
          </Stack>
        </Center>

      </AppShell.Main>
    </AppShell>
  );
}

