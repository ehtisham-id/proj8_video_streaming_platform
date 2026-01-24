import { useState } from 'react';
import { TextField, Button, Box, Paper, Typography } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const { saveToken } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post('/auth/login', { email, password });
            if (res.data && res.data.accessToken) {
                saveToken(res.data.accessToken);
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
                <Typography variant="h5" gutterBottom>Sign in</Typography>
                <form onSubmit={handleSubmit}>
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
                            {loading ? 'Signing...' : 'Sign in'}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
}
