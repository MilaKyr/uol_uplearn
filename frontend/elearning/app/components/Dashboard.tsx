'use client';

import React from "react";
import 'dayjs/locale/en';
import StudentOwner from "./dashboards/StudentOwner";
import TeacherOwner from "./dashboards/TeacherOwner";


export default function Dashboard(props: {role: string | undefined}) {

    return props.role === "student" ?  <StudentOwner /> : <TeacherOwner />

}
