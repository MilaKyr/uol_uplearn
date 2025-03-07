'use client';

export const getToken = () => {
    if (typeof window !== 'undefined') {
        const token = window.sessionStorage.getItem("jwt");
        if (token) {
            return JSON.parse(token).access
       }
    }
    return null
}

export const getUser = () => {
    if (typeof window !== 'undefined') {
        const token = window.sessionStorage.getItem("jwt");
        if (token) {
            return JSON.parse(token).user
       }
    }
    return null
}

export const removeToken = () => {
    if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem("jwt");
    }
}