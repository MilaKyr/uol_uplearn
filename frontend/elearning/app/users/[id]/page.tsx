'use client';

import React from "react";
import { useParams } from 'next/navigation';
import UserGuest from "@/app/components/dashboards/UserGuest";


export default function UserPage() {
    const params = useParams<{ id: string }>();
    const userId = parseInt(params.id);

    if (userId) return <UserGuest id={userId} />
}
