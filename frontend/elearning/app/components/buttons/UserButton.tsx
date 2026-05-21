import React from 'react';
import { Avatar, Group, Text, UnstyledButton } from '@mantine/core';
import classes from './UserButton.module.css';

interface UserButtonInfo {
  name: string;
  photo: string;
  onClick: () => void;
}

export const UserButton = (props: UserButtonInfo) => (
    <UnstyledButton className={classes.user} onClick={props.onClick}>
      <Group>
        <Avatar
        name={props.name}
          src={`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${props.photo}`}
          radius="xl"
        />

        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
           {props.name}
          </Text>
        </div>
      </Group>
    </UnstyledButton>
);
