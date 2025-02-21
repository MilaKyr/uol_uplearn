import React from 'react';
import Link from 'next/link';
import { Group, Text, BackgroundImage, Title, Blockquote, ActionIcon } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import { StudentProfileData } from '@/app/types';

export const StudentProfile = (props: StudentProfileData) => (
        <>
            <BackgroundImage
                src="/student_bk_img.jpg"
                radius="sm" py={24} >
                <Title px={24}> Hello, {props.first_name} {props.last_name}!</Title>
                <Text mx={24}>Start your learning journey here!</Text>
                
            </BackgroundImage>


            <Blockquote color="indigo" radius="md" iconSize={46} icon={<ActionIcon component={Link} href={'/home?selected=settings'} variant="transparent"><IconPencil/></ActionIcon>} mt={24}>
                {props.status ? props.status : "Too busy to write a status 😜"}
                <Group justify='flex-end'>
                
                </Group>
            </Blockquote>
           
           
        </>
    )