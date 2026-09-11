export interface Individual {
  genes: number[];
  fitness: number;
}

export class GeneticAlgorithm {
  private populationSize: number;
  private mutationRate: number;
  private crossoverRate: number;
  private maxGenerations: number;

  constructor(
    populationSize: number = 50,
    mutationRate: number = 0.1,
    crossoverRate: number = 0.8,
    maxGenerations: number = 100
  ) {
    this.populationSize = populationSize;
    this.mutationRate = mutationRate;
    this.crossoverRate = crossoverRate;
    this.maxGenerations = maxGenerations;
  }

  private createIndividual(geneLength: number): Individual {
    return {
      genes: Array.from({ length: geneLength }, () => Math.random()),
      fitness: 0,
    };
  }

  private initializePopulation(geneLength: number): Individual[] {
    return Array.from({ length: this.populationSize }, () =>
      this.createIndividual(geneLength)
    );
  }

  private evaluateFitness(
    individual: Individual,
    fitnessFunction: (genes: number[]) => number
  ): void {
    individual.fitness = fitnessFunction(individual.genes);
  }

  private selectParent(population: Individual[]): Individual {
    // Tournament selection
    const tournamentSize = Math.max(3, Math.floor(this.populationSize * 0.1));
    let best = population[Math.floor(Math.random() * population.length)];

    for (let i = 1; i < tournamentSize; i++) {
      const candidate = population[Math.floor(Math.random() * population.length)];
      if (candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    return best;
  }

  private crossover(parent1: Individual, parent2: Individual): Individual {
    if (Math.random() > this.crossoverRate) {
      return { ...parent1, genes: [...parent1.genes] };
    }

    const crossoverPoint = Math.floor(parent1.genes.length / 2);
    const genes = [
      ...parent1.genes.slice(0, crossoverPoint),
      ...parent2.genes.slice(crossoverPoint),
    ];

    return { genes, fitness: 0 };
  }

  private mutate(individual: Individual): void {
    for (let i = 0; i < individual.genes.length; i++) {
      if (Math.random() < this.mutationRate) {
        individual.genes[i] = Math.random();
      }
    }
  }

  optimize(
    geneLength: number,
    fitnessFunction: (genes: number[]) => number
  ): number[] {
    let population = this.initializePopulation(geneLength);

    for (let generation = 0; generation < this.maxGenerations; generation++) {
      // Evaluate fitness
      population.forEach(ind => this.evaluateFitness(ind, fitnessFunction));

      // Sort by fitness (descending)
      population.sort((a, b) => b.fitness - a.fitness);

      // Create new generation
      const newPopulation: Individual[] = [];

      // Elitism: keep top 10%
      const eliteSize = Math.max(1, Math.floor(this.populationSize * 0.1));
      for (let i = 0; i < eliteSize; i++) {
        newPopulation.push({
          genes: [...population[i].genes],
          fitness: population[i].fitness,
        });
      }

      // Fill rest with crossover and mutation
      while (newPopulation.length < this.populationSize) {
        const parent1 = this.selectParent(population);
        const parent2 = this.selectParent(population);
        const child = this.crossover(parent1, parent2);
        this.mutate(child);
        newPopulation.push(child);
      }

      population = newPopulation;
    }

    // Return best solution
    population.forEach(ind => this.evaluateFitness(ind, fitnessFunction));
    population.sort((a, b) => b.fitness - a.fitness);
    return population[0].genes;
  }
}

export class ParticleSwarmOptimizer {
  private numParticles: number;
  private maxIterations: number;
  private inertia: number = 0.7;
  private cognitiveCoeff: number = 1.5;
  private socialCoeff: number = 1.5;

  constructor(
    numParticles: number = 30,
    maxIterations: number = 100
  ) {
    this.numParticles = numParticles;
    this.maxIterations = maxIterations;
  }

  optimize(
    dimensionality: number,
    fitnessFunction: (position: number[]) => number
  ): number[] {
    const particles = Array.from({ length: this.numParticles }, () => ({
      position: Array.from({ length: dimensionality }, () => Math.random()),
      velocity: Array.from({ length: dimensionality }, () =>
        (Math.random() - 0.5) * 2
      ),
      bestPosition: Array.from({ length: dimensionality }, () => Math.random()),
      bestFitness: -Infinity,
    }));

    let globalBest = particles[0].bestPosition;
    let globalBestFitness = -Infinity;

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      for (const particle of particles) {
        const fitness = fitnessFunction(particle.position);

        if (fitness > particle.bestFitness) {
          particle.bestFitness = fitness;
          particle.bestPosition = [...particle.position];
        }

        if (fitness > globalBestFitness) {
          globalBestFitness = fitness;
          globalBest = [...particle.position];
        }
      }

      // Update velocities and positions
      for (const particle of particles) {
        for (let d = 0; d < dimensionality; d++) {
          const r1 = Math.random();
          const r2 = Math.random();

          particle.velocity[d] =
            this.inertia * particle.velocity[d] +
            this.cognitiveCoeff * r1 * (particle.bestPosition[d] - particle.position[d]) +
            this.socialCoeff * r2 * (globalBest[d] - particle.position[d]);

          particle.position[d] += particle.velocity[d];
          particle.position[d] = Math.max(0, Math.min(1, particle.position[d]));
        }
      }
    }

    return globalBest;
  }
}
