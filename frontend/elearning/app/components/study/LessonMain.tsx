'use client';

import React from "react";
import { Group, Title, UnstyledButton, Stack, Text, LoadingOverlay, Button, Divider, } from "@mantine/core";
import JSZip from 'jszip';
import { IconExclamationCircle, IconFile, } from '@tabler/icons-react';
import { RichTextEditor } from '@mantine/tiptap';
import { FileWithPath } from '@mantine/dropzone';
import { useRouter } from 'next/navigation';
import { notifications } from "@mantine/notifications";
import { Editor } from "@tiptap/react";
import { LessonStudyData } from "@/app/types";

export default function LessonMain(props: { id: number, editor: Editor }) {
  const id = props.id;

  const [files, setFiles] = React.useState<FileWithPath[]>([]);
  const [lesson, setLesson] = React.useState<LessonStudyData>();
  const router = useRouter();
  const [isLoading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const getFiles = async () => {
      const token = window.sessionStorage.getItem("jwt");

      if (!token) {
        router.replace('/') // If no token is found, redirect to login page
        return
      }
      const parsedToken = JSON.parse(token);
      try {
        let res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/lessons/${id}/files`, {
          headers: {
            Authorization: `Bearer ${parsedToken.access}`,
          },
        });
        if (!res.ok) throw new Error('');
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
        props.editor.commands.setContent(lesson.html || "")
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

  }, [id])


  const previews = files.map((file, index) => {
    return (
      <Group gap={5} key={index} justify="space-between" align="flex-start">
        <UnstyledButton onClick={() => onDownload(file)}>
          <Group gap={3}>
            <IconFile />
            <Text key={index}>{file.name}</Text>
          </Group>

        </UnstyledButton>
      </Group>
    )
  });


  const onDownload = (file: any) => {
    const link = document.createElement("a");
    const fileUrl = URL.createObjectURL(file);
    link.download = file.name;
    link.href = fileUrl;
    link.click();
  };

  const makeDone = async () => {
    const token = window.sessionStorage.getItem("jwt");

    if (!token) {
      router.replace('/') // If no token is found, redirect to login page
      return
    }
    const parsedToken = JSON.parse(token);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/lessons/${props.id}/done`, {
        headers: {
          Authorization: `Bearer ${parsedToken.access}`,
          "Content-Type": "application/json"
        },
        method: "POST"
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
      const updatedLesson: LessonStudyData = Object.assign({}, lesson);
      updatedLesson.done = !lesson?.done;
      
      setLesson(updatedLesson);
    } catch (error) {
      console.error(error)
    }
    router.refresh();
  }



  if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
  return (
    <Stack>
      <Title>{lesson?.title}</Title>
      <Divider />
      <RichTextEditor editor={props.editor} >
        <RichTextEditor.Content />
      </RichTextEditor>


      {files.length > 0 && (
        <>
          <Text size="sm" fs="italic" pt={36} c="dimmed"> Additional files</Text> {previews}
        </>
      )
      }


      <Group justify="flex-end">
        <Button disabled={lesson?.done} onClick={makeDone} my={24} variant="full">Done</Button>
      </Group>

    </Stack>

  );
}
