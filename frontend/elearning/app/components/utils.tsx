import { IconCircleCheckFilled, IconCircleDashedCheck, IconExclamationCircleFilled, IconCircleCheck } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { notifications } from '@mantine/notifications';
import { IconExclamationCircle } from "@tabler/icons-react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const dateNames: string[] = ["days", "months", "years"];
const timeNames: string[] = ["days", "months", "years"];


export function printDuration(duration: string | undefined): string {

  if (duration === undefined) {
    return ''
  }
  let [duration_date, duration_time] = duration!.split(" ");
  console.log(duration_time)
  let toReturn = ``;
  if (duration_date.includes(":")) {
    let date_splitted = duration_date.split(":");
    for (var i = date_splitted.length; i > 0; i--) {
      toReturn += " " + date_splitted[i] + dateNames[i];
    }

  } else {
    toReturn += " " + duration_date + " days";
  }
  if (duration_time !== "00:00:00") {
    let time_splitted = duration_time.split(":");
    for (var j = time_splitted.length; j > 0; j--) {
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

  let diff = deadline.valueOf()  - new Date().valueOf() ;
  if (deadline < new Date()) {
      return <IconExclamationCircleFilled color="orange" size={20} className={className} stroke={1.5} />
  } 

  if (Math.abs(Math.round(diff)/ (1000 * 60 * 60 * 24)) <= 2) {
      return <IconExclamationCircleFilled color="orange" size={20} className={className} stroke={1.5} />
  } 
  return <IconCircleCheck color="gray" size={20} className={className}  stroke={1.5} />
}
