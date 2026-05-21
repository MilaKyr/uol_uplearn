'use client';

import React, { useCallback } from 'react';
import {IconArrowBadgeRight } from '@tabler/icons-react';
import {Button, ScrollArea,} from '@mantine/core';

import classes from './CourseNavBar.module.css';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CourseButton } from '../buttons/CourseButton';
import StudyLessonButton from '../buttons/StudyLesson';
import { CourseEditData, LessonStudyData } from '@/app/types';


interface CourseNavbarProps {
  course: CourseEditData;
  selected?: string;
  onClickTitle: () => void;
  onClickTopic: (topicId: string) => void;
  onClickLesson: (topicId: string, lessonId: string) => void;
}



export function CourseNavBar(props: CourseNavbarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [selected, setSelected] = React.useState(props?.selected);

  React.useEffect(() => {
    if (searchParams.size > 0) {
      const params = searchParams.get("selected");
      if (params) {
        setSelected(params);
      }
    } else {
      setSelected(props?.selected);
    }
  }, [searchParams, pathname])


  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  );


  const handleTopicClick = (id: string) => {
    router.push(pathname + '?' + createQueryString('selected', `topic_${id}`));
    props.onClickTopic(id)
    setSelected(`topic_${id}`);
  }

  const handleLessonClick = (topicId: string, lessonId: string) => {
    router.push(pathname + '?' + createQueryString('selected', `lesson_${lessonId}`));
    props.onClickLesson(topicId, lessonId)
    setSelected(`lesson_${lessonId}`);
  }

  const titleClick = () => {
    router.push(pathname);
    props.onClickTitle();
    setSelected("main")
  }

  return (
  <ScrollArea type="never" >
    <nav className={classes.navbar}>

      <div className={classes.section}>
        <CourseButton title={props.course?.title} photo={`${props.course?.photo}`} onClick={titleClick} />
      </div>

      
      <div className={classes.section}>
        <div className={classes.mainLinks}>
         
          {props.course && props.course?.topics.map((topic) => (

            <div key={topic.id} className={classes.mainLinks}>
              <Button size={'xl'}  color={selected === `topic_${topic.id}` ? 'indigo.2' : 'transparent'} key={topic.id} 
              onClick={() => handleTopicClick(topic.id)} className={classes.mainLink}>
                <div className={classes.mainLinkInner}>
                  <IconArrowBadgeRight className={classes.mainLinkIcon} stroke={1.5} />
                  <span style={{textAlign: 'start', wordWrap: 'break-word',
                    fontSize: 14,
                    lineHeight: 1.3,
                    textWrap: 'balance', flex: 4, textDecorationLine: 'underline'}}>{topic.title}</span>
                </div>
              </Button>

              <div className={classes.mainLinks}>
                {topic.lessons.map((lesson: LessonStudyData) => (
                  <StudyLessonButton key={lesson.id} id={lesson.id} done={lesson.done} title={lesson.title}
                    deadline={new Date(lesson.deadline)} selected={selected === `lesson_${lesson.id}`} onClick={() => handleLessonClick(topic.id, lesson.id)} />
                ))}
              </div>
            </div>
          ))}
     
        </div>
      </div>
      
    </nav>
    </ScrollArea>
  );
}