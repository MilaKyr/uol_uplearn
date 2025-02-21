import React from "react";
import { Button } from "@mantine/core";

export const LearnMore = (props: { onClick: () => void }) => (
    <Button onClick={props.onClick} variant="outline" mt="md" radius="md">
        Learn more
    </Button>
)