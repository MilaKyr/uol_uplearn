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
import { api } from '../actions/api';
import { IconExclamationCircle } from '@tabler/icons-react';

export function Authentication(props: {setAuth: (token: string) => void}) {
  const router = useRouter()
  const [type, toggle] = useToggle(['login', 'register']);
  const [role, setRole] = React.useState<string>();

  const form = useForm({
    mode: 'uncontrolled',
    onSubmitPreventDefault: 'always',
    initialValues: {
      email: '',
      first_name: '',
      last_name: '',
      password1: '',
      password2: '',
      role: '',
      token: ''
    },
    validateInputOnChange: true,
    validate: {
      role: (value) => (value == '' ? 'This field is required' : null),
      first_name: (value) => (value.length < 2 ? 'Name must have at least 2 letters' : null),
      last_name: (value) => (value.length < 2 ? 'Name must have at least 2 letters' : null),
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      password1: (val) => (val.length <= 8 ? 'Password should include at least 8 characters' : null),
      password2: (value, values) => value !== values.password1 ? 'Passwords are not the same' : null,
      token: (value, values) => value === '' && values.role === "teacher" ? "This field cannot be empty" : null,
    },
    transformValues: (values) => ({
      role: values.role.toLowerCase(),
      email: values.email,
      first_name: values.first_name,
      last_name: values.last_name,
      password1: values.password1,
      password2: values.password2,
      token: values.token,
    }),
  });

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    const values = form.getTransformedValues();
    const tosend = type === "register" ? values : { email: values.email, password: values.password1 };
    const response = await api.auth(`/api/${type}/`, JSON.stringify(tosend));
    if (response.access) {
      window.sessionStorage.setItem("jwt", JSON.stringify(response));
      notifications.show({
        title: "You're being logged in",
        message: "In a few seconds you'll be redirected to the home page",
        color: 'teal',
        loading: true,
      });
      props.setAuth(response.user.id)
      router.push(`/home/${response.user.id}`)
    } else {
      if (type === "register") {
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        Object.entries(response as { key: string; error: any }).forEach(([key, error]) => {
          form.setFieldError(key, error.join(" "));
        });
      } else {
         // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        const tmpErrors = Object.values(response).map((error: any) => {
          return error;
        });
        notifications.show({
          title: "Failed to login",
          message: tmpErrors.join(""),
          color: 'red',
          icon: <IconExclamationCircle />
        });
      }
    }
  }

  const toggleType = () => {
    form.clearErrors();
    toggle();
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

        <form onSubmit={submit}>
          <Stack>


            {type === 'register' && (
              <Select
                required
                label="I am a"
                placeholder="Pick your role"
                data={[{ value: 'student', label: 'Student' },
                { value: 'teacher', label: 'Teacher' }]}
                {...form.getInputProps('role')}
                onOptionSubmit={setRole}
              />
            )}

            {type === 'register' && role === "teacher" && (
              <TextInput
                required
                label="Token"
                placeholder="Your organisation's token"
                {...form.getInputProps('token')}
                radius="md"
              />
            )}

            {type === 'register' && (
              <TextInput
                required
                label="First Name"
                placeholder="Your name"
                {...form.getInputProps('first_name')}
                radius="md"
              />
            )}


            {type === 'register' && (
              <TextInput
                required
                label="Last Name"
                placeholder="Your last anme"
                {...form.getInputProps('last_name')}
                radius="md"
              />
            )}

            <TextInput
              required
              label="Email"
              placeholder="hello@uplearn.com"
              {...form.getInputProps('email')}
              error={form.errors.email && 'Invalid email'}
              radius="md"
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              {...form.getInputProps('password1')}
              // error={form.errors.password1 && 'Password should include at least 8 characters'}
              radius="md"
            />

            {type === 'register' && (
              <PasswordInput
                required
                label="Confirm Password"
                placeholder="Your password"
                {...form.getInputProps('password2')}
                error={form.errors.password2}
                radius="md"
              />
            )}
          </Stack>

          <Group justify="space-between" mt="xl">
            <Anchor component="button" type="button" c="dimmed" onClick={toggleType} size="xs" fw={700}>
              {type === 'register'
                ? "Already have an account? Login"
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