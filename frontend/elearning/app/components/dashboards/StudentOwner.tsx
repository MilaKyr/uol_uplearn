'use client';

import React from "react";
import { Stack, Divider, SimpleGrid } from "@mantine/core";
import WeeklyCalendar from "./WeeklyCalendar";
import TodoTask from "./TodoTask";
import { TodoData, HomeData } from "@/app/types";
import { SearchCourses } from "../buttons/SearchCourses";
import { StudentProfile } from "./DashboardProfile";
import { StudentCourseTable } from "./CourseTable";

export const StudentOwner = (props: { user: HomeData, setTodo: (todos: TodoData[]) => void }) => (
    <SimpleGrid cols={{ base: 1, sm: 1, md: 2, lg: 2 }} spacing="md">
        <Stack>
            <StudentProfile
                id={props.user.user?.id}
                photo={props.user.user?.photo}
                name={props.user.user?.name}
                role={props.user.user?.role}
                user_id=""
                status={props.user?.status || ""} />
            <Divider />

            {props.user.courses && props.user.courses.length > 0 ?
                <StudentCourseTable courses={props.user?.courses} /> : <SearchCourses />}
        </Stack>

        <Stack align='center' py={12} style={{ backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 10 }}>
            <WeeklyCalendar userId={props.user.user?.id} onClick={props.setTodo} />
            {props.user?.todo.map((task) => <TodoTask key={task.id} task={task} />)}
        </Stack>

    </SimpleGrid>
)

