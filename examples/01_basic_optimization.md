# Example 1: Basic Optimization

## Overview
This example demonstrates how to use the ML Optimization Suite for basic optimization problems.

## 1. Sphere Function (Benchmark)

The Sphere function is a classic benchmark:
```
f(x) = Σ(x_i²)
```

```python
from ml_optimization_suite import GeneticAlgorithm, ParticleSwarmOptimizer
import numpy as np
import matplotlib.pyplot as plt

# Define objective function
def sphere_function(x):
    return -np.sum(x**2)  # Negative because we maximize

# Test different algorithms
algorithms = [
    ("Genetic Algorithm", GeneticAlgorithm(population_size=50)),
    ("Particle Swarm", ParticleSwarmOptimizer(n_particles=30)),
]

results = {}
bounds = [(-5.0, 5.0) for _ in range(5)]

for name, optimizer in algorithms:
    best_solution, best_fitness = optimizer.optimize(
        sphere_function,
        bounds,
        max_iterations=100
    )
    results[name] = {
        'solution': best_solution,
        'fitness': best_fitness,
        'history': optimizer.get_history()
    }
    print(f"{name}: Best = {best_fitness:.6f}")

# Plot convergence
plt.figure(figsize=(12, 5))
for name, result in results.items():
    history = result['history']
    best_fitnesses = [h['best_fitness'] for h in history]
    plt.plot(best_fitnesses, label=name)

plt.xlabel('Iteration')
plt.ylabel('Best Fitness (Sphere Function)')
plt.legend()
plt.title('Algorithm Convergence Comparison')
plt.grid()
plt.show()
```

## 2. Rosenbrock Function (Complex Landscape)

```python
def rosenbrock(x):
    return -sum(100.0 * (x[i+1] - x[i]**2)**2 + (1 - x[i])**2 
                for i in range(len(x) - 1))

# Requires more iterations for complex function
optimizer = ParticleSwarmOptimizer(n_particles=50, w=0.7)
bounds = [(-2.0, 2.0) for _ in range(10)]

best_solution, best_fitness = optimizer.optimize(
    rosenbrock,
    bounds,
    max_iterations=200
)

print(f"Rosenbrock Best: {best_fitness:.6f}")
print(f"Solution: {best_solution}")
```

## 3. Multi-Modal Rastrigin Function

```python
def rastrigin(x):
    A = 10
    n = len(x)
    return -(A * n + sum(x_i**2 - A * np.cos(2 * np.pi * x_i) 
                         for x_i in x))

# Use Differential Evolution for multi-modal problems
from ml_optimization_suite import DifferentialEvolution

optimizer = DifferentialEvolution(population_size=50, F=0.8, CR=0.9)
bounds = [(-5.12, 5.12) for _ in range(10)]

best_solution, best_fitness = optimizer.optimize(
    rastrigin,
    bounds,
    max_iterations=300
)

print(f"Rastrigin Best: {best_fitness:.6f}")
```

## 4. Real-time Progress Tracking

```python
optimizer = GeneticAlgorithm(population_size=30)
best_solution, best_fitness = optimizer.optimize(
    sphere_function,
    [(-5.0, 5.0) for _ in range(10)],
    max_iterations=100
)

# Access history
history = optimizer.get_history()
print(f"Total iterations: {len(history)}")

for i in [0, 25, 50, 99]:
    record = history[i]
    print(f"Iteration {record['iteration']}: "
          f"Best = {record['best_fitness']:.4f}, "
          f"Mean = {record['mean_fitness']:.4f}")
```

## 5. Different Optimization Strategies

### Strategy 1: Single Long Run
```python
optimizer = ParticleSwarmOptimizer()
best_solution, best_fitness = optimizer.optimize(
    sphere_function,
    bounds,
    max_iterations=500
)
```

### Strategy 2: Multiple Short Runs
```python
best_overall = None
best_overall_fitness = -np.inf

for run in range(5):
    optimizer = ParticleSwarmOptimizer(random_state=run)
    best_sol, best_fit = optimizer.optimize(
        sphere_function,
        bounds,
        max_iterations=100
    )
    if best_fit > best_overall_fitness:
        best_overall = best_sol
        best_overall_fitness = best_fit
        print(f"Run {run}: Found better solution {best_fit:.6f}")

print(f"Best overall: {best_overall_fitness:.6f}")
```

### Strategy 3: Warm Start
```python
# First phase: exploration
optimizer1 = GeneticAlgorithm(population_size=50)
solution1, fitness1 = optimizer1.optimize(sphere_function, bounds, 100)

# Second phase: refinement around best solution
bounds_refined = [(s - 1.0, s + 1.0) for s in solution1]
optimizer2 = SimulatedAnnealing(initial_temp=10.0)
solution2, fitness2 = optimizer2.optimize(
    sphere_function,
    bounds_refined,
    max_iterations=100
)

print(f"Phase 1: {fitness1:.6f}")
print(f"Phase 2: {fitness2:.6f}")
```

## Tips & Best Practices

1. **Choose Algorithm by Problem Type**
   - Continuous: PSO, DE, GA
   - Complex landscape: DE, SA
   - Speed critical: PSO, SA
   - Quality critical: DE, HS

2. **Parameter Tuning**
   - Start with default parameters
   - Increase iterations if not converged
   - Adjust population size based on problem complexity
   - Set random_state for reproducibility

3. **Bounds Definition**
   - Use realistic bounds
   - Tighter bounds = faster convergence
   - Wide bounds = more exploration

4. **Performance Monitoring**
   - Check history for convergence
   - Plot fitness curves
   - Run multiple trials for statistics
   - Track computation time

## Summary
This example showed how to:
- Use different algorithms for optimization
- Define custom objective functions
- Monitor convergence progress
- Apply different optimization strategies
