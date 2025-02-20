'use client';

import React, { useState } from 'react';
import {
  IconBell,
  IconChevronDown,
  IconHeart,
  IconHome,
  IconLogout,
  IconMail,
  IconMessage,
  IconSettings,
  IconStar,
  IconSwitchHorizontal,
  IconTrash,
} from '@tabler/icons-react';
import cx from 'clsx';
import {
  Avatar,
  Burger,
  Container,
  Group,
  Menu,
  Tabs,
  Text,
  UnstyledButton,
  useMantineTheme,
  Image,
  ActionIcon,
} from '@mantine/core';
import classes from './Header.module.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BasicUserData } from '@/app/types';

interface burgerOption {
  opened: boolean;
  toggle: () =>  void;
}

export function HeaderTabs(props: burgerOption) {
  const theme = useMantineTheme();
  const [user, setUser] = React.useState<BasicUserData>();
  const [userMenuOpened, setUserMenuOpened] = useState(false);
  const router = useRouter()

 React.useEffect(() => {
             const token = window.sessionStorage.getItem("jwt");
         
             if (!token) {
               router.replace('/') // If no token is found, redirect to login page
               return
             }
         
             let parsedToken = JSON.parse(token);

             setUser(parsedToken.user)
     }, [router]);

     const logOut = async () => {
      const token = window.sessionStorage.getItem("jwt");
    
        if (!token) {
          router.replace('/') // If no token is found, redirect to login page
          return
        }
    
        let parsedToken = JSON.parse(token);
        // Validate the token by making an API call
          try {
            const res = await fetch('http://127.0.0.1:8000/api/logout/', {
              headers: {
                Authorization: `Bearer ${parsedToken.access}`,
                "Content-Type": "application/json",
              },
              method: 'POST',
            });
            if (!res.ok) throw new Error('Token validation failed');

          } catch (error) {
            console.error(error)
          } finally  {
            window.sessionStorage.removeItem("jwt");
            router.replace('/') // Redirect to login if token validation fails
          }
    }

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
          <Group justify='space-around'>
          

          <Menu
            width={260}
            position="bottom-end"
            transitionProps={{ transition: 'pop-top-right' }}
            onClose={() => setUserMenuOpened(false)}
            onOpen={() => setUserMenuOpened(true)}
            withinPortal
          >
            <Menu.Target>
              <UnstyledButton 
                className={cx(classes.user, { [classes.userActive]: userMenuOpened })}
              >
                <Group gap={7}>
                  <Avatar src={`data:image/jpeg;base64,${user?.photo}`} 
                  alt={user?.first_name + " " +user?.last_name} radius="xl" size={20} />
                  <Text fw={500} size="sm" lh={1} mr={3}>
                    {user?.first_name} {user?.last_name}
                  </Text>
                  <IconChevronDown size={12} stroke={1.5} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
            <Menu.Item
            component={Link}
            href={{
              pathname: '/home',
              query: { selected: 'dashboard' },
            }}
                leftSection={<IconHome size={16} color={theme.colors.gray[6]} stroke={1.5} />}
              >
                Home
              </Menu.Item>
              <Menu.Item
              component={Link}
              href={{
                pathname: '/home',
                query: { selected: 'notifications' },
              }}
                leftSection={<IconBell size={16} color={theme.colors.red[6]} stroke={1.5} />}
              >
                Notifications
              </Menu.Item>
              <Menu.Item
              component={Link}
              href={{
                pathname: '/home',
                query: { selected: 'messages' },
              }}
                leftSection={<IconMessage size={16} color={theme.colors.blue[6]} stroke={1.5} />}
              >
                Messages
              </Menu.Item>
              <Menu.Item
              component={Link}
              href={{
                pathname: '/home',
                query: { selected: 'feedbacks' },
              }}
                leftSection={<IconStar size={16} color={theme.colors.yellow[6]} stroke={1.5} />}
              >
                Feedbacks
              </Menu.Item>

              <Menu.Label>Settings</Menu.Label>
              <Menu.Item 
              component={Link}
              href={{
                pathname: '/home',
                query: { selected: 'settings' },
              }}
              leftSection={<IconSettings size={16} stroke={1.5} />}>
                Account settings
              </Menu.Item>
              <Menu.Item onClick={logOut} leftSection={<IconLogout size={16} stroke={1.5} />}>Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          </Group>
          
        </Group>
        </Container>
  );
}