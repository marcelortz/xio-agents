# ML Optimization Suite

[![Python Version](https://img.shields.io/badge/python-3.8+-blue)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![PyPI Status](https://img.shields.io/badge/status-coming%20soon-orange)](https://pypi.org)

A production-ready Python library of advanced metaheuristic optimization algorithms for hyperparameter tuning, feature selection, and general optimization problems.

## 🚀 Features

### ✨ 7+ Optimization Algorithms
- **Genetic Algorithm (GA)** - Population-based evolutionary optimization
- **Particle Swarm Optimization (PSO)** - Social behavior simulation
- **Simulated Annealing (SA)** - Temperature-based local search
- **Ant Colony Optimization (ACO)** - Pheromone-based swarm intelligence
- **Differential Evolution (DE)** - Continuous optimization with mutation
- **Harmony Search (HS)** - Music improvisation inspired algorithm
- **Tabu Search (TS)** - Local search with memory mechanism

### 🔧 Framework Integration
- **scikit-learn** - BaseEstimator compatibility, GridSearchCV support
- **TensorFlow/Keras** - Hyperparameter tuning callbacks
- **PyTorch** - Optimizer wrapper for model hyperparameters
- **XGBoost** - Advanced hyperparameter optimization
- **LightGBM** - Gradient boosting hyperparameter tuning

### 📊 Advanced Features
- Real-time optimization progress tracking
- Convergence history and statistics
- Export results (JSON, CSV, PNG)
- Session management and persistence
- Command-line interface
- Comprehensive documentation

## 📦 Installation

### From PyPI
```bash
pip install ml-optimization-suite
```

### From Source
```bash
git clone https://github.com/marcelortz/xio-agents-2b.git
cd xio-agents-2b
pip install -e .
```

### Optional Dependencies
```bash
# scikit-learn integration
pip install ml-optimization-suite[sklearn]

# Deep learning frameworks
pip install ml-optimization-suite[tensorflow,torch]

# Gradient boosting
pip install ml-optimization-suite[xgboost,lightgbm]

# Development
pip install ml-optimization-suite[dev]

# Documentation
pip install ml-optimization-suite[docs]
```

## 🎯 Quick Start

### Basic Usage
```python
from ml_optimization_suite import GeneticAlgorithm
import numpy as np

# Define objective function (minimize Sphere function)
def sphere_function(x):
    return -np.sum(x**2)  # Negative for maximization

# Create optimizer
ga = GeneticAlgorithm(
    population_size=50,
    mutation_rate=0.1,
    crossover_rate=0.8,
    random_state=42
)

# Set bounds for each dimension
bounds = [(-5.0, 5.0) for _ in range(10)]

# Run optimization
best_solution, best_fitness = ga.optimize(
    objective_func=sphere_function,
    bounds=bounds,
    max_iterations=100
)

print(f"Best solution: {best_solution}")
print(f"Best fitness: {best_fitness}")

# Access history
history = ga.get_history()
```

### scikit-learn Compatible
```python
from ml_optimization_suite import SKLearnOptimizer
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split

# Load data
X, y = make_classification(n_samples=100, n_features=20, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Create optimizer (scikit-learn compatible)
optimizer = SKLearnOptimizer(
    algorithm='genetic',
    n_iterations=50,
    population_size=30
)

# Fit and score
optimizer.fit(X_train, y_train)
score = optimizer.score(X_test, y_test)
print(f"R² Score: {score}")
```

### Hyperparameter Tuning with GridSearch
```python
from ml_optimization_suite import GridSearchOptimizer
from sklearn.datasets import make_regression

X, y = make_regression(n_samples=200, n_features=15)

# Define parameter grid
param_grid = {
    'algorithm': ['genetic', 'pso', 'de'],
    'n_iterations': [50, 100, 200],
    'population_size': [30, 50]
}

# Run grid search
grid_search = GridSearchOptimizer(param_grid=param_grid, cv=5)
grid_search.fit(X, y)

print(f"Best parameters: {grid_search.best_params_}")
print(f"Best score: {grid_search.best_score_}")
```

### XGBoost Hyperparameter Optimization
```python
from ml_optimization_suite.framework import XGBoostOptimizer
from sklearn.datasets import make_classification

X, y = make_classification(n_samples=1000, n_features=30)

# Define bounds for XGBoost parameters
param_bounds = {
    'max_depth': (3, 10),
    'learning_rate': (0.01, 0.3),
    'subsample': (0.6, 1.0),
    'colsample_bytree': (0.6, 1.0),
}

# Create optimizer
xgb_opt = XGBoostOptimizer(param_bounds=param_bounds, n_iterations=30)
best_params = xgb_opt.optimize_hyperparameters(X, y)

print(f"Best XGBoost parameters: {best_params}")
```

### TensorFlow/Keras Integration
```python
from ml_optimization_suite.framework import TensorFlowOptimizer
from tensorflow import keras
import numpy as np

# Create model
model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(20,)),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dense(1)
])

# Define hyperparameter bounds
param_bounds = {
    'epochs': (10, 50),
    'batch_size': (16, 64),
    'learning_rate': (0.0001, 0.01),
}

# Optimize
tf_opt = TensorFlowOptimizer(param_bounds=param_bounds)
best_params = tf_opt.optimize_hyperparameters(
    model, X_train, y_train, X_val, y_val
)

print(f"Best hyperparameters: {best_params}")
```

## 🛠️ Command-Line Interface

### List Available Algorithms
```bash
ml-optimize list-algorithms
```

### Run Optimization
```bash
ml-optimize optimize \
  --algorithm genetic \
  --bounds "[[−5, 5], [−5, 5], [−5, 5]]" \
  --iterations 100 \
  --output results.json
```

### Run Benchmark
```bash
ml-optimize benchmark \
  --algorithm pso \
  --dimensions 10 \
  --iterations 100
```

### Show Information
```bash
ml-optimize info
```

## 📚 Documentation

### Algorithm Comparison

| Algorithm | Speed | Quality | Best For |
|-----------|-------|---------|----------|
| Genetic Algorithm | Medium | High | General optimization |
| PSO | Fast | High | Continuous optimization |
| Simulated Annealing | Very Fast | Medium | Local search |
| ACO | Medium | Medium | Combinatorial problems |
| Differential Evolution | Medium | Very High | Complex landscapes |
| Harmony Search | Fast | High | Resource-constrained |
| Tabu Search | Medium | High | Discrete optimization |

### Parameters by Algorithm

**Genetic Algorithm**
- `population_size` (int): Size of population (default: 50)
- `mutation_rate` (float): Probability of mutation (0-1, default: 0.1)
- `crossover_rate` (float): Probability of crossover (0-1, default: 0.8)

**Particle Swarm Optimizer**
- `n_particles` (int): Number of particles (default: 30)
- `w` (float): Inertia weight (default: 0.7)
- `c1` (float): Cognitive parameter (default: 1.5)
- `c2` (float): Social parameter (default: 1.5)

**Simulated Annealing**
- `initial_temp` (float): Starting temperature (default: 100.0)
- `cooling_rate` (float): Temperature decay rate (default: 0.95)

**And more...**

## 🔬 Advanced Topics

### Custom Objective Functions
```python
# Multi-modal function
def rosenbrock(x):
    return -sum(100*(x[i+1]-x[i]**2)**2 + (1-x[i])**2 
                for i in range(len(x)-1))

bounds = [(-2.0, 2.0) for _ in range(10)]
optimizer = ParticleSwarmOptimizer(n_particles=50)
best_solution, best_fitness = optimizer.optimize(rosenbrock, bounds, 200)
```

### Parallel Optimization
```python
from multiprocessing import Pool

def optimize_with_seed(seed):
    optimizer = DifferentialEvolution(random_state=seed)
    return optimizer.optimize(objective, bounds, 100)

seeds = range(10)
with Pool(4) as pool:
    results = pool.map(optimize_with_seed, seeds)
```

### Real-time Progress Tracking
```python
optimizer = GeneticAlgorithm()
best_solution, best_fitness = optimizer.optimize(
    objective_func, bounds, max_iterations=100
)

# Access history
for iteration, record in enumerate(optimizer.get_history()):
    print(f"Iteration {record['iteration']}: "
          f"Best = {record['best_fitness']:.4f}, "
          f"Mean = {record['mean_fitness']:.4f}")
```

## 🎓 Examples

Complete examples with Jupyter notebooks:
- Basic optimization workflow
- scikit-learn integration
- Framework-specific tutorials (TensorFlow, PyTorch, XGBoost)
- Hyperparameter tuning strategies
- Performance benchmarking

See `examples/` directory for detailed notebooks.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with NumPy, SciPy, and scikit-learn inspiration.

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/marcelortz/xio-agents-2b/issues)
- **Documentation**: [Full docs](https://ml-optimization-suite.dev)
- **Email**: support@ml-optimization-suite.dev

---

**Happy Optimizing! 🎯**
