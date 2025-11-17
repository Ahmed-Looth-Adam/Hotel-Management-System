/**
 * SkeletonGrid - Skeleton loader for grid layouts
 *
 * Features:
 * - Grid of skeleton cards
 * - Configurable grid columns
 * - Responsive layout
 * - Customizable item count
 *
 * Usage:
 * <SkeletonGrid count={6} columns={{ xs: 1, sm: 2, md: 3 }} />
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { Grid } from '@mui/material';
import SkeletonCard from './SkeletonCard';

const SkeletonGrid = ({
  count = 6,
  columns = { xs: 12, sm: 6, md: 4 },
  hasImage = true,
  lines = 3,
  imageHeight = 200,
}) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item {...columns} key={index}>
          <SkeletonCard hasImage={hasImage} lines={lines} height={imageHeight} />
        </Grid>
      ))}
    </Grid>
  );
};

export default SkeletonGrid;
