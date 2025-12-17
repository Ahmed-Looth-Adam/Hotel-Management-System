/**
 * Component Demo - Showcase of reusable common components
 *
 * This demo file demonstrates how to use the common component library
 * with real-world examples from the hotel management system.
 *
 * Edited By:
 * -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Stack, Chip } from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { Button, Input, Card, DataTable } from './common';

function ComponentDemo() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);

  // Sample table data for bookings
  const bookingColumns = [
    { id: 'id', label: 'Booking ID', minWidth: 100 },
    { id: 'guestName', label: 'Guest Name', minWidth: 150 },
    { id: 'roomNumber', label: 'Room', align: 'center', minWidth: 80 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      render: (row) => (
        <Chip
          label={row.status}
          color={
            row.status === 'Confirmed'
              ? 'success'
              : row.status === 'Pending'
              ? 'warning'
              : 'error'
          }
          size="small"
        />
      ),
    },
    { id: 'checkIn', label: 'Check-In', minWidth: 120 },
    { id: 'checkOut', label: 'Check-Out', minWidth: 120 },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      sortable: false,
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button
            variant="text"
            color="primary"
            size="small"
            startIcon={<EditIcon />}
          >
            Edit
          </Button>
          <Button
            variant="text"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
          >
            Cancel
          </Button>
        </Stack>
      ),
    },
  ];

  const bookingData = [
    {
      id: 'BK001',
      guestName: 'John Smith',
      roomNumber: '101',
      status: 'Confirmed',
      checkIn: '2025-11-15',
      checkOut: '2025-11-18',
    },
    {
      id: 'BK002',
      guestName: 'Sarah Johnson',
      roomNumber: '205',
      status: 'Pending',
      checkIn: '2025-11-16',
      checkOut: '2025-11-20',
    },
    {
      id: 'BK003',
      guestName: 'Michael Brown',
      roomNumber: '308',
      status: 'Confirmed',
      checkIn: '2025-11-14',
      checkOut: '2025-11-17',
    },
    {
      id: 'BK004',
      guestName: 'Emily Davis',
      roomNumber: '412',
      status: 'Cancelled',
      checkIn: '2025-11-19',
      checkOut: '2025-11-22',
    },
  ];

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(value && !value.includes('@'));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Home
        </Button>

        <Typography variant="h3" color="primary" gutterBottom>
          Component Library Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Reusable components for the Hotel Management System
        </Typography>

        {/* Button Examples */}
        <Card title="Button Component" sx={{ mb: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Variants & Colors:
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button variant="contained" color="primary">
                  Primary
                </Button>
                <Button variant="contained" color="secondary">
                  Secondary
                </Button>
                <Button variant="outlined" color="primary">
                  Outlined
                </Button>
                <Button variant="text" color="primary">
                  Text
                </Button>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Sizes & Icons:
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button size="small" startIcon={<AddIcon />}>
                  Add Room
                </Button>
                <Button size="medium" startIcon={<SearchIcon />}>
                  Search
                </Button>
                <Button size="large" endIcon={<AddIcon />}>
                  Create Booking
                </Button>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                States:
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button color="success">Available</Button>
                <Button color="warning">Pending</Button>
                <Button color="error">Unavailable</Button>
                <Button disabled>Disabled</Button>
              </Stack>
            </Box>
          </Stack>
        </Card>

        {/* Input Examples */}
        <Card title="Input Component" sx={{ mb: 3 }}>
          <Stack spacing={3}>
            <Input
              label="Search Guests"
              placeholder="Enter guest name or booking ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<SearchIcon color="action" />}
              helperText="Search by name, email, or booking ID"
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={emailError}
              errorText="Please enter a valid email address"
              required
            />

            <Input
              label="Check-in Date"
              type="date"
              InputLabelProps={{ shrink: true }}
            />

            <Input
              label="Special Requests"
              multiline
              rows={4}
              placeholder="Enter any special requests or notes"
            />
          </Stack>
        </Card>

        {/* Card Examples */}
        <Card title="Card Component Examples" sx={{ mb: 3 }}>
          <Stack spacing={2}>
            <Card
              title="Room 101 - Deluxe Suite"
              subtitle="3rd Floor - Ocean View"
              status="success"
              statusLabel="Available"
              action={
                <Button variant="outlined" size="small">
                  Book Now
                </Button>
              }
              footer={
                <Typography variant="h6" color="primary">
                  £250/night
                </Typography>
              }
              hoverable
            >
              <Typography variant="body2" color="text.secondary">
                Spacious suite with king bed, private balcony, and stunning ocean views.
                Includes complimentary breakfast and WiFi.
              </Typography>
            </Card>

            <Card
              title="Booking Statistics"
              status="info"
              statusLabel="Updated Today"
              variant="outlined"
            >
              <Stack direction="row" spacing={4}>
                <Box>
                  <Typography variant="h4" color="primary">
                    87
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Bookings
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="success.main">
                    45
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Rooms
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="secondary.main">
                    92%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Occupancy Rate
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Card>

        {/* DataTable Example */}
        <Card title="DataTable Component" sx={{ mb: 3 }}>
          <DataTable
            columns={bookingColumns}
            data={bookingData}
            selectable
            onSelectionChange={(selected) => console.log('Selected:', selected)}
          />
        </Card>
      </Container>
    </Box>
  );
}

export default ComponentDemo;
