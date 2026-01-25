import { useEffect, useState } from 'react';
import { Paper, Typography, TextField, Button, Box } from '@mui/material';
import api from '../api';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');

    async function fetchProfile() {
        setLoading(true);
        try {
            const res = await api.get('/users/me');
            setProfile(res.data);
            setName(res.data?.name || '');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchProfile(); }, []);

    async function save() {
        try {
            await api.patch('/users/me', { name });
            fetchProfile();
            alert('Saved');
        } catch (err) {
            alert('Save failed: ' + (err.response?.data?.message || err.message));
        }
    }

    return (
        <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6">Profile</Typography>
            {!profile && <Typography>Loading...</Typography>}
            {profile && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Email" value={profile.email} disabled />
                    <TextField label="Name" value={name} onChange={e => setName(e.target.value)} />
                    <Button variant="contained" onClick={save}>Save</Button>
                </Box>
            )}
        </Paper>
    );
}
