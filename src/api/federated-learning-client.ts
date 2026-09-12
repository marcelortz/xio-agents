/**
 * Federated Learning API Client Library
 * Type-safe client for interacting with the Federated Learning REST API
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ClientData {
  clientId: string;
  features: number[][];
  labels: number[];
}

export interface TrainingRequest {
  rounds: number;
  epochs?: number;
}

export interface EvaluationRequest {
  testFeatures: number[][];
  testLabels: number[];
}

export interface SessionConfig {
  initialWeights: number[];
  aggregationStrategy?: 'averaging' | 'weighted-averaging' | 'median' | 'trimmed-mean';
}

export interface SessionResponse {
  sessionId: string;
  aggregationStrategy: string;
  initialWeightsDimension: number;
  createdAt: string;
  message: string;
}

export interface SessionDetails {
  sessionId: string;
  status: 'active' | 'training' | 'completed';
  createdAt: string;
  aggregationStrategy: string;
  trainingRounds: number;
  clientCount: number;
  globalModelWeights: number[];
  communicationRounds: number;
  trainingHistory: Array<{ round: number; loss: number; accuracy: number }>;
}

export interface SessionListResponse {
  totalSessions: number;
  sessions: Array<{
    sessionId: string;
    status: string;
    createdAt: string;
    aggregationStrategy: string;
    clientCount: number;
    trainingRounds: number;
  }>;
}

export interface ClientResponse {
  sessionId: string;
  clientId: string;
  samplesAdded: number;
  totalClients: number;
  message: string;
}

export interface ClientListResponse {
  sessionId: string;
  totalClients: number;
  clients: Array<{
    clientId: string;
    samplesCount: number;
    featuresDimension: number;
  }>;
}

export interface TrainingResponse {
  sessionId: string;
  roundsCompleted: number;
  communicationRounds: number;
  duration: number;
  globalModelWeights: number[];
  averageTimePerRound: string;
  timestamp: string;
  message: string;
}

export interface EvaluationResponse {
  sessionId: string;
  accuracy: number;
  testSamples: number;
  globalModelWeights: number[];
  timestamp: string;
}

export interface ModelResponse {
  sessionId: string;
  globalModel: {
    weights: number[];
    dimension: number;
    aggregationStrategy: string;
  };
  timestamp: string;
}

export interface MetricsResponse {
  sessionId: string;
  metrics: {
    globalWeights: number[];
    communicationRounds: number;
    aggregationStrategy: string;
    clientCount: number;
    trainingHistory: Array<{ round: number; loss: number; accuracy: number }>;
  };
  timestamp: string;
}

export interface StrategyInfo {
  id: string;
  name: string;
  description: string;
  robustness: string;
  speed: string;
  useCase: string;
}

export interface StrategiesResponse {
  strategies: StrategyInfo[];
}

export interface ApiInfoResponse {
  name: string;
  version: string;
  description: string;
  endpoints: Record<string, Record<string, string>>;
}

export interface DeleteResponse {
  sessionId: string;
  deleted: boolean;
  message: string;
}

export interface ClientDeleteResponse {
  sessionId: string;
  clientId: string;
  removed: boolean;
  remainingClients: number;
  message: string;
}

export interface ApiError {
  error: string;
  statusCode: number;
}

// ============================================================================
// Error Classes
// ============================================================================

export class FederatedLearningClientError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public response?: any
  ) {
    super(message);
    this.name = 'FederatedLearningClientError';
  }
}

export class SessionNotFoundError extends FederatedLearningClientError {
  constructor(sessionId: string) {
    super(404, `Session '${sessionId}' not found`);
    this.name = 'SessionNotFoundError';
  }
}

export class ClientNotFoundError extends FederatedLearningClientError {
  constructor(sessionId: string, clientId: string) {
    super(404, `Client '${clientId}' not found in session '${sessionId}'`);
    this.name = 'ClientNotFoundError';
  }
}

export class ValidationError extends FederatedLearningClientError {
  constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// Client Configuration
// ============================================================================

export interface ClientConfig {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// ============================================================================
// Main Client Class
// ============================================================================

export class FederatedLearningClient {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private sessionCache: Map<string, SessionDetails> = new Map();

  constructor(config: ClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000/federated';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (data) {
          options.body = JSON.stringify(data);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorData: any = null;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: response.statusText };
          }

          if (response.status === 404) {
            if (endpoint.includes('/clients/')) {
              const parts = endpoint.split('/');
              const sessionId = parts[2];
              const clientId = parts[4];
              throw new ClientNotFoundError(sessionId, clientId);
            } else if (endpoint.includes('/sessions/')) {
              const sessionId = endpoint.split('/')[2];
              throw new SessionNotFoundError(sessionId);
            }
          }

          throw new FederatedLearningClientError(
            response.status,
            errorData.error || response.statusText,
            errorData
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on 4xx errors (except 429)
        if (
          error instanceof FederatedLearningClientError &&
          error.statusCode >= 400 &&
          error.statusCode !== 429
        ) {
          throw error;
        }

        if (attempt < this.retryAttempts - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, this.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  // ========================================================================
  // Session Management
  // ========================================================================

  /**
   * Create a new federated learning session
   */
  async createSession(config: SessionConfig): Promise<SessionResponse> {
    this.validateSessionConfig(config);
    return this.makeRequest<SessionResponse>('POST', '/sessions', config);
  }

  /**
   * Get details of a specific session
   */
  async getSession(sessionId: string): Promise<SessionDetails> {
    this.validateSessionId(sessionId);
    const details = await this.makeRequest<SessionDetails>('GET', `/sessions/${sessionId}`);
    this.sessionCache.set(sessionId, details);
    return details;
  }

  /**
   * List all active sessions
   */
  async listSessions(): Promise<SessionListResponse> {
    return this.makeRequest<SessionListResponse>('GET', '/sessions');
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<DeleteResponse> {
    this.validateSessionId(sessionId);
    this.sessionCache.delete(sessionId);
    return this.makeRequest<DeleteResponse>('DELETE', `/sessions/${sessionId}`);
  }

  // ========================================================================
  // Client Management
  // ========================================================================

  /**
   * Add a client to a session
   */
  async addClient(sessionId: string, client: ClientData): Promise<ClientResponse> {
    this.validateSessionId(sessionId);
    this.validateClientData(client);
    this.sessionCache.delete(sessionId);
    return this.makeRequest<ClientResponse>('POST', `/sessions/${sessionId}/clients`, client);
  }

  /**
   * List all clients in a session
   */
  async listClients(sessionId: string): Promise<ClientListResponse> {
    this.validateSessionId(sessionId);
    return this.makeRequest<ClientListResponse>('GET', `/sessions/${sessionId}/clients`);
  }

  /**
   * Remove a client from a session
   */
  async removeClient(sessionId: string, clientId: string): Promise<ClientDeleteResponse> {
    this.validateSessionId(sessionId);
    this.validateClientId(clientId);
    this.sessionCache.delete(sessionId);
    return this.makeRequest<ClientDeleteResponse>(
      'DELETE',
      `/sessions/${sessionId}/clients/${clientId}`
    );
  }

  // ========================================================================
  // Training & Evaluation
  // ========================================================================

  /**
   * Run federated training rounds
   */
  async train(sessionId: string, request: TrainingRequest): Promise<TrainingResponse> {
    this.validateSessionId(sessionId);
    this.validateTrainingRequest(request);
    this.sessionCache.delete(sessionId);
    return this.makeRequest<TrainingResponse>('POST', `/sessions/${sessionId}/train`, request);
  }

  /**
   * Evaluate the global model on test data
   */
  async evaluate(sessionId: string, request: EvaluationRequest): Promise<EvaluationResponse> {
    this.validateSessionId(sessionId);
    this.validateEvaluationRequest(request);
    return this.makeRequest<EvaluationResponse>(
      'POST',
      `/sessions/${sessionId}/evaluate`,
      request
    );
  }

  /**
   * Get the current global model
   */
  async getModel(sessionId: string): Promise<ModelResponse> {
    this.validateSessionId(sessionId);
    return this.makeRequest<ModelResponse>('GET', `/sessions/${sessionId}/model`);
  }

  /**
   * Get training metrics
   */
  async getMetrics(sessionId: string): Promise<MetricsResponse> {
    this.validateSessionId(sessionId);
    return this.makeRequest<MetricsResponse>('GET', `/sessions/${sessionId}/metrics`);
  }

  // ========================================================================
  // Strategies & Info
  // ========================================================================

  /**
   * List available aggregation strategies
   */
  async getStrategies(): Promise<StrategiesResponse> {
    return this.makeRequest<StrategiesResponse>('GET', '/strategies');
  }

  /**
   * Get API information
   */
  async getInfo(): Promise<ApiInfoResponse> {
    return this.makeRequest<ApiInfoResponse>('GET', '/info');
  }

  // ========================================================================
  // Validation Methods
  // ========================================================================

  private validateSessionConfig(config: SessionConfig): void {
    if (!config.initialWeights || !Array.isArray(config.initialWeights)) {
      throw new ValidationError('initialWeights must be an array of numbers');
    }

    if (config.initialWeights.length === 0) {
      throw new ValidationError('initialWeights cannot be empty');
    }

    if (!config.initialWeights.every(w => typeof w === 'number')) {
      throw new ValidationError('All initialWeights values must be numbers');
    }

    if (config.aggregationStrategy) {
      const validStrategies = ['averaging', 'weighted-averaging', 'median', 'trimmed-mean'];
      if (!validStrategies.includes(config.aggregationStrategy)) {
        throw new ValidationError(
          `Invalid aggregationStrategy. Must be one of: ${validStrategies.join(', ')}`
        );
      }
    }
  }

  private validateSessionId(sessionId: string): void {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
  }

  private validateClientData(client: ClientData): void {
    if (!client.clientId || typeof client.clientId !== 'string') {
      throw new ValidationError('clientId must be a non-empty string');
    }

    if (!Array.isArray(client.features) || client.features.length === 0) {
      throw new ValidationError('features must be a non-empty array');
    }

    if (!Array.isArray(client.labels) || client.labels.length === 0) {
      throw new ValidationError('labels must be a non-empty array');
    }

    if (client.features.length !== client.labels.length) {
      throw new ValidationError('features and labels must have the same length');
    }

    if (!client.features.every(f => Array.isArray(f))) {
      throw new ValidationError('All features must be arrays');
    }

    if (!client.labels.every(l => typeof l === 'number')) {
      throw new ValidationError('All labels must be numbers');
    }
  }

  private validateClientId(clientId: string): void {
    if (!clientId || typeof clientId !== 'string') {
      throw new ValidationError('clientId must be a non-empty string');
    }
  }

  private validateTrainingRequest(request: TrainingRequest): void {
    if (!request.rounds || typeof request.rounds !== 'number' || request.rounds < 1) {
      throw new ValidationError('rounds must be a number >= 1');
    }

    if (request.epochs !== undefined) {
      if (typeof request.epochs !== 'number' || request.epochs < 1) {
        throw new ValidationError('epochs must be a number >= 1');
      }
    }
  }

  private validateEvaluationRequest(request: EvaluationRequest): void {
    if (!Array.isArray(request.testFeatures) || request.testFeatures.length === 0) {
      throw new ValidationError('testFeatures must be a non-empty array');
    }

    if (!Array.isArray(request.testLabels) || request.testLabels.length === 0) {
      throw new ValidationError('testLabels must be a non-empty array');
    }

    if (request.testFeatures.length !== request.testLabels.length) {
      throw new ValidationError('testFeatures and testLabels must have the same length');
    }
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Clear the session cache
   */
  clearCache(): void {
    this.sessionCache.clear();
  }

  /**
   * Set the base URL (useful for changing environments)
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
    this.clearCache();
  }

  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// ============================================================================
// Session Manager (Higher-level wrapper)
// ============================================================================

export class SessionManager {
  private client: FederatedLearningClient;
  private sessionId: string;

  constructor(client: FederatedLearningClient, sessionId: string) {
    this.client = client;
    this.sessionId = sessionId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async getDetails(): Promise<SessionDetails> {
    return this.client.getSession(this.sessionId);
  }

  async addClient(clientData: ClientData): Promise<ClientResponse> {
    return this.client.addClient(this.sessionId, clientData);
  }

  async listClients(): Promise<ClientListResponse> {
    return this.client.listClients(this.sessionId);
  }

  async removeClient(clientId: string): Promise<ClientDeleteResponse> {
    return this.client.removeClient(this.sessionId, clientId);
  }

  async train(rounds: number, epochs?: number): Promise<TrainingResponse> {
    return this.client.train(this.sessionId, { rounds, epochs });
  }

  async evaluate(testFeatures: number[][], testLabels: number[]): Promise<EvaluationResponse> {
    return this.client.evaluate(this.sessionId, { testFeatures, testLabels });
  }

  async getModel(): Promise<ModelResponse> {
    return this.client.getModel(this.sessionId);
  }

  async getMetrics(): Promise<MetricsResponse> {
    return this.client.getMetrics(this.sessionId);
  }

  async delete(): Promise<DeleteResponse> {
    return this.client.deleteSession(this.sessionId);
  }
}

// ============================================================================
// Batch Operations Helper
// ============================================================================

export class BatchOperations {
  private client: FederatedLearningClient;

  constructor(client: FederatedLearningClient) {
    this.client = client;
  }

  /**
   * Create a session and add multiple clients at once
   */
  async createSessionWithClients(
    config: SessionConfig,
    clients: ClientData[]
  ): Promise<SessionManager> {
    const sessionResponse = await this.client.createSession(config);
    const sessionManager = new SessionManager(this.client, sessionResponse.sessionId);

    for (const clientData of clients) {
      await sessionManager.addClient(clientData);
    }

    return sessionManager;
  }

  /**
   * Run training and automatically evaluate at specified intervals
   */
  async trainWithEvaluation(
    sessionManager: SessionManager,
    totalRounds: number,
    roundsPerEvaluation: number,
    testFeatures: number[][],
    testLabels: number[]
  ): Promise<Array<{ round: number; accuracy: number }>> {
    const results: Array<{ round: number; accuracy: number }> = [];
    let currentRound = 0;

    while (currentRound < totalRounds) {
      const roundsToRun = Math.min(roundsPerEvaluation, totalRounds - currentRound);
      await sessionManager.train(roundsToRun);
      currentRound += roundsToRun;

      const evaluation = await sessionManager.evaluate(testFeatures, testLabels);
      results.push({
        round: currentRound,
        accuracy: evaluation.accuracy,
      });
    }

    return results;
  }
}
