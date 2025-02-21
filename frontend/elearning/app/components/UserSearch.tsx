import React from "react";
import { Group, TextInput, ActionIcon, Select, MultiSelect } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useForm  } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { CourseTitle, SearchedUserData } from "../types";

interface SetResults {
    onClick: (users: SearchedUserData[]) => void
}

interface Tag {
    id: number;
    name: string;
    color: string;
  }

export default function UserSearch(props: SetResults) {
    const [courseTitles, setCourseTitles] = React.useState<CourseTitle[]>([]);
    const router = useRouter();

    const searchForm = useForm({
        mode: 'controlled',
        initialValues: { query: '', role: '', course_id: '', status: [] },
        transformValues: (values) => ({
          status: values.status.join(","),
        }),
    });

    React.useEffect(() => {
        const getCourseTitles = async () => {
            const token = window.sessionStorage.getItem("jwt");
          
              if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
              }
          
              const parsedToken = JSON.parse(token);
              // Validate the token by making an API call
              try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/home/course_titles`, {
                    headers: {
                      Authorization: `Bearer ${parsedToken.access}`,
                    },
                  })
          
                  if (!res.ok) throw new Error('');
                  const titles = await res.json();
                  setCourseTitles(titles);
                } catch (error) {
                  console.error(error)
                  router.replace('/') // Redirect to login if token validation fails
                }
          }

          getCourseTitles();
    }, [])

    const search = async () => {
        const token = window.sessionStorage.getItem("jwt");
          
              if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
              }
          
              const parsedToken = JSON.parse(token);
              courseTitles.map((title) => {
                if (title.title === searchForm.values.course_id) {
                  searchForm.setValues({course_id: `${title.id}`})
                }
              })

              const values = searchForm.getTransformedValues();
              // Validate the token by making an API call
              try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/users/search?` + new URLSearchParams(values).toString(), {
                    headers: {
                      Authorization: `Bearer ${parsedToken.access}`,
                      "Content-Type": "application/json"
                    },
                    method: "GET",
                  })
          
                  if (!res.ok) throw new Error('');
                  const newUsers = await res.json();
                  props.onClick(newUsers);
                } catch (error) {
                  console.error(error)
                  router.replace('/') // Redirect to login if token validation fails
                }
    }

    return (
      <form style={{paddingBottom: 12}}>
        <Group>
                <TextInput
                    w={{ base: 100, xs: 200, sm: 100, md: 250, lg: 500, xl: 600 }}
                    placeholder="Search"
                    leftSection={<IconSearch size={16} stroke={1.5} />}
                    {...searchForm.getInputProps('query')}
                />
                <Select
                    w={{ base: 150, xs: 150, sm: 150, md: 150, lg: 150, xl: 150 }}
                    placeholder="Pick a role"
                    data={["Student", "Teacher"]}
                    label=""
                    clearable
                    {...searchForm.getInputProps('role')}
                />
                 <Select
                    w={{ base: 250, xs: 250, sm: 250, md: 250, lg: 250, xl: 250 }}
                    placeholder="My courses"
                    data={courseTitles.map((title) => title.title)}
                    label=""
                    clearable
                    {...searchForm.getInputProps('course_id')}
                />
                <MultiSelect
                    w={{ base: 250, xs: 400, sm: 400, md: 700, lg: 800, xl: 800 }}
                    placeholder="Course status"
                    data={["Started", "Blocked", "Removed", "Finished",]}
                    label=""
                    clearable
                    hidePickedOptions
                    {...searchForm.getInputProps('status_list')}
                />
                <ActionIcon onClick={search}  size={36}><IconSearch /></ActionIcon>
                </Group>
        </form>
    )
}