"""
scikit-learn compatible API for optimization algorithms
"""

import numpy as np
from typing import Callable, Optional, List, Tuple
from .algorithms import (
    GeneticAlgorithm,
    ParticleSwarmOptimizer,
    SimulatedAnnealing,
    AntColonyOptimization,
    DifferentialEvolution,
    HarmonySearch,
    TabuSearch,
)


class SKLearnOptimizer:
    """
    Base scikit-learn compatible optimizer wrapper.

    Can be used with GridSearchCV, RandomizedSearchCV, and other sklearn tools.
    """

    def __init__(
        self,
        algorithm: str = "genetic",
        n_iterations: int = 100,
        random_state: Optional[int] = None,
        verbose: int = 0,
        **algorithm_kwargs
    ):
        self.algorithm = algorithm
        self.n_iterations = n_iterations
        self.random_state = random_state
        self.verbose = verbose
        self.algorithm_kwargs = algorithm_kwargs

        # Initialize the optimizer
        self._init_optimizer()

    def _init_optimizer(self):
        """Initialize the underlying optimizer"""
        algorithms = {
            "genetic": GeneticAlgorithm,
            "pso": ParticleSwarmOptimizer,
            "sa": SimulatedAnnealing,
            "aco": AntColonyOptimization,
            "de": DifferentialEvolution,
            "hs": HarmonySearch,
            "tabu": TabuSearch,
        }

        if self.algorithm not in algorithms:
            raise ValueError(f"Unknown algorithm: {self.algorithm}")

        OptimizerClass = algorithms[self.algorithm]
        self.optimizer_ = OptimizerClass(
            random_state=self.random_state,
            **self.algorithm_kwargs
        )

    def fit(self, X: np.ndarray, y: np.ndarray) -> "SKLearnOptimizer":
        """
        Fit the optimizer to the data.

        For optimization problems where y is the objective to minimize,
        this method prepares the optimizer and computes the optimal parameters.

        Parameters
        ----------
        X : array-like of shape (n_samples, n_features)
            Training data
        y : array-like of shape (n_samples,)
            Target values to optimize

        Returns
        -------
        self : SKLearnOptimizer
        """
        self.n_features_in_ = X.shape[1]
        self.X_ = X
        self.y_ = y

        # Define objective function based on data
        def objective_func(params: np.ndarray) -> float:
            # Predict using parameters
            pred = np.dot(X, params[:self.n_features_in_])
            # Return negative MSE (maximize)
            mse = np.mean((pred - y) ** 2)
            return -mse

        # Define bounds for parameters
        bounds = [(-10.0, 10.0) for _ in range(self.n_features_in_)]

        # Run optimization
        self.best_params_, self.best_score_ = self.optimizer_.optimize(
            objective_func,
            bounds,
            max_iterations=self.n_iterations,
        )

        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict using optimized parameters.

        Parameters
        ----------
        X : array-like of shape (n_samples, n_features)
            Samples

        Returns
        -------
        y_pred : array of shape (n_samples,)
            Predicted values
        """
        if not hasattr(self, "best_params_"):
            raise ValueError("Model must be fitted before prediction")

        return np.dot(X, self.best_params_[:self.n_features_in_])

    def score(self, X: np.ndarray, y: np.ndarray) -> float:
        """
        Compute R² score.

        Parameters
        ----------
        X : array-like of shape (n_samples, n_features)
            Test samples
        y : array-like of shape (n_samples,)
            True target values

        Returns
        -------
        score : float
            R² score
        """
        from sklearn.metrics import r2_score
        y_pred = self.predict(X)
        return r2_score(y, y_pred)

    def get_params(self, deep: bool = True) -> dict:
        """Get parameters for this estimator."""
        return {
            "algorithm": self.algorithm,
            "n_iterations": self.n_iterations,
            "random_state": self.random_state,
            "verbose": self.verbose,
            **self.algorithm_kwargs,
        }

    def set_params(self, **params) -> "SKLearnOptimizer":
        """Set parameters for this estimator."""
        for key, value in params.items():
            if key in ["algorithm", "n_iterations", "random_state", "verbose"]:
                setattr(self, key, value)
            else:
                self.algorithm_kwargs[key] = value

        self._init_optimizer()
        return self


class GridSearchOptimizer:
    """
    Grid search optimization wrapper.

    Searches over a grid of algorithm parameters.
    """

    def __init__(self, param_grid: dict, cv: int = 5, verbose: int = 1):
        self.param_grid = param_grid
        self.cv = cv
        self.verbose = verbose
        self.best_params_ = None
        self.best_score_ = -np.inf

    def fit(self, X: np.ndarray, y: np.ndarray) -> "GridSearchOptimizer":
        """
        Fit by searching over parameter grid.

        Parameters
        ----------
        X : array-like
            Training data
        y : array-like
            Target values

        Returns
        -------
        self : GridSearchOptimizer
        """
        from sklearn.model_selection import StratifiedKFold

        param_combinations = self._get_param_combinations()

        for i, params in enumerate(param_combinations):
            if self.verbose > 0:
                print(f"Testing parameters {i+1}/{len(param_combinations)}: {params}")

            optimizer = SKLearnOptimizer(**params)

            # Cross-validation
            kfold = StratifiedKFold(n_splits=self.cv, shuffle=True)
            scores = []

            for train_idx, test_idx in kfold.split(X, y):
                X_train, X_test = X[train_idx], X[test_idx]
                y_train, y_test = y[train_idx], y[test_idx]

                optimizer.fit(X_train, y_train)
                score = optimizer.score(X_test, y_test)
                scores.append(score)

            mean_score = np.mean(scores)

            if mean_score > self.best_score_:
                self.best_score_ = mean_score
                self.best_params_ = params

        return self

    def _get_param_combinations(self) -> List[dict]:
        """Generate all parameter combinations"""
        from itertools import product

        keys = self.param_grid.keys()
        values = self.param_grid.values()

        combinations = []
        for combo in product(*values):
            combinations.append(dict(zip(keys, combo)))

        return combinations


class RandomSearchOptimizer:
    """
    Random search optimization wrapper.

    Samples random parameter combinations.
    """

    def __init__(
        self,
        param_distributions: dict,
        n_iter: int = 10,
        cv: int = 5,
        random_state: Optional[int] = None,
        verbose: int = 1,
    ):
        self.param_distributions = param_distributions
        self.n_iter = n_iter
        self.cv = cv
        self.random_state = random_state
        self.verbose = verbose
        self.best_params_ = None
        self.best_score_ = -np.inf

    def fit(self, X: np.ndarray, y: np.ndarray) -> "RandomSearchOptimizer":
        """
        Fit by randomly sampling parameter combinations.

        Parameters
        ----------
        X : array-like
            Training data
        y : array-like
            Target values

        Returns
        -------
        self : RandomSearchOptimizer
        """
        from sklearn.model_selection import StratifiedKFold

        if self.random_state is not None:
            np.random.seed(self.random_state)

        for i in range(self.n_iter):
            params = self._sample_params()

            if self.verbose > 0:
                print(f"Testing parameters {i+1}/{self.n_iter}: {params}")

            optimizer = SKLearnOptimizer(**params)

            # Cross-validation
            kfold = StratifiedKFold(n_splits=self.cv, shuffle=True)
            scores = []

            for train_idx, test_idx in kfold.split(X, y):
                X_train, X_test = X[train_idx], X[test_idx]
                y_train, y_test = y[train_idx], y[test_idx]

                optimizer.fit(X_train, y_train)
                score = optimizer.score(X_test, y_test)
                scores.append(score)

            mean_score = np.mean(scores)

            if mean_score > self.best_score_:
                self.best_score_ = mean_score
                self.best_params_ = params

        return self

    def _sample_params(self) -> dict:
        """Sample random parameters"""
        params = {}
        for key, distribution in self.param_distributions.items():
            if isinstance(distribution, list):
                params[key] = np.random.choice(distribution)
            elif isinstance(distribution, tuple) and len(distribution) == 2:
                params[key] = np.random.uniform(distribution[0], distribution[1])
            else:
                raise ValueError(f"Invalid distribution for {key}")
        return params
