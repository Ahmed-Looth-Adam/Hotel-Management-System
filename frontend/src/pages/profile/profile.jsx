import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Person,
  Hotel,
  EventAvailable,
  Payment,
  Assessment,
} from '@mui/icons-material';

const Profile = () => { 
    const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              This is user profile customization page in development
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.first_name || user?.username}!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role: {user?.role || 'Guest'}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile; // Added export statement