
import React from 'react';
import Link from 'next/link';
import { Burger, Group, Image } from '@mantine/core';

interface burgerOption {
  opened: boolean;
  toggle: () =>  void
}

export const Header = (props: burgerOption) => (

        <Group justify="space-between" h="100%" px="md">
        <Burger opened={props.opened} onClick={props.toggle} hiddenFrom="xs" size="sm" />
        <Link href="/" > 
        <Image 
        height={48}
        w="auto"
        fit="contain"
        src='/logo.png' />
        </Link>
       </Group>
  );