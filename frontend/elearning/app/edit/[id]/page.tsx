'use client';

import React, {Usable, use } from "react";
import { AppShell, Stack, Center, LoadingOverlay,
 } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { HeaderTabs } from "@/app/components/header/Header2";
import { Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import { Color } from '@tiptap/extension-color';
import TextStyle from "@tiptap/extension-text-style";
import Image from '@tiptap/extension-image';
import FileHandler from '@tiptap-pro/extension-file-handler'
import Youtube from '@tiptap/extension-youtube';
import { useRouter } from 'next/navigation';
import CourseMain from "@/app/components/edit/CourseMain";
import TopicMain from "@/app/components/edit/TopicMain";
import LessonMain from "@/app/components/edit/LessonMain";
import ImageResize from 'tiptap-extension-resize-image';
import { CourseNavBar } from "@/app/components/navbars/CourseNavbar";
import { CourseEditData, TopicProps, LessonEditData } from "@/app/types";


const contentPlaceholder: string = '<em>Just start adding your content here. To add an image drag and drop it where you want it to be... That`s all, now you can delete this text and start creating.</em>';

export default function CourseEdit({ params }: { params: Usable<{ id: string }> }) {
  const router = useRouter();
    const usedparams: { id: string } = use(params);
    const newCourseId = usedparams.id;
    const [course, setCourse] = React.useState<CourseEditData>();
    const [topic, setTopic] = React.useState<TopicProps>();
    const [lesson, setLesson] = React.useState<LessonEditData>();
    const [opened, { toggle }] = useDisclosure();
    const [current, setCurrent] = React.useState<string>();

    const editor = useEditor({
          extensions: [
            StarterKit,
            Underline,
            Link,
            Superscript,
            SubScript,
            Highlight,
            TextStyle,
            Color,
            ImageResize,
            Image.configure({ inline: true , allowBase64: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Youtube.configure({
              controls: false,
              nocookie: true,
            }),
            FileHandler.configure({
              allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'],
              onDrop: (currentEditor, files, pos) => {
                files.forEach(file => {
                  const fileReader = new FileReader()
      
                  fileReader.readAsDataURL(file)
                  fileReader.onload = () => {
                    currentEditor.chain().insertContentAt(pos, {
                      type: 'image',
                      attrs: {
                        src: fileReader.result,
                      },
                    }).focus().run()
                  }
                })
              },
              onPaste: (currentEditor, files, htmlContent) => {
                files.forEach(file => {
                  if (htmlContent) {
                    // if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
                    // you could extract the pasted file from this url string and upload it to a server for example
                    console.log(htmlContent) // eslint-disable-line no-console
                    return false
                  }
      
                  const fileReader = new FileReader()
                  fileReader.readAsDataURL(file)
                  fileReader.onload = () => {
                    currentEditor?.chain().insertContentAt(currentEditor.state.selection.anchor, {
                      type: 'image',
                      attrs: {
                        src: fileReader.result,
                      },
                    }).focus().run()
                  }
                })
              },
            }),
          ],
          content: contentPlaceholder,
        });

    React.useEffect(() => {
            const token = window.sessionStorage.getItem("jwt");
        
            if (!token) {
              router.replace('/') // If no token is found, redirect to login page
              return
            }
        
            const parsedToken = JSON.parse(token);
            // Validate the token by making an API call
            const getCourse = async () => {
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/${newCourseId}/edit`, {
                  headers: {
                    Authorization: `Bearer ${parsedToken.access}`,
                  },
                })
                if (!res.ok) throw new Error('');
                const data = await res.json();
                // const res2 = await fetch(`http://127.0.0.1:8000/api/courses/${newCourseId}/photo`, {
                //   headers: {
                //     Authorization: `Bearer ${parsedToken.access}`,
                //   },
                // })
                // if (res2.status === 200) {
                //   let photo =  await res2.blob();
                //   data.photo = URL.createObjectURL(photo);
                // }
                if (!res.ok) throw new Error('');
                setCourse(data);
                setCurrent("main")
              } catch (error) {
                console.error(error)
                router.replace('/') // Redirect to login if token validation fails
              }
            }
        
            getCourse()
    }, [router])

    
    const clickTopic = (topicId: number) => {
      let selected: TopicProps;
      course?.topics.map((topic) => {
        if (topic.id === topicId) {
          selected = topic;
        }
        setTopic(selected);
        setCurrent("topic");
      })
    }


    const clickLesson = (topicId: number, lessonId: number) => {
      let selected: LessonEditData;
      course?.topics.map((topic) => {
        if (topic.id === topicId) {
          topic.lessons.map((lesson) => {
            if (lesson.id === lessonId) {
              selected = lesson;
            }
          }) 
          
        }
        setLesson(selected);
        if (selected.html === null) {
          editor?.commands.setContent(contentPlaceholder)
        } else {
          editor?.commands.setContent(selected.html);
        }
        setCurrent("lesson");
      })
    }

    return (
    <AppShell

    header={{ height: 70 }}
    navbar={{
      width: 300,
      breakpoint: 'sm',
      collapsed: { mobile: !opened },
    }}
    padding="md"
    >
      <AppShell.Header>
      <HeaderTabs opened={opened} toggle={toggle}/>
      </AppShell.Header>

      <AppShell.Navbar>
        <CourseNavBar selected={current} course={course!} onClickTitle={() => setCurrent("main")} onClickTopic={clickTopic} onClickLesson={clickLesson}/>
        </AppShell.Navbar>

      <AppShell.Main>
        <Center>
        <Stack w={900}>

        
        
        {
          current === "main" ? <CourseMain course={course!} /> : 
          current === "topic" ? <TopicMain topic={topic!}/> : 
          (current === "lesson" && editor) ? <LessonMain lesson={lesson!} editor={editor}/> : 
          <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
        }
      </Stack>
      </Center>

      </AppShell.Main>
    </AppShell>
  );
}

