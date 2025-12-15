# Loading States & Skeleton Screens

This project includes a comprehensive loading system with spinners and skeleton loaders for async operations, built on top of Material-UI's CircularProgress and Skeleton components.

## Features

- ✅ Multiple loading spinner variations (sizes, colors, positions)
- ✅ Skeleton loaders for different layouts (cards, lists, tables, grids)
- ✅ Loading button component
- ✅ Custom `useLoading` hook for state management
- ✅ Full-screen loading overlay
- ✅ Reusable and customizable components

## Components

### LoadingSpinner

A flexible loading spinner component with multiple configurations.

```jsx
import { LoadingSpinner } from '../components/loading';

// Basic usage
<LoadingSpinner />

// With custom size and text
<LoadingSpinner size="large" text="Loading data..." />

// Full-screen overlay
<LoadingSpinner fullScreen />

// Different sizes
<LoadingSpinner size="small" />
<LoadingSpinner size="medium" />  // default
<LoadingSpinner size="large" />

// Custom color
<LoadingSpinner color="secondary" />
```

**Props:**
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `text`: Optional loading message
- `fullScreen`: Boolean - shows full-screen overlay (default: false)
- `centered`: Boolean - centers the spinner (default: true)
- `color`: Material-UI color variant (default: 'primary')

### LoadingButton

Button component with integrated loading state.

```jsx
import { LoadingButton } from '../components/loading';

<LoadingButton
  loading={isLoading}
  onClick={handleSubmit}
  variant="contained"
>
  Submit
</LoadingButton>
```

**Props:**
- `loading`: Boolean - shows spinner when true
- All other Material-UI Button props supported

### SkeletonCard

Skeleton loader for card layouts.

```jsx
import { SkeletonCard } from '../components/loading';

// Basic card skeleton
<SkeletonCard />

// Without image
<SkeletonCard hasImage={false} />

// Custom configuration
<SkeletonCard
  hasImage={true}
  lines={5}
  height={250}
/>
```

**Props:**
- `hasImage`: Boolean - show image placeholder (default: true)
- `lines`: Number - number of text lines (default: 4)
- `height`: Number - image height in pixels (default: 200)

### SkeletonList

Skeleton loader for list layouts.

```jsx
import { SkeletonList } from '../components/loading';

// Basic list skeleton
<SkeletonList count={5} />

// Without avatars
<SkeletonList count={3} hasAvatar={false} />
```

**Props:**
- `count`: Number - number of list items (default: 5)
- `hasAvatar`: Boolean - show avatar placeholders (default: true)

### SkeletonTable

Skeleton loader for table layouts.

```jsx
import { SkeletonTable } from '../components/loading';

// Basic table skeleton
<SkeletonTable rows={10} columns={5} />

// Without header
<SkeletonTable rows={8} columns={4} hasHeader={false} />
```

**Props:**
- `rows`: Number - number of rows (default: 5)
- `columns`: Number - number of columns (default: 4)
- `hasHeader`: Boolean - show header row (default: true)

### SkeletonGrid

Skeleton loader for grid layouts.

```jsx
import { SkeletonGrid } from '../components/loading';

// Basic grid
<SkeletonGrid count={6} />

// Responsive grid
<SkeletonGrid
  count={9}
  columns={{ xs: 12, sm: 6, md: 4 }}
  hasImage={true}
  lines={3}
  imageHeight={200}
/>
```

**Props:**
- `count`: Number - number of grid items (default: 6)
- `columns`: Object - responsive grid columns (default: { xs: 12, sm: 6, md: 4 })
- `hasImage`: Boolean - show image in cards (default: true)
- `lines`: Number - text lines per card (default: 3)
- `imageHeight`: Number - card image height (default: 200)

## useLoading Hook

Custom hook for managing loading states.

```jsx
import useLoading from '../hooks/useLoading';

function MyComponent() {
  const { isLoading, startLoading, stopLoading, withLoading } = useLoading();

  // Method 1: Manual control
  const handleManual = async () => {
    startLoading();
    try {
      await fetchData();
    } finally {
      stopLoading();
    }
  };

  // Method 2: Automatic (recommended)
  const handleAutomatic = async () => {
    await withLoading(async () => {
      await fetchData();
    });
  };

  return (
    <>
      {isLoading ? <LoadingSpinner /> : <Content />}
      <LoadingButton loading={isLoading} onClick={handleAutomatic}>
        Submit
      </LoadingButton>
    </>
  );
}
```

**API:**
- `isLoading`: Boolean - current loading state
- `startLoading()`: Start loading
- `stopLoading()`: Stop loading
- `resetLoading()`: Reset all loading states
- `withLoading(asyncFn)`: Execute async function with automatic loading management

## Common Usage Patterns

### 1. Data Fetching with Skeleton

```jsx
import { useState, useEffect } from 'react';
import { SkeletonGrid } from '../components/loading';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <SkeletonGrid count={6} />;
  }

  return (
    <Grid container spacing={3}>
      {products.map(product => (
        <ProductCard key={product.id} {...product} />
      ))}
    </Grid>
  );
}
```

### 2. Form Submission with Loading Button

```jsx
import useLoading from '../hooks/useLoading';
import { LoadingButton } from '../components/loading';
import useNotification from '../hooks/useNotification';

function MyForm() {
  const { isLoading, withLoading } = useLoading();
  const { showSuccess, showError } = useNotification();

  const handleSubmit = async (values) => {
    await withLoading(async () => {
      try {
        await api.submitForm(values);
        showSuccess('Form submitted successfully!');
      } catch (error) {
        showError('Failed to submit form');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <LoadingButton
        loading={isLoading}
        type="submit"
        variant="contained"
      >
        Submit
      </LoadingButton>
    </form>
  );
}
```

### 3. Table with Skeleton Loader

```jsx
import { useState, useEffect } from 'react';
import { SkeletonTable } from '../components/loading';

function DataTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTableData().then(data => {
      setData(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <SkeletonTable rows={10} columns={5} />;
  }

  return (
    <Table>
      {/* render table */}
    </Table>
  );
}
```

### 4. Full-Screen Loading

```jsx
import { LoadingSpinner } from '../components/loading';

function App() {
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    initializeApp().then(() => setInitializing(false));
  }, []);

  if (initializing) {
    return <LoadingSpinner fullScreen text="Initializing application..." />;
  }

  return <MainApp />;
}
```

### 5. Multiple Concurrent Operations

```jsx
import useLoading from '../hooks/useLoading';

function Dashboard() {
  const { isLoading, startLoading, stopLoading } = useLoading();

  const loadData = async () => {
    startLoading(); // First operation
    await fetchUsers();

    startLoading(); // Second operation (count = 2)
    await fetchPosts();

    stopLoading(); // Still loading (count = 1)
    stopLoading(); // Loading complete (count = 0)
  };

  // isLoading will be true until all operations complete
}
```

## Integration with Existing Code

### In Authentication Flow

```jsx
// In Login component
const { isLoading, withLoading } = useLoading();
const { showSuccess, showError } = useNotification();

const handleLogin = async (credentials) => {
  await withLoading(async () => {
    const result = await authService.login(credentials);
    if (result.success) {
      showSuccess('Login successful!');
      navigate('/dashboard');
    } else {
      showError(result.error);
    }
  });
};

return (
  <form>
    {/* form fields */}
    <LoadingButton loading={isLoading} type="submit">
      Sign In
    </LoadingButton>
  </form>
);
```

### In Data Tables

```jsx
// Protected context example
const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // rest of logic
};
```

## Live Demo

Visit `/loading-demo` to see interactive examples of all loading components and patterns.

## Best Practices

1. **Use skeletons for content loading**: Show skeleton loaders instead of blank screens
2. **Match skeleton to content**: Skeleton should roughly match the final content layout
3. **Use loading buttons for actions**: Show loading state in buttons during form submissions
4. **Full-screen for critical operations**: Use full-screen spinner for app initialization or critical operations
5. **Combine with notifications**: Use loading states with toast notifications for better UX
6. **Handle errors gracefully**: Always stop loading state even if operation fails

## File Structure

```
frontend/src/
├── components/
│   └── loading/
│       ├── LoadingSpinner.jsx
│       ├── LoadingButton.jsx
│       ├── SkeletonCard.jsx
│       ├── SkeletonList.jsx
│       ├── SkeletonTable.jsx
│       ├── SkeletonGrid.jsx
│       └── index.js
├── hooks/
│   └── useLoading.js
└── examples/
    └── LoadingExample.jsx
```

## Material-UI Foundation

All loading components are built on top of Material-UI's:
- `CircularProgress` - for spinners
- `Skeleton` - for skeleton loaders
- `Button` - for loading buttons

This ensures consistency with your app's theme and design system.
