import { useState, useEffect } from 'react';
import { TextField, Button, Box, Paper, Typography } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export default function Login({ showSignup: initialSignup }) {
    const { saveToken } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSignup, setIsSignup] = useState(false);

    useEffect(() => {
        if (typeof initialSignup !== 'undefined') setIsSignup(initialSignup);
    }, [initialSignup]);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isSignup) {
                const res = await axios.post('/auth/register', { name, email, password });
                if (res.data && res.data.accessToken) {
                    saveToken(res.data.accessToken);
                }
            } else {
                const res = await axios.post('/auth/login', { email, password });
                if (res.data && res.data.accessToken) {
                    saveToken(res.data.accessToken);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box sx={{ mt: 6 }}>
            <Paper sx={{ p: 4, maxWidth: 520, margin: '0 auto' }} elevation={6}>
                <Typography variant="h5" gutterBottom>{isSignup ? 'Sign up' : 'Sign in'}</Typography>
                <form onSubmit={handleSubmit}>
                    {isSignup && (
                        <TextField
                            label="Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                        />
                    )}
                    <TextField
                        label="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        type="password"
                        fullWidth
                        margin="normal"
                        required
                    />
                    {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
                    <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                        <Button type="submit" variant="contained" disabled={loading}>
                            {loading ? (isSignup ? 'Signing up...' : 'Signing...') : (isSignup ? 'Sign up' : 'Sign in')}
                        </Button>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                            {isSignup ? 'Already have an account?' : "Don't have an account?"}
                        </Typography>
                        <Button onClick={() => setIsSignup(s => !s)}>{isSignup ? 'Sign in' : 'Sign up'}</Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
}
