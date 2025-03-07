import React from "react";
import { Group, TextInput, ActionIcon, Select } from "@mantine/core";
import { IconSearch, IconExclamationCircle } from "@tabler/icons-react";
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { CourseListData, TagData } from "../types";
import { notifications } from '@mantine/notifications';

export default function CourseSearch(props: { onClick: (newCourses: CourseListData[]) => void }) {

  const [tags, setTags] = React.useState<TagData[]>([]);
  const router = useRouter();

  const searchForm = useForm({
    mode: 'controlled',
    initialValues: { query: '', tag: '' },
  });

  React.useEffect(() => {
    const getTags = async () => {
      const token = window.sessionStorage.getItem("jwt");

      if (!token) {
        router.replace('/') // If no token is found, redirect to login page
        return
      }

      const parsedToken = JSON.parse(token);
      // Validate the token by making an API call
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/tags/`, {
          headers: {
            Authorization: `Bearer ${parsedToken.access}`,
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
        const tags: TagData[] = await res.json();
        setTags(tags);
      } catch (error) {
        console.error(error)
      }
    }

    getTags();
  }, [])

  const search = async () => {
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }

    const parsedToken = JSON.parse(token);
    // Validate the token by making an API call
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/search?` + new URLSearchParams(searchForm.values).toString(), {
        headers: {
          Authorization: `Bearer ${parsedToken.access}`,
          "Content-Type": "application/json"
        },
        method: "GET",
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
      const newCourses = await res.json();
      props.onClick(newCourses);
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form style={{ paddingBottom: 12 }}>
      <Group>
        <TextInput
          w={{ base: 200, xs: 300, sm: 200, md: 350, lg: 600, xl: 700 }}
          placeholder="Search"
          leftSection={<IconSearch size={16} stroke={1.5} />}
          {...searchForm.getInputProps('query')}
        />
        <Select
          w={{ base: 150, xs: 150, sm: 150, md: 150, lg: 150, xl: 150 }}
          placeholder="Pick a course tag"
          data={tags.map((tag) => tag.name)}
          label=""
          {...searchForm.getInputProps('tag')}
        />
        <ActionIcon onClick={search} size={36}><IconSearch /></ActionIcon>
      </Group>
    </form>
  )
}