/**
 * Loading Example - Demonstrates loading spinners and skeletons
 *
 * This component shows various loading states and skeleton screens:
 * 1. Loading spinners (different sizes and variations)
 * 2. Skeleton loaders (cards, lists, tables, grids)
 * 3. Loading buttons
 * 4. useLoading hook examples
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Grid,
  Divider,
} from '@mui/material';
import {
  LoadingSpinner,
  LoadingButton,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonGrid,
} from '../components/loading';
import useLoading from '../hooks/useLoading';

const LoadingExample = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showSkeletonCards, setShowSkeletonCards] = useState(false);
  const [showSkeletonList, setShowSkeletonList] = useState(false);
  const [showSkeletonTable, setShowSkeletonTable] = useState(false);
  const [showSkeletonGrid, setShowSkeletonGrid] = useState(false);

  const { isLoading, withLoading } = useLoading();

  // Simulate async operation
  const simulateAsyncOperation = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const handleWithLoading = async () => {
    await withLoading(simulateAsyncOperation);
  };

  const handleFullScreen = () => {
    setShowFullScreen(true);
    setTimeout(() => setShowFullScreen(false), 3000);
  };

  const toggleSkeleton = (setter) => {
    setter((prev) => !prev);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Loading States & Skeleton Screens
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Examples of loading spinners and skeleton loaders for async operations
      </Typography>

      {/* Loading Spinners */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading Spinners
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Different sizes and configurations of loading spinners
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2, border: '1px dashed grey.300', borderRadius: 1 }}>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Small Spinner
              </Typography>
              <LoadingSpinner size="small" centered={false} />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2, border: '1px dashed grey.300', borderRadius: 1 }}>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Medium Spinner (Default)
              </Typography>
              <LoadingSpinner size="medium" centered={false} />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2, border: '1px dashed grey.300', borderRadius: 1 }}>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Large Spinner
              </Typography>
              <LoadingSpinner size="large" centered={false} />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          With text and centered
        </Typography>
        <Box sx={{ border: '1px dashed grey.300', borderRadius: 1, minHeight: 150 }}>
          <LoadingSpinner text="Loading data..." />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleFullScreen}>
            Show Full-Screen Spinner (3s)
          </Button>
        </Box>
      </Paper>

      {/* Loading Buttons */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading Buttons
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Buttons with loading state using useLoading hook
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
          <LoadingButton
            loading={isLoading}
            variant="contained"
            onClick={handleWithLoading}
          >
            Click to Load (2s)
          </LoadingButton>
          <LoadingButton loading={isLoading} variant="outlined" color="secondary">
            Outlined Button
          </LoadingButton>
          <LoadingButton loading={true} variant="contained" color="error">
            Always Loading
          </LoadingButton>
        </Stack>
      </Paper>

      {/* Skeleton Cards */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Skeleton Cards
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Skeleton loaders for card layouts
        </Typography>
        <Button
          variant="outlined"
          onClick={() => toggleSkeleton(setShowSkeletonCards)}
          sx={{ mb: 2 }}
        >
          {showSkeletonCards ? 'Hide' : 'Show'} Skeleton Cards
        </Button>
        {showSkeletonCards && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <SkeletonCard />
            </Grid>
            <Grid item xs={12} md={4}>
              <SkeletonCard hasImage={false} lines={5} />
            </Grid>
            <Grid item xs={12} md={4}>
              <SkeletonCard height={150} lines={3} />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Skeleton List */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Skeleton List
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Skeleton loaders for list layouts
        </Typography>
        <Button
          variant="outlined"
          onClick={() => toggleSkeleton(setShowSkeletonList)}
          sx={{ mb: 2 }}
        >
          {showSkeletonList ? 'Hide' : 'Show'} Skeleton List
        </Button>
        {showSkeletonList && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                With Avatars
              </Typography>
              <SkeletonList count={4} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">
                Without Avatars
              </Typography>
              <SkeletonList count={4} hasAvatar={false} />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Skeleton Table */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Skeleton Table
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Skeleton loaders for table layouts
        </Typography>
        <Button
          variant="outlined"
          onClick={() => toggleSkeleton(setShowSkeletonTable)}
          sx={{ mb: 2 }}
        >
          {showSkeletonTable ? 'Hide' : 'Show'} Skeleton Table
        </Button>
        {showSkeletonTable && <SkeletonTable rows={8} columns={5} />}
      </Paper>

      {/* Skeleton Grid */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Skeleton Grid
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Grid of skeleton cards for gallery/product listings
        </Typography>
        <Button
          variant="outlined"
          onClick={() => toggleSkeleton(setShowSkeletonGrid)}
          sx={{ mb: 2 }}
        >
          {showSkeletonGrid ? 'Hide' : 'Show'} Skeleton Grid
        </Button>
        {showSkeletonGrid && (
          <SkeletonGrid
            count={6}
            columns={{ xs: 12, sm: 6, md: 4 }}
            imageHeight={180}
            lines={2}
          />
        )}
      </Paper>

      {/* Code Examples */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Usage Examples
        </Typography>
        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', m: 0 }}>
{`// Loading Spinner
import { LoadingSpinner } from '../components/loading';
<LoadingSpinner />
<LoadingSpinner size="large" text="Loading..." />
<LoadingSpinner fullScreen />

// Loading Button with useLoading hook
import { LoadingButton } from '../components/loading';
import useLoading from '../hooks/useLoading';

const { isLoading, withLoading } = useLoading();
const handleSubmit = () => withLoading(async () => {
  await api.submit();
});

<LoadingButton loading={isLoading} onClick={handleSubmit}>
  Submit
</LoadingButton>

// Skeleton Loaders
import { SkeletonCard, SkeletonList, SkeletonTable } from '../components/loading';

{isLoading ? (
  <SkeletonCard />
) : (
  <Card>...</Card>
)}

// Conditional rendering pattern
{loading ? <SkeletonGrid count={6} /> : <ActualContent />}`}
          </Typography>
        </Box>
      </Paper>

      {/* Full-screen spinner */}
      {showFullScreen && <LoadingSpinner fullScreen text="Loading..." />}
    </Container>
  );
};

export default LoadingExample;
