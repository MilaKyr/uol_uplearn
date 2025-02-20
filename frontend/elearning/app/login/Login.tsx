'use client';
import { useToggle } from '@mantine/hooks';
import {
    Anchor,
    Button,
    Checkbox,
    Paper,
    PasswordInput,
    Text,
    TextInput,
    Title,
    SimpleGrid,
    Image,
  } from '@mantine/core';
  import classes from './Login.module.css';
  
  export function Authentication() {

    const [type, toggle] = useToggle(['login', 'register']);

    return (
      <SimpleGrid cols={2}>
        <div>
        <Paper className={classes.form} radius={0} p={30}>
          <Title order={2} className={classes.title} ta="center" mt="md" mb={50}>
            Welcome to Uplearn!
          </Title>
  
          <TextInput label="Email address" placeholder="hello@gmail.com" size="md" />
          <PasswordInput label="Password" placeholder="Your password" mt="md" size="md" />
          <Checkbox label="Keep me logged in" mt="xl" size="md" />
          <Button fullWidth mt="xl" size="md">
            Login
          </Button>
  
          <Text ta="center" mt="md">
            Don&apos;t have an account?{' '}
            <Anchor<'a'> href="#" fw={700}>
              Register
            </Anchor>
          </Text>
        </Paper>
        </div>
        <div>
        <Image 
        h={450}
        src="/undraw_online-learning_tgmv.png"/>
        </div>
        
        </SimpleGrid>
    );
  }