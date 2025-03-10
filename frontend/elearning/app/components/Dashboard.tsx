'use client';

import React from "react";
import { LoadingOverlay } from "@mantine/core";
import 'dayjs/locale/en';
import { StudentOwner } from "./dashboards/StudentOwner";
import TeacherOwner from "./dashboards/TeacherOwner";
import { HomeData, TodoData } from "../types";
import { api } from '@/app/actions/api';
import { useRouter } from "next/navigation";
import { notifications } from '@mantine/notifications';
import { IconExclamationCircle } from "@tabler/icons-react";

export default function Dashboard(props: { userId: string }) {
    const router = useRouter();
    const [user, setUser] = React.useState<HomeData>();
    const [isLoading, setLoading] = React.useState(true);

    const getUser = async () => {
        const url = `/api/dashboard/${props.userId}`;
        const { data, status } = await api.get(url)
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
        console.log(data)
        setUser(data);
        setLoading(false);
    }
    
    React.useEffect(() => {
        getUser()
    }, [])

    const setTodo = (todo: TodoData[]) => {
        if (user?.user.role == "student") {
            const updateUser = { ...user }
            updateUser.todo = todo;
            setUser(updateUser)
        }
    }

    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
    if (user) return user?.user?.role === "student" ? <StudentOwner setTodo={setTodo} user={user} /> : <TeacherOwner user={user} />

}
