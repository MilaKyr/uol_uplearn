import React from 'react';
import Link from 'next/link';
import { Group, Text, Button } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { getUser } from '@/app/actions/getAuth';

export function SearchCourses() {
    const user = getUser();
    return (
        <Group justify="center">
            <Button component={Link} href={{ pathname: `/home/${user.id}`, 
                query: { selected: 'courses' } }} w={'50%'} variant="outline" color="teal" >
                <Group align="flex-start" gap={10}>
                    <IconSearch />
                    <Text>Search for courses!</Text>
                </Group>

            </Button>
        </Group>
    );
}