import React, { useState, useEffect, useCallback } from 'react';
import {
  FederatedLearningClient,
  SessionManager,
  ClientData,
  SessionDetails,
  TrainingResponse,
  EvaluationResponse,
} from '../api/federated-learning-client';

// ============================================================================
// Types
// ============================================================================

interface DashboardState {
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

interface SessionUIState extends DashboardState {
  sessions: SessionDetails[];
  selectedSessionId: string | null;
}

interface ClientForm {
  clientId: string;
  featureCount: number;
  sampleCount: number;
}

// ============================================================================
// Styles (inline for simplicity)
// ============================================================================

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '30px',
    borderBottom: '2px solid #2c3e50',
    paddingBottom: '20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#7f8c8d',
    margin: '0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#2c3e50',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonHover: {
    backgroundColor: '#2980b9',
  },
  buttonDanger: {
    backgroundColor: '#e74c3c',
  },
  buttonSuccess: {
    backgroundColor: '#27ae60',
  },
  alert: {
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '14px',
  },
  alertError: {
    backgroundColor: '#fadbd8',
    color: '#c0392b',
    border: '1px solid #e74c3c',
  },
  alertSuccess: {
    backgroundColor: '#d5f4e6',
    color: '#27ae60',
    border: '1px solid #27ae60',
  },
  alertWarning: {
    backgroundColor: '#fce5cd',
    color: '#d68910',
    border: '1px solid #f39c12',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    padding: '12px',
    borderBottom: '1px solid #ecf0f1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  badgeActive: {
    backgroundColor: '#d5f4e6',
    color: '#27ae60',
  },
  badgeInactive: {
    backgroundColor: '#fadbd8',
    color: '#c0392b',
  },
  metric: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginTop: '15px',
  },
  metricItem: {
    backgroundColor: '#ecf0f1',
    padding: '15px',
    borderRadius: '4px',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginBottom: '5px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '10px',
  },
  th: {
    backgroundColor: '#ecf0f1',
    padding: '12px',
    textAlign: 'left' as const,
    fontWeight: 'bold',
    color: '#2c3e50',
    borderBottom: '2px solid #bdc3c7',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ecf0f1',
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// ============================================================================
// Subcomponents
// ============================================================================

interface AlertProps {
  type: 'error' | 'success' | 'warning';
  message: string;
  onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const alertStyle = {
    ...styles.alert,
    ...(type === 'error' && styles.alertError),
    ...(type === 'success' && styles.alertSuccess),
    ...(type === 'warning' && styles.alertWarning),
  };

  return (
    <div style={alertStyle}>
      {message}
      <button
        onClick={onClose}
        style={{
          marginLeft: '10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        ✕
      </button>
    </div>
  );
};

interface CreateSessionFormProps {
  onSessionCreated: (sessionId: string) => void;
  client: FederatedLearningClient;
}

const CreateSessionForm: React.FC<CreateSessionFormProps> = ({ onSessionCreated, client }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState('averaging');

  const handleCreateSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await client.createSession({
        initialWeights: Array(10).fill(0.1),
        aggregationStrategy: strategy as any,
      });

      onSessionCreated(session.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.card, ...styles.fullWidth }}>
      <div style={styles.cardTitle}>Create New Session</div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div style={styles.formGroup}>
        <label style={styles.label}>Aggregation Strategy</label>
        <select
          value={strategy}
          onChange={e => setStrategy(e.target.value)}
          style={styles.select}
          disabled={loading}
        >
          <option value="averaging">Averaging</option>
          <option value="weighted-averaging">Weighted Averaging</option>
          <option value="median">Median</option>
          <option value="trimmed-mean">Trimmed Mean</option>
        </select>
      </div>

      <button
        onClick={handleCreateSession}
        disabled={loading}
        style={{
          ...styles.button,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Creating...' : 'Create Session'}
      </button>
    </div>
  );
};

interface SessionListProps {
  sessions: SessionDetails[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  loading: boolean;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  onDeleteSession,
  loading,
}) => {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>Active Sessions</div>

      {loading ? (
        <div>Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div style={{ color: '#7f8c8d' }}>No active sessions</div>
      ) : (
        <ul style={styles.list}>
          {sessions.map(session => (
            <li
              key={session.sessionId}
              style={{
                ...styles.listItem,
                backgroundColor: selectedSessionId === session.sessionId ? '#ecf0f1' : '#fff',
              }}
            >
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onSelectSession(session.sessionId)}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {session.sessionId.substring(0, 20)}...
                </div>
                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                  Clients: {session.clientCount} | Rounds: {session.trainingRounds}
                </div>
              </div>
              <span style={{ ...styles.badge, ...styles.badgeActive }}>{session.status}</span>
              <button
                onClick={() => onDeleteSession(session.sessionId)}
                style={{
                  ...styles.button,
                  ...styles.buttonDanger,
                  padding: '6px 12px',
                  fontSize: '12px',
                  marginLeft: '10px',
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface SessionDetailProps {
  session: SessionDetails;
  onAddClient: (clientData: ClientData) => Promise<void>;
  onTrain: (rounds: number, epochs: number) => Promise<void>;
  onEvaluate: (testFeatures: number[][], testLabels: number[]) => Promise<void>;
  loading: boolean;
}

const SessionDetail: React.FC<SessionDetailProps> = ({ session, onAddClient, onTrain, onEvaluate, loading }) => {
  const [clientForm, setClientForm] = useState<ClientForm>({
    clientId: '',
    featureCount: 10,
    sampleCount: 10,
  });
  const [trainingRounds, setTrainingRounds] = useState(5);
  const [trainingEpochs, setTrainingEpochs] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddClient = async () => {
    if (!clientForm.clientId) {
      setError('Client ID is required');
      return;
    }

    try {
      setError(null);
      const features = Array(clientForm.sampleCount)
        .fill(0)
        .map(() => Array(clientForm.featureCount).fill(0).map(() => Math.random()));
      const labels = Array(clientForm.sampleCount).fill(0).map(() => Math.round(Math.random()));

      await onAddClient({
        clientId: clientForm.clientId,
        features,
        labels,
      });

      setSuccess(`Client '${clientForm.clientId}' added successfully`);
      setClientForm({ clientId: '', featureCount: 10, sampleCount: 10 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add client');
    }
  };

  const handleTrain = async () => {
    try {
      setError(null);
      await onTrain(trainingRounds, trainingEpochs);
      setSuccess(`Training completed: ${trainingRounds} rounds`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
    }
  };

  return (
    <div>
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div style={styles.grid}>
        {/* Add Client Card */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Add Client</div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Client ID</label>
            <input
              type="text"
              value={clientForm.clientId}
              onChange={e => setClientForm({ ...clientForm, clientId: e.target.value })}
              style={styles.input}
              placeholder="client-1"
              disabled={loading}
            />
          </div>

          <div style={styles.metric}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Features</label>
              <input
                type="number"
                value={clientForm.featureCount}
                onChange={e => setClientForm({ ...clientForm, featureCount: parseInt(e.target.value) })}
                style={styles.input}
                min="1"
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Samples</label>
              <input
                type="number"
                value={clientForm.sampleCount}
                onChange={e => setClientForm({ ...clientForm, sampleCount: parseInt(e.target.value) })}
                style={styles.input}
                min="1"
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={handleAddClient}
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.buttonSuccess,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Adding...' : 'Add Client'}
          </button>
        </div>

        {/* Training Card */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Run Training</div>

          <div style={styles.metric}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Rounds</label>
              <input
                type="number"
                value={trainingRounds}
                onChange={e => setTrainingRounds(parseInt(e.target.value))}
                style={styles.input}
                min="1"
                max="100"
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Epochs</label>
              <input
                type="number"
                value={trainingEpochs}
                onChange={e => setTrainingEpochs(parseInt(e.target.value))}
                style={styles.input}
                min="1"
                max="10"
                disabled={loading}
              />
            </div>
          </div>

          <button
            onClick={handleTrain}
            disabled={loading || session.clientCount === 0}
            style={{
              ...styles.button,
              opacity: loading || session.clientCount === 0 ? 0.6 : 1,
            }}
          >
            {loading ? 'Training...' : 'Start Training'}
          </button>

          {session.clientCount === 0 && (
            <div style={{ ...styles.alert, ...styles.alertWarning, marginTop: '10px' }}>
              Add at least one client before training
            </div>
          )}
        </div>

        {/* Metrics Card */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Session Metrics</div>

          <div style={styles.metric}>
            <div style={styles.metricItem}>
              <div style={styles.metricLabel}>Clients</div>
              <div style={styles.metricValue}>{session.clientCount}</div>
            </div>

            <div style={styles.metricItem}>
              <div style={styles.metricLabel}>Training Rounds</div>
              <div style={styles.metricValue}>{session.trainingRounds}</div>
            </div>

            <div style={styles.metricItem}>
              <div style={styles.metricLabel}>Communication Rounds</div>
              <div style={styles.metricValue}>{session.communicationRounds}</div>
            </div>

            <div style={styles.metricItem}>
              <div style={styles.metricLabel}>Strategy</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
                {session.aggregationStrategy}
              </div>
            </div>
          </div>
        </div>

        {/* Model Weights Preview */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Global Model Weights (First 5)</div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Index</th>
                <th style={styles.th}>Value</th>
              </tr>
            </thead>
            <tbody>
              {session.globalModelWeights.slice(0, 5).map((weight, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{idx}</td>
                  <td style={styles.td}>{weight.toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Dashboard Component
// ============================================================================

interface FederatedLearningDashboardProps {
  apiBaseUrl?: string;
}

export const FederatedLearningDashboard: React.FC<FederatedLearningDashboardProps> = ({
  apiBaseUrl = 'http://localhost:3000/federated',
}) => {
  const [client] = useState(() => new FederatedLearningClient({ baseUrl: apiBaseUrl }));
  const [sessionState, setSessionState] = useState<SessionUIState>({
    sessions: [],
    selectedSessionId: null,
    loading: false,
    error: null,
    successMessage: null,
  });

  // Load sessions
  const loadSessions = useCallback(async () => {
    setSessionState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await client.listSessions();
      const sessionDetails = await Promise.all(
        response.sessions.map(async session => {
          try {
            return await client.getSession(session.sessionId);
          } catch {
            return null;
          }
        })
      );

      const validSessions = sessionDetails.filter((s): s is SessionDetails => s !== null);
      setSessionState(prev => ({
        ...prev,
        sessions: validSessions,
        loading: false,
      }));
    } catch (err) {
      setSessionState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to load sessions',
        loading: false,
      }));
    }
  }, [client]);

  // Initial load
  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [loadSessions]);

  const handleSessionCreated = async (sessionId: string) => {
    setSessionState(prev => ({
      ...prev,
      successMessage: 'Session created successfully',
      selectedSessionId: sessionId,
    }));
    await loadSessions();
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await client.deleteSession(sessionId);
        setSessionState(prev => ({
          ...prev,
          successMessage: 'Session deleted',
          selectedSessionId: null,
        }));
        await loadSessions();
      } catch (err) {
        setSessionState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to delete session',
        }));
      }
    }
  };

  const selectedSession =
    sessionState.sessions.find(s => s.sessionId === sessionState.selectedSessionId) || null;

  const handleAddClient = async (clientData: ClientData) => {
    if (!selectedSession) return;

    try {
      await client.addClient(selectedSession.sessionId, clientData);
      await loadSessions();
    } catch (err) {
      throw err;
    }
  };

  const handleTrain = async (rounds: number, epochs: number) => {
    if (!selectedSession) return;

    try {
      await client.train(selectedSession.sessionId, { rounds, epochs });
      await loadSessions();
    } catch (err) {
      throw err;
    }
  };

  const handleEvaluate = async (testFeatures: number[][], testLabels: number[]) => {
    if (!selectedSession) return;

    try {
      await client.evaluate(selectedSession.sessionId, { testFeatures, testLabels });
      await loadSessions();
    } catch (err) {
      throw err;
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          button:hover {
            opacity: 0.9;
          }
          input:disabled, select:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}
      </style>

      <div style={styles.header}>
        <h1 style={styles.title}>Federated Learning Dashboard</h1>
        <p style={styles.subtitle}>Distributed Machine Learning Control Panel</p>
      </div>

      {sessionState.error && (
        <Alert
          type="error"
          message={sessionState.error}
          onClose={() => setSessionState(prev => ({ ...prev, error: null }))}
        />
      )}

      {sessionState.successMessage && (
        <Alert
          type="success"
          message={sessionState.successMessage}
          onClose={() => setSessionState(prev => ({ ...prev, successMessage: null }))}
        />
      )}

      <div style={styles.grid}>
        <CreateSessionForm onSessionCreated={handleSessionCreated} client={client} />

        <SessionList
          sessions={sessionState.sessions}
          selectedSessionId={sessionState.selectedSessionId}
          onSelectSession={sessionId => setSessionState(prev => ({ ...prev, selectedSessionId: sessionId }))}
          onDeleteSession={handleDeleteSession}
          loading={sessionState.loading}
        />
      </div>

      {selectedSession && (
        <SessionDetail
          session={selectedSession}
          onAddClient={handleAddClient}
          onTrain={handleTrain}
          onEvaluate={handleEvaluate}
          loading={sessionState.loading}
        />
      )}
    </div>
  );
};

export default FederatedLearningDashboard;
