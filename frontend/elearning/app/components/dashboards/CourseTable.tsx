import React from "react";
import { Table } from "@mantine/core";
import { Course } from "@/app/types";
import {CourseStudentTableRow, CourseTeacherTableRow} from "./CourseTableRow";

export function StudentCourseTable(props: { courses: Course[] }) {
    return (
        <Table
            highlightOnHover
            highlightOnHoverColor={'var(--mantine-color-blue-light)'}>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Course</Table.Th>
                    <Table.Th>Progress</Table.Th>
                    <Table.Th></Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {props.courses.map((course) => <CourseStudentTableRow key={course.id} course={course} />)}
            </Table.Tbody>
        </Table>
    )
}

export function TeacherCourseTable(props: { courses: Course[], onCourseClick: (id: string) => void }) {
    return (
        <Table
            highlightOnHover
            highlightOnHoverColor={'var(--mantine-color-blue-light)'}>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Course</Table.Th>
                    <Table.Th>Rating</Table.Th>
                    <Table.Th >Students</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {props.courses.map((course) => (
                    <CourseTeacherTableRow key={course.id} course={course} onCourseClick={props.onCourseClick} />
                ))}
            </Table.Tbody>
        </Table>
    )
}