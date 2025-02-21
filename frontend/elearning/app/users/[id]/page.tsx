'use client';

import React from "react";
import UserGuest from "@/app/components/dashboards/UserGuest";


export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
    const usedparams: { id: string } = await params;
    const userId = parseInt(usedparams.id);

    if (userId) return <UserGuest id={userId} />
}
