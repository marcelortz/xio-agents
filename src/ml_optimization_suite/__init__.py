"""
ML Optimization Suite - Advanced Metaheuristic Optimization Algorithms

A comprehensive library of 11+ optimization algorithms for hyperparameter tuning,
feature selection, and general optimization problems.

Features:
- 11 metaheuristic algorithms (GA, PSO, SA, ACO, DE, HS, TS, and more)
- scikit-learn compatible API
- Framework integrations (TensorFlow, PyTorch, XGBoost, LightGBM, CatBoost)
- Real-time streaming results
- Export and visualization capabilities
"""

__version__ = "1.0.0"
__author__ = "Claude & Team"
__email__ = "support@ml-optimization-suite.dev"

from .algorithms import (
    GeneticAlgorithm,
    ParticleSwarmOptimizer,
    SimulatedAnnealing,
    AntColonyOptimization,
    DifferentialEvolution,
    HarmonySearch,
    TabuSearch,
)

from .sklearn_wrapper import (
    SKLearnOptimizer,
    GridSearchOptimizer,
    RandomSearchOptimizer,
)

from .framework import (
    TensorFlowOptimizer,
    PyTorchOptimizer,
    XGBoostOptimizer,
    LightGBMOptimizer,
)

__all__ = [
    # Base algorithms
    "GeneticAlgorithm",
    "ParticleSwarmOptimizer",
    "SimulatedAnnealing",
    "AntColonyOptimization",
    "DifferentialEvolution",
    "HarmonySearch",
    "TabuSearch",

    # scikit-learn wrappers
    "SKLearnOptimizer",
    "GridSearchOptimizer",
    "RandomSearchOptimizer",

    # Framework integrations
    "TensorFlowOptimizer",
    "PyTorchOptimizer",
    "XGBoostOptimizer",
    "LightGBMOptimizer",
]
