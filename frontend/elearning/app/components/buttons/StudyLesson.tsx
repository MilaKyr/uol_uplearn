import React from "react";
import { Button } from "@mantine/core";
import classes from './StudyLesson.module.css';
import { selectIcon } from "../utils";

interface Lesson {
    id: number;
    selected: boolean;
    onClick: () => void;
    done?: boolean;
    deadline: Date;
    title: string;
}



export default function StudyLessonButton(props: Lesson) {
    const icon = selectIcon(props.done, props.deadline, classes.mainLinkIcon)

    return (

        <Button color={props.selected ? 'indigo.2' : 'transparent'} className={classes.mainLink} key={props.id} onClick={props.onClick}>
            <div className={classes.mainLinkInner}>
                {icon}
                <span>{props.title}</span>
            </div>
        </Button>

    )
}