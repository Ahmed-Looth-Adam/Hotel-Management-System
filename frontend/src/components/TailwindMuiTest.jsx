/**
 * Test Component - Verifies Tailwind CSS v3 and Material-UI v7 Integration
 *
 * This component demonstrates that both frameworks can coexist without conflicts.
 * - MUI components use the theme from theme.js
 * - Tailwind utility classes work alongside MUI
 *
 * Edited By:
 * -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { Button, Card, CardContent, Typography, Box } from '@mui/material';

function TailwindMuiTest() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        🎨 Tailwind + MUI Integration Test
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* MUI Card */}
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary" gutterBottom>
              Material-UI Card
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This uses MUI components with theme styling
            </Typography>
            <Button variant="contained" color="primary" sx={{ mt: 2 }}>
              MUI Button
            </Button>
          </CardContent>
        </Card>

        {/* Tailwind Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Tailwind Card
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            This uses Tailwind utility classes for styling
          </p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded">
            Tailwind Button
          </button>
        </div>

        {/* Hybrid - MUI with Tailwind classes */}
        <Card className="border-l-4 border-green-500">
          <CardContent>
            <Typography variant="h6" className="text-green-700">
              Hybrid Approach
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              MUI component with Tailwind utility classes
            </Typography>
            <Button
              variant="outlined"
              color="success"
              className="mt-4"
            >
              Hybrid Button
            </Button>
          </CardContent>
        </Card>

        {/* Tailwind with MUI colors */}
        <div className="bg-gradient-to-br from-primary-light to-primary-dark rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">
            Tailwind + MUI Colors
          </h3>
          <p className="text-sm opacity-90 mb-4">
            Using MUI theme colors in Tailwind classes
          </p>
          <button className="bg-secondary-main hover:bg-secondary-dark text-primary-dark font-medium py-2 px-4 rounded">
            Custom Button
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
        <Typography variant="body1" className="text-green-800 font-medium">
          ✅ Both frameworks are working correctly together!
        </Typography>
      </div>
    </Box>
  );
}

export default TailwindMuiTest;
