import React from 'react';
import { Avatar, Group, Text, UnstyledButton } from '@mantine/core';
import classes from './CourseButton.module.css';

interface CourseButtonInfo {
  title: string;
  photo: string;
  onClick: () =>  void;
}

export function CourseButton(props: CourseButtonInfo) {

  return (
    <UnstyledButton className={classes.course} onClick={props.onClick}>
      <Group>
        <Avatar
        name={props.title}
          src={`${props.photo}`}
          radius="xl"
        />

        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
           {props.title}
          </Text>
        </div>
      </Group>
    </UnstyledButton>
  );
}