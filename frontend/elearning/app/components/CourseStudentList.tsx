import React from "react";
import { ScrollArea, Table, List, Space, Group, ActionIcon, Center, Text, Avatar, UnstyledButton, Modal, Button } from "@mantine/core";
import { IconBarrierBlockOff, IconBarrierBlock, IconTrash, IconPlus, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from "@mantine/notifications";
import { useDisclosure } from '@mantine/hooks';
import { StudentProfileData } from "../types";

export default function CourseStudentList(props: { courseId: number }) {
    const [students, setStudents] = React.useState<StudentProfileData[]>([])
    const router = useRouter();
    const [openedRemove, removeHandle] = useDisclosure(false);
    const [enrollmentId, setEnrollmentId] = React.useState<number>();

    React.useEffect(() => {
        const getStudent = async () => {
            const token = window.sessionStorage.getItem("jwt");

            if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
            }

            let parsedToken = JSON.parse(token);
            // Validate the token by making an API call
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/courses/${props.courseId}/students`, {
                    headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                    },
                })

                if (!res.ok) throw new Error('Token validation failed');
                let data = await res.json();

                setStudents(data)
            } catch (error) {
                console.error(error)
            }
        }
        getStudent();
    }, []);

    const block = async (enrollmentId: number | undefined, block: boolean) => {
        if (enrollmentId) {
            const token = window.sessionStorage.getItem("jwt");

            if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
            }
    
            let parsedToken = JSON.parse(token);
            // Validate the token by making an API call
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/enrollments/${enrollmentId}/block`, {
                    headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                        "Content-Type": "application/json"
                    },
                    method: "PUT",
                    body: JSON.stringify({ block: block })
                })
    
                if (!res.ok) throw new Error('Token validation failed');
                block ?
                    notifications.show({
                        title: 'Student has been successfully blocked',
                        message: "This student will no longer have access to the course. You can unblock them at any time",
                        withCloseButton: true,
                        color: 'teal',
                        icon: <IconCheck />,
                    }) :
                    notifications.show({
                        title: 'Student has been successfully unblocked',
                        message: "This student can access to the course. You can block them at any time",
                        withCloseButton: true,
                        color: 'teal',
                        icon: <IconCheck />,
                    })
                router.refresh()
            } catch (error) {
                console.error(error)
                router.replace('/') // Redirect to login if token validation fails
            }
            let newStudents = [...students];
            newStudents.map((enrolled_stds) => {
                if (enrolled_stds.id === enrollmentId) {
                    enrolled_stds.status = block ? "blocked" : "started";
                }
            });
            setStudents(newStudents);
        }
    }

    const remove = async () => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        let parsedToken = JSON.parse(token);
        // Validate the token by making an API call
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/enrollments/${enrollmentId}/remove`, {
                headers: {
                    Authorization: `Bearer ${parsedToken.access}`,
                    "Content-Type": "application/json"
                },
                method: "PUT",
            })

            if (!res.ok) throw new Error('Token validation failed');
            notifications.show({
                title: 'Student has been successfully removed',
                message: "This student can no longer access the course",
                withCloseButton: true,
                color: 'teal',
                icon: <IconCheck />,
            })
        } catch (error) {
            console.error(error)
            router.replace('/') // Redirect to login if token validation fails
        }

        let newStudents = [...students];
        newStudents.map((enrolled_stds) => {
            if (enrolled_stds.id === enrollmentId) {
                enrolled_stds.status = "removed";
            }
        });
        setStudents(newStudents);
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
                                            name={`${enrolledStudent.first_name} ${enrolledStudent.last_name}`}
                                            src={`data:image/jpeg;base64,${enrolledStudent.photo}`}

                                        />
                                <UnstyledButton component="a" href={"/users/" + enrolledStudent.id} color="black">{enrolledStudent.first_name} {enrolledStudent.last_name}</UnstyledButton>
                                </Group>
                                </Table.Td>
                                <Table.Td>
                                <ActionIcon 
                                onClick={() => block(enrolledStudent.id, enrolledStudent.status !== "blocked")} 
                                variant="filled" 
                                color={enrolledStudent.status === "blocked" ? 'orange.2' : 'orange.6'} 
                                size="md" 
                                radius="md"> 
                                    {enrolledStudent.status === "blocked" ? <IconBarrierBlockOff /> : <IconBarrierBlock />}
                                </ActionIcon>
                                </Table.Td>
                                <Table.Td>
                                <ActionIcon onClick={() => {
                                    setEnrollmentId(enrolledStudent.id)
                                    removeHandle.open();
                                }} variant="filled" color={'red.6'} size="md" radius="md" disabled={enrolledStudent.status === "removed"}> <IconTrash />
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
                    onClick={remove}
                    color={"red"}
                >Yes, I'm sure</Button>

            </Modal>
        </>

    )
}