'use client';

import React, {Usable, use} from "react";
import { AppShell,  LoadingOverlay,Center
 } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import { HeaderTabs } from "@/app/components/header/Header2";
import {  IconExclamationCircle } from '@tabler/icons-react';
import {Link } from '@mantine/tiptap';
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
import { useRouter, useSearchParams } from 'next/navigation';
import { CourseNavBar } from "@/app/components/navbars/CourseNavbar";
import TopicMain from "@/app/components/study/TopicMain";
import LessonMain from "@/app/components/study/LessonMain";
import { notifications } from "@mantine/notifications";
import { CourseEditData } from "@/app/types";


export default function StudyDetail({ params }: { params: Usable<{ id: string }> }) {
    const [opened, { toggle }] = useDisclosure();
    const usedparams: { id: string } = use(params);
    const courseId = usedparams.id;
    const router = useRouter()
    const searchParams = useSearchParams();
    const [course, setCourse] = React.useState<CourseEditData>();

    const [current, setCurrent] = React.useState<string>();
    const [topic, setTopic] = React.useState<number>();
    const [lesson, setLesson] = React.useState<number>();
    const [selected, setSelected] = React.useState(searchParams.get("selected") || "")

    const [isLoading, setLoading] = React.useState(true);
    

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
                const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/courses/${courseId}/`, {
                  headers: {
                    Authorization: `Bearer ${parsedToken.access}`,
                  },
                })
        
                if (!res.ok)  {
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
                    throw new Error('')};
                  }
                  
                const data = await res.json();
                setCourse(data);
                setLoading(false);
                if (searchParams.size > 0) {
                  const params = searchParams.get("selected")
                  if (params && params.includes("_")) {
                    const [component, id] = params.split("_")
                    if (component === "topic") {
                      setCurrent("topic");
                      setTopic(parseInt(id));
                      setSelected(params)
                    } else {
                      setCurrent("lesson");
                      setLesson(parseInt(id))
                      setSelected(params);
                    }
                  }
                } else {
                  setCurrent("topic")
                  const topic = data.topics[0];
                  if (topic){
                    setTopic(topic.id);
                    setSelected('topic_'+topic.id)
                  }
                }
                
              } catch (error) {
                console.error(error)
                
              }
            }
        
            getTags()
    }, [router, searchParams])

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
            Image,
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
          immediatelyRender: false,
          editable: false,
          content: '',
        });

      const onClickTitle = () => {
        router.push(`/courses/${courseId}`)
      }

      const clickTopic = (topicId: number) => {
        setTopic(topicId);
        setCurrent("topic");
      }
  
  
      const clickLesson = (topicId: number, lessonId: number) => {
        setLesson(lessonId);
        setCurrent("lesson");
      }
  

    if (isLoading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
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
            {course && <CourseNavBar selected={selected} course={course} onClickTitle={onClickTitle} onClickTopic={clickTopic} onClickLesson={clickLesson}/>}
            </AppShell.Navbar>
    

      <AppShell.Main>
        <Center>
        {current === "topic" && topic ? <TopicMain id={topic}/> : lesson && <LessonMain id={lesson} editor={editor!}/>}

        </Center>
    

      </AppShell.Main>
    </AppShell>
  );
}