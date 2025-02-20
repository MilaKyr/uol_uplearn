import React from "react";
import { useDisclosure } from '@mantine/hooks';
import { Grid, Text, Modal, LoadingOverlay, Center } from "@mantine/core";
import { IconCircleCheck, IconExclamationCircle } from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import UserCard from "./UserCard";
import CourseSearch from "./CourseSearch";
import { CourseListData } from "../types";
import CourseCard from "./CourseCard";

export default function Courses() {
  const router = useRouter();
  const [courses, setCourses] = React.useState<CourseListData[]>([]);
  const [openedTeacher, teacherHandle] = useDisclosure(false);
  const [userId, setUserId] = React.useState<number | undefined>();
  const [isLoading, setLoading] = React.useState<boolean>(true);

  const getCourses = async () => {
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }

    let parsedToken = JSON.parse(token);
    // Validate the token by making an API call
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/`, {
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
      let courses: CourseListData[] = await res.json();
      setCourses(courses);
      setLoading(false);
    } catch (error) {
      console.error(error)
      router.replace('/') // Redirect to login if token validation fails
    }
  }

  React.useEffect(() => {

    getCourses();

  }, [])


  const learnMore = (id: number) => {
    router.push(`/courses/${id}`)
  }

  const showUser = (id: number) => {
    setUserId(id);
    teacherHandle.open();
  }

  const enroll = async (index: number, id: number) => {
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }

    let parsedToken = JSON.parse(token);
    // Validate the token by making an API call
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/${id}/enroll`, {
        headers: {
          Authorization: `Bearer ${parsedToken.access}`,
        },
        method: "POST"
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
      notifications.show({
        title: "Success",
        message: "",
        autoClose: 5000,
        icon: <IconCircleCheck />,
        color: 'teal',
      });
      setLoading(true);
      await getCourses();

    } catch (error) {
      console.error(error)
    }

    let newCourses = [...courses];
    newCourses.splice(index, 1);
    setCourses(newCourses)
  }

  if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

  return (
    <>

      <Modal size="lg" opened={openedTeacher} onClose={() => teacherHandle.close()}>
        <UserCard id={userId!} />
      </Modal>

      <CourseSearch onClick={setCourses} />

      {courses.length > 0 ? (
        <Grid>
          {courses.map((course, index) => (
        
        <Grid.Col span={{ base: 12, xs: 12, sm: 12, md: 6, lg: 4, xl: 3 }} key={course.id}>
          <CourseCard course={course} enroll={() => enroll(index, course.id)} showUser={showUser} />
        </Grid.Col>
      
        ))}
        </Grid>
      ):
        <Center pt={34}><Text c="dimmed">No courses available. </Text></Center>
      }
    </>
  )
}