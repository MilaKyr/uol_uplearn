
import Link from 'next/link';
import { ActionIcon, Burger, Container, Group, Image } from '@mantine/core';
import classes from './Header.module.css';
import { IconBell, IconMessage, IconNotification } from '@tabler/icons-react';

interface burgerOption {
  opened: boolean;
  toggle: () =>  void
}

export function Header(props: burgerOption) {

  return (

      <Container size="md" className={classes.inner}>
        <Group justify="space-between" h="100%" px="md">
        <Burger opened={props.opened} onClick={props.toggle} hiddenFrom="xs" size="sm" />
        <Link href="/home" > 
        <Image 
        height={48}
        w="auto"
        fit="contain"
        src='/logo.png' />
        </Link>
       </Group>
      </Container>
  );
}