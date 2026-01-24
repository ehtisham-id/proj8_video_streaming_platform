import { Container, AppBar, Toolbar, Typography, Button } from '@mui/material';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const { token, logout } = useAuth();
  
  return (
    <Container maxWidth="lg">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Video Platform Demo
          </Typography>
          {token ? (
            <Button color="inherit" onClick={logout}>Logout</Button>
          ) : (
            <Button color="inherit" href="#login">Login</Button>
          )}
        </Toolbar>
      </AppBar>
      
      {token ? <Dashboard /> : <Login />}
    </Container>
  );
}

export default App;