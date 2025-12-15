/**
 * SkeletonList - Skeleton loader for list layouts
 *
 * Features:
 * - Mimics list item structure
 * - Configurable number of items
 * - Optional avatar/icon
 * - Adjustable spacing
 *
 * Usage:
 * <SkeletonList count={5} />
 * <SkeletonList count={3} hasAvatar={false} />
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { Box, Skeleton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';

const SkeletonList = ({ count = 5, hasAvatar = true }) => {
  return (
    <List>
      {Array.from({ length: count }).map((_, index) => (
        <ListItem key={index}>
          {hasAvatar && (
            <ListItemAvatar>
              <Skeleton variant="circular" width={40} height={40} />
            </ListItemAvatar>
          )}
          <ListItemText
            primary={<Skeleton variant="text" width="60%" />}
            secondary={<Skeleton variant="text" width="80%" />}
          />
        </ListItem>
      ))}
    </List>
  );
};

export default SkeletonList;
