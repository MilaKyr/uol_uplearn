'use client';

import React, { use, Usable } from "react";
import UserGuest from "@/app/components/dashboards/UserGuest";


export default function UserPage({ params }: { params: Usable<{ id: string }> }) {
    const usedparams: { id: string } = use(params);
    const userId = parseInt(usedparams.id);

    if (userId) return <UserGuest id={userId} />
}
