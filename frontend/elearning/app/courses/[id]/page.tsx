'use client';

import React, {use, Usable} from 'react';
import { CloseButton, Divider, Spoiler, LoadingOverlay } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { Flex, Paper, Text, Grid, Stack, UnstyledButton, Title, Rating, Image,
    Group, Avatar, Timeline, Button, Center, 
 } from '@mantine/core';
 import { IconCurrentLocation, IconExclamationCircle } from '@tabler/icons-react';
import { printDuration } from '@/app/components/utils';
import { notifications } from "@mantine/notifications";
import { HeaderTabs } from '@/app/components/header/Header2';
import { CourseDetail } from '@/app/types';


export default function Course({ params }: { params: Usable<{ id: string }> }) {
        const router = useRouter();
        const usedparams: { id: string } = use(params);
        const courseId = usedparams.id;
        const [opened, {toggle}] = useDisclosure(false);
        const [expanded, setExpanded] = React.useState(false);
        const [course, setCourse] = React.useState<CourseDetail>();
        const [isLoading, setLoading] = React.useState(true);

        React.useEffect(() => {
              const getCourse = async () => {
                const token = window.sessionStorage.getItem("jwt");
            
                if (!token) {
                  router.replace('/') // If no token is found, redirect to login page
                  return
                }
            
                const parsedToken = JSON.parse(token);
        
                try {
        
                const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/${courseId}/`, {
                    headers: {
                      Authorization: `Bearer ${parsedToken.access}`,
                      "Content-Type": "application/json"
                    },
                  });
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
                  const course = await res.json();
                  course["is_owner"] = course.teacher.id === parsedToken.user.id;
                  setLoading(false);
                  setCourse(course);
                } catch (error) {
                  console.error(error)
                }
              }
               
              getCourse();
        
            }, []);

        const onClose = () => {
            router.back()
        }

        const enroll = async () => {
          const token = window.sessionStorage.getItem("jwt");
              
          if (!token) {
              router.replace('/') // If no token is found, redirect to login page
                return
          }
              
          const parsedToken = JSON.parse(token);
              // Validate the token by making an API call
           try {
               const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/${course?.id}/enroll`, {
                 headers: {
                  Authorization: `Bearer ${parsedToken.access}`,
              },
              method: "POST"
            })
              
              if (!res.ok) throw new Error('');
              } catch (error) {
                console.error(error)
             }
        }
    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

        return (
<>
    <HeaderTabs opened={opened} toggle={toggle}/>
    <Divider />
    <Center>
                <Stack p={24} w={{base: 600, xs: 570, sm: 760, md: 800, lg: 900, xl: 900}}>
        <Stack p={25} style={{backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: 10 }}>
        <Group justify='flex-end'><CloseButton onClick={onClose}/>  </Group>
        <Grid >
      <Grid.Col span={{xs: 12, sm: 12, md: 4, lg: 4, xl: 4}}>
        <Image h="100%" radius="lg" src={`data:image/jpeg;base64,${course?.photo}`} />
      </Grid.Col>
      <Grid.Col span={{xs: 12, sm: 12, md: 8, lg: 8, xl: 8}} >
      <Stack
      h="100%"
      align="stretch"
      justify="center"
      gap="md"
    >
        <Flex align="center" justify="space-between">
        <Title>{course?.title}</Title>
        </Flex>
            
        <Group justify='space-between'>
        <UnstyledButton component={Link} href={"/users/"+course?.teacher.id}>
                <Group gap={7}>
                <Avatar style={{backgroundColor:'#696969'}} src={`data:image/jpeg;base64,${course?.teacher?.photo}`} 
                  name={course?.teacher?.first_name + " " + course?.teacher?.last_name} 
                  radius="xl" size={42} />
                  <Group gap={4}>
                  <Text fw={500} size="lg" lh={1}>
                    {course?.teacher?.first_name}
                  </Text>
                  <Text fw={500} size="lg" lh={1} >
                    {course?.teacher?.last_name}
                  </Text>
                  </Group>
                  
                  </Group>
            </UnstyledButton>
            <Rating size="lg" value={course?.average_rating} fractions={2} readOnly/>
        </Group>
        

        
            
        <Group justify='space-between'>
        

        <Text size="lg" c="gray.7"><Text fw={700} component="span">Starts:</Text> {course?.start_date && new Date(course?.start_date).toLocaleDateString()}</Text>
        <Text size="lg" c="gray.7"><Text fw={700} component="span">Duration:</Text>{printDuration(course?.duration)}</Text>
        </Group>
       
    
            <Flex
          h="100%"
          gap="md"
          justify="center"
          align="flex-end"
          direction="column"
          wrap="wrap"
          >
        {course?.enrolled ? (
          <Button component={Link} href={`/study/${course?.id}`} fullWidth variant="filled">Go to course</Button>
        ) : course?.is_owner ? (<Button component={Link} href={`/edit/${course?.id}`} fullWidth variant="filled">Edit</Button>) : (<Button onClick={enroll} fullWidth variant="filled">Enroll</Button>
        )}
      </Flex>
        </Stack>
      </Grid.Col>
    </Grid>

    <Spoiler
    py={24}
    showLabel="Show more"
    hideLabel="Show less"
    expanded={expanded}
    onExpandedChange={setExpanded}
    ><Text ta="justify" size="md">{course?.description}</Text></Spoiler>

    </Stack>

    <Divider />
    <Paper p="md">
        <Title py={5}>Curriculum</Title>
        <Timeline active={0} bulletSize={24} lineWidth={2}>
        {course?.topics?.map(item => (
         <Timeline.Item key={item.id} bullet={<IconCurrentLocation size={12} />} title={item.title}>
            <Text c="dimmed" size="sm">Complete all lessons </Text>
            <Text size="xs" mt={4}>{item.n_hours} hours</Text>
       </Timeline.Item>
        ))}

        </Timeline>
    </Paper>


    {course?.feedback && course?.feedback.length > 0 && (
        <Stack>
            <Divider />
        <Title p={16}>What others say about the course</Title>
        {course?.feedback?.map(feedbck => (
            <Paper py={24} key={feedbck.created} shadow="xs">
            <Group align="top" p={6}>
              <UnstyledButton component={Link} href={`/users/${feedbck.user.id}`} onClick={()=>setLoading(true)}>
              <Avatar
                src={`data:image/jpeg;base64,${feedbck.user.photo}`}
                alt="Student photo"
                radius="xl"
            />
              </UnstyledButton>
               
            <Stack gap={0}>
                <Text size="sm">{feedbck.user.first_name} {feedbck.user.last_name}</Text>
                <Text size="xs" c="dimmed">
                    {new Date(feedbck.created).toLocaleDateString()}
                </Text>
            </Stack>
            
            <Rating defaultValue={feedbck.rating} fractions={2}  readOnly/>

            </Group>
            
            <Text pl={54} pt="sm" size="sm">
                {feedbck.text}
            </Text>
            </Paper>
            ))}

        </Stack>
    )}
    
    
    </Stack>
    </Center>

</>
            
        )
        
}