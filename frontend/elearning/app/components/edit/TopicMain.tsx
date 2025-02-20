import React from "react";
import { Text, Divider, Title, Timeline } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { TopicProps } from "@/app/types";

export default function TopicMain(props: { topic: TopicProps }) {

    return (
        <div>
            <Title>{props.topic?.title}</Title>
            <Text pt={6} c="dimmed">Estimated time demand: {props.topic?.n_hours}h</Text>
            <Divider pb={24} />
            <Title order={4}>Lessons:</Title>
            <Timeline bulletSize={24} my={24}>
                {props.topic?.lessons.map((lesson) => {
                    let deadline = new Date(lesson.deadline).toLocaleString();
                    return (
                        <Timeline.Item
                            key={lesson.id}
                            bullet={<IconCheck />}
                            title={lesson.title}>
                            <Text c="dimmed">Deadline: {deadline}</Text>
                        </Timeline.Item>
                    )
                })}
            </Timeline>
        </div>
    )
}