import React from "react";
import { ScrollArea, Table, Group, ActionIcon, Center, Text, Avatar, UnstyledButton, Modal, Button } from "@mantine/core";
import { IconBarrierBlockOff, IconBarrierBlock, IconTrash, IconCheck, IconExclamationCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from "@mantine/notifications";
import { useDisclosure } from '@mantine/hooks';
import { StudentProfileData } from "../types";
import { api } from "../actions/api";

export default function CourseStudentList(props: { courseId: string }) {
    const [students, setStudents] = React.useState<StudentProfileData[]>([])
    const router = useRouter();
    const [openedRemove, removeHandle] = useDisclosure(false);
    const [enrollmentId, setEnrollmentId] = React.useState<string>();

    const getStudents = async () => {
        const { data, status } = await api.get(`/api/enrollments/students?course_id=${props.courseId}`)
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
        console.log(data)
        setStudents(data)
    }

    const updateStatus = async (enrollId: string, newStatus: string) => {
        const jsonData = JSON.stringify({ status: newStatus });
        const { status } = await api.patch(`/api/enrollments/${enrollId}/`, jsonData)
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
        const statusName = newStatus === "started" ? "un-blocked" : newStatus;
        const statusDescription = newStatus === "started" ?
            "This student can access to the course. You can block them at any time" : status === "blocked" ?
                "This student will no longer have access to the course. You can un-block them at any time" :
                "This student will no longer have access to the course";
        notifications.show({
            title: `Student has been successfully ${statusName}`,
            message: statusDescription,
            withCloseButton: true,
            color: 'teal',
            icon: <IconCheck />,
        })
        const newStudents = [...students];
        newStudents.map((enrolled_stds) => {
            console.log(enrolled_stds, enrolled_stds.id === enrollId)
            if (enrolled_stds.id === enrollId) {
                enrolled_stds.status = newStatus;
            }
        });
        setStudents(newStudents);
        removeHandle.close()
    }

    React.useEffect(() => {
        getStudents();
    }, []);

    const handleRemove = (enrollId: string) => {
        setEnrollmentId(enrollId)
        removeHandle.open();
    }


    return (
        <>
            <ScrollArea>
                <Table>
                    <Table.Thead></Table.Thead>
                    <Table.Tbody>
                        {students?.map((enrolledStudent: StudentProfileData) => (
                            <Table.Tr
                                key={enrolledStudent.id}>
                                <Table.Td>
                                    <Group>
                                        <Avatar
                                            name={`${enrolledStudent.name}`}
                                            src={`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${enrolledStudent.photo}`}

                                        />
                                        <UnstyledButton component="a" href={"/users/" + enrolledStudent.id} color="black">{enrolledStudent.name}</UnstyledButton>
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <ActionIcon
                                        onClick={() => updateStatus(enrolledStudent.id, enrolledStudent.status === "blocked" ? "started" : "blocked")}
                                        variant="filled"
                                        color={enrolledStudent.status === "blocked" ? 'orange.2' : 'orange.6'}
                                        size="md"
                                        radius="md">
                                        {enrolledStudent.status === "blocked" ? <IconBarrierBlockOff /> : <IconBarrierBlock />}
                                    </ActionIcon>
                                </Table.Td>
                                <Table.Td>
                                    <ActionIcon onClick={() => handleRemove(enrolledStudent.id)} variant="filled" color={'red.6'} size="md" radius="md" disabled={enrolledStudent.status === "removed"}> <IconTrash />
                                    </ActionIcon>
                                </Table.Td>

                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </ScrollArea>


            <Modal opened={openedRemove} onClose={() => removeHandle.close()} title="Are you sure you want to remove this student?">
                <Center pb={20}><Text c="red" fw={700}>This cannot be undone!</Text></Center>
                <Button size="sm"
                    onClick={() =>{if (enrollmentId) {updateStatus(enrollmentId, "removed")}}}
                    color={"red"}>{"Yes, I'm sure"}</Button>

            </Modal>
        </>

    )
}