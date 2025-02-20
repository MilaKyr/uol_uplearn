import Link from 'next/link';
import { IconChevronRight } from '@tabler/icons-react';
import { Avatar, Group, Text, UnstyledButton } from '@mantine/core';
import classes from './UserButton.module.css';

interface UserButtonInfo {
  user: {
    first_name: string;
    last_name: string
  },
  photo: string | undefined;
  onClick: () => void;
}

export function UserButton(props: UserButtonInfo) {
  let usersName = props.user.first_name + " " + props.user.last_name;
  return (
    <UnstyledButton className={classes.user} onClick={props.onClick}>
      <Group>
        <Avatar
        name={usersName}
          src={props.photo}
          radius="xl"
        />

        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
           {usersName}
          </Text>
        </div>
      </Group>
    </UnstyledButton>
  );
}