import { useEffect, useState } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import axios from 'axios';

export default function VideoList({ token, onPlay }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);

    async function fetchVideos() {
        setLoading(true);
        try {
            const res = await axios.get('/videos');
            setVideos(res.data || []);
        } catch (err) {
            console.error('Could not load videos', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchVideos();
    }, []);

    async function handlePlay(id) {
        try {
            const res = await axios.get(`/videos/${id}`);
            if (res.data && res.data.playable && res.data.url) {
                onPlay({ id, title: res.data.title, url: res.data.url });
            } else {
                alert('Video not ready yet — processing in background.');
            }
        } catch (err) {
            alert('Failed to fetch video: ' + (err.response?.data?.message || err.message));
        }
    }

    return (
        <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>Available Videos</Typography>
            <List>
                {videos.length === 0 && <ListItem><ListItemText primary={loading ? 'Loading...' : 'No videos yet'} /></ListItem>}
                {videos.map(v => (
                    <ListItem key={v.id} secondaryAction={
                        <Button onClick={() => handlePlay(v.id)} variant="contained" size="small">Play</Button>
                    }>
                        <ListItemText primary={v.title} secondary={`Status: ${v.status} • Uploaded: ${new Date(v.createdAt).toLocaleString()}`} />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
}
