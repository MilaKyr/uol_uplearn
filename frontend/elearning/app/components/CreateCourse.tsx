'use client';

import React from "react";
import { Image, Group, Title, 
  Stack, Text,
  Button, Divider, TextInput, Stepper,  Code, Textarea, ActionIcon,
  Center, NumberInput, TagsInput, Grid,  LoadingOverlay } from "@mantine/core";
import { IconGripVertical, IconTrash, IconPhoto, IconCheck } from '@tabler/icons-react';
import { isNotEmpty, useForm } from '@mantine/form';
import { DateTimePicker } from '@mantine/dates';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { randomId } from '@mantine/hooks';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconUpload, IconX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { delay } from "./utils";

interface Tag {
  id: number;
  name: string;
}

export default function CreateCourse() {
    const router = useRouter();
    const [isLoading, setLoading] = React.useState(false);
    const [active, setActive] = React.useState(0);
    const [tags, setTags] = React.useState<string[]>();
    const [imgBackground, setImgBackground] = React.useState('#f8f8ff');
    const [newCourseId, setNewCourseId] = React.useState<number|null>(null);
    const [courseImg, setCourseImg] = React.useState<File|null>();
    const [courseImgShow, setCourseImgShow] = React.useState<File|string>("https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg");

    const acceptFile = (file: File) => {
      setCourseImg(file);
      setCourseImgShow(URL.createObjectURL(file));
    }

    const setCourseId = async () => {
      const token = window.sessionStorage.getItem("jwt");
    
        if (!token) {
          router.replace('/') // If no token is found, redirect to login page
          return
        }
    
        const parsedToken = JSON.parse(token);
        // Validate the token by making an API call
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/new`, {
              headers: {
                Authorization: `Bearer ${parsedToken.access}`,
              },
            })
    
            if (!res.ok) throw new Error('');
            const id: number = await res.json();           
            setNewCourseId(id);
          } catch (error) {
            notifications.show({
              title: 'Default notification',
              message: 'Do not forget to star Mantine on GitHub! 🌟',
            })
            router.replace('/') 
            
          }
    }

    const submit = async () => {
      setLoading(true);
      try {
        await submitCourse();
        notifications.show({
          title: 'New course created!',
          message: "You'll be redirected to edit page in a few seconds",
          withCloseButton: true,
          color: 'teal',
          icon: <IconCheck />,
        });
        setLoading(false);
        await delay(2000);
        router.push(`/edit/${newCourseId}`);
      } catch(err) {
        console.log(err);
        notifications.show({
          title: 'Failed to create new course',
          message: 'Try again',
          withCloseButton: true,
          color: 'red',
          icon: <IconX />,
          autoClose: false,
        });
        setLoading(false);
      }


    }

    const submitCourse = async () => {
      
      const token = window.sessionStorage.getItem("jwt");
    
        if (!token) {
          router.replace('/') // If no token is found, redirect to login page
          return
        }
    

        const parsedToken = JSON.parse(token);
        // Validate the token by making an API call

            form.setFieldValue('pk', newCourseId)
            const toSend = form.values;
            const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/`, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${parsedToken.access}`,
              },
              method: 'POST',
              body: JSON.stringify(toSend)
            })
    
            if (!res.ok) throw new Error('');

            if (courseImg) {
                // send image
                const formData = new FormData();
                formData.append('photo', courseImg);
                const res_photo = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/${newCourseId}/photo`, {
                  headers: {
                    Authorization: `Bearer ${parsedToken.access}`,
                  },
                  method: 'PUT',
                  body: formData,
                });
                if (!res_photo.ok) throw new Error('Something went wrong');
            }

            // now redirect
            setLoading(false);
            router.push(`/edit/${newCourseId}`);
    }

    React.useEffect(() => {
        const token = window.sessionStorage.getItem("jwt");
    
        if (!token) {
          router.replace('/') // If no token is found, redirect to login page
          return
        }
    
        const parsedToken = JSON.parse(token);
        // Validate the token by making an API call
        const getTags = async () => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/tags`, {
              headers: {
                Authorization: `Bearer ${parsedToken.access}`,
              },
            })
    
            if (!res.ok) throw new Error('');
            const data: Tag[] = await res.json();
            const toSave: string[] = [];
            data.map((tag: Tag) => {
              toSave.push(tag.name);
            })
            setTags(toSave)
          } catch (error) {
            console.error(error)
            router.replace('/') // Redirect to login if token validation fails
          }
        }
    
        getTags()
      }, [router])

    const form = useForm({
      mode: 'controlled',
      initialValues: {
        title: '',
        start_date: '',
        end_date: '',
        description: '',
        tags: [],
        topics: [
          {title: '', description: '', n_hours: 1, key: randomId(), 
            lessons: [
              {title: '', deadline: '', key: randomId()}
          ]}
        ],
      },
      validate: {
        title: (value: string) => value.trim().length < 6 ? 'Title must include at least 6 characters': null,
        start_date: (value: string) => value === "" || new Date(value) < new Date() ? 'Start date cannot be empty or in the past' : null,
        end_date: (value, values) =>  value === "" || new Date(values.start_date) > new Date(value) ? 'End date must be after start date' : null,
        description: isNotEmpty("Cannot be empty"),
        tags: isNotEmpty("Cannot be empty"),
        topics: {
              title: (value) => active === 1 && (value === '' || value === undefined) ? "Cannot be empty" : null,
              description: (value: string) => active === 1 && value.trim().length < 10
                ? 'Description must include at least 10 characters'
                : null,
              n_hours: (value) =>  active === 1 && (value < 1 || value === undefined) ? "Cannot be empty" : null,

              lessons: {
                title: (value) => active === 2 && (value === '' || value === undefined) ? "Cannot be empty" : null,
                deadline: (value, values) =>  active === 2 &&  (value === "" || new Date(value) < new Date(values.start_date) || new Date(value) > new Date(values.end_date)  ? 'Deadline must be after start date and before end date' : new Date(value) < new Date(Math.max.apply(null, values.topics.map((topic) => topic.lessons.map((less) => new Date(less.deadline).valueOf())).flat()))) ? "Deadline must be after all previous lessons' deadlines" : null,
              }
            }
        },

  });


      const fields = form.getValues().topics.map((item, index) => (
        <Draggable key={item.key} index={index} draggableId={item.key}>
          {(provided) => (
            <Group ref={provided.innerRef} mt="xs" {...provided.draggableProps}>
              <Center {...provided.dragHandleProps}>
                <IconGripVertical size={18} />
              </Center>
              <TextInput
                required
                placeholder="Topic title"
                key={form.key(`topics.${index}.title`)}
                {...form.getInputProps(`topics.${index}.title`)}
              />
              <Textarea
                required
                autosize
                placeholder="Description"
                key={form.key(`topics.${index}.description`)}
                {...form.getInputProps(`topics.${index}.description`)}
              />
               <NumberInput
                required
                placeholder="Number of estimated hours"
                clampBehavior="strict"
                min={1}
                key={form.key(`topics.${index}.n_hours`)}
                {...form.getInputProps(`topics.${index}.n_hours`)}
    />
        <ActionIcon color="red" onClick={() => form.removeListItem('topics', index)}>
            <IconTrash size={16} />
          </ActionIcon>
            </Group>
          )}
        </Draggable>
      ));


    
    const nextStep = async () =>
        setActive((current) => {
          if (active === 0) {
            setCourseId();
          } 
          if ((active === 0) && (courseImg === undefined)) {
            setImgBackground('#ffa8a8');
            console.log("im here")
            return current;
          }
          if (form.validate().hasErrors) {
            console.log("im here2", form.validate())
            return current;
          }
          return current < 3 ? current + 1 : current;
        });

    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));



    const deleteImage = () => {
      setCourseImgShow("https://upload.wikimedia.org/wikipedia/commons/3/3f/Placeholder_view_vector.svg");
      setCourseImg(null);

    }

    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
    return (
        <>
        <Stepper active={active}>
          <Stepper.Step py={24} label="First step" description="Course">
            
          <Grid >
          <Grid.Col span="auto">
            {courseImg ? (
              <Stack h={265} gap={32} justify="flex-start">
              <Image h={333} radius="md" src={courseImgShow} />
              <ActionIcon style={{alignSelf: 'flex-start'}} onClick={deleteImage} color="red"><IconTrash /></ActionIcon>
              </Stack>
            ) : (
               <Dropzone
               multiple={false}
               onDrop={(files: File[]) => acceptFile(files[0])}
               onReject={(files) => console.log('rejected files', files)}
               maxSize={5 * 1024 ** 2}
               accept={IMAGE_MIME_TYPE}
             >
               <Group justify="center" gap="xl" mih={333} style={{borderRadius: 10, pointerEvents: 'none', backgroundColor: imgBackground }}>
                 <Dropzone.Accept>
                   <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5} />
                 </Dropzone.Accept>
                 <Dropzone.Reject>
                   <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
                 </Dropzone.Reject>
                 <Dropzone.Idle>
                   <IconPhoto size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
                 </Dropzone.Idle>
     
                 <div>
                 <Text size="sm" c="red" inline mb={4}>
                    This is required
                   </Text><Text size="xl" inline>
                     Drag image here or click to select file
                   </Text>
                   <Text size="sm" c="dimmed" inline mt={7}>
                    File should not exceed 5mb
                   </Text>
                 </div>
               </Group>
             </Dropzone>
            )}
         
      </Grid.Col>

        <Grid.Col span="auto">
        <TextInput
            required
              label="Title"
              placeholder="Title"
              key={form.key('title')}
              {...form.getInputProps('title')}
            />

            <Group justify="space-between">
            <DateTimePicker
              mt="md"
              required
              valueFormat="DD/MM/YYYY HH:mm:ss"
              label="Start date"
              placeholder="Course start date"
              key={form.key('start_date')}
              {...form.getInputProps('start_date')}
            />

            <DateTimePicker
              mt="md"            
              required
              valueFormat="DD/MM/YYYY HH:mm:ss"
              label="End date"
              placeholder="Course end date"
              key={form.key('end_date')}
              {...form.getInputProps('end_date')}
            />

            </Group>
            
            <Textarea 
            py={16}
            required
            label="Description"
            description="Course description"
            placeholder="Write course description here..."
            key={form.key('description')}
            {...form.getInputProps('description')}
            />

          <TagsInput
                required
                label="Course tags"
                placeholder="Pick tag from list"
                data={tags}
                key={form.key('tags')}
                {...form.getInputProps('tags')}
              />
        </Grid.Col>
            
        </Grid>
            


          

          </Stepper.Step>
  
          <Stepper.Step label="Second step" description="Topics">
          <div >
            <DragDropContext onDragEnd={({ destination, source }) =>
          destination?.index !== undefined && form.reorderListItem('topics', { from: source.index, to: destination.index })
        }>
                <Droppable droppableId="dnd-list" direction="vertical">
                {(provided) => {
                  return (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                    {fields}
                    {provided.placeholder}
                    </div>
                )}}
                </Droppable>
            </DragDropContext>

            <Group justify="center" mt="md">
                <Button onClick={() => form.insertListItem('topics', { title: '', description: '', nHours: 1 , key: randomId(), lessons: [
              {title: '', deadline: '', key: randomId()}] })}>
                Add topic
                </Button>
            </Group>
            </div>
          </Stepper.Step>



          <Stepper.Step label="Third step" description="Lessons">
          <div>
          
            <DragDropContext key={"third-step"} onDragEnd={({ destination, source }) =>
            destination?.index !== undefined &&  form.reorderListItem(`topics.${source.droppableId}.lessons`, { from: source.index, to: destination.index })
        }>
          {form.values.topics.map((topic, tp_index) => {
            return (

            <Droppable key={topic.key} droppableId={`dnd-${topic.key}`}>
            {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <Group key={topic.key} justify="flex-start" mt="md">
              <Title>{topic.title}</Title>
            </Group>
                {topic.lessons.map((item, index) => (
                  <Draggable
                    key={item.key}
                    draggableId={item.key}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
    
                      >
                        <Draggable key={item.key} index={index} draggableId={item.key}>
                            {(provided) => (
                              <Group ref={provided.innerRef} mt="xs" {...provided.draggableProps}>
                                <Center {...provided.dragHandleProps}>
                                  <IconGripVertical size={18} />
                                </Center>
                                <TextInput
                                  placeholder="Lesson title"
                                  key={form.key(`topics.${tp_index}.lessons.${index}.title`)}
                                  {...form.getInputProps(`topics.${tp_index}.lessons.${index}.title`)}
                                />
                                <DateTimePicker
                                  placeholder="Deadline"
                                  key={form.key(`topics.${tp_index}.lessons.${index}.deadline`)}
                                  {...form.getInputProps(`topics.${tp_index}.lessons.${index}.deadline`)}
                                />
                          <ActionIcon color="red" onClick={() => form.removeListItem(`topics.${tp_index}.lessons`, index)}>
                              <IconTrash size={16} />
                            </ActionIcon>
                              </Group>
                              
                            )}
                          </Draggable>
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
              <Button my={24} onClick={() => form.insertListItem(`topics.${tp_index}.lessons`, { title: '', deadline: '', key: randomId() })}>
              Add lesson
              </Button>
              <Divider />
              </div>
            )}
            </Droppable>
          )})}
            </DragDropContext>

            
            </div>
          </Stepper.Step>
          
          
          <Stepper.Completed>
            Completed! Form values:
            <Code block mt="xl">
              {JSON.stringify(form.getValues(), null, 2)}
            </Code>
          </Stepper.Completed>
        </Stepper>
  
        <Group justify="flex-end" mt="xl">
          {active !== 0 && (
            <Button variant="default" onClick={prevStep}>
              Back
            </Button>
          )}
          {active !== 2 && <Button onClick={nextStep}>Next step</Button>}
          {active === 2 && <Button onClick={submit}>Submit</Button>}

        </Group>
      </>
  );
}



