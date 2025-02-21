import React from "react";
import { Group, Rating as MantineRating, Text } from "@mantine/core";
import { CourseListData } from "@/app/types";

export default function Rating(props: {course: CourseListData}) {
    return (
        <Group gap={4} align="flex-end" mt="md" mb="xs">
            <MantineRating size="md" defaultValue={props.course.average_rating} fractions={2} readOnly />
            <Text size="sm" c="dimmed">({props.course.n_students})</Text>
        </Group>
    )
}