'use client';

import React, { useCallback, Suspense } from "react";
import {
  Group, Title, UnstyledButton, Modal, Center, LoadingOverlay,
  Stack, Text, Button, Divider, SimpleGrid, ActionIcon, TextInput,
} from "@mantine/core";
import JSZip from 'jszip';
import {
  IconPhoto, IconFile, IconUpload, IconX,
  IconBrandYoutube, IconTrashX,
  IconTrash,
} from '@tabler/icons-react';
import { RichTextEditor, useRichTextEditorContext } from '@mantine/tiptap';
import { IconColorPicker, IconCircleCheck, IconExclamationCircle } from '@tabler/icons-react';
import { Dropzone, PDF_MIME_TYPE, FileWithPath } from '@mantine/dropzone';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LessonEditData } from "@/app/types";
import { Editor as TipTapEditor } from '@tiptap/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from "@mantine/notifications";
import { useForm, isNotEmpty } from '@mantine/form';

function InsertYoutubeControl() {
  const { editor } = useRichTextEditorContext();

  const addYT = useCallback(() => {
    const url = prompt('Enter YouTube URL')

    if (url) {
      editor!.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480,
      })
    }

  }, [editor])


  if (!editor) {
    return null
  }

  return (
    <RichTextEditor.Control
      onClick={addYT}
      aria-label="Insert YouTube video"
      title="Insert YouTube video"
    >
      <IconBrandYoutube stroke={1.5} size={16} />
    </RichTextEditor.Control>
  );
}


export default function LessonMain(props: {
  id: string,
  courseId: string,
  editor: TipTapEditor
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [lesson, setLesson] = React.useState<LessonEditData>();
  const [opened, { open, close }] = useDisclosure(false);
  const [files, setFiles] = React.useState<FileWithPath[]>([]);
  const [isLoading, setLoading] = React.useState(true);

  const onDownload = (file: File) => {
    const link = document.createElement("a");
    const fileUrl = URL.createObjectURL(file);
    link.download = file.name;
    link.href = fileUrl;
    link.click();
  };

  const lessonForm = useForm({
    mode: 'controlled',
    initialValues: { title: '' },
    validate: {
      title: isNotEmpty('Enter your bio description'),
    },
  });

  React.useEffect(() => {

    const getFiles = async () => {
      const token = window.sessionStorage.getItem("jwt");

      if (!token) {
        router.replace('/') // If no token is found, redirect to login page
        return
      }
      const parsedToken = JSON.parse(token);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/lessons/files/${props.id}/`, {
          headers: {
            Authorization: `Bearer ${parsedToken.access}`,
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
        const unzip = async () => {
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(await res.blob());
          const toSave = [];
          for (const zobj of Object.values(zipContent.files)) {
            if (zobj.dir) continue;
            const zblob = await zobj.async("blob");
            const zfile = new File([zblob], zobj.name, {
              lastModified: zobj.date.getTime(),
              type: 'application/pdf'
            });
            toSave.push(zfile);
          }
          setFiles(toSave);
        }
        unzip();
      } catch (error) {
        console.error(error)
      }
    }
    const getLesson = async () => {
      const token = window.sessionStorage.getItem("jwt");

      if (!token) {
        router.replace('/') // If no token is found, redirect to login page
        return
      }
      const parsedToken = JSON.parse(token);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/lessons/${props.id}/`, {
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
            throw new Error('')
          }
        };
        const lesson = await res.json();
        props.editor.commands.setContent(lesson.html || "");
        lessonForm.setValues({ title: lesson.title });
        setLesson(lesson);
        if (lesson.has_files) {
          getFiles();
        } else {
          setFiles([])
        }
        setLoading(false);
      } catch (error) {
        console.error(error)
      }
    }

    getLesson();
  }, [pathname, searchParams])


  const sendFiles = async () => {
    if (files.length > 0) {
      const token = window.sessionStorage.getItem("jwt");

      if (!token) {
        router.replace('/') // If no token is found, redirect to login page
        return
      }

      const parsedToken = JSON.parse(token);
      // Validate the token by making an API call
      try {
        files.forEach(async (file: File) => {
          const formData = new FormData();
          formData.append('files', file);
          const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/lessons/files/${lesson?.id}/`, {
            headers: {
              Authorization: `Bearer ${parsedToken.access}`,
            },
            method: "PATCH",
            body: formData
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
          notifications.show({
            title: `Success`,
            message: `Files have been saved`,
            color: 'teal',
            icon: <IconCircleCheck />,
            autoClose: 5000,
          })
        })

      } catch (error) {
        console.error(error)
      }
    }
  }

  const sendContent = async (html: string) => {
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }

    const parsedToken = JSON.parse(token);
    // Validate the token by making an API call
    const title = lessonForm.getValues()
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/lessons/${lesson?.id}/`, {
        headers: {
          Authorization: `Bearer ${parsedToken.access}`,
          "Content-Type": "application/json",
        },
        method: "PATCH",
        body: JSON.stringify({ html: html, ...title })
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
      notifications.show({
        title: `Success`,
        message: `Content has been updated`,
        color: 'teal',
        icon: <IconCircleCheck />,
        autoClose: 5000,
      })
    } catch (error) {
      console.error(error)
    }
  }


  const deleteLesson = async () => {
    close();
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }

    const parsedToken = JSON.parse(token);
    // Validate the token by making an API call
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/lessons/${lesson?.id}/`, {
        headers: {
          Authorization: `Bearer ${parsedToken.access}`,
        },
        method: "DELETE"
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
        title: `Success`,
        message: `Lesson has been deleted`,
        color: 'teal',
        icon: <IconCircleCheck />,
        autoClose: 5000,
      })

      router.push(`/edit/${props.courseId}?selected=topic_${lesson?.topic_id}`)
    } catch (error) {
      console.error(error)
    }
  }


  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  }

  const previews = files.map((file, index) => {
    return (
      <Group gap={5} key={index} justify="space-between" align="flex-start">
        <UnstyledButton onClick={() => onDownload(file)}>
          <Group gap={3}>
            <IconFile />
            <Text key={index}>{file.name}</Text>
          </Group>

        </UnstyledButton>
        <ActionIcon onClick={() => removeFile(index)} color="red"><IconTrashX /></ActionIcon>
      </Group>
    )
  });

  const saveContent = async () => {
    await sendContent(props.editor!.getHTML());
    await sendFiles();
  }

  if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />


  return (
    <Suspense>
      <Modal opened={opened} onClose={close} title="Are you sure you want to delete this topic?">
        <Center pb={20}><Text c="red" fw={700}>This cannot be undone!</Text></Center>
        <Button size="sm"
          onClick={deleteLesson}
          color={"red"}
        >I want to delete</Button>

      </Modal>

      <Stack maw={900}>
        
        <TextInput {...lessonForm.getInputProps('title')} py={6} />
        <Divider />
        <Title pt={24} order={3}>Fill the content</Title>
        <RichTextEditor editor={props.editor} >
          <RichTextEditor.Toolbar sticky stickyOffset={60}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.Strikethrough />
              <RichTextEditor.ClearFormatting />
              <RichTextEditor.Highlight />
              <RichTextEditor.Code />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
              <RichTextEditor.H4 />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Blockquote />
              <RichTextEditor.Hr />
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
              <RichTextEditor.Subscript />
              <RichTextEditor.Superscript />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignJustify />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Undo />
              <RichTextEditor.Redo />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ColorPicker
              colors={[
                '#25262b',
                '#868e96',
                '#fa5252',
                '#e64980',
                '#be4bdb',
                '#7950f2',
                '#4c6ef5',
                '#228be6',
                '#15aabf',
                '#12b886',
                '#40c057',
                '#82c91e',
                '#fab005',
                '#fd7e14',
              ]}
            />

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Control interactive={false}>
                <IconColorPicker size={16} stroke={1.5} />
              </RichTextEditor.Control>
              <RichTextEditor.Color color="#F03E3E" />
              <RichTextEditor.Color color="#7048E8" />
              <RichTextEditor.Color color="#1098AD" />
              <RichTextEditor.Color color="#37B24D" />
              <RichTextEditor.Color color="#F59F00" />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.UnsetColor />


            <InsertYoutubeControl />
          </RichTextEditor.Toolbar>
          <RichTextEditor.Content />
        </RichTextEditor>

        <Text size="sm" fs="italic" pt={36} c="dimmed"> In case you want to append files</Text>
        <Dropzone mb={24} accept={PDF_MIME_TYPE} onDrop={setFiles}
          onReject={(files) => console.log('rejected files', files)}
          maxSize={5 * 1024 ** 2}
        >
          <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none', backgroundColor: 'var(--mantine-color-blue-light)' }}>
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
              <Text size="xl" inline>
                Drag PDF here or click to select files
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Attach as many files as you like, each file should not exceed 5mb
              </Text>
            </div>
          </Group>
        </Dropzone>

        <SimpleGrid cols={{ base: 1, sm: 1 }} mt={previews.length > 0 ? 'xl' : 0}>
          {previews}
        </SimpleGrid>



        <Group justify="flex-end">
          <ActionIcon onClick={open} variant="outline" color="red"><IconTrash /></ActionIcon>
          <Button w={'20%'} onClick={saveContent} my={24} variant="full">Save</Button>
        </Group>

      </Stack>
    </Suspense>
  );
}
