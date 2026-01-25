import { useEffect, useState } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import api from '../api';

export default function HealthMetrics() {
    const [health, setHealth] = useState(null);
    const [metrics, setMetrics] = useState(null);

    async function fetchHealth() {
        try {
            const res = await api.get('/health');
            setHealth(res.data);
        } catch (err) {
            setHealth(null);
        }
    }

    async function fetchMetrics() {
        try {
            const res = await api.get('/metrics/streaming');
            setMetrics(res.data);
        } catch (err) {
            setMetrics(null);
        }
    }

    useEffect(() => { fetchHealth(); fetchMetrics(); }, []);

    return (
        <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6">System Health & Metrics</Typography>
            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Health</Typography>
                <pre>{JSON.stringify(health, null, 2)}</pre>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Streaming Metrics</Typography>
                <pre>{JSON.stringify(metrics, null, 2)}</pre>
            </Box>
        </Paper>
    );
}
