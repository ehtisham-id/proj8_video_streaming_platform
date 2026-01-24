import { useState } from 'react';
import { Box, Grid, Paper, Typography, Button } from '@mui/material';
import UploadForm from './UploadForm';
import VideoList from './VideoList';
import VideoPlayer from './VideoPlayer';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
    const { token, logout } = useAuth();
    const [selected, setSelected] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    function onUploaded() {
        setRefreshKey(k => k + 1);
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <UploadForm token={token} onUploaded={onUploaded} />
                    <Box sx={{ mt: 2 }}>
                        <VideoList key={refreshKey} token={token} onPlay={setSelected} />
                    </Box>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, minHeight: 480 }} elevation={3}>
                        {selected ? (
                            <>
                                <Typography variant="h6" gutterBottom>{selected.title}</Typography>
                                <VideoPlayer src={selected.url} poster="" />
                                <Box sx={{ mt: 2 }}>
                                    <Button variant="outlined" onClick={() => setSelected(null)}>Close</Button>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                <Typography variant="h5">Select a video to watch</Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>Upload a new video or choose from the list.</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
