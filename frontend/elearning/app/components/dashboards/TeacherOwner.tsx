'use client';

import React from "react";
import Link from "next/link";
import {
    Group, Stack, Text,
    Button, Divider, Modal,
} from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import 'dayjs/locale/en';
import CourseStudentList from "../CourseStudentList";
import { HomeData } from "@/app/types";
import { TeacherProfile } from "./DashboardProfile";
import { TeacherCourseTable } from "./CourseTable";
import { getUser } from "@/app/actions/getAuth";


const StudentModal = (props: { opened: boolean, courseId: string, onClose: () => void }) => (
    <Modal opened={props.opened} onClose={props.onClose} title="Students">
        <CourseStudentList courseId={props.courseId} />
    </Modal>
)



export default function TeacherOwner(props: { user: HomeData }) {
    const [opened, { open, close }] = useDisclosure(false);
    const [courseId, setCourseId] = React.useState<string | undefined>();
    const user = getUser();

    const onCourseClick = (id: string) => {
        setCourseId(id);
        open()
    }

    return (
        <>
            {courseId && <StudentModal onClose={close} opened={opened} courseId={courseId} />}

            <Stack>
                {props.user.bio && <TeacherProfile name={props.user.name} bio={props.user.bio} />}
                <Divider />
                {props.user.courses && props.user.courses.length > 0 ? (
                    <TeacherCourseTable onCourseClick={onCourseClick} courses={props.user.courses} />
                ) : (
                    <Group justify="center">
                        <Button component={Link} href={{ pathname: `/home/${user.id}`, query: { selected: 'addCourse' } }} w={'50%'} variant="outline" color="teal" >
                            <Group align="flex-start" gap={10}>
                                <IconPlus />
                                <Text>Create your first course!</Text>
                            </Group>

                        </Button>
                    </Group>
                )
                }

            </Stack>
        </>
    )
}
