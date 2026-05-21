'use client';

import React, { useState } from 'react';
import {
  IconBell,
  IconChevronDown,
  IconHome,
  IconLogout,
  IconMessage,
  IconPlus,
  IconSchool,
  IconSettings,
  IconStar,
  IconUsersGroup,
} from '@tabler/icons-react';
import cx from 'clsx';
import {
  Avatar,
  Burger,
  Group,
  Menu,
  Text,
  UnstyledButton,
  useMantineTheme,
  Image,
  Grid,
} from '@mantine/core';
import classes from './Header.module.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/app/actions/api';
import { getUser } from '@/app/actions/getAuth';

interface burgerOption {
  opened: boolean;
  toggle: () => void;
}

export function HeaderTabs(props: burgerOption) {
  const user = getUser();
  const theme = useMantineTheme();
  const [userMenuOpened, setUserMenuOpened] = useState(false);
  const router = useRouter()

  const handleLogout = async () => {
    await api.logout();
    router.push('/');
  }

  return (
    <Grid px={12} pt={12} justify="flex-start" align="center" gutter={{ base: 'xl', xs: 'xl', md: 'xl', xl: 50 }}>
      <Grid.Col span={1} hiddenFrom="xs" >
        <Burger opened={props.opened} onClick={props.toggle} hiddenFrom="xs" size="sm" />
      </Grid.Col>

      <Grid.Col span={{ base: 3, xs: 3, sm: 2, md: 3, lg: 1, xl: 2 }}>
        <Link href={`/`} >
          <Image
            height={48}
            w="auto"
            fit="contain"
            src='/logo.png' />
        </Link>
      </Grid.Col>


      <Grid.Col offset={{ base: 4, xs: 4, md: 0, lg: 2, xl: 0 }} span={4}>

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
              <Group gap={7} align='flex-end'>
                <Avatar src={`${user?.photo}`}
                  alt={user?.name} radius="xl" size={20} />
                <Text visibleFrom='xs' fw={500} size="sm" lh={1} mr={3}>
                  {user?.name}
                </Text>
                <IconChevronDown size={12} stroke={1.5} />
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              component={Link}
              href={{
                pathname: `/home/${user.id}`,
                query: { selected: 'dashboard' },
              }}
              leftSection={<IconHome size={16} color={theme.colors.gray[6]} stroke={1.5} />}
            >
              Home
            </Menu.Item>
            <Menu.Item
              component={Link}
              href={{
                pathname: `/home/${user.id}`,
                query: { selected: 'notifications' },
              }}
              leftSection={<IconBell size={16} color={theme.colors.teal[6]} stroke={1.5} />}
            >
              Notifications
            </Menu.Item>
            <Menu.Item
              component={Link}
              href={'/messages'}
              leftSection={<IconMessage size={16} color={theme.colors.blue[6]} stroke={1.5} />}
            >
              Messages
            </Menu.Item>
            {user?.role === "student" &&
              <Menu.Item
                component={Link}
                href={{
                  pathname: `/home/${user.id}`,
                  query: { selected: 'courses' },
                }}
                leftSection={<IconSchool size={16} color={theme.colors.violet[6]} stroke={1.5} />}
              >
                Browse Courses
              </Menu.Item>}

            {user?.role === "teacher" &&
              <Menu.Item
                component={Link}
                href={{
                  pathname: `/home/${user.id}`,
                  query: { selected: 'addCourse' },
                }}
                leftSection={<IconPlus size={16} color={theme.colors.yellow[6]} stroke={1.5} />}
              >
                Add course
              </Menu.Item>}

            {user?.role === "teacher" &&
              <Menu.Item
                component={Link}
                href={{
                  pathname: `/home/${user.id}`,
                  query: { selected: 'users' },
                }}
                leftSection={<IconUsersGroup size={16} color={theme.colors.violet[6]} stroke={1.5} />}
              >
                Users
              </Menu.Item>}

            {user?.role === "student" && <Menu.Item
              component={Link}
              href={{
                pathname: `/home/${user.id}`,
                query: { selected: 'feedbacks' },
              }}
              leftSection={<IconStar size={16} color={theme.colors.yellow[6]} stroke={1.5} />}
            >
              Feedbacks
            </Menu.Item>}

            <Menu.Label>Settings</Menu.Label>
            <Menu.Item
              component={Link}
              href={{
                pathname: `/home/${user.id}`,
                query: { selected: 'settings' },
              }}
              leftSection={<IconSettings size={16} stroke={1.5} />}>
              Account settings
            </Menu.Item>
            <Menu.Item onClick={handleLogout} 
            leftSection={<IconLogout size={16} stroke={1.5} color={theme.colors.red[6]} />}>Logout</Menu.Item>
          </Menu.Dropdown>
        </Menu>

      </Grid.Col>
    </Grid>
  );
}
