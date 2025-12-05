import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  SupervisorAccount, 
} from '@mui/icons-material';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    navigate('/');
    await logout();
  };

  const dashboardCards = [
    {
      title: 'Profile',
      icon: <Person sx={{ fontSize: 40 }} />,
      description: 'Manage your account settings',
      link: '/profile',
    },
    {
      title: 'Hotels',
      icon: <Hotel sx={{ fontSize: 40 }} />,
      description: 'View and manage hotels',
      link: '/hotels',
    },
    {
      title: 'Bookings',
      icon: <EventAvailable sx={{ fontSize: 40 }} />,
      description: 'Manage reservations',
      link: '/bookings',
    },
    {
      title: 'Payments',
      icon: <Payment sx={{ fontSize: 40 }} />,
      description: 'View payment history',
      link: '/payments',
    },
    {
      title: 'Reports',
      icon: <Assessment sx={{ fontSize: 40 }} />,
      description: 'Generate and view reports',
      link: '/reports',
    },
  ];

  const adminCards = [
    {
      title: 'User Management',
      icon: <SupervisorAccount sx={{ fontSize: 40 }} />,
      description: 'Manage staff and user accounts',
      link: '/admin/users',
    },
  ];

  const finalCards = user?.role === 'admin' 
      ? [...adminCards, ...dashboardCards] 
      : dashboardCards;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, {user?.first_name || user?.username}!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role: {user?.role || 'Guest'}
            </Typography>
          </Box>
          <Button variant="outlined" color="error" onClick={handleLogout}>
            Logout
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/*  Dashboard Cards */}
          {finalCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate(card.link)}
              >
                <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {card.icon}
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Stats
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Bookings
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Hotels
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary">
                $0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Dashboard;
