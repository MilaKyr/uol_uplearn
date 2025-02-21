'use client';

import React, {Suspense} from "react";
import { useDisclosure } from "@mantine/hooks";
import styles from "./page.module.css";
import { Authentication } from "./components/Authentication";
import { Header } from "./components/header/Header";
import UserDashboard from "./home/page";
import { Auth } from "./types";


export default function Home() {
  const [opened, { toggle }] = useDisclosure(false);
  const [auth, setAuth] = React.useState<Auth>();  


  return (
    <Suspense>
      <main className={styles.main}>
        <Header opened={opened} toggle={toggle}/>
        {auth ? <UserDashboard /> : <Authentication setAuth={setAuth}/> }
      </main>
    </Suspense>
  );
}
