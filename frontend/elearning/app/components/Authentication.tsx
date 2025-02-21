'use client';
import { FormEvent } from 'react'
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  Anchor,
  Button,
  Paper,
  PasswordInput,
  TextInput,
  Title,
  SimpleGrid,
  Image,
  Group,
  Stack,
  AspectRatio,
  Select,
} from '@mantine/core';
import { upperFirst, useToggle } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Auth } from '../types';

export function Authentication(props: {setAuth: (auth: Auth) => void}) {
  
  const router = useRouter()
  const [type, toggle] = useToggle(['login', 'register']);

  const form = useForm({
    initialValues: {
      email: '',
      first_name: '',
      last_name: '',
      password1: '',
      password2: '',
      role: ''
    },
    validateInputOnChange: true,
    validate: {
      first_name: (value) => (value.length < 2 ? 'Name must have at least 2 letters' : null),
      last_name: (value) => (value.length < 2 ? 'Name must have at least 2 letters' : null),
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      // password1: (val) => (val.length <= 8 ? 'Password should include at least 8 characters' : null),
      // password2: (value, values) => value !== values.password1 ? 'Passwords are not the same' : null,
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    

    const url = type === "register" ? `${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/register/` : `${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/login/`;
    const tosend = type === "register" ? form.values : { email: form.values.email, password: form.values.password1 };
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin":"*"
        },
        method: 'POST',

        body: JSON.stringify(tosend),
      });
      if (response.ok) {
        const token = await response.json();
        window.sessionStorage.setItem("jwt", JSON.stringify(token));
        notifications.show({
          title: "You're being logged in",
          message:  "In a few seconds you'll be redirected to the home page",
          color: 'teal',
          loading: true,
        });

        props.setAuth(token);
        console.log("set auth")
        router.push('/home')
      } else {
        const msg = await response.json()
        throw new Error(JSON.stringify({ code: response.status, message: msg }))
      }
    } catch (error) {
      console.log(error);
      notifications.show({
        autoClose: false,
        color: 'red',
        title: 'Failed to authenticate',
        message: 'Email or password is not correct',
      })
    }
  }


  return (
    <SimpleGrid
      style={{ alignSelf: 'center' }}
      maw={1200}
      cols={{ base: 1, sm: 1, lg: 2 }}
      spacing={{ base: 'xs', sm: 'sm', lg: 'md' }}
      verticalSpacing={{ base: 'md', sm: 'xl' }} >
      <Paper radius="" p="xl" withBorder >
        <Title order={2} ta="center" mt="md" mb={50}>
          {type === "register" ? "Start your journey here!" : "Welcome!"}
        </Title>

        <form onSubmit={handleSubmit}>
          <Stack>


            {type === 'register' && (
              <Select
                required
                label="I am a"
                placeholder="Pick your role"
                data={[{ value: 'student', label: 'Student' },
                { value: 'teacher', label: 'Teacher' }]}
                {...form.getInputProps('role')}
              />
            )}

            {type === 'register' && (
              <TextInput
                required
                label="First Name"
                placeholder="Your name"
                value={form.values.first_name}
                onChange={(event) => form.setFieldValue('first_name', event.currentTarget.value)}
                radius="md"
              />
            )}


            {type === 'register' && (
              <TextInput
                required
                label="Last Name"
                placeholder="Your last anme"
                value={form.values.last_name}
                onChange={(event) => form.setFieldValue('last_name', event.currentTarget.value)}
                radius="md"
              />
            )}

            <TextInput
              required
              label="Email"
              placeholder="hello@uplearn.com"
              value={form.values.email}
              onChange={(event) => form.setFieldValue('email', event.currentTarget.value)}
              error={form.errors.email && 'Invalid email'}
              radius="md"
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              value={form.values.password1}
              onChange={(event) => form.setFieldValue('password1', event.currentTarget.value)}
              // error={form.errors.password1 && 'Password should include at least 8 characters'}
              radius="md"
            />

            {type === 'register' && (
              <PasswordInput
                required
                label="Confirm Password"
                placeholder="Your password"
                value={form.values.password2}
                onChange={(event) => form.setFieldValue('password2', event.currentTarget.value)}
                error={form.errors.password2}
                radius="md"
              />
            )}
          </Stack>

          <Group justify="space-between" mt="xl">
            <Anchor component="button" type="button" c="dimmed" onClick={() => toggle()} size="xs">
              {type === 'register'
                ? 'Already have an account? Login'
                : "Don't have an account? Register"}
            </Anchor>
            <Button type="submit" radius="xl">
              {upperFirst(type)}
            </Button>
          </Group>
        </form>
      </Paper>
      <AspectRatio ratio={type === "register" ? 1 : 1080 / 720} maw={type === 'register' ? 600 : 600} mx="auto">
        <Image
          src={type === 'register' ? "/rb_2148508675.png" : '/e-learning-education-process-training-application-mobile-app-development-courses-mobile-apps-online-courses-become-mobile-developer-concept-b.png'} />
      </AspectRatio>

    </SimpleGrid>
  );
}