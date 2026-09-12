import React from 'react';
import FederatedLearningDashboard from './FederatedLearningDashboard';

/**
 * Example React Application using the Federated Learning Dashboard
 *
 * This is a complete working example of how to integrate the
 * FederatedLearningDashboard component into a React application.
 */

const App: React.FC = () => {
  return (
    <FederatedLearningDashboard
      apiBaseUrl="http://localhost:3000/federated"
    />
  );
};

export default App;
