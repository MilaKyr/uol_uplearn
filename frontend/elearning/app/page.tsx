'use client';

import React from "react";
import { useDisclosure } from "@mantine/hooks";
import styles from "./page.module.css";
import { Authentication } from "./components/Authentication";
import { Header } from "./components/header/Header";
import UserDashboardSuspensed from "./home/page";
import { Auth } from "./types";

export default function Home() {
  const [opened, { toggle }] = useDisclosure(false);
  const [auth, setAuth] = React.useState<Auth>();

  return (
    <main className={styles.main}>
      <Header opened={opened} toggle={toggle} />
     {auth ? <UserDashboardSuspensed /> : <Authentication setAuth={setAuth} /> }
    </main>
  )
}
