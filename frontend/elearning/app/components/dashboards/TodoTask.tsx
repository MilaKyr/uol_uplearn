import React, {Suspense} from "react";
import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { UnstyledButton, Stack, Text } from "@mantine/core";
import { TodoData } from "@/app/types";

export default function TodoTask(props: { task: TodoData }) {
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set(name, value)

            return params.toString()
        },
        [searchParams]
    );


    return (
        <Suspense>
        <UnstyledButton w={{ base: '70%', md: '90%', lg: '60%' }} py={6} key={props.task.id} style={{
            backgroundColor: 'var(--mantine-color-blue-light)', zIndex: 100, borderRadius: 10,
            alignItems: 'baseline', justifyContent: 'center'
        }} component={Link} href={`study/${props.task.course_id}?` + createQueryString('selected', `lesson_${props.task.id}`)}>
            <Stack gap={2} px={12}>
                <Text fw={600} size="sm">{new Date(props.task.deadline).toLocaleDateString()}</Text>
                <Stack align="flex-start" gap={0}>
                    <Text td="underline" size="sm" pt={6} fw={700} c="dimmed">{props.task.course_title}</Text>
                    <Text size="sm" fw={500} c="dimmed">{props.task.topic_title}</Text>
                </Stack>

                <Text size="md">{props.task.title}</Text>
                
            </Stack>

        </UnstyledButton>
        </Suspense>
    )
}