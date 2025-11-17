/**
 * SkeletonTable - Skeleton loader for table layouts
 *
 * Features:
 * - Mimics table structure with rows and columns
 * - Configurable rows and columns
 * - Optional header row
 * - Table container styling
 *
 * Usage:
 * <SkeletonTable rows={10} columns={5} />
 * <SkeletonTable rows={5} columns={3} hasHeader={false} />
 *
 * Created By: Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
} from '@mui/material';

const SkeletonTable = ({ rows = 5, columns = 4, hasHeader = true }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        {hasHeader && (
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableCell key={index}>
                  <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SkeletonTable;
