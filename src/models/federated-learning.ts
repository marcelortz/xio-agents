export interface FederatedModel {
  id: string;
  weights: number[];
  timestamp: number;
  accuracy?: number;
}

export interface FederatedData {
  features: number[][];
  labels: number[];
}

export interface AggregationStrategy {
  aggregate(models: FederatedModel[]): number[];
  name: string;
}

export class FederatedClient {
  private clientId: string;
  private localWeights: number[];
  private trainingData: FederatedData;
  private learningRate: number = 0.01;
  private epochs: number = 5;

  constructor(clientId: string, initialWeights: number[], trainingData: FederatedData) {
    this.clientId = clientId;
    this.localWeights = [...initialWeights];
    this.trainingData = trainingData;
  }

  private predict(features: number[]): number {
    return features.reduce((sum, feature, index) => {
      return sum + (this.localWeights[index] || 0) * feature;
    }, 0);
  }

  private calculateGradients(predictions: number[], labels: number[]): number[] {
    const gradients: number[] = Array(this.localWeights.length).fill(0);
    const dataSize = predictions.length;

    for (let i = 0; i < dataSize; i++) {
      const error = predictions[i] - labels[i];
      for (let j = 0; j < this.localWeights.length; j++) {
        gradients[j] += (error * this.trainingData.features[i][j]) / dataSize;
      }
    }

    return gradients;
  }

  trainLocal(): number[] {
    const dataSize = this.trainingData.features.length;

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      const predictions = this.trainingData.features.map(features =>
        this.predict(features)
      );

      const gradients = this.calculateGradients(predictions, this.trainingData.labels);

      for (let i = 0; i < this.localWeights.length; i++) {
        this.localWeights[i] -= this.learningRate * gradients[i];
      }
    }

    return [...this.localWeights];
  }

  updateWeights(newWeights: number[]): void {
    this.localWeights = [...newWeights];
  }

  getModel(): FederatedModel {
    return {
      id: this.clientId,
      weights: [...this.localWeights],
      timestamp: Date.now(),
    };
  }

  evaluateAccuracy(testFeatures: number[][], testLabels: number[]): number {
    let correctPredictions = 0;

    for (let i = 0; i < testFeatures.length; i++) {
      const prediction = this.predict(testFeatures[i]) > 0.5 ? 1 : 0;
      if (prediction === testLabels[i]) {
        correctPredictions++;
      }
    }

    return correctPredictions / testFeatures.length;
  }
}

export class AveragingAggregator implements AggregationStrategy {
  readonly name = 'averaging';

  aggregate(models: FederatedModel[]): number[] {
    if (models.length === 0) return [];

    const weightLength = models[0].weights.length;
    const aggregated: number[] = Array(weightLength).fill(0);

    models.forEach(model => {
      model.weights.forEach((weight, index) => {
        aggregated[index] += weight / models.length;
      });
    });

    return aggregated;
  }
}

export class WeightedAveragingAggregator implements AggregationStrategy {
  readonly name = 'weighted-averaging';
  private weights: Map<string, number> = new Map();

  setClientWeight(clientId: string, weight: number): void {
    this.weights.set(clientId, weight);
  }

  aggregate(models: FederatedModel[]): number[] {
    if (models.length === 0) return [];

    const weightLength = models[0].weights.length;
    const aggregated: number[] = Array(weightLength).fill(0);
    let totalWeight = 0;

    models.forEach(model => {
      const clientWeight = this.weights.get(model.id) || 1 / models.length;
      totalWeight += clientWeight;

      model.weights.forEach((weight, index) => {
        aggregated[index] += weight * clientWeight;
      });
    });

    return aggregated.map(w => w / totalWeight);
  }
}

export class MedianAggregator implements AggregationStrategy {
  readonly name = 'median';

  aggregate(models: FederatedModel[]): number[] {
    if (models.length === 0) return [];

    const weightLength = models[0].weights.length;
    const aggregated: number[] = Array(weightLength).fill(0);

    for (let i = 0; i < weightLength; i++) {
      const weights = models.map(model => model.weights[i]).sort((a, b) => a - b);
      const mid = Math.floor(weights.length / 2);

      if (weights.length % 2 === 0) {
        aggregated[i] = (weights[mid - 1] + weights[mid]) / 2;
      } else {
        aggregated[i] = weights[mid];
      }
    }

    return aggregated;
  }
}

export class TrimmedMeanAggregator implements AggregationStrategy {
  readonly name = 'trimmed-mean';
  private trimPercentage: number = 0.2;

  constructor(trimPercentage: number = 0.2) {
    this.trimPercentage = Math.min(Math.max(trimPercentage, 0), 0.5);
  }

  aggregate(models: FederatedModel[]): number[] {
    if (models.length === 0) return [];

    const weightLength = models[0].weights.length;
    const aggregated: number[] = Array(weightLength).fill(0);
    const trimCount = Math.floor(models.length * this.trimPercentage);

    for (let i = 0; i < weightLength; i++) {
      const weights = models
        .map(model => model.weights[i])
        .sort((a, b) => a - b)
        .slice(trimCount, models.length - trimCount);

      const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length;
      aggregated[i] = mean;
    }

    return aggregated;
  }
}

export class FederatedServer {
  private globalWeights: number[];
  private clients: Map<string, FederatedClient> = new Map();
  private aggregator: AggregationStrategy;
  private communicationRounds: number = 0;
  private trainingHistory: { round: number; loss: number; accuracy: number }[] = [];

  constructor(initialWeights: number[], aggregator: AggregationStrategy = new AveragingAggregator()) {
    this.globalWeights = [...initialWeights];
    this.aggregator = aggregator;
  }

  registerClient(client: FederatedClient): void {
    const model = client.getModel();
    this.clients.set(model.id, client);
  }

  unregisterClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  broadcastWeights(clientIds?: string[]): void {
    const targetClients = clientIds || Array.from(this.clients.keys());

    targetClients.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client) {
        client.updateWeights([...this.globalWeights]);
      }
    });
  }

  aggregateModels(): number[] {
    const models = Array.from(this.clients.values()).map(client => client.getModel());
    const aggregated = this.aggregator.aggregate(models);
    return aggregated;
  }

  executeFederatedRound(epochs: number = 1): number[] {
    this.broadcastWeights();

    const clients = Array.from(this.clients.values());
    for (let i = 0; i < epochs; i++) {
      clients.forEach(client => client.trainLocal());
    }

    this.globalWeights = this.aggregateModels();
    this.communicationRounds++;

    return [...this.globalWeights];
  }

  executeFederatedRounds(rounds: number, epochs: number = 1): number[] {
    for (let i = 0; i < rounds; i++) {
      this.executeFederatedRound(epochs);
    }

    return [...this.globalWeights];
  }

  evaluateGlobalModel(testFeatures: number[][], testLabels: number[]): number {
    let correctPredictions = 0;

    for (let i = 0; i < testFeatures.length; i++) {
      const prediction = this.predictWithGlobalModel(testFeatures[i]) > 0.5 ? 1 : 0;
      if (prediction === testLabels[i]) {
        correctPredictions++;
      }
    }

    return correctPredictions / testFeatures.length;
  }

  private predictWithGlobalModel(features: number[]): number {
    return features.reduce((sum, feature, index) => {
      return sum + (this.globalWeights[index] || 0) * feature;
    }, 0);
  }

  recordMetrics(loss: number, accuracy: number): void {
    this.trainingHistory.push({
      round: this.communicationRounds,
      loss,
      accuracy,
    });
  }

  getGlobalWeights(): number[] {
    return [...this.globalWeights];
  }

  getTrainingHistory() {
    return [...this.trainingHistory];
  }

  getCommunicationRounds(): number {
    return this.communicationRounds;
  }

  getAggregationStrategy(): string {
    return this.aggregator.name;
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export class FederatedLearningFramework {
  private server: FederatedServer;
  private clients: Map<string, FederatedClient> = new Map();

  constructor(
    initialWeights: number[],
    aggregationStrategy: AggregationStrategy = new AveragingAggregator()
  ) {
    this.server = new FederatedServer(initialWeights, aggregationStrategy);
  }

  addClient(clientId: string, trainingData: FederatedData): void {
    const client = new FederatedClient(clientId, this.server.getGlobalWeights(), trainingData);
    this.clients.set(clientId, client);
    this.server.registerClient(client);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    this.server.unregisterClient(clientId);
  }

  runTraining(rounds: number, epochs: number = 1): { weights: number[]; rounds: number } {
    const weights = this.server.executeFederatedRounds(rounds, epochs);
    return {
      weights,
      rounds: this.server.getCommunicationRounds(),
    };
  }

  evaluate(testFeatures: number[][], testLabels: number[]): number {
    return this.server.evaluateGlobalModel(testFeatures, testLabels);
  }

  getGlobalModel(): number[] {
    return this.server.getGlobalWeights();
  }

  getMetrics() {
    return {
      globalWeights: this.server.getGlobalWeights(),
      communicationRounds: this.server.getCommunicationRounds(),
      aggregationStrategy: this.server.getAggregationStrategy(),
      clientCount: this.server.getClientCount(),
      trainingHistory: this.server.getTrainingHistory(),
    };
  }
}
