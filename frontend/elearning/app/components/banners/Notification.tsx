import React from "react";
import { BackgroundImage, Stack, Title } from "@mantine/core";

export default function NotificationBanner() {
    return (
        <BackgroundImage mb={24}
            src="/dynamic-wang-7SLliuJAGoQ-unsplash.jpg"
            radius="sm" py={24}>
            <Stack m={24} justify="space-between" align="flex-start">
                <Title c="dimmed">Notification center</Title>
            </Stack>
        </BackgroundImage>
    )
}