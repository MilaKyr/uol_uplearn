'use client';

import React, { useCallback, Suspense } from 'react';
import { IconExclamationCircle } from '@tabler/icons-react';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { IconSettings, IconSchool, IconMessage, IconBell, IconUsersGroup, IconPlus, IconLogout, IconStar } from '@tabler/icons-react';
import {
  Badge,
  UnstyledButton,
} from '@mantine/core';
import { UserButton } from '../buttons/UserButton';
import classes from './NavBar.module.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { HomeData } from '@/app/types';
import { api } from '@/app/actions/api';
import { notifications, useNotifications } from '@mantine/notifications';


interface ButtonLink {
  id: number,
  icon: React.ElementType,
  label: string,
  value: string,
}

interface Link {
  id: number;
  icon: typeof IconBell;
  label: string;
  value: string;
  unseen?: number;
  color: string;
}

const studentlinks: Link[] = [
  { id: 1, icon: IconBell, label: 'Notifications', value: "notifications", color: "#12b886" },
  { id: 2, icon: IconMessage, label: 'Messages', value: "messages", color: "#228be6" },
  { id: 3, icon: IconSchool, label: 'Browse Courses', value: "courses", color: "#7950f2" },
  { id: 4, icon: IconStar, label: 'Feedbacks', value: "feedbacks", color: "#fab005" },
  { id: 5, icon: IconSettings, label: 'Settings', value: "settings", color: "#495057" },
];

const teacherlinks: Link[] = [
  { id: 1, icon: IconBell, label: 'Notifications', value: "notifications", color: "#12b886" },
  { id: 2, icon: IconMessage, label: 'Messages', value: "messages", color: "#228be6" },
  { id: 3, icon: IconUsersGroup, label: 'Users', value: "users", color: "#7950f2" },
  { id: 4, icon: IconSettings, label: 'Settings', value: "settings", color: "#495057" },
  { id: 5, icon: IconPlus, label: 'Add course', value: "addCourse", color: "#fab005" },
];


const selectBtn = (searchParams: ReadonlyURLSearchParams, role: string) => {
  if (searchParams.size === 0) {
    return 0
  }
  const selected = searchParams.get("selected");
  if (role === "student") {
    for (let i = 0; i < studentlinks.length; i++) {
      const link = studentlinks[i];
      if (link.value === selected) {
        return link.id
      }
    }
  }
  for (let i = 0; i < teacherlinks.length; i++) {
    const link = teacherlinks[i];
    if (link.value === selected) {
      return link.id
    }
  }
  return 0
}


const UserNavbarSearch = (props: {
  selected: string,
  onClick: (label: string) => void,
  userId: string
}) => {
  const notificationsStore = useNotifications();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = React.useState<number>();
  const [links, setLinks] = React.useState<Link[]>();
  const [user, setUser] = React.useState<HomeData>();

  const getInbox = async () => {
    const {data, status} = await api.get(`/api/notifications/inbox`)
    if (status === 401 || status === 403) {
      const check_if_exists = notificationsStore.notifications.find((notif) => notif.title==="Session expired")
      if (check_if_exists === undefined) {
        notifications.show({
          title: "Session expired",
          message: "Please log in to continue",
          autoClose: false,
          icon: <IconExclamationCircle />,
                        color: 'red',
        });
        router.push('/')
      }     
    }
    return data
  }

  const getUser = async () => {
    const url = `/api/dashboard/${props.userId}`;
    const {data, status} = await api.get(url)
    if (status === 401 || status === 403) {
      const check_if_exists = notificationsStore.notifications.find((notif) => notif.title==="Session expired")
      if (check_if_exists === undefined) {
        notifications.show({
          title: "Session expired",
          message: "Please log in to continue",
          autoClose: false,
          icon: <IconExclamationCircle />,
                        color: 'red',
        });
        router.push('/')
      }     
    }
    console.log(data)
    const inbox = await getInbox();
    const appLinks = data.role === "student" ? studentlinks : teacherlinks;
    appLinks[0]["unseen"] = inbox.new_notifications
    appLinks[1]["unseen"] = inbox.new_messages
    setLinks(appLinks);
    setSelected(selectBtn(searchParams, data.role))
    setUser(data);
  }

  React.useEffect(() => {
    getUser()
  }, [searchParams, selected])


  const handleClick = (link: ButtonLink) => {
    if (link.value === "messages") {
      router.push('/messages');
    } else {
      router.push(`/home/${props.userId}` + '?' + createQueryString('selected', link.value));
      setSelected(link.id);
      props.onClick(link.value);
    }
  }

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  );

  const handleUserBtn = () => {
    router.replace(`/home/${props.userId}`);
    props.onClick("dashboard");
    setSelected(0);
  }

  const handleLogout = async () => {
    await api.logout();
    router.push('/');
  }

  return (
    <Suspense>
      <nav className={classes.navbar}>
        <div className={classes.section}>
          {user && <UserButton name={user?.name} photo={user?.photo} onClick={handleUserBtn} />}
        </div>

        <div className={classes.section}>
          <div className={classes.mainLinks}>

            {links && links.map((link) => {
              const showUnseen = link.unseen ? link.unseen! !== 0 : false;

              return (

                <UnstyledButton onClick={() => handleClick(link)} key={link.label} className={classes.mainLink}
                  color={link.id === selected ? 'indigo.2' : 'transparent'}>

                  <div className={classes.mainLinkInner}>
                    <link.icon size={20} className={classes.mainLinkIcon} stroke={1.5} color={link.color} />
                    <span>{link.label}</span>
                  </div>
                  {showUnseen && (
                    <Badge size="sm" variant="filled" className={classes.mainLinkBadge}>
                      {link.unseen}
                    </Badge>
                  )}
                </UnstyledButton>

              )
            })}
          </div>
        </div>

        <div className={classes.section}>
          <div className={classes.mainLinks}>
            <UnstyledButton variant="subtle" className={classes.mainLink} onClick={handleLogout}>
              <div className={classes.mainLinkInner}>
                <IconLogout className={classes.mainLinkIcon} color={'red'} stroke={1.5} />
                <span >Log out</span>
              </div>
            </UnstyledButton>
          </div>
        </div>
      </nav>
    </Suspense>
  );
};

export default UserNavbarSearch;