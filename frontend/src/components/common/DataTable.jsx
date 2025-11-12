/**
 * DataTable Component - Reusable MUI Table wrapper with pagination and sorting
 *
 * A feature-rich table component for displaying tabular data in the hotel management system.
 * Supports sorting, pagination, row selection, and custom cell rendering.
 *
 * Note: Uses MUI Table (not DataGrid) to avoid additional dependencies.
 * For advanced features like virtualization, consider installing @mui/x-data-grid.
 *
 * Usage:
 *   const columns = [
 *     { id: 'name', label: 'Name', sortable: true },
 *     { id: 'email', label: 'Email' },
 *     { id: 'status', label: 'Status', render: (row) => <Chip label={row.status} /> },
 *   ];
 *   const data = [{ id: 1, name: 'John', email: 'john@hotel.com', status: 'active' }];
 *   <DataTable columns={columns} data={data} />
 *
 * Edited By:
 * -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  Typography,
  Box,
} from '@mui/material';
import PropTypes from 'prop-types';

function DataTable({
  columns = [],
  data = [],
  selectable = false,
  onSelectionChange,
  pagination = true,
  defaultRowsPerPage = 10,
  sortable = true,
  emptyMessage = 'No data available',
  className = '',
  ...props
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sort
  const handleSort = (columnId) => {
    if (!sortable) return;

    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  // Handle select all
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const newSelected = data.map((row) => row.id);
      setSelected(newSelected);
      onSelectionChange?.(newSelected);
    } else {
      setSelected([]);
      onSelectionChange?.([]);
    }
  };

  // Handle select one
  const handleSelect = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter((selectedId) => selectedId !== id);
    }

    setSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (!orderBy) return 0;

    const aValue = a[orderBy];
    const bValue = b[orderBy];

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate data
  const paginatedData = pagination
    ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedData;

  const isSelected = (id) => selected.indexOf(id) !== -1;

  return (
    <Paper
      className={className}
      sx={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 2,
        ...props.sx,
      }}
      {...props}
    >
      <TableContainer>
        <Table stickyHeader>
          {/* Table Header */}
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{
                    fontWeight: 600,
                    backgroundColor: 'background.paper',
                    minWidth: column.minWidth,
                  }}
                >
                  {column.sortable !== false && sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* Table Body */}
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  align="center"
                >
                  <Box sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => {
                const isItemSelected = isSelected(row.id);

                return (
                  <TableRow
                    key={row.id}
                    hover
                    selected={isItemSelected}
                    onClick={() => selectable && handleSelect(row.id)}
                    sx={{
                      cursor: selectable ? 'pointer' : 'default',
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox color="primary" checked={isItemSelected} />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align || 'left'}>
                        {column.render ? column.render(row) : row[column.id]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination && data.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      minWidth: PropTypes.number,
      sortable: PropTypes.bool,
      render: PropTypes.func,
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectable: PropTypes.bool,
  onSelectionChange: PropTypes.func,
  pagination: PropTypes.bool,
  defaultRowsPerPage: PropTypes.number,
  sortable: PropTypes.bool,
  emptyMessage: PropTypes.string,
  className: PropTypes.string,
};

export default DataTable;
