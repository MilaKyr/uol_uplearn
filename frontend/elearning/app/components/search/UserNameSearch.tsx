import React from "react";
import { Group, ScrollArea, Stack, TextInput, Code, ActionIcon, Select, Combobox, useCombobox, Avatar, Text, InputBase} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useForm, hasLength, isEmail, matchesField, isNotEmpty } from '@mantine/form';
import { usePathname, useRouter } from 'next/navigation';
import { propagateServerField } from "next/dist/server/lib/render-server";
import { getHotkeyHandler } from '@mantine/hooks';
import { createConversation } from "@/app/actions/CreateConversation";
import { BasicUserData } from "@/app/types";

export default function UserNameSearch() {
    const router = useRouter();
    const [searchValue, setSearchValue] = React.useState('');
    const [searchedUser, setSearchedUser] = React.useState();
    const [users, setUsers] = React.useState<BasicUserData []>([]);
    
    const combobox = useCombobox({
      onDropdownClose: () => combobox.resetSelectedOption(),
      onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
    });


    const search = async () => {
        const token = window.sessionStorage.getItem("jwt");
          
              if (!token) {
                router.replace('/') // If no token is found, redirect to login page
                return
              }
          
              let parsedToken = JSON.parse(token);
              // Validate the token by making an API call
              try {
                  const res = await fetch('http://127.0.0.1:8000/api/users/search?' + new URLSearchParams(`query=${searchValue}`).toString(), {
                    headers: {
                      Authorization: `Bearer ${parsedToken.access}`,
                      "Content-Type": "application/json"
                    },
                    method: "GET",
                  })
          
                  if (!res.ok) throw new Error('');
                  let newUsers = await res.json();
                  setUsers(newUsers);
                } catch (error) {
                  console.error(error)
                  router.replace('/') // Redirect to login if token validation fails
                }
    }

    const handleCLick = async (optionId: number) => {
      let selected: BasicUserData = users[optionId]
      if (selected && selected.id) {
        await createConversation(router, selected.id);
        window.location.reload();
      }
      
    }
    return (
      <Stack style={{paddingTop: 12, paddingBottom: 12}}>
        <Combobox
        onOptionSubmit={(optionValue) => {
          handleCLick(parseInt(optionValue))
        combobox.closeDropdown();
      }}
      store={combobox}
    >
     <Combobox.Target>
        <InputBase
         rightSection={<Combobox.Chevron />}
         rightSectionPointerEvents="none"
         placeholder="Search by person's name"
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.currentTarget.value);
            combobox.openDropdown();
          }}
          onKeyDown={getHotkeyHandler([['Enter', search],
          ])}
          onClick={(val) => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearchValue(searchValue || '');
          }}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
        <ScrollArea.Autosize type="scroll" mah={200}>
          {users.length === 0 ? <Combobox.Empty>Nothing found</Combobox.Empty> : (
            users.map((user, index) => (
              <Combobox.Option value={`${index}`} key={index}>
                <Group>
                  <Avatar src={`data:image/jpeg;base64,${user.photo}`}radius="xl" />
                <Text>{user.first_name} {user.last_name}</Text>
                </Group>
                
              </Combobox.Option>
            ))
          )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>

    </Combobox>
      </Stack>
    )
}

