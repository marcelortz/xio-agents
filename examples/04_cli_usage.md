# Example 4: Command-Line Interface

## Overview
Use the `ml-optimize` CLI tool for quick optimization without writing Python code.

## 1. List Available Algorithms

```bash
ml-optimize list-algorithms
```

Output:
```
📊 Available Algorithms:

  GENETIC
    Genetic Algorithm - Population-based evolutionary algorithm

  PSO
    Particle Swarm Optimization - Social behavior simulation

  SA
    Simulated Annealing - Temperature-based local search

  ACO
    Ant Colony Optimization - Pheromone-based swarm intelligence

  DE
    Differential Evolution - Population-based continuous optimization

  HS
    Harmony Search - Music improvisation inspired algorithm

  TABU
    Tabu Search - Local search with memory
```

## 2. Basic Optimization

### Example: Optimize a 3D Sphere Function

```bash
ml-optimize optimize \
  --algorithm genetic \
  --bounds "[[−5, 5], [−5, 5], [−5, 5]]" \
  --iterations 100
```

Output:
```
🚀 Running GENETIC optimization...
   Iterations: 100
   Dimensions: 3

✅ Optimization Complete!

📈 Results:
   Best Fitness: 0.012345
   Best Solution: [0.0321 -0.0214 0.0087]
   Iterations: 100
```

### With Output Saving

```bash
ml-optimize optimize \
  --algorithm pso \
  --bounds "[[−5, 5], [−5, 5], [−5, 5]]" \
  --iterations 100 \
  --output results.json
```

This creates `results.json` with:
```json
{
  "algorithm": "pso",
  "best_fitness": 0.012345,
  "best_solution": [0.0321, -0.0214, 0.0087],
  "iterations": 100,
  "history": [
    {
      "iteration": 0,
      "best_fitness": 2.456,
      "mean_fitness": 5.234
    },
    ...
  ]
}
```

## 3. Run Benchmark

### Benchmark with Default Settings

```bash
ml-optimize benchmark \
  --algorithm genetic \
  --dimensions 10 \
  --iterations 100
```

Output:
```
🔬 Benchmarking GENETIC
   Function: Sphere (D=10)
   Iterations: 100

Results:
   Best Fitness: 0.087654
   Best Solution: [0.123 -0.234 0.067 ... 0.043]
   Time: 2.34s
   Iterations/sec: 42.74
```

### Compare Multiple Algorithms

```bash
for algo in genetic pso sa de hs tabu; do
  echo "Benchmarking $algo..."
  ml-optimize benchmark \
    --algorithm $algo \
    --dimensions 5 \
    --iterations 50
done
```

## 4. Hyperparameter Tuning with Config Files

### Create Configuration

`config.json`:
```json
{
  "algorithm": "genetic",
  "population_size": 50,
  "mutation_rate": 0.1,
  "crossover_rate": 0.8,
  "max_iterations": 200
}
```

### Run Tuning

```bash
ml-optimize tune \
  --config config.json \
  --data training_data.csv
```

## 5. Export Results to CSV

```bash
ml-optimize optimize \
  --algorithm de \
  --bounds "[[−5, 5], [−5, 5], [−5, 5]]" \
  --iterations 100 \
  --output solution.csv
```

Output `solution.csv`:
```csv
Parameter,Value
x0,0.0123
x1,-0.0456
x2,0.0789
Best Fitness,0.098765
```

## 6. Show Package Information

```bash
ml-optimize info
```

Output:
```
╔════════════════════════════════════════════════════════════════╗
║         ML Optimization Suite v1.0.0                          ║
║     Advanced Metaheuristic Optimization Algorithms           ║
╚════════════════════════════════════════════════════════════════╝

📚 Features:
  • 7 optimization algorithms (GA, PSO, SA, ACO, DE, HS, TS)
  • scikit-learn compatible API
  • Framework integrations (TensorFlow, PyTorch, XGBoost, LightGBM)
  • Real-time streaming results
  • Export and visualization

📖 Usage:
  ml-optimize list-algorithms      # Show available algorithms
  ml-optimize optimize --help       # Run optimization
  ml-optimize benchmark --help      # Run benchmarks
  ml-optimize tune --help           # Hyperparameter tuning

🔗 Links:
  GitHub: https://github.com/marcelortz/xio-agents-2b
  Docs: https://ml-optimization-suite.dev

💡 Quick Start:
  1. Import: from ml_optimization_suite import GeneticAlgorithm
  2. Create: ga = GeneticAlgorithm(population_size=50)
  3. Run: solution, fitness = ga.optimize(objective_func, bounds, max_iterations=100)
```

## 7. Practical Example: Optimize Hyperparameters

### Scenario: Find best learning rate and batch size

```bash
ml-optimize optimize \
  --algorithm pso \
  --bounds "[[0.001, 0.1], [16, 128]]" \
  --iterations 50 \
  --output hyperparams.json
```

Parse results:
```python
import json

with open('hyperparams.json', 'r') as f:
    results = json.load(f)

lr, batch_size = results['best_solution']
print(f"Best learning rate: {lr:.6f}")
print(f"Best batch size: {int(batch_size)}")
```

## 8. Batch Optimization

### Script: `run_experiments.sh`

```bash
#!/bin/bash

# Test different algorithms
for algo in genetic pso de hs; do
    echo "Testing $algo..."
    
    ml-optimize optimize \
        --algorithm $algo \
        --bounds "[[−5, 5], [−5, 5], [−5, 5], [−5, 5], [−5, 5]]" \
        --iterations 100 \
        --output results/${algo}_results.json
    
    echo "$algo complete"
done

echo "All experiments finished!"
```

Run with:
```bash
bash run_experiments.sh
```

## 9. Integration with Python Scripts

### `optimize_and_analyze.py`

```python
import subprocess
import json
import numpy as np
from pathlib import Path

# Run CLI
result = subprocess.run([
    'ml-optimize', 'optimize',
    '--algorithm', 'de',
    '--bounds', '[[−5, 5], [−5, 5], [−5, 5]]',
    '--iterations', '200',
    '--output', 'temp_results.json'
], capture_output=True, text=True)

if result.returncode == 0:
    # Load and analyze results
    with open('temp_results.json', 'r') as f:
        data = json.load(f)
    
    history = data['history']
    fitnesses = [h['best_fitness'] for h in history]
    
    # Plot convergence
    import matplotlib.pyplot as plt
    plt.plot(fitnesses)
    plt.xlabel('Iteration')
    plt.ylabel('Best Fitness')
    plt.title(f"Convergence: {data['algorithm'].upper()}")
    plt.savefig('convergence.png')
    
    print(f"Best fitness: {data['best_fitness']:.6f}")
    print(f"Solution: {data['best_solution']}")
else:
    print(f"Error: {result.stderr}")
```

## 10. Using with GNU Parallel for Parallel Optimization

```bash
# Generate parameter combinations
cat <<EOF | parallel --colsep ',' ml-optimize benchmark --algorithm {1} --dimensions {2} --iterations 100
genetic,5
genetic,10
pso,5
pso,10
de,5
de,10
hs,5
hs,10
EOF
```

## Tips & Tricks

### 1. Quick Testing
```bash
# Test algorithm quickly
ml-optimize benchmark --algorithm pso --dimensions 3 --iterations 20
```

### 2. Detailed Results
```bash
# Save everything
ml-optimize optimize \
  --algorithm genetic \
  --bounds "[[−5, 5], [−5, 5]]" \
  --iterations 500 \
  --output detailed_results.json
```

### 3. Compare Algorithms
```bash
# Create comparison script
for algo in genetic pso sa de; do
  echo "=== $algo ===" >> comparison.txt
  ml-optimize benchmark --algorithm $algo --dimensions 5 --iterations 100 >> comparison.txt
done

cat comparison.txt
```

### 4. Silence Output
```bash
ml-optimize optimize \
  --algorithm pso \
  --bounds "[[−5, 5], [−5, 5]]" \
  --iterations 100 \
  --output results.json 2>/dev/null
```

### 5. Pipe to Other Tools
```bash
# Extract best fitness
ml-optimize optimize \
  --algorithm genetic \
  --bounds "[[−5, 5], [−5, 5]]" \
  --iterations 100 \
  --output - | jq '.best_fitness'
```

## Common Issues

### Issue: "ml-optimize not found"
**Solution:** Install with `pip install ml-optimization-suite`

### Issue: Invalid bounds format
**Solution:** Use JSON format: `"[[min1, max1], [min2, max2]]"`

### Issue: Slow performance
**Solution:** 
- Reduce iterations for testing
- Use faster algorithm (SA, PSO)
- Reduce dimensions

## Summary
The CLI provides:
- Quick algorithm testing without coding
- Batch optimization experiments
- Integration with scripts and pipelines
- Export in multiple formats
- Reproducible benchmarking
