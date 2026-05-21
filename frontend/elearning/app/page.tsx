'use client';

import React from "react";
import { useDisclosure } from "@mantine/hooks";
import styles from "./page.module.css";
import { Authentication } from "./components/Authentication";
import { Header } from "./components/header/Header";
import UserDashboardSuspensed from "./home/[id]/page";

export default function Home() {
  const [opened, { toggle }] = useDisclosure(false);
  const [auth, setAuth] = React.useState<string>();

  return (
    <main className={styles.main}>
      <Header opened={opened} toggle={toggle} />
     {auth ? <UserDashboardSuspensed /> : <Authentication setAuth={setAuth} /> }
    </main>
  )
}
