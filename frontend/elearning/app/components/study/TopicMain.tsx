import React, { useCallback } from "react";
import Link from "next/link";
import { Text,Divider, Title, Timeline, LoadingOverlay } from '@mantine/core';
import { IconExclamationCircle, } from '@tabler/icons-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { selectIcon } from "../utils";
import { notifications } from "@mantine/notifications";
import { TopicStudyData } from "@/app/types";

export default function TopicMain(props: { id: number }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [topic, setTopic] = React.useState<TopicStudyData>();
    const [isLoading, setLoading] = React.useState(true);


    const createQueryString = useCallback(
        (name: string, value: string) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set(name, value)
    
          return params.toString()
        },
        [searchParams]
      ); 
    

    React.useEffect(() => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        const parsedToken = JSON.parse(token);
        // Validate the token by making an API call
        const getTopic = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/topics/${props.id}/`, {
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
                      const data = await res.json();
                setTopic(data);
                setLoading(false);
            } catch (error) {
                console.error(error)
                router.replace('/') // Redirect to login if token validation fails
            }
        }

        getTopic()
    }, [])

    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
    return (
        <div>
            <Title>{topic?.title}</Title>
            <Text pt={6} c="dimmed">Estimated time demand: {topic?.n_hours}h</Text>
            <Divider pb={24} />
            <Title order={4}>Lessons:</Title>
            <Timeline bulletSize={24} my={24}>
                {topic?.lessons.map((lesson) => {
                    const icon = selectIcon(lesson.done, new Date(lesson.deadline), undefined )
                    const deadline = new Date(lesson.deadline).toLocaleString();
                    return (
                        <Timeline.Item
                            key={lesson.id}
                            bullet={icon}
                            title={<Link href={pathname + '?' + createQueryString('selected', `lesson_${lesson.id}`) }>{lesson.title}</Link>}>
                            <Text c="dimmed">Deadline: {deadline}</Text>
                        </Timeline.Item>
                    )
                })}
            </Timeline>
        </div>
    )
}