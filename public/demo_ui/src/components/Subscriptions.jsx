import { useEffect, useState } from 'react';
import { Paper, Typography, Button, Box } from '@mui/material';
import api from '../api';

export default function Subscriptions() {
    const [status, setStatus] = useState(null);

    async function fetchStatus() {
        try {
            const res = await api.get('/subscriptions/status');
            setStatus(res.data);
        } catch (err) {
            setStatus(null);
        }
    }

    useEffect(() => { fetchStatus(); }, []);

    async function start() {
        try {
            await api.post('/subscriptions/start');
            fetchStatus();
            alert('Subscription started');
        } catch (err) { alert('Failed: ' + (err.response?.data?.message || err.message)); }
    }

    async function cancel() {
        try {
            await api.post('/subscriptions/cancel');
            fetchStatus();
            alert('Canceled');
        } catch (err) { alert('Failed: ' + (err.response?.data?.message || err.message)); }
    }

    return (
        <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6">Subscription</Typography>
            <Box sx={{ mt: 2 }}>
                <Typography>Status: {status?.status ?? 'none'}</Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button variant="contained" onClick={start}>Start</Button>
                    <Button variant="outlined" color="error" onClick={cancel}>Cancel</Button>
                </Box>
            </Box>
        </Paper>
    );
}
