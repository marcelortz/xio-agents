"""
Framework-specific integration adapters for optimization algorithms
"""

import numpy as np
from typing import Optional, Callable, Dict, Any
from .algorithms import BaseOptimizer


class TensorFlowOptimizer:
    """TensorFlow/Keras callback for hyperparameter optimization"""

    def __init__(
        self,
        optimizer_class: type = None,
        param_bounds: Dict[str, tuple] = None,
        n_iterations: int = 50,
    ):
        """
        Initialize TensorFlow optimizer callback.

        Parameters
        ----------
        optimizer_class : type
            BaseOptimizer subclass to use
        param_bounds : dict
            Parameter bounds for optimization
        n_iterations : int
            Number of optimization iterations
        """
        self.optimizer_class = optimizer_class
        self.param_bounds = param_bounds or {}
        self.n_iterations = n_iterations
        self.best_params = None
        self.best_loss = np.inf

    def optimize_hyperparameters(self, model, X_train, y_train, X_val, y_val):
        """
        Optimize model hyperparameters.

        Parameters
        ----------
        model : keras.Model
            Model to optimize
        X_train, y_train : arrays
            Training data
        X_val, y_val : arrays
            Validation data

        Returns
        -------
        best_params : dict
            Optimal hyperparameters
        """
        from .algorithms import GeneticAlgorithm

        if self.optimizer_class is None:
            self.optimizer_class = GeneticAlgorithm

        optimizer = self.optimizer_class(random_state=42)

        # Build objective function
        param_names = list(self.param_bounds.keys())
        bounds = [self.param_bounds[name] for name in param_names]

        def objective(params):
            """Training loss for given hyperparameters"""
            # Map parameters to model config
            param_dict = dict(zip(param_names, params))

            # Update model with new hyperparameters
            # This is a simplified example
            try:
                model.compile(
                    optimizer=param_dict.get("optimizer", "adam"),
                    loss=param_dict.get("loss", "mse"),
                )

                history = model.fit(
                    X_train,
                    y_train,
                    validation_data=(X_val, y_val),
                    epochs=int(param_dict.get("epochs", 10)),
                    batch_size=int(param_dict.get("batch_size", 32)),
                    verbose=0,
                )

                return -history.history["val_loss"][-1]  # Negative for maximization
            except Exception:
                return 0.0

        # Run optimization
        self.best_params_array, _ = optimizer.optimize(
            objective,
            bounds,
            max_iterations=self.n_iterations,
        )

        self.best_params = dict(zip(param_names, self.best_params_array))
        return self.best_params


class PyTorchOptimizer:
    """PyTorch optimizer wrapper for hyperparameter tuning"""

    def __init__(
        self,
        optimizer_class: type = None,
        param_bounds: Dict[str, tuple] = None,
        n_iterations: int = 50,
    ):
        """Initialize PyTorch optimizer"""
        self.optimizer_class = optimizer_class
        self.param_bounds = param_bounds or {}
        self.n_iterations = n_iterations
        self.best_params = None
        self.best_loss = np.inf

    def optimize_hyperparameters(self, model, train_loader, val_loader, device="cpu"):
        """
        Optimize PyTorch model hyperparameters.

        Parameters
        ----------
        model : torch.nn.Module
            Model to optimize
        train_loader : DataLoader
            Training data loader
        val_loader : DataLoader
            Validation data loader
        device : str
            Device to run on

        Returns
        -------
        best_params : dict
            Optimal hyperparameters
        """
        from .algorithms import ParticleSwarmOptimizer

        if self.optimizer_class is None:
            self.optimizer_class = ParticleSwarmOptimizer

        optimizer = self.optimizer_class(random_state=42)

        param_names = list(self.param_bounds.keys())
        bounds = [self.param_bounds[name] for name in param_names]

        def objective(params):
            """Validation loss for given hyperparameters"""
            param_dict = dict(zip(param_names, params))

            try:
                import torch

                # Create optimizer with new learning rate
                lr = param_dict.get("learning_rate", 0.001)
                model_optimizer = torch.optim.Adam(model.parameters(), lr=lr)

                # Training loop
                model.train()
                for _ in range(3):  # Quick training for evaluation
                    for batch_X, batch_y in train_loader:
                        batch_X = batch_X.to(device)
                        batch_y = batch_y.to(device)

                        model_optimizer.zero_grad()
                        outputs = model(batch_X)
                        loss = torch.nn.functional.mse_loss(outputs, batch_y)
                        loss.backward()
                        model_optimizer.step()

                # Validation
                model.eval()
                val_loss = 0.0
                with torch.no_grad():
                    for batch_X, batch_y in val_loader:
                        batch_X = batch_X.to(device)
                        batch_y = batch_y.to(device)
                        outputs = model(batch_X)
                        val_loss += torch.nn.functional.mse_loss(outputs, batch_y)

                return -val_loss / len(val_loader)  # Negative for maximization
            except Exception:
                return 0.0

        # Run optimization
        self.best_params_array, _ = optimizer.optimize(
            objective,
            bounds,
            max_iterations=self.n_iterations,
        )

        self.best_params = dict(zip(param_names, self.best_params_array))
        return self.best_params


class XGBoostOptimizer:
    """XGBoost hyperparameter tuning"""

    def __init__(
        self,
        optimizer_class: type = None,
        param_bounds: Dict[str, tuple] = None,
        n_iterations: int = 50,
        cv_folds: int = 5,
    ):
        """Initialize XGBoost optimizer"""
        self.optimizer_class = optimizer_class
        self.param_bounds = param_bounds or {
            "max_depth": (3, 10),
            "learning_rate": (0.01, 0.3),
            "subsample": (0.6, 1.0),
            "colsample_bytree": (0.6, 1.0),
        }
        self.n_iterations = n_iterations
        self.cv_folds = cv_folds
        self.best_params = None

    def optimize_hyperparameters(self, X, y, dtrain=None):
        """
        Optimize XGBoost hyperparameters.

        Parameters
        ----------
        X : array-like
            Training features
        y : array-like
            Training targets
        dtrain : xgb.DMatrix, optional
            XGBoost DMatrix

        Returns
        -------
        best_params : dict
            Optimal hyperparameters
        """
        try:
            import xgboost as xgb
        except ImportError:
            raise ImportError("xgboost is required for XGBoostOptimizer")

        from .algorithms import DifferentialEvolution

        if self.optimizer_class is None:
            self.optimizer_class = DifferentialEvolution

        optimizer = self.optimizer_class(random_state=42)

        param_names = list(self.param_bounds.keys())
        bounds = [self.param_bounds[name] for name in param_names]

        if dtrain is None:
            dtrain = xgb.DMatrix(X, label=y)

        def objective(params):
            """Cross-validation AUC for given hyperparameters"""
            param_dict = dict(zip(param_names, params))
            param_dict["max_depth"] = int(param_dict["max_depth"])

            try:
                cv_results = xgb.cv(
                    param_dict,
                    dtrain,
                    num_boost_round=100,
                    nfold=self.cv_folds,
                    metrics="auc",
                )
                return cv_results["test-auc-mean"].iloc[-1]
            except Exception:
                return 0.0

        # Run optimization
        self.best_params_array, _ = optimizer.optimize(
            objective,
            bounds,
            max_iterations=self.n_iterations,
        )

        self.best_params = dict(zip(param_names, self.best_params_array))
        self.best_params["max_depth"] = int(self.best_params["max_depth"])

        return self.best_params


class LightGBMOptimizer:
    """LightGBM hyperparameter tuning"""

    def __init__(
        self,
        optimizer_class: type = None,
        param_bounds: Dict[str, tuple] = None,
        n_iterations: int = 50,
        cv_folds: int = 5,
    ):
        """Initialize LightGBM optimizer"""
        self.optimizer_class = optimizer_class
        self.param_bounds = param_bounds or {
            "max_depth": (3, 10),
            "learning_rate": (0.01, 0.3),
            "num_leaves": (20, 150),
            "feature_fraction": (0.5, 1.0),
        }
        self.n_iterations = n_iterations
        self.cv_folds = cv_folds
        self.best_params = None

    def optimize_hyperparameters(self, X, y, categorical_features=None):
        """
        Optimize LightGBM hyperparameters.

        Parameters
        ----------
        X : array-like
            Training features
        y : array-like
            Training targets
        categorical_features : list, optional
            Names of categorical features

        Returns
        -------
        best_params : dict
            Optimal hyperparameters
        """
        try:
            import lightgbm as lgb
        except ImportError:
            raise ImportError("lightgbm is required for LightGBMOptimizer")

        from .algorithms import HarmonySearch

        if self.optimizer_class is None:
            self.optimizer_class = HarmonySearch

        optimizer = self.optimizer_class(random_state=42)

        param_names = list(self.param_bounds.keys())
        bounds = [self.param_bounds[name] for name in param_names]

        train_data = lgb.Dataset(X, label=y, categorical_feature=categorical_features)

        def objective(params):
            """Cross-validation AUC for given hyperparameters"""
            param_dict = dict(zip(param_names, params))
            param_dict["max_depth"] = int(param_dict["max_depth"])
            param_dict["num_leaves"] = int(param_dict["num_leaves"])

            try:
                cv_results = lgb.cv(
                    param_dict,
                    train_data,
                    num_boost_round=100,
                    nfold=self.cv_folds,
                    metrics="auc",
                )
                return np.mean(cv_results["auc-mean"])
            except Exception:
                return 0.0

        # Run optimization
        self.best_params_array, _ = optimizer.optimize(
            objective,
            bounds,
            max_iterations=self.n_iterations,
        )

        self.best_params = dict(zip(param_names, self.best_params_array))
        self.best_params["max_depth"] = int(self.best_params["max_depth"])
        self.best_params["num_leaves"] = int(self.best_params["num_leaves"])

        return self.best_params
