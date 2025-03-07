'use client';

import React from 'react';
import { CloseButton, Divider, Spoiler, LoadingOverlay } from '@mantine/core';
import { useRouter, useParams } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import {
  Flex, Paper, Text, Grid, Stack, UnstyledButton, Title, Rating, Image,
  Group, Avatar, Timeline, Button, Center,
} from '@mantine/core';
import { IconCurrentLocation, IconExclamationCircle } from '@tabler/icons-react';
import { notifications, useNotifications } from "@mantine/notifications";
import { HeaderTabs } from '@/app/components/header/Header2';
import { CourseDetail } from '@/app/types';
import { getToken, getUser } from '@/app/actions/getAuth';
import useWebSocket from "react-use-websocket";
import { api } from "@/app/actions/api";

export default function Course() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const [opened, { toggle }] = useDisclosure(false);
  const [expanded, setExpanded] = React.useState(false);
  const [course, setCourse] = React.useState<CourseDetail>();
  const [isLoading, setLoading] = React.useState(true);
  const notificationsStore = useNotifications();
  const user = getUser();
  const token = getToken();

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(`${process.env.NEXT_PUBLIC_WS_ADDRESS}/ws/notify/${user.id}/?token=${token}`,
    {
      share: true,
      shouldReconnect: () => true,
    }
  );

  const getCourse = async () => {
    const { data, status } = await api.get(`/api/courses/${courseId}/`)
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

    data["is_owner"] = data.teacher.id === user.id;
    setLoading(false);
    setCourse(data);
  }
  React.useEffect(() => {
    getCourse();
  }, []);

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
    return data
  }

  const showMessage = async (senderId: string, messageId: string, messageBody: string) => {
    const avatar = await getUserAvatar(senderId);
    notifications.show({
      title: "You have new message!",
      message: messageBody,
      autoClose: false,
      icon: <Avatar src={`${avatar.photo}`} />,
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



  const enroll = async () => {
    const { status } = await api.post(`/api/courses/${course?.id}/enroll`, {})
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
  }

  const onClose = () => {
    router.back()
  }

  if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

  return (
    <>
      <HeaderTabs opened={opened} toggle={toggle} />
      <Divider />
      <Center>
        <Stack p={24} w={{ base: 600, xs: 570, sm: 760, md: 800, lg: 900, xl: 900 }}>
          <Stack p={25} style={{ backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 10 }}>
            <Group justify='flex-end'><CloseButton onClick={onClose} />  </Group>
            <Grid >
              <Grid.Col span={{ xs: 12, sm: 12, md: 4, lg: 4, xl: 4 }}>
                <Image h="100%" radius="lg" src={`${course?.photo}`} />
              </Grid.Col>
              <Grid.Col span={{ xs: 12, sm: 12, md: 8, lg: 8, xl: 8 }} >
                <Stack
                  h="100%"
                  align="stretch"
                  justify="center"
                  gap="md"
                >
                  <Flex align="center" justify="space-between">
                    <Title>{course?.title}</Title>
                  </Flex>

                  <Group justify='space-between'>
                    <UnstyledButton component={Link} href={"/users/" + course?.teacher.id}>
                      <Group gap={7}>
                        <Avatar style={{ backgroundColor: '#696969' }} src={`${course?.teacher?.photo}`}
                          name={course?.teacher?.name}
                          radius="xl" size={42} />
                        <Text fw={500} size="lg" lh={1}>
                          {course?.teacher?.name}
                        </Text>

                      </Group>
                    </UnstyledButton>
                    <Rating size="lg" value={course?.average_rating} fractions={2} readOnly />
                  </Group>




                  <Group justify='space-between'>


                    <Text size="lg" c="gray.7"><Text fw={700} component="span">Starts:</Text> {course?.start_date && course?.start_date}</Text>
                    <Text size="lg" c="gray.7"><Text fw={700} component="span">Duration:</Text>{course?.duration} days</Text>
                  </Group>


                  <Flex
                    h="100%"
                    gap="md"
                    justify="center"
                    align="flex-end"
                    direction="column"
                    wrap="wrap"
                  >
                    {course?.enrolled !== undefined ? (
                      <Button component={Link} href={`/study/${course?.id}`} fullWidth variant="filled">Go to course</Button>
                    ) : course?.is_owner ? (<Button component={Link} href={`/edit/${course?.id}`} fullWidth variant="filled">Edit</Button>) : (<Button onClick={enroll} fullWidth variant="filled">Enroll</Button>
                    )}
                  </Flex>
                </Stack>
              </Grid.Col>
            </Grid>

            <Spoiler
              py={24}
              showLabel="Show more"
              hideLabel="Show less"
              expanded={expanded}
              onExpandedChange={setExpanded}
            ><Text ta="justify" size="md">{course?.description}</Text></Spoiler>

          </Stack>

          <Divider />
          <Paper p="md">
            <Title py={5}>Curriculum</Title>
            <Timeline active={0} bulletSize={24} lineWidth={2}>
              {course?.topics?.map(item => (
                <Timeline.Item key={item.id} bullet={<IconCurrentLocation size={12} />} title={item.title}>
                  <Text c="dimmed" size="sm">Complete all lessons </Text>
                  <Text size="xs" mt={4}>{item.n_hours} hours</Text>
                </Timeline.Item>
              ))}

            </Timeline>
          </Paper>


          {course?.feedback && course?.feedback.length > 0 && (
            <Stack>
              <Divider />
              <Title p={16}>What others say about the course</Title>
              {course?.feedback?.map(feedbck => (
                <Paper py={24} key={feedbck.id} shadow="xs">
                  <Group align="top" p={6}>
                    <UnstyledButton component={Link} href={`/users/${feedbck.user.id}`} onClick={() => setLoading(true)}>
                      <Avatar
                        src={`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${feedbck.user.photo}`}
                        alt="Student photo"
                        radius="xl"
                      />
                    </UnstyledButton>

                    <Stack gap={0}>
                      <Text size="sm">{feedbck.user.name}</Text>
                      <Text size="xs" c="dimmed">
                        {new Date(feedbck.created).toLocaleDateString()}
                      </Text>
                    </Stack>

                    <Rating defaultValue={feedbck.rating} fractions={2} readOnly />

                  </Group>

                  <Text pl={54} pt="sm" size="sm">
                    {feedbck.text}
                  </Text>
                </Paper>
              ))}

            </Stack>
          )}


        </Stack>
      </Center>

    </>

  )

}