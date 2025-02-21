'use client';

import React, { useCallback, Suspense } from 'react';
import {IconArrowBadgeRight } from '@tabler/icons-react';
import {Button,} from '@mantine/core';

import classes from './CourseNavBar.module.css';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CourseButton } from '../buttons/CourseButton';
import StudyLessonButton from '../buttons/StudyLesson';
import { CourseEditData, LessonStudyData } from '@/app/types';


interface CourseNavbarProps {
  course: CourseEditData;
  selected?: string;
  onClickTitle: () => void;
  onClickTopic: (topicId: number) => void;
  onClickLesson: (topicId: number, lessonId: number) => void;
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
    }
    
  }, [router, searchParams, pathname])


  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  );


  const handleTopicClick = (id: number) => {
    router.push(pathname + '?' + createQueryString('selected', `topic_${id}`));
    props.onClickTopic(id)
    setSelected(`topic_${id}`);
  }

  const handleLessonClick = (topicId: number, lessonId: number) => {
    router.push(pathname + '?' + createQueryString('selected', `lesson_${lessonId}`));
    props.onClickLesson(topicId, lessonId)
    setSelected(`lesson_${lessonId}`);
  }

  const titleClick = () => {
    router.push(pathname);
    props.onClickTitle();
  }

  return (
    <Suspense>
    <nav className={classes.navbar}>

      <div className={classes.section}>
        <CourseButton title={props.course?.title} photo={`data:image/jpeg;base64,${props.course?.photo}`} onClick={titleClick} />
      </div>


      <div className={classes.section}>
        <div className={classes.mainLinks}>
          {props.course?.topics.map((topic) => (

            <div key={topic.id} className={classes.mainLinks}>
              <Button color={selected === `topic_${topic.id}` ? 'indigo.2' : 'transparent'} key={topic.id} onClick={() => handleTopicClick(topic.id)} className={classes.mainLink}>
                <div className={classes.mainLinkInner}>
                  <IconArrowBadgeRight className={classes.mainLinkIcon} stroke={1.5} />
                  <span style={{ textDecorationLine: 'underline' }}>{topic.title}</span>
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
    </Suspense>
  );
}