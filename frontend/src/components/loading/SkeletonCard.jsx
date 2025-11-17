/**
 * SkeletonCard - Skeleton loader for card layouts
 *
 * Features:
 * - Mimics card structure with image and text
 * - Configurable with/without image
 * - Adjustable number of text lines
 * - Material-UI Card styling
 *
 * Usage:
 * <SkeletonCard />
 * <SkeletonCard hasImage={false} lines={3} />
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { Card, CardContent, Skeleton, Box } from '@mui/material';

const SkeletonCard = ({ hasImage = true, lines = 4, height = 200 }) => {
  return (
    <Card>
      {hasImage && (
        <Skeleton variant="rectangular" width="100%" height={height} />
      )}
      <CardContent>
        <Skeleton variant="text" sx={{ fontSize: '1.5rem', mb: 1 }} />
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant="text"
            sx={{ fontSize: '1rem' }}
            width={index === lines - 1 ? '80%' : '100%'}
          />
        ))}
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={100} height={36} />
          <Skeleton variant="rounded" width={100} height={36} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SkeletonCard;
