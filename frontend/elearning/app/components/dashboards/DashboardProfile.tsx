import React from 'react';
import Link from 'next/link';
import { Group, Text, Title, Blockquote, ActionIcon, Stack, Spoiler } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import { StudentProfileData } from '@/app/types';
import { DashboardBanner } from '../banners/Dashboard';


export const StudentProfile = (props: StudentProfileData) => (
    <>
        <DashboardBanner name={props.name} actionName='learning' />
        <Blockquote color="indigo" radius="md" iconSize={46} icon={<ActionIcon component={Link} href={`/home/${props.id}?selected=settings`} 
        variant="transparent"><IconPencil /></ActionIcon>} mt={24}>
            {props.status ? props.status : "..."}
            <Group justify='flex-end'>

            </Group>
        </Blockquote>


    </>
)

export const TeacherProfile = (props: {
    name: string,
    bio: string,
}) => (
    <>
        <DashboardBanner name={props.name} actionName='teaching' />
        <Stack p={24} style={{ backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 10 }}>
            <Group justify="space-between">
                <Title c="dimmed" order={3}>About me</Title>
            </Group>
            <Spoiler hideLabel="Show less" showLabel="Show more">
                <Text style={{ whiteSpace: 'pre-line' }}>{props.bio}</Text>
            </Spoiler>

        </Stack>
    </>
)