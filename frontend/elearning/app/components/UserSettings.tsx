'use client';

import React from "react";
import {LoadingOverlay, Tabs} from "@mantine/core";
import { IconMoodEdit, IconMail, IconUser, IconExclamationCircle } from '@tabler/icons-react';
import { useForm, hasLength, isEmail, isNotEmpty } from '@mantine/form';
import 'dayjs/locale/en';
import { useRouter } from 'next/navigation';
import { UserSettingsData, UserSettingsProps } from "../types";
import { notifications } from "@mantine/notifications";
import { api } from "../actions/api";
import { BioForm, EmailForm, PersonalForm, StatusForm } from "./forms/SettingForms";
import { SettingsBanner } from "./banners/Settings";

export default function UserSettings(props: UserSettingsProps) {
    const router = useRouter();
    const [user, setUser] = React.useState<UserSettingsData>();

    const [isLoading, setLoading] = React.useState(true);

    const formPersonal = useForm({
        mode: 'uncontrolled',
        initialValues: { first_name: '', last_name: '' },
        validate: {
            first_name: hasLength({ min: 1 }, 'Must be at least 1 characters'),
            last_name: hasLength({ min: 2 }, 'Must be at least 2 characters'),

        },
    });


    const formStatus = useForm({
        mode: 'uncontrolled',
        initialValues: { status: '', },
        validate: {
            status: hasLength({ min: 3, max: 100 }, 'Must be at least 3 and at most 100 characters long'),
        },
    });


    const formBio = useForm({
        mode: 'uncontrolled',
        initialValues: { bio: '' },
        validate: {
            bio: isNotEmpty('Enter your bio description'),
        },
    });


    const emailForm = useForm({
        mode: 'uncontrolled',
        initialValues: { email: '' },
        validate: {
            email: isEmail('Invalid email'),
        },
    })

    const getSettings = async () => {
        const { data, status } = await api.get(`/api/home/settings/${props.userId}`)
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
        setUser(data);
        setLoading(false);
        formPersonal.setValues({ first_name: data.first_name, last_name: data.last_name });
        emailForm.setValues({ email: data.email });
        if (data.role === "student") {
            formStatus.setValues({ status: data.status })
        } else {
            formBio.setValues({ bio: data.bio })
        }
    }

    const getProfileSettings = async () => {
        const { data, status } = await api.get(`/api/home/settings/profile/${props.userId}`)
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
        if (user?.role === "student") {
            formStatus.setValues({ status: data.status })
        } else {
            formBio.setValues({ bio: data.bio })
        }
    }


    React.useEffect(() => {
        getSettings();
        getProfileSettings();
    }, [])

    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

    const panelMoodName = user?.role === "student" ? "Status" : "Bio"
    const panelMood = user?.role === "student" ? <StatusForm userId={props.userId} form={formStatus} /> : <BioForm userId={props.userId} form={formBio} />

    return (
        <>
            <SettingsBanner name={`${user?.first_name} ${user?.last_name}`} userId={props.userId} />

            <Tabs defaultValue="mood" radius="lg" variant="outline">
                <Tabs.List grow justify="space-between">
                    <Tabs.Tab value="mood" leftSection={<IconMoodEdit size={16} />}>{panelMoodName}</Tabs.Tab>
                    <Tabs.Tab value="personal" leftSection={<IconUser size={16} />}>Personal data</Tabs.Tab>
                    <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>Email</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="mood">{panelMood}</Tabs.Panel>

                <Tabs.Panel value="personal"><PersonalForm userId={props.userId} form={formPersonal} /></Tabs.Panel>

                <Tabs.Panel value="email"><EmailForm userId={props.userId} form={emailForm} /></Tabs.Panel>
            </Tabs>
        </>
    );
}

