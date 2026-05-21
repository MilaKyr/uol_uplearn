'use client';

import React from "react";
import { TextInput, Button, Textarea,
} from "@mantine/core";
import { IconCircleCheck, IconExclamationCircle } from '@tabler/icons-react';
import {  UseFormReturnType } from '@mantine/form';
import 'dayjs/locale/en';
import { useRouter } from 'next/navigation';
import { notifications } from "@mantine/notifications";
import { api } from "../../actions/api";


export const BioForm = (props: { userId: string, form: UseFormReturnType<{ bio: string }> }) => {
    const router = useRouter();

    const sendBio = async () => {
        const jsonData = JSON.stringify(props.form.getValues())
        const { status } = await api.patch(`/api/home/settings/profile/${props.userId}`, jsonData)
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
        notifications.show({
            title: "Your bio has been changed",
            message: "",
            color: "teal",
            icon: <IconCircleCheck />,
            autoClose: 5000,
        })
    }

    return (
        <form style={{ paddingBlock: 12 }}>
            <Textarea autosize {...props.form.getInputProps('bio')} py={6} label="Your bio"
                placeholder={"Write your bio here..."} />
            <Button onClick={sendBio} mt="md">Save</Button>
        </form>
    )
}


export const EmailForm = (props: { userId: string, form: UseFormReturnType<{ email: string; }> }) => {
    const router = useRouter();

    const sendEmail = async () => {
        const jsonData = JSON.stringify(props.form.getValues())
        const { status } = await api.patch(`/api/home/settings/${props.userId}`, jsonData)
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
        notifications.show({
            title: "Your email has been changed",
            message: "Please login with new credentials",
            color: "teal",
            icon: <IconCircleCheck />,
            autoClose: 7000,
        })
    }

    return (
        <form style={{ paddingBottom: 12 }}>
            <TextInput {...props.form.getInputProps('email')} py={6} label="New email" />
            <Button onClick={sendEmail} mt="md">Change</Button>
        </form>
    )
}

export const StatusForm = (props: { userId: string, form: UseFormReturnType<{ status: string }> }) => {
    const router = useRouter();

    const sendStatus = async () => {
        const jsonData = JSON.stringify(props.form.getValues())
        const { status } = await api.patch(`/api/home/settings/profile/${props.userId}`, jsonData)
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
        notifications.show({
            title: "Your status has been changed",
            message: "",
            color: "teal",
            icon: <IconCircleCheck />,
            autoClose: 5000,
        })
    }

    return (
        <form style={{ paddingBlock: 12 }}>
            <TextInput {...props.form.getInputProps('status')} py={6} label="Your status"
                placeholder={"Write your status here..."} />
            <Button onClick={sendStatus} mt="md">Save</Button>
        </form>
    )
}


export const PersonalForm = (props: { userId: string, form: UseFormReturnType<{ first_name: string; last_name: string; }>}) => {
    const router = useRouter();

    const sendPersonal = async () => {
        const jsonData = JSON.stringify(props.form.getValues())
        console.log(jsonData)
        const { status } = await api.patch(`/api/home/settings/${props.userId}`, jsonData)
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
            title: "Your data has been changed",
            message: "Please login again",
            color: "teal",
            icon: <IconCircleCheck />,
            autoClose: 7000,
        })
    }

    return (
        <form style={{ paddingBottom: 12 }}>
            <TextInput {...props.form.getInputProps('first_name')} py={6} label="First Name" />
            <TextInput {...props.form.getInputProps('last_name')} py={6} label="Last Name" />
            <Button onClick={sendPersonal} mt="md">Save</Button>
        </form>
    )
}