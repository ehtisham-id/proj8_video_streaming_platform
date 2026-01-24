import { useState } from 'react';
import { Box, Button, TextField, Paper, Typography } from '@mui/material';
import axios from 'axios';

export default function UploadForm({ token, onUploaded }) {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    async function submit(e) {
        e.preventDefault();
        if (!file) return setMsg('Please choose a video file');
        setLoading(true);
        setMsg(null);
        try {
            const fd = new FormData();
            fd.append('video', file);
            fd.append('title', title || file.name);

            const res = await axios.post('/videos/upload', fd, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            setMsg('Upload successful — processing will begin shortly.');
            setFile(null);
            setTitle('');
            onUploaded?.();
        } catch (err) {
            setMsg(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Paper sx={{ p: 2, mb: 3 }} elevation={3}>
            <Typography variant="h6" gutterBottom>Upload Video</Typography>
            <Box component="form" onSubmit={submit} sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    label="Title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    sx={{ flex: '1 1 300px' }}
                />

                <Button variant="outlined" component="label">
                    {file ? file.name : 'Choose Video'}
                    <input hidden type="file" accept="video/*" onChange={e => setFile(e.target.files[0])} />
                </Button>

                <Button type="submit" variant="contained" disabled={loading || !token}>
                    {loading ? 'Uploading...' : 'Upload'}
                </Button>
            </Box>
            {msg && <Typography sx={{ mt: 1 }}>{msg}</Typography>}
        </Paper>
    );
}
