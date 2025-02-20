'use client';

import React from "react";
import {
    Group, Title, Stack, TextInput, Avatar,
    Button, Textarea, FileButton, Tabs
} from "@mantine/core";
import { IconMoodEdit, IconMail, IconUser } from '@tabler/icons-react';
import { useForm, hasLength, isEmail, isNotEmpty } from '@mantine/form';
import 'dayjs/locale/en';
import { useRouter } from 'next/navigation';
import { UserSettingsData } from "../types";

export default function UserSettings(props: UserSettingsData) {

    const router = useRouter();

    const [file, setFile] = React.useState<File>();
    const [showFile, setShowFile] = React.useState<string>(props.photo || "");

    const uploadPhoto = (uploaded: File | null) => {
        if (uploaded) {
            let newPhoto = URL.createObjectURL(uploaded)
            setShowFile(newPhoto);
            setFile(uploaded);
            props.onClick(newPhoto)
        }
    }


    const sendPhoto = async () => {
        if (file) {
            const token = window.sessionStorage.getItem("jwt");

            if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
            }

            let parsedToken = JSON.parse(token);

            try {
                const formData = new FormData();
                formData.append('photo', file);

                const res = await fetch('http://127.0.0.1:8000/api/user/photo', {
                    headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                    },
                    method: 'PUT',
                    body: formData,
                });
                if (!res.ok) throw new Error('Spmething went wrong');
                router.refresh();
            } catch (error) {
                console.error(error)
            }
        }
    }

    const sendStatus = async () => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        let parsedToken = JSON.parse(token);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/user/update/status', {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${parsedToken.access}`,
                },
                method: 'PUT',
                body: JSON.stringify(formStatus.values),
            });
            if (!res.ok) throw new Error('Something went wrong');
        } catch (error) {
            console.error(error)
        }
    }


    const sendPersonal = async () => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        let parsedToken = JSON.parse(token);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/user/update/name', {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${parsedToken.access}`,
                },
                method: 'PUT',
                body: JSON.stringify(formPersonal.values),
            });
            if (!res.ok) throw new Error('Something went wrong');
            window.sessionStorage.removeItem("jwt");
            router.push('/')
        } catch (error) {
            console.error(error)
        }
    }


    const sendEmail = async () => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        let parsedToken = JSON.parse(token);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/user/update/email', {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${parsedToken.access}`,
                },
                method: 'PUT',
                body: JSON.stringify(emailForm.values),
            });
            if (!res.ok) throw new Error('Something went wrong');
            window.sessionStorage.removeItem("jwt");
            router.push('/')
        } catch (error) {
            console.error(error)
        }
    }

    const sendBio = async () => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        let parsedToken = JSON.parse(token);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/user/update/bio', {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${parsedToken.access}`,
                },
                method: 'PUT',
                body: JSON.stringify(formBio.values),
            });
            if (!res.ok) throw new Error('Something went wrong');
        } catch (error) {
            console.error(error)
        }
    }


    const formPersonal = useForm({
        mode: 'controlled',
        initialValues: { first_name: props.first_name, last_name: props.last_name },
        validate: {
            first_name: hasLength({ min: 1 }, 'Must be at least 1 characters'),
            last_name: hasLength({ min: 2 }, 'Must be at least 2 characters'),

        },
    });


    const formStatus = useForm({
        mode: 'controlled',
        initialValues: { status: props.status, },
        validate: {
            status: hasLength({ min: 3, max: 100 }, 'Must be at least 3 and at most 100 characters long'),
        },
    });


    const formBio = useForm({
        mode: 'controlled',
        initialValues: { bio: props.bio, },
        validate: {
            bio: isNotEmpty('Enter your bio description'),
        },
    });


    const emailForm = useForm({
        mode: 'controlled',
        initialValues: { email: props.email },
        validate: {
            email: isEmail('Invalid email'),
        },
    })



    return (
        <>

            <Stack mb={24} p={12} justify="space-between" align="flex-start" style={{ backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 10 }}>
                <Title c="dimmed">User settings</Title>

                <Group py={24} my={12} align="flex-end">
                    <Avatar
                        size="xl"
                        radius="lg"
                        name={props.first_name + " " + props.last_name}
                        src={showFile}
                    />
                    <FileButton onChange={(payload) => uploadPhoto(payload)} accept="image/png,image/jpeg">
                        {(props) => <Button variant="outline" {...props}>Upload image</Button>}
                    </FileButton>
                    <Button onClick={sendPhoto} mt="md">Save</Button>
                </Group>
            </Stack>

            <Tabs defaultValue="mood" radius="lg" variant="outline">
                <Tabs.List grow justify="space-between">
                    <Tabs.Tab value="mood" leftSection={<IconMoodEdit size={16} />}>
                        {props.role === "student" ? "Status" : "Bio"}
                    </Tabs.Tab>
                    <Tabs.Tab value="personal" leftSection={<IconUser size={16} />}>
                        Personal data
                    </Tabs.Tab>
                    <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>
                        Email
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="mood">
                    {props.role === "student" ? (
                        <form style={{ paddingBlock: 12 }}>
                            <TextInput {...formStatus.getInputProps('status')} py={6} label="Your status"
                                placeholder={"Write your status here..."} />
                            <Button onClick={sendStatus} mt="md">Save</Button>
                        </form>

                    ) : (
                        <form style={{ paddingBlock: 12 }}>
                            <Textarea autosize {...formBio.getInputProps('bio')} py={6} label="Your bio"
                                placeholder={"Write your bio here..."} />
                            <Button onClick={sendBio} mt="md">Save</Button>




                        </form>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="personal">
                    <form style={{ paddingBottom: 12 }}>
                        <TextInput {...formPersonal.getInputProps('first_name')} py={6} label="First Name" />
                        <TextInput {...formPersonal.getInputProps('last_name')} py={6} label="Last Name" />
                        <Button onClick={sendPersonal} mt="md">Save</Button>

                    </form>
                </Tabs.Panel>

                <Tabs.Panel value="email">
                    <form style={{ paddingBottom: 12 }}>
                        <TextInput {...emailForm.getInputProps('email')} py={6} label="New email" />
                        <Button onClick={sendEmail} mt="md">Change</Button>


                    </form>
                </Tabs.Panel>

            </Tabs>



        </>
    );
}