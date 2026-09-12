import React from 'react';
import FederatedLearningDashboard from './FederatedLearningDashboard';

/**
 * Example React Application using the Federated Learning Dashboard
 *
 * This is a complete working example of how to integrate the
 * FederatedLearningDashboard component into a React application.
 *
 * Environment Variables:
 * - REACT_APP_API_URL: Base URL for the Federated Learning API
 *   Default: http://localhost:3000/federated (development)
 */

const App: React.FC = () => {
  // Use environment variable for API URL, with fallback to localhost
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/federated';

  return (
    <FederatedLearningDashboard
      apiBaseUrl={apiUrl}
    />
  );
};

export default App;
