"""
Base optimization algorithms with Python API
"""

import numpy as np
from abc import ABC, abstractmethod
from typing import Callable, Optional, Tuple, List, Dict, Any


class BaseOptimizer(ABC):
    """Base class for all optimizers"""

    def __init__(self, random_state: Optional[int] = None):
        self.random_state = random_state
        self.best_fitness_ = None
        self.best_solution_ = None
        self.history_ = []

    @abstractmethod
    def optimize(
        self,
        objective_func: Callable,
        bounds: List[Tuple[float, float]],
        max_iterations: int = 100,
        **kwargs
    ) -> Tuple[np.ndarray, float]:
        """
        Optimize the objective function within given bounds.

        Parameters
        ----------
        objective_func : callable
            Function to minimize. Takes 1D array, returns scalar.
        bounds : list of tuples
            [(min, max), ...] for each dimension
        max_iterations : int
            Maximum iterations
        **kwargs : dict
            Algorithm-specific parameters

        Returns
        -------
        solution : ndarray
            Best solution found
        fitness : float
            Objective value at best solution
        """
        pass

    def get_history(self) -> List[Dict[str, Any]]:
        """Get optimization history"""
        return self.history_


class GeneticAlgorithm(BaseOptimizer):
    """Genetic Algorithm optimizer"""

    def __init__(
        self,
        population_size: int = 50,
        mutation_rate: float = 0.1,
        crossover_rate: float = 0.8,
        random_state: Optional[int] = None,
    ):
        super().__init__(random_state)
        self.population_size = population_size
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate

    def optimize(
        self,
        objective_func: Callable,
        bounds: List[Tuple[float, float]],
        max_iterations: int = 100,
        **kwargs
    ) -> Tuple[np.ndarray, float]:
        """Genetic Algorithm optimization"""
        if self.random_state is not None:
            np.random.seed(self.random_state)

        dimension = len(bounds)
        bounds_array = np.array(bounds)

        # Initialize population
        population = np.random.uniform(
            bounds_array[:, 0],
            bounds_array[:, 1],
            (self.population_size, dimension),
        )

        for iteration in range(max_iterations):
            # Evaluate fitness
            fitness = np.array([objective_func(ind) for ind in population])

            # Track best
            best_idx = np.argmax(fitness)
            if self.best_fitness_ is None or fitness[best_idx] > self.best_fitness_:
                self.best_fitness_ = fitness[best_idx]
                self.best_solution_ = population[best_idx].copy()

            # Selection (tournament)
            selected = []
            for _ in range(self.population_size):
                idx1, idx2 = np.random.choice(self.population_size, 2, replace=False)
                selected.append(population[idx1 if fitness[idx1] > fitness[idx2] else idx2])

            population = np.array(selected)

            # Crossover and mutation
            new_population = []
            for i in range(0, self.population_size, 2):
                parent1, parent2 = population[i], population[(i + 1) % self.population_size]

                if np.random.rand() < self.crossover_rate:
                    point = np.random.randint(dimension)
                    child1 = np.concatenate([parent1[:point], parent2[point:]])
                    child2 = np.concatenate([parent2[:point], parent1[point:]])
                else:
                    child1, child2 = parent1.copy(), parent2.copy()

                # Mutation
                for child in [child1, child2]:
                    if np.random.rand() < self.mutation_rate:
                        idx = np.random.randint(dimension)
                        child[idx] = np.random.uniform(bounds_array[idx, 0], bounds_array[idx, 1])

                new_population.extend([child1, child2])

            population = np.array(new_population[: self.population_size])

            # Record history
            self.history_.append({
                "iteration": iteration,
                "best_fitness": float(self.best_fitness_),
                "mean_fitness": float(np.mean(fitness)),
            })

        return self.best_solution_, self.best_fitness_


class ParticleSwarmOptimizer(BaseOptimizer):
    """Particle Swarm Optimization"""

    def __init__(
        self,
        n_particles: int = 30,
        w: float = 0.7,
        c1: float = 1.5,
        c2: float = 1.5,
        random_state: Optional[int] = None,
    ):
        super().__init__(random_state)
        self.n_particles = n_particles
        self.w = w
        self.c1 = c1
        self.c2 = c2

    def optimize(
        self,
        objective_func: Callable,
        bounds: List[Tuple[float, float]],
        max_iterations: int = 100,
        **kwargs
    ) -> Tuple[np.ndarray, float]:
        """Particle Swarm Optimization"""
        if self.random_state is not None:
            np.random.seed(self.random_state)

        dimension = len(bounds)
        bounds_array = np.array(bounds)

        # Initialize particles
        position = np.random.uniform(
            bounds_array[:, 0], bounds_array[:, 1], (self.n_particles, dimension)
        )
        velocity = np.random.uniform(-1, 1, (self.n_particles, dimension))

        # Personal best
        pbest_position = position.copy()
        pbest_fitness = np.array([objective_func(p) for p in position])

        # Global best
        best_idx = np.argmax(pbest_fitness)
        gbest_position = pbest_position[best_idx].copy()
        gbest_fitness = pbest_fitness[best_idx]

        self.best_solution_ = gbest_position.copy()
        self.best_fitness_ = gbest_fitness

        for iteration in range(max_iterations):
            for i in range(self.n_particles):
                # Update velocity
                r1 = np.random.rand(dimension)
                r2 = np.random.rand(dimension)
                velocity[i] = (
                    self.w * velocity[i]
                    + self.c1 * r1 * (pbest_position[i] - position[i])
                    + self.c2 * r2 * (gbest_position - position[i])
                )

                # Update position
                position[i] += velocity[i]

                # Boundary check
                position[i] = np.clip(position[i], bounds_array[:, 0], bounds_array[:, 1])

                # Evaluate
                fitness = objective_func(position[i])

                if fitness > pbest_fitness[i]:
                    pbest_fitness[i] = fitness
                    pbest_position[i] = position[i].copy()

                    if fitness > gbest_fitness:
                        gbest_fitness = fitness
                        gbest_position = position[i].copy()
                        self.best_solution_ = gbest_position.copy()
                        self.best_fitness_ = gbest_fitness

            # Record history
            self.history_.append({
                "iteration": iteration,
                "best_fitness": float(gbest_fitness),
                "mean_fitness": float(np.mean(pbest_fitness)),
            })

        return self.best_solution_, self.best_fitness_


class SimulatedAnnealing(BaseOptimizer):
    """Simulated Annealing optimizer"""

    def __init__(
        self,
        initial_temp: float = 100.0,
        cooling_rate: float = 0.95,
        random_state: Optional[int] = None,
    ):
        super().__init__(random_state)
        self.initial_temp = initial_temp
        self.cooling_rate = cooling_rate

    def optimize(
        self,
        objective_func: Callable,
        bounds: List[Tuple[float, float]],
        max_iterations: int = 100,
        **kwargs
    ) -> Tuple[np.ndarray, float]:
        """Simulated Annealing optimization"""
        if self.random_state is not None:
            np.random.seed(self.random_state)

        dimension = len(bounds)
        bounds_array = np.array(bounds)

        # Initialize
        current_solution = np.random.uniform(bounds_array[:, 0], bounds_array[:, 1], dimension)
        current_fitness = objective_func(current_solution)

        self.best_solution_ = current_solution.copy()
        self.best_fitness_ = current_fitness

        temperature = self.initial_temp

        for iteration in range(max_iterations):
            # Generate neighbor
            neighbor = current_solution + np.random.normal(0, 0.1, dimension)
            neighbor = np.clip(neighbor, bounds_array[:, 0], bounds_array[:, 1])

            neighbor_fitness = objective_func(neighbor)

            # Acceptance probability
            if neighbor_fitness > current_fitness or np.random.rand() < np.exp(
                (neighbor_fitness - current_fitness) / (temperature + 1e-10)
            ):
                current_solution = neighbor
                current_fitness = neighbor_fitness

            if current_fitness > self.best_fitness_:
                self.best_solution_ = current_solution.copy()
                self.best_fitness_ = current_fitness

            # Cool down
            temperature *= self.cooling_rate

            # Record history
            self.history_.append({
                "iteration": iteration,
                "best_fitness": float(self.best_fitness_),
                "temperature": float(temperature),
            })

        return self.best_solution_, self.best_fitness_


class AntColonyOptimization(BaseOptimizer):
    """Ant Colony Optimization"""

    def __init__(
        self,
        n_ants: int = 30,
        evaporation_rate: float = 0.1,
        random_state: Optional[int] = None,
    ):
        super().__init__(random_state)
        self.n_ants = n_ants
        self.evaporation_rate = evaporation_rate

    def optimize(
        self,
        objective_func: Callable,
        bounds: List[Tuple[float, float]],
        max_iterations: int = 100,
        **kwargs
    ) -> Tuple[np.ndarray, float]:
        """Ant Colony Optimization"""
        if self.random_state is not None:
            np.random.seed(self.random_state)

        dimension = len(bounds)
        bounds_array = np.array(bounds)

        # Initialize pheromones
        pheromone = np.ones((self.n_ants, dimension))
        self.best_solution_ = None
        self.best_fitness_ = -np.inf

        for iteration in range(max_iterations):
            solutions = []

            for ant in range(self.n_ants):
                # Construct solution based on pheromone
                solution = np.zeros(dimension)
                for d in range(dimension):
                    if np.random.rand() < 0.5:
                        solution[d] = bounds_array[d, 0] + (
                            pheromone[ant, d]
                            / (np.sum(pheromone[:, d]) + 1e-10)
                            * (bounds_array[d, 1] - bounds_array[d, 0])
                        )
                    else:
                        solution[d] = np.random.uniform(bounds_array[d, 0], bounds_array[d, 1])

                solution = np.clip(solution, bounds_array[:, 0], bounds_array[:, 1])
                fitness = objective_func(solution)
                solutions.append((solution, fitness))

                if fitness > self.best_fitness_:
                    self.best_fitness_ = fitness
                    self.best_solution_ = solution.copy()

            # Update pheromone
            pheromone *= 1 - self.evaporation_rate
            for i, (sol, fit) in enumerate(solutions):
                for d in range(dimension):
                    pheromone[i, d] += fit / (1 + np.abs(sol[d]))

            # Record history
            self.history_.append({
                "iteration": iteration,
                "best_fitness": float(self.best_fitness_),
            })

        return self.best_solution_, self.best_fitness_


class DifferentialEvolution(BaseOptimizer):
    """Differential Evolution optimizer"""

    def __init__(
        self,
        population_size: int = 30,
        F: float = 0.8,
        CR: float = 0.9,
        random_state: Optional[int] = None,
    ):
        super().__init__(random_state)
        self.population_size = population_size
        self.F = F
        self.CR = CR

    def optimize(
        self,
        objective_func: Callable,
        bounds: List[Tuple[float, float]],
        max_iterations: int = 100,
        **kwargs
    ) -> Tuple[np.ndarray, float]:
        """Differential Evolution optimization"""
        if self.random_state is not None:
            np.random.seed(self.random_state)

        dimension = len(bounds)
        bounds_array = np.array(bounds)

        # Initialize population
        population = np.random.uniform(
            bounds_array[:, 0],
            bounds_array[:, 1],
            (self.population_size, dimension),
        )

        fitness = np.array([objective_func(ind) for ind in population])

        for iteration in range(max_iterations):
            new_population = population.copy()

            for i in range(self.population_size):
                # Select random individuals
                indices = list(range(self.population_size))
                indices.remove(i)
                a, b, c = np.random.choice(indices, 3, replace=False)

                # Mutation
                mutant = population[a] + self.F * (population[b] - population[c])
                mutant = np.clip(mutant, bounds_array[:, 0], bounds_array[:, 1])

                # Crossover
                trial = population[i].copy()
                for d in range(dimension):
                    if np.random.rand() < self.CR:
                        trial[d] = mutant[d]

                # Selection
                trial_fitness = objective_func(trial)
                if trial_fitness > fitness[i]:
                    new_population[i] = trial
                    fitness[i] = trial_fitness

            population = new_population

            # Track best
            best_idx = np.argmax(fitness)
            if self.best_fitness_ is None or fitness[best_idx] > self.best_fitness_:
                self.best_fitness_ = fitness[best_idx]
                self.best_solution_ = population[best_idx].copy()

            # Record history
            self.history_.append({
                "iteration": iteration,
                "best_fitness": float(self.best_fitness_),
                "mean_fitness": float(np.mean(fitness)),
            })

        return self.best_solution_, self.best_fitness_


class HarmonySearch(BaseOptimizer):
    """Harmony Search optimizer"""

    def __init__(
        self,
        harmony_memory_size: int = 30,
        hmcr: float = 0.9,
        par: float = 0.3,
        random_state: Optional[int] = None,
    ):
        super().__init__(random_state)
        self.harmony_memory_size = harmony_memory_size
        self.hmcr = hmcr  # Harmony Memory Consideration Rate
        self.par = par  # Pitch Adjustment Rate

    def optimize(
        self,
        objective_func: Callable,
        bounds: List[Tuple[float, float]],
        max_iterations: int = 100,
        **kwargs
    ) -> Tuple[np.ndarray, float]:
        """Harmony Search optimization"""
        if self.random_state is not None:
            np.random.seed(self.random_state)

        dimension = len(bounds)
        bounds_array = np.array(bounds)

        # Initialize harmony memory
        harmony_memory = np.random.uniform(
            bounds_array[:, 0],
            bounds_array[:, 1],
            (self.harmony_memory_size, dimension),
        )
        fitness = np.array([objective_func(h) for h in harmony_memory])

        self.best_solution_ = harmony_memory[np.argmax(fitness)].copy()
        self.best_fitness_ = np.max(fitness)

        for iteration in range(max_iterations):
            # Create new harmony
            new_harmony = np.zeros(dimension)

            for d in range(dimension):
                if np.random.rand() < self.hmcr:
                    # From harmony memory
                    idx = np.random.randint(self.harmony_memory_size)
                    new_harmony[d] = harmony_memory[idx, d]

                    # Pitch adjustment
                    if np.random.rand() < self.par:
                        new_harmony[d] += np.random.uniform(-0.01, 0.01)
                else:
                    # Random value
                    new_harmony[d] = np.random.uniform(bounds_array[d, 0], bounds_array[d, 1])

            new_harmony = np.clip(new_harmony, bounds_array[:, 0], bounds_array[:, 1])
            new_fitness = objective_func(new_harmony)

            # Update harmony memory
            worst_idx = np.argmin(fitness)
            if new_fitness > fitness[worst_idx]:
                harmony_memory[worst_idx] = new_harmony
                fitness[worst_idx] = new_fitness

            # Track best
            if new_fitness > self.best_fitness_:
                self.best_fitness_ = new_fitness
                self.best_solution_ = new_harmony.copy()

            # Record history
            self.history_.append({
                "iteration": iteration,
                "best_fitness": float(self.best_fitness_),
                "mean_fitness": float(np.mean(fitness)),
            })

        return self.best_solution_, self.best_fitness_


class TabuSearch(BaseOptimizer):
    """Tabu Search optimizer"""

    def __init__(
        self,
        tabu_tenure: int = 10,
        random_state: Optional[int] = None,
    ):
        super().__init__(random_state)
        self.tabu_tenure = tabu_tenure

    def optimize(
        self,
        objective_func: Callable,
        bounds: List[Tuple[float, float]],
        max_iterations: int = 100,
        **kwargs
    ) -> Tuple[np.ndarray, float]:
        """Tabu Search optimization"""
        if self.random_state is not None:
            np.random.seed(self.random_state)

        dimension = len(bounds)
        bounds_array = np.array(bounds)

        # Initialize
        current_solution = np.random.uniform(bounds_array[:, 0], bounds_array[:, 1], dimension)
        current_fitness = objective_func(current_solution)

        self.best_solution_ = current_solution.copy()
        self.best_fitness_ = current_fitness

        tabu_list = []

        for iteration in range(max_iterations):
            # Generate neighbors
            best_neighbor = None
            best_neighbor_fitness = -np.inf

            for _ in range(10):
                neighbor = current_solution + np.random.normal(0, 0.2, dimension)
                neighbor = np.clip(neighbor, bounds_array[:, 0], bounds_array[:, 1])

                neighbor_hash = tuple(np.round(neighbor, 4))

                if neighbor_hash not in tabu_list:
                    neighbor_fitness = objective_func(neighbor)

                    if neighbor_fitness > best_neighbor_fitness:
                        best_neighbor_fitness = neighbor_fitness
                        best_neighbor = neighbor

            if best_neighbor is not None:
                current_solution = best_neighbor
                current_fitness = best_neighbor_fitness

                # Add to tabu list
                tabu_list.append(tuple(np.round(current_solution, 4)))
                if len(tabu_list) > self.tabu_tenure:
                    tabu_list.pop(0)

            if current_fitness > self.best_fitness_:
                self.best_fitness_ = current_fitness
                self.best_solution_ = current_solution.copy()

            # Record history
            self.history_.append({
                "iteration": iteration,
                "best_fitness": float(self.best_fitness_),
                "tabu_list_size": len(tabu_list),
            })

        return self.best_solution_, self.best_fitness_
