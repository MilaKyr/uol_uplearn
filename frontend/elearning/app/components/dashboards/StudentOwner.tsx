'use client';

import React from "react";
import { Stack, Divider, SimpleGrid, LoadingOverlay } from "@mantine/core";
import { useRouter } from 'next/navigation';
import WeeklyCalendar from "./WeeklyCalendar";
import TodoTask from "./TodoTask";
import { TodoData, StudentHomeData } from "@/app/types";
import { SearchCourses } from "../buttons/SearchCourses";
import {StudentProfile} from "./StudentProfile";
import StudentCourseTable from "./StudentCourseTable";

export default function StudentOwner() {
    const router = useRouter();
    const [data, setData] = React.useState<StudentHomeData | undefined>();
    const [isLoading, setLoading] = React.useState(true)


    React.useEffect(() => {
        const getStudent = async () => {
            const token = window.sessionStorage.getItem("jwt");

            if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
            }

            const parsedToken = JSON.parse(token);
            // Validate the token by making an API call
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/home/`, {
                    headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                        "Access-Control-Allow-Origin":"*"
                    },
                })

                if (!res.ok) throw new Error('Token validation failed');
                const data: StudentHomeData = await res.json();

                const res2 = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/user/photo`, {
                    headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                        "Access-Control-Allow-Origin":"*"
                    },
                })
                if (res2.status === 200) {
                    const photo = await res2.blob();
                    data.photo = URL.createObjectURL(photo);
                }

                setData(data)
                setLoading(false);
            } catch (error) {
                console.error(error)
                router.replace('/') // Redirect to login if token validation fails
            }
        }

        getStudent();
    }, [])

    const setTodo = (todo: TodoData[]) => {
        if (data !== undefined) {
            const newData = { ...data }
            newData.todo = todo;
            setData(newData)
        }
    }

    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

    return (
        <SimpleGrid cols={{ base: 1, sm: 1, md: 2, lg: 2 }} spacing="md">

            <Stack>
                {data && <StudentProfile
                    id={data?.id}
                    photo={data?.photo}
                    first_name={data?.first_name}
                    last_name={data?.last_name}
                    status={data?.status} />}

                <Divider />

                {(data?.courses && data?.courses.length > 0) ?
                    <StudentCourseTable setLoading={setLoading} courses={data?.courses} /> : <SearchCourses />}
            </Stack>

            <Stack align='center' py={12} style={{ backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 10 }}>
                <WeeklyCalendar userId={data?.id} onClick={setTodo} />
                {data?.todo.map((task) => <TodoTask key={task.id} task={task} />)}
            </Stack>

        </SimpleGrid>
    )
}
