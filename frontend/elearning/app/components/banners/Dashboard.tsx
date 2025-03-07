'use client';

import React from "react";
import { BackgroundImage, Title, Text } from "@mantine/core";

export const DashboardBanner = (props: { name: string, actionName: string }) => (
    <BackgroundImage
        src="/student_bk_img.jpg"
        radius="sm" py={24} >
        <Title px={24}> Hello, {props.name}!</Title>
        <Text mx={24}>Start your {props.actionName} journey here!</Text>

    </BackgroundImage>
)