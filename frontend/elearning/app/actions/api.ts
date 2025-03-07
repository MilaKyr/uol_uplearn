import { getToken, removeToken } from "./getAuth";

export const api = {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  get: async function (url: string): Promise<any> {
    const token = getToken()
    return new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      })
      .then(response => response.json().then(data => ({
        data: data, status: response.status
      })))
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        reject(error);
      })
    })
  },

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  delete: async function (url: string): Promise<any> {
    const token = getToken()
    return new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        method: "DELETE"
      })
      .then(response => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        reject(error);
      })
    })
  },

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  post: async function (url: string, data: any): Promise<any> {
    const token = getToken()
    return new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        method: "POST",
        body: data
      })
      .then(response => response.json().then(data => ({
        data: data, status: response.status
      })))
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      })
    })
  },
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  auth: async function (url: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${url}`, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        method: "POST",
        body: data
      })
      .then(response => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        reject(error);
      })
    })
  },
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  logout: async function (): Promise<any> {
    const token = getToken()
    return new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}/api/logout/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        method: "POST",
      })
      .then(response => response.json())
      .then((json) => {
        removeToken();
        resolve(json);
      })
      .catch((error) => {
        reject(error);
      })
    })
  },
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
  put: async function (url: string, data: any): Promise<any> {
    const token = getToken()
    return new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        method: "PUT",
        body: data
      })
      .then(response => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        reject(error);
      })
    })
  },
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  putPhoto: async function (url: string, data: any): Promise<any> {
    const token = getToken()
    return new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Access-Control-Allow-Origin": "*"
        },
        method: "PUT",
        body: data
      })
      .then(response => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        reject(error);
      })
    })
  },
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
  patch: async function (url: string, data: any): Promise<any> {
    const token = getToken()
    return new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_HTTP_ADDRESS}${url}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        method: "PATCH",
        body: data
      })
      .then(response => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        reject(error);
      })
    })
  }
}
