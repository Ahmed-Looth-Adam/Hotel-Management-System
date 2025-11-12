/**
 * Card Component - Reusable MUI Card wrapper with consistent hotel styling
 *
 * A standardized card component for displaying content in the hotel management system.
 * Supports headers, actions, and various visual variants for different use cases.
 *
 * Usage:
 *   <Card title="Room Details">Content here</Card>
 *   <Card title="Statistics" action={<Button>View All</Button>}>...</Card>
 *   <Card variant="elevated" hoverable>...</Card>
 *   <Card status="success" statusLabel="Available">...</Card>
 *
 * Edited By:
 * -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import {
  Card as MuiCard,
  CardHeader,
  CardContent,
  CardActions,
  Divider,
  Chip,
} from '@mui/material';
import PropTypes from 'prop-types';

function Card({
  children,
  title,
  subtitle,
  action,
  status,
  statusLabel,
  footer,
  variant = 'outlined',
  hoverable = false,
  className = '',
  contentClassName = '',
  ...props
}) {
  // Determine status color
  const statusColor = {
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
    default: 'default',
  }[status] || 'default';

  return (
    <MuiCard
      variant={variant}
      className={`transition-all duration-200 ${hoverable ? 'hover:shadow-lg' : ''} ${className}`}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...(hoverable && {
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        }),
        ...props.sx,
      }}
      {...props}
    >
      {/* Card Header */}
      {(title || action || status) && (
        <>
          <CardHeader
            title={title}
            subheader={subtitle}
            action={
              <>
                {status && (
                  <Chip
                    label={statusLabel || status}
                    color={statusColor}
                    size="small"
                    sx={{ mr: action ? 1 : 0 }}
                  />
                )}
                {action}
              </>
            }
            titleTypographyProps={{
              variant: 'h6',
              fontWeight: 600,
            }}
            subheaderTypographyProps={{
              variant: 'body2',
              color: 'text.secondary',
            }}
            sx={{
              pb: 2,
            }}
          />
          <Divider />
        </>
      )}

      {/* Card Content */}
      <CardContent
        className={contentClassName}
        sx={{
          flexGrow: 1,
          p: 3,
        }}
      >
        {children}
      </CardContent>

      {/* Card Footer/Actions */}
      {footer && (
        <>
          <Divider />
          <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
            {footer}
          </CardActions>
        </>
      )}
    </MuiCard>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  action: PropTypes.node,
  status: PropTypes.oneOf(['success', 'warning', 'error', 'info', 'default']),
  statusLabel: PropTypes.string,
  footer: PropTypes.node,
  variant: PropTypes.oneOf(['elevation', 'outlined']),
  hoverable: PropTypes.bool,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
};

export default Card;
