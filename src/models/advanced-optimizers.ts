export class SimulatedAnnealing {
  private initialTemperature: number;
  private coolingRate: number;
  private minTemperature: number;

  constructor(
    initialTemperature: number = 100,
    coolingRate: number = 0.95,
    minTemperature: number = 0.01
  ) {
    this.initialTemperature = initialTemperature;
    this.coolingRate = coolingRate;
    this.minTemperature = minTemperature;
  }

  private calculateAcceptanceProbability(
    currentEnergy: number,
    newEnergy: number,
    temperature: number
  ): number {
    if (newEnergy < currentEnergy) {
      return 1.0;
    }
    return Math.exp(-(newEnergy - currentEnergy) / temperature);
  }

  optimize(
    solutionDimension: number,
    objectiveFunction: (solution: number[]) => number,
    minimize: boolean = true
  ): number[] {
    let currentSolution = Array.from({ length: solutionDimension }, () => Math.random());
    let currentEnergy = objectiveFunction(currentSolution);
    let bestSolution = [...currentSolution];
    let bestEnergy = currentEnergy;

    let temperature = this.initialTemperature;

    while (temperature > this.minTemperature) {
      // Generate neighbor solution
      const newSolution = [...currentSolution];
      const changeIndex = Math.floor(Math.random() * solutionDimension);
      const perturbation = (Math.random() - 0.5) * 2 * temperature / this.initialTemperature;
      newSolution[changeIndex] = Math.max(0, Math.min(1, newSolution[changeIndex] + perturbation));

      const newEnergy = objectiveFunction(newSolution);

      // Accept or reject
      const energyDifference = minimize ? newEnergy - currentEnergy : currentEnergy - newEnergy;

      if (energyDifference < 0 || Math.random() < this.calculateAcceptanceProbability(
        minimize ? currentEnergy : -currentEnergy,
        minimize ? newEnergy : -newEnergy,
        temperature
      )) {
        currentSolution = newSolution;
        currentEnergy = newEnergy;

        if (minimize ? newEnergy < bestEnergy : newEnergy > bestEnergy) {
          bestSolution = [...newSolution];
          bestEnergy = newEnergy;
        }
      }

      temperature *= this.coolingRate;
    }

    return bestSolution;
  }
}

export class AntColonyOptimization {
  private numAnts: number;
  private numIterations: number;
  private evaporationRate: number;
  private pheromoneWeight: number;
  private heuristicWeight: number;

  constructor(
    numAnts: number = 30,
    numIterations: number = 100,
    evaporationRate: number = 0.1,
    pheromoneWeight: number = 1.0,
    heuristicWeight: number = 1.0
  ) {
    this.numAnts = numAnts;
    this.numIterations = numIterations;
    this.evaporationRate = evaporationRate;
    this.pheromoneWeight = pheromoneWeight;
    this.heuristicWeight = heuristicWeight;
  }

  optimize(
    dimension: number,
    objectiveFunction: (solution: number[]) => number
  ): number[] {
    // Initialize pheromone trails
    const pheromone = Array(dimension).fill(1.0);
    let bestSolution = Array.from({ length: dimension }, () => Math.random());
    let bestFitness = objectiveFunction(bestSolution);

    for (let iteration = 0; iteration < this.numIterations; iteration++) {
      const solutions: number[][] = [];
      const fitnesses: number[] = [];

      // Construct solutions for each ant
      for (let ant = 0; ant < this.numAnts; ant++) {
        const solution = Array(dimension).fill(0);

        for (let i = 0; i < dimension; i++) {
          const pheromoneInfluence = Math.pow(pheromone[i], this.pheromoneWeight);
          const heuristicInfluence = Math.pow(1.0 / (Math.abs(pheromone[i] - 0.5) + 0.1), this.heuristicWeight);

          const probability = pheromoneInfluence * heuristicInfluence;
          solution[i] = Math.random() < (probability / (probability + 1)) ?
            Math.random() :
            1 - Math.random();
        }

        solutions.push(solution);
        const fitness = objectiveFunction(solution);
        fitnesses.push(fitness);

        if (fitness > bestFitness) {
          bestFitness = fitness;
          bestSolution = [...solution];
        }
      }

      // Update pheromone
      pheromone.forEach((_, i) => {
        pheromone[i] *= (1 - this.evaporationRate);
      });

      for (let ant = 0; ant < this.numAnts; ant++) {
        const pheromoneDeposit = fitnesses[ant];
        for (let i = 0; i < dimension; i++) {
          pheromone[i] += solutions[ant][i] * pheromoneDeposit / this.numAnts;
        }
      }

      // Limit pheromone levels
      pheromone.forEach((_, i) => {
        pheromone[i] = Math.max(0.1, Math.min(10, pheromone[i]));
      });
    }

    return bestSolution;
  }
}

export class DifferentialEvolution {
  private populationSize: number;
  private maxGenerations: number;
  private scaleF: number;
  private crossoverRate: number;

  constructor(
    populationSize: number = 50,
    maxGenerations: number = 100,
    scaleF: number = 0.8,
    crossoverRate: number = 0.9
  ) {
    this.populationSize = populationSize;
    this.maxGenerations = maxGenerations;
    this.scaleF = scaleF;
    this.crossoverRate = crossoverRate;
  }

  optimize(
    dimension: number,
    objectiveFunction: (solution: number[]) => number
  ): number[] {
    // Initialize population
    const population = Array.from({ length: this.populationSize }, () =>
      Array.from({ length: dimension }, () => Math.random())
    );

    let fitnesses = population.map(ind => objectiveFunction(ind));
    let bestIndex = fitnesses.indexOf(Math.max(...fitnesses));
    let bestSolution = [...population[bestIndex]];

    for (let generation = 0; generation < this.maxGenerations; generation++) {
      const newPopulation = [];

      for (let i = 0; i < this.populationSize; i++) {
        // Select three random individuals
        let r1, r2, r3;
        do {
          r1 = Math.floor(Math.random() * this.populationSize);
        } while (r1 === i);

        do {
          r2 = Math.floor(Math.random() * this.populationSize);
        } while (r2 === i || r2 === r1);

        do {
          r3 = Math.floor(Math.random() * this.populationSize);
        } while (r3 === i || r3 === r1 || r3 === r2);

        // Mutation
        const mutant = Array(dimension).fill(0);
        for (let j = 0; j < dimension; j++) {
          mutant[j] = population[r1][j] +
            this.scaleF * (population[r2][j] - population[r3][j]);
          mutant[j] = Math.max(0, Math.min(1, mutant[j]));
        }

        // Crossover
        const trial = [...population[i]];
        const crossoverPoint = Math.floor(Math.random() * dimension);
        for (let j = crossoverPoint; j < dimension; j++) {
          if (Math.random() < this.crossoverRate) {
            trial[j] = mutant[j];
          }
        }

        const trialFitness = objectiveFunction(trial);
        if (trialFitness > fitnesses[i]) {
          newPopulation.push(trial);
          fitnesses[i] = trialFitness;

          if (trialFitness > fitnesses[bestIndex]) {
            bestIndex = i;
            bestSolution = [...trial];
          }
        } else {
          newPopulation.push(population[i]);
        }
      }

      population.splice(0, this.populationSize, ...newPopulation);
    }

    return bestSolution;
  }
}

export class HarmonySearch {
  private harmonyMemorySize: number;
  private maxImprovisation: number;
  private harmonyMemoryConsiderationRate: number;
  private pitchAdjustmentRate: number;

  constructor(
    harmonyMemorySize: number = 30,
    maxImprovisation: number = 100,
    harmonyMemoryConsiderationRate: number = 0.9,
    pitchAdjustmentRate: number = 0.3
  ) {
    this.harmonyMemorySize = harmonyMemorySize;
    this.maxImprovisation = maxImprovisation;
    this.harmonyMemoryConsiderationRate = harmonyMemoryConsiderationRate;
    this.pitchAdjustmentRate = pitchAdjustmentRate;
  }

  optimize(
    dimension: number,
    objectiveFunction: (harmony: number[]) => number
  ): number[] {
    // Initialize harmony memory
    const harmonyMemory = Array.from({ length: this.harmonyMemorySize }, () =>
      Array.from({ length: dimension }, () => Math.random())
    );

    const fitnesses = harmonyMemory.map(h => objectiveFunction(h));
    let bestIndex = fitnesses.indexOf(Math.max(...fitnesses));

    for (let improvisation = 0; improvisation < this.maxImprovisation; improvisation++) {
      const newHarmony = Array(dimension).fill(0);

      for (let j = 0; j < dimension; j++) {
        const rand = Math.random();

        if (rand < this.harmonyMemoryConsiderationRate) {
          // Select from harmony memory
          const randomIndex = Math.floor(Math.random() * this.harmonyMemorySize);
          newHarmony[j] = harmonyMemory[randomIndex][j];

          // Pitch adjustment
          if (Math.random() < this.pitchAdjustmentRate) {
            newHarmony[j] += (Math.random() - 0.5) * 0.2;
            newHarmony[j] = Math.max(0, Math.min(1, newHarmony[j]));
          }
        } else {
          // Random selection
          newHarmony[j] = Math.random();
        }
      }

      const newFitness = objectiveFunction(newHarmony);
      const worstIndex = fitnesses.indexOf(Math.min(...fitnesses));

      if (newFitness > fitnesses[worstIndex]) {
        harmonyMemory[worstIndex] = newHarmony;
        fitnesses[worstIndex] = newFitness;

        if (newFitness > fitnesses[bestIndex]) {
          bestIndex = worstIndex;
        }
      }
    }

    return harmonyMemory[bestIndex];
  }
}

export class TabuSearch {
  private maxIterations: number;
  private tabuTenure: number;
  private neighborhoodSize: number;

  constructor(
    maxIterations: number = 100,
    tabuTenure: number = 10,
    neighborhoodSize: number = 20
  ) {
    this.maxIterations = maxIterations;
    this.tabuTenure = tabuTenure;
    this.neighborhoodSize = neighborhoodSize;
  }

  optimize(
    dimension: number,
    objectiveFunction: (solution: number[]) => number
  ): number[] {
    let currentSolution = Array.from({ length: dimension }, () => Math.random());
    let currentFitness = objectiveFunction(currentSolution);
    let bestSolution = [...currentSolution];
    let bestFitness = currentFitness;

    const tabuList: string[] = [];

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      let bestNeighbor = null;
      let bestNeighborFitness = -Infinity;

      // Generate neighbors
      for (let n = 0; n < this.neighborhoodSize; n++) {
        const neighbor = [...currentSolution];
        const changeIndices: number[] = [];
        const numChanges = Math.floor(Math.random() * dimension / 2) + 1;

        for (let c = 0; c < numChanges; c++) {
          const idx = Math.floor(Math.random() * dimension);
          if (!changeIndices.includes(idx)) {
            changeIndices.push(idx);
            neighbor[idx] = Math.random();
          }
        }

        const neighborKey = neighbor.join(',');
        const isTabu = tabuList.includes(neighborKey);
        const neighborFitness = objectiveFunction(neighbor);

        if (!isTabu && neighborFitness > bestNeighborFitness) {
          bestNeighbor = neighbor;
          bestNeighborFitness = neighborFitness;
        }
      }

      if (bestNeighbor) {
        currentSolution = bestNeighbor;
        currentFitness = bestNeighborFitness;

        if (currentFitness > bestFitness) {
          bestSolution = [...currentSolution];
          bestFitness = currentFitness;
        }

        // Update tabu list
        const solutionKey = currentSolution.join(',');
        tabuList.push(solutionKey);
        if (tabuList.length > this.tabuTenure) {
          tabuList.shift();
        }
      }
    }

    return bestSolution;
  }
}
