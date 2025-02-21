import React, { useCallback } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import { Calendar } from '@mantine/dates';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifications } from "@mantine/notifications";
import { IconExclamationCircle } from "@tabler/icons-react";
import { TodoData } from '@/app/types';

function getDay(date: Date) {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
}

function startOfWeek(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - getDay(date) - 1);
}

function endOfWeek(date: Date) {
    return dayjs(new Date(date.getFullYear(), date.getMonth(), date.getDate() + (6 - getDay(date))))
        .endOf('date')
        .toDate();
}

function isInWeekRange(date: Date, value: Date | null) {
    return value
        ? dayjs(date).isBefore(endOfWeek(value)) && dayjs(date).isAfter(startOfWeek(value))
        : false;
}


export default function WeeklyCalendar(props: { userId: number | undefined, onClick: (data: TodoData[]) => void }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [hovered, setHovered] = React.useState<Date | null>(null);
    const [value, setValue] = React.useState<Date | null>(null);

    const getUrl = (date: Date | null) => {
        const onejan = new Date(date!.getFullYear(), 0, 1);
        const week = Math.ceil((((date!.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
        return `${process.env.HTTP_ADDRESS}/api/students/${props.userId}/todo_for` + '?' + createQueryString(
            'month', `${date?.getMonth()}`,) + '&' + createQueryString(
                'week', `${week}`) + '&' + createQueryString(
                    'year', `${date?.getFullYear()}`)
    }

    const getTodo = async (date: Date | null) => {
        const token = window.sessionStorage.getItem("jwt");

        if (!token) {
            router.replace('/') // If no token is found, redirect to login page
            return
        }

        const parsedToken = JSON.parse(token);
        // Validate the token by making an API call


        try {
            const res = await fetch(getUrl(date), {
                headers: {
                    Authorization: `Bearer ${parsedToken.access}`,
                    "Content-Type": "application/json"
                },

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
            const data: TodoData[] = await res.json();
            props.onClick(data)
        } catch (error) {
            console.error(error)
            router.replace('/') // Redirect to login if token validation fails
        }
    }

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set(name, value)

            return params.toString()
        },
        [searchParams]
    );

    const onClick = async (date: Date | null) => {
        setValue(date);
        getTodo(date);
    }
    return (
        <Calendar
            size="lg"
            withCellSpacing={false}
            getDayProps={(date) => {
                const isHovered = isInWeekRange(date, hovered);
                const isSelected = isInWeekRange(date, value);
                const isInRange = isHovered || isSelected;
                return {
                    onMouseEnter: () => setHovered(date),
                    onMouseLeave: () => setHovered(null),
                    inRange: isInRange,
                    firstInRange: isInRange && date.getDay() === 1,
                    lastInRange: isInRange && date.getDay() === 0,
                    selected: isSelected,
                    onClick: () => onClick(date)
                };
            }}
        />
    )
}

