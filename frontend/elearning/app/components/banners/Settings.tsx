'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { Stack, Group, Title, Avatar, FileButton, Button } from "@mantine/core";
import { api } from "@/app/actions/api";
import { notifications } from "@mantine/notifications";
import { IconExclamationCircle } from '@tabler/icons-react';

export const SettingsBanner = (props: {
    userId: string,
    name: string,
}) => {
    const router = useRouter();
    const [showFile, setShowFile] = React.useState<string>();
    const [file, setFile] = React.useState<File>();

    React.useEffect(() => {
        getPhoto();
    }, [])

    const uploadPhoto = (uploaded: File | null) => {
        if (uploaded) {
            const newPhoto = URL.createObjectURL(uploaded)
            setShowFile(newPhoto);
            setFile(uploaded);
        }
    }

    const getPhoto = async () => {
        const { data, status } = await api.get(`/api/dashboard/photo/${props.userId}`);
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
        setShowFile(data.photo)
    }
    const sendPhoto = async () => {
        if (file) {
            const formData = new FormData();
            formData.append('photo', file);
            const { status } = await api.putPhoto(`/api/dashboard/photo/${props.userId}`, formData);
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
        }
    }

    return (
        <Stack mb={24} p={12} justify="space-between" align="flex-start" style={{ backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 10 }}>
            <Title c="dimmed">User settings</Title>

            <Group py={24} my={12} align="flex-end">
                <Avatar
                    size="xl"
                    radius="lg"
                    name={props.name}
                    src={showFile}
                />
                <FileButton onChange={(payload) => uploadPhoto(payload)} accept="image/png,image/jpeg">
                    {(props) => <Button variant="outline" {...props}>Upload image</Button>}
                </FileButton>
                <Button onClick={sendPhoto} mt="md">Save</Button>
            </Group>
        </Stack>
    )
}