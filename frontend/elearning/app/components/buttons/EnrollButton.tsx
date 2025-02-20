import { Button } from "@mantine/core";

export const EnrollButton = (props: { onClick: () => void }) => (
    <Button mt="md" radius="md" onClick={props.onClick}>
        Enroll
    </Button>
);