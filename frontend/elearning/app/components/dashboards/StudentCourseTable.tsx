import React from "react";
import { Table } from "@mantine/core";
import { CourseStudentHomeData } from "@/app/types";
import CourseStudentTableRow from "./StudentCourseTableRow";

export default function StudentCourseTable(props: {courses: CourseStudentHomeData[], setLoading: (value: boolean) => void}) {
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
                {props.courses.map((course) => <CourseStudentTableRow key={course.id} course={course} setLoading={props.setLoading}/>)}
            </Table.Tbody>
        </Table>
    )
}