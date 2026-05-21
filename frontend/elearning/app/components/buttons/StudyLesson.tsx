import React from "react";
import { Button } from "@mantine/core";
import classes from './StudyLesson.module.css';
import { selectIcon } from "../utils";

interface Lesson {
    id: string;
    selected: boolean;
    onClick: () => void;
    done?: boolean;
    deadline: Date;
    title: string;
}



export default function StudyLessonButton(props: Lesson) {
    const icon = selectIcon(props.done, props.deadline, classes.mainLinkIcon)

    return (

        <Button size={'xl'} color={props.selected ? 'indigo.2' : 'transparent'} className={classes.mainLink} key={props.id} onClick={props.onClick}>
            <div className={classes.mainLinkInner}>
            {icon}
            <span style={{fontSize: 12, lineHeight: 1.2, textAlign: 'start', wordWrap: 'break-word', textWrap: 'balance', flex: 4}}>{props.title}</span>
               
            </div>
        </Button>

    )
}