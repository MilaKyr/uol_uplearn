import React from "react";
import { IconCircleCheckFilled, IconCircleDashedCheck, IconExclamationCircleFilled, IconCircleCheck } from "@tabler/icons-react";

const dateNames: string[] = ["days", "months", "years"];
const timeNames: string[] = ["days", "months", "years"];


export function printDuration(duration: string | undefined): string {

  if (duration === undefined) {
    return ''
  }
  const [duration_date, duration_time] = duration!.split(" ");
  let toReturn = ``;
  if (duration_date.includes(":")) {
    const date_splitted = duration_date.split(":");
    for (let i = date_splitted.length; i > 0; i--) {
      toReturn += " " + date_splitted[i] + dateNames[i];
    }

  } else {
    toReturn += " " + duration_date + " days";
  }
  if (duration_time !== "00:00:00") {
    const time_splitted = duration_time.split(":");
    for (let j = time_splitted.length; j > 0; j--) {
      toReturn += " " + time_splitted[j] + timeNames[j];
    }
  }

  return toReturn
};


export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export function selectIcon(done: boolean | undefined, deadline: Date, className?: string) {
  if (done === undefined || done === null) {
      return <IconCircleDashedCheck  size={20} className={className} stroke={1.5} />
  }

  if (done) {
      return <IconCircleCheckFilled color="green" size={20} className={className} stroke={1.5} />
  }

  const diff = deadline.valueOf()  - new Date().valueOf() ;
  if (deadline < new Date()) {
      return <IconExclamationCircleFilled color="orange" size={20} className={className} stroke={1.5} />
  } 

  if (Math.abs(Math.round(diff)/ (1000 * 60 * 60 * 24)) <= 2) {
      return <IconExclamationCircleFilled color="orange" size={20} className={className} stroke={1.5} />
  } 
  return <IconCircleCheck color="gray" size={20} className={className}  stroke={1.5} />
}
