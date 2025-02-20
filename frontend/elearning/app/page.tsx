'use client';

import { useDisclosure } from "@mantine/hooks";
import styles from "./page.module.css";
import { Authentication } from "./components/Authentication";
import { Header } from "./components/header/Header";

export default function Home() {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    
      <main className={styles.main}>
        <Header opened={opened} toggle={toggle}/>
        <Authentication/>
      </main>
      
  );
}
