import { useState, useEffect } from 'react';

export function useAuth() {
    const [token, setToken] = useState(() => localStorage.getItem('token'));

    useEffect(() => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
    }, [token]);

    function saveToken(t) {
        setToken(t);
    }

    function logout() {
        setToken(null);
        localStorage.removeItem('token');
    }

    return { token, saveToken, logout };
}

export default useAuth;
