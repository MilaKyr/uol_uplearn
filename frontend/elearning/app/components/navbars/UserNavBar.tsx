'use client';

import React, { useCallback, Suspense} from 'react';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { IconSettings, IconPencilStar, IconSchool, IconMessage, IconBell, IconUsersGroup, IconExclamationCircle, IconPlus, IconLogout } from '@tabler/icons-react';
import {
  Badge,
  UnstyledButton,
} from '@mantine/core';
import { UserButton } from '../buttons/UserButton';
import classes from './NavBar.module.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserNavbarProps } from '@/app/types';
import { notifications } from '@mantine/notifications';

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
  unseen? : number;
}
  
const studentlinks: Link[] = [
    {id: 1, icon: IconBell, label: 'Notifications', value: "notifications" },
    {id: 2, icon: IconMessage, label: 'Messages', value: "messages" },
    {id: 3, icon: IconSchool, label: 'Browse Courses', value: "courses"  },
    {id: 4, icon: IconPencilStar, label: 'Feedbacks', value: "feedbacks" },
    {id: 5, icon: IconSettings, label: 'Settings', value: "settings" },
  ];

  const teacherlinks: Link[] = [
    {id: 1, icon: IconBell, label: 'Notifications' , value: "notifications" },
    {id: 2, icon: IconMessage, label: 'Messages', value: "messages" },
    {id: 3, icon: IconUsersGroup, label: 'Users', value: "users" },
    {id: 4, icon: IconSettings, label: 'Settings', value: "settings" },
    {id: 5, icon: IconPlus, label: 'Add course', value: "addCourse" },
  ];


const selectBtn = (searchParams: ReadonlyURLSearchParams, props: UserNavbarProps) => {
  if (searchParams.size === 0) {
    return 0
  }
  const selected = searchParams.get("selected");
  if (props.role === "student"){
    for (let i=0; i<studentlinks.length; i++) {
      const link = studentlinks[i];
      if (link.value === selected) {
        return link.id
      }
    }
  }
  for (let i=0; i<teacherlinks.length; i++) {
    const link = teacherlinks[i];
    if (link.value === selected) {
      return link.id
    }
  }
  return 0
}
  

const UserNavbarSearch = (props: UserNavbarProps) => {
    const searchParams = useSearchParams();
    const [selected, setSelected] = React.useState(selectBtn(searchParams, props));
    const [user, setUser] = React.useState(null);
    const [links, setLinks] = React.useState<Link[]>([]);
    const router = useRouter();

     React.useEffect(() => {
                 const token = window.sessionStorage.getItem("jwt");
             
                 if (!token) {
                   router.replace('/') // If no token is found, redirect to login page
                   return
                 }
             
                 const parsedToken = JSON.parse(token);
    
                 setUser(parsedToken.user);
                 const apprLinks: Link[] = parsedToken.user.role === "student" ? studentlinks : teacherlinks;

                 const getInboxInfo = async (apprLinks: Link[]) => {
                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/home/inbox`, {
                      headers: {
                        Authorization: `Bearer ${parsedToken.access}`,
                        "Access-Control-Allow-Origin":"*"
                      },
                    })
            
                    if (!res.ok) {
                      if (res.status === 401) {
                        notifications.show({
                          title: "Session expired",
                          message: "Please log in to continue",
                          autoClose: false,
                          icon: <IconExclamationCircle />,
                          color: 'red',
                        });
                        window.sessionStorage.removeItem("jwt");
                        router.push('/') // Redirect to login if token validation fails
                      } else {
                        throw new Error('Something went wrong')
                      }
                    };
                    const data = await res.json();
                    console.log("data", data)
                    apprLinks[0]["unseen"] = data["new_notifications"]
                    apprLinks[1]["unseen"] = data["new_messages"]
                    setLinks(apprLinks);
                  } catch (error) {
                    console.log(error);
                    notifications.show({
                      title: "Session expired",
                      message: 'Please login to continue',
                      color: 'red'
                    })
                    router.replace('/') // Redirect to login if token validation fails
                  }
                }
                
                 setSelected(selectBtn(searchParams, props))                
                 getInboxInfo(apprLinks)
         }, [router, searchParams, selected])



    const handleClick = (link: ButtonLink) => {
      if (link.value === "messages") {
          props.setLoading(true);
          router.push( '/messages');
      } else {
        router.push('/home' + '?' + createQueryString('selected', link.value));
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

    const logOut = async () => {
      props.setLoading(true);
      const token = window.sessionStorage.getItem("jwt");
    
        if (!token) {
          router.replace('/') // If no token is found, redirect to login page
          return
        }
    
        const parsedToken = JSON.parse(token);
        // Validate the token by making an API call
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/logout/`, {
              headers: {
                Authorization: `Bearer ${parsedToken.access}`,
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin":"*"
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

    const handleUserBtn = () => {
      router.replace('/home');
      props.onClick("dashboard"); 
      setSelected(0);
    }


      return (
        <Suspense>
        <nav className={classes.navbar}>
          <div className={classes.section}>
          {user && <UserButton user={user} onClick={handleUserBtn} photo={props.photo} />}
          </div>
    
          <div className={classes.section}>
            <div className={classes.mainLinks}>

              {links.map((link) => {
                const showUnseen = link.unseen ? link.unseen! !== 0 : false;
                return (
                
                <UnstyledButton onClick={() => handleClick(link)} key={link.label} className={classes.mainLink}
                color={ link.id=== selected ? 'indigo.2' : 'transparent'}>

                  <div className={classes.mainLinkInner}>
                  <link.icon size={20} className={classes.mainLinkIcon} stroke={1.5} />
                  <span>{link.label}</span>
                  </div>
                  {showUnseen && (
                    <Badge size="sm" variant="filled" className={classes.mainLinkBadge}>
                    {link.unseen}
                    </Badge>
                  )}
                </UnstyledButton>
                
              )})}
            </div>
          </div>
    
          <div className={classes.section}>
          <div className={classes.mainLinks}>
          <UnstyledButton variant="subtle" className={classes.mainLink} onClick={logOut}>
          <div className={classes.mainLinkInner}>
                <IconLogout  className={classes.mainLinkIcon}  stroke={1.5}/>
                <span>Log out</span>
              </div>
          </UnstyledButton>
          </div>
          </div>
        </nav>
        </Suspense>
      );
    };

export default UserNavbarSearch;