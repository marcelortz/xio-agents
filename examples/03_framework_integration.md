# Example 3: Framework Integration

## Overview
Integrate ML Optimization Suite with TensorFlow, PyTorch, XGBoost, and LightGBM for advanced hyperparameter optimization.

## 1. TensorFlow/Keras Optimization

```python
from ml_optimization_suite.framework import TensorFlowOptimizer
from tensorflow import keras
from sklearn.datasets import make_regression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import numpy as np

# Generate and prepare data
X, y = make_regression(n_samples=500, n_features=20, random_state=42)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)

# Split training data for validation
X_train, X_val, y_train, y_val = train_test_split(
    X_train, y_train, test_size=0.2, random_state=42
)

# Create model
model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(20,)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dense(1)
])

# Define hyperparameter bounds
param_bounds = {
    'epochs': (10, 50),
    'batch_size': (16, 64),
    'learning_rate': (0.0001, 0.01),
}

# Optimize hyperparameters
tf_optimizer = TensorFlowOptimizer(param_bounds=param_bounds, n_iterations=20)
best_params = tf_optimizer.optimize_hyperparameters(
    model,
    X_train,
    y_train,
    X_val,
    y_val
)

print(f"Best TensorFlow Hyperparameters:")
for param, value in best_params.items():
    print(f"  {param}: {value}")
```

## 2. XGBoost Hyperparameter Tuning

```python
from ml_optimization_suite.framework import XGBoostOptimizer
from sklearn.datasets import make_classification
import xgboost as xgb

# Generate classification data
X, y = make_classification(
    n_samples=1000,
    n_features=30,
    n_informative=20,
    random_state=42
)

# Define bounds for XGBoost parameters
param_bounds = {
    'max_depth': (3, 10),
    'learning_rate': (0.01, 0.3),
    'subsample': (0.6, 1.0),
    'colsample_bytree': (0.6, 1.0),
    'min_child_weight': (1, 5),
}

# Optimize hyperparameters
xgb_optimizer = XGBoostOptimizer(
    param_bounds=param_bounds,
    n_iterations=30,
    cv_folds=5
)
best_params = xgb_optimizer.optimize_hyperparameters(X, y)

print(f"Best XGBoost Parameters:")
for param, value in best_params.items():
    print(f"  {param}: {value:.4f}")

# Train final model with optimized parameters
dtrain = xgb.DMatrix(X, label=y)
final_model = xgb.train(best_params, dtrain, num_boost_round=100)
```

## 3. LightGBM Optimization

```python
from ml_optimization_suite.framework import LightGBMOptimizer
import lightgbm as lgb
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split

# Load data
data = load_breast_cancer()
X, y = data.data, data.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Define bounds
param_bounds = {
    'max_depth': (3, 10),
    'learning_rate': (0.01, 0.3),
    'num_leaves': (20, 150),
    'feature_fraction': (0.5, 1.0),
    'bagging_fraction': (0.5, 1.0),
}

# Optimize
lgb_optimizer = LightGBMOptimizer(
    param_bounds=param_bounds,
    n_iterations=25,
    cv_folds=5
)
best_params = lgb_optimizer.optimize_hyperparameters(X_train, y_train)

print(f"Best LightGBM Parameters:")
for param, value in best_params.items():
    print(f"  {param}: {value:.4f}")

# Train final model
train_data = lgb.Dataset(X_train, label=y_train)
final_model = lgb.train(best_params, train_data, num_boost_round=100)

# Evaluate
y_pred = final_model.predict(X_test)
from sklearn.metrics import roc_auc_score
auc = roc_auc_score(y_test, y_pred)
print(f"Test AUC: {auc:.4f}")
```

## 4. PyTorch Neural Network Optimization

```python
from ml_optimization_suite.framework import PyTorchOptimizer
import torch
from torch.utils.data import TensorDataset, DataLoader
from sklearn.datasets import make_regression
from sklearn.preprocessing import StandardScaler

# Generate and prepare data
X, y = make_regression(n_samples=500, n_features=20, random_state=42)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
y_scaled = (y - y.mean()) / y.std()

# Create tensors
X_tensor = torch.FloatTensor(X_scaled)
y_tensor = torch.FloatTensor(y_scaled).reshape(-1, 1)

# Create data loaders
train_dataset = TensorDataset(X_tensor[:400], y_tensor[:400])
val_dataset = TensorDataset(X_tensor[400:], y_tensor[400:])

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32)

# Define model
class RegressionNet(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = torch.nn.Linear(20, 64)
        self.fc2 = torch.nn.Linear(64, 32)
        self.fc3 = torch.nn.Linear(32, 1)
        self.relu = torch.nn.ReLU()
        self.dropout = torch.nn.Dropout(0.3)
    
    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.fc3(x)
        return x

model = RegressionNet()

# Define hyperparameter bounds
param_bounds = {
    'learning_rate': (0.0001, 0.01),
    'momentum': (0.0, 0.9),
}

# Optimize
torch_optimizer = PyTorchOptimizer(
    param_bounds=param_bounds,
    n_iterations=15
)
best_params = torch_optimizer.optimize_hyperparameters(
    model,
    train_loader,
    val_loader,
    device='cpu'
)

print(f"Best PyTorch Hyperparameters:")
for param, value in best_params.items():
    print(f"  {param}: {value:.6f}")
```

## 5. Multi-Framework Comparison

```python
from ml_optimization_suite.framework import (
    XGBoostOptimizer,
    LightGBMOptimizer
)
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
import pandas as pd

# Load data
data = load_breast_cancer()
X, y = data.data, data.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Optimize different frameworks
results = {}

# XGBoost
xgb_bounds = {
    'max_depth': (3, 10),
    'learning_rate': (0.01, 0.3),
}
xgb_opt = XGBoostOptimizer(param_bounds=xgb_bounds, n_iterations=15)
xgb_params = xgb_opt.optimize_hyperparameters(X_train, y_train)
results['XGBoost'] = xgb_params

# LightGBM
lgb_bounds = {
    'max_depth': (3, 10),
    'learning_rate': (0.01, 0.3),
    'num_leaves': (20, 100),
}
lgb_opt = LightGBMOptimizer(param_bounds=lgb_bounds, n_iterations=15)
lgb_params = lgb_opt.optimize_hyperparameters(X_train, y_train)
results['LightGBM'] = lgb_params

# Display comparison
print("Framework Hyperparameter Comparison:")
for framework, params in results.items():
    print(f"\n{framework}:")
    for param, value in params.items():
        print(f"  {param}: {value:.4f}")
```

## 6. Nested Optimization (Algorithm + Framework)

```python
from ml_optimization_suite import GridSearchOptimizer
from ml_optimization_suite.framework import XGBoostOptimizer
from sklearn.datasets import make_classification

X, y = make_classification(n_samples=1000, n_features=30, random_state=42)

# First: Optimize XGBoost hyperparameters
xgb_param_bounds = {
    'max_depth': (3, 10),
    'learning_rate': (0.01, 0.3),
    'subsample': (0.6, 1.0),
}

xgb_opt = XGBoostOptimizer(
    param_bounds=xgb_param_bounds,
    n_iterations=20,
    cv_folds=5
)
best_xgb_params = xgb_opt.optimize_hyperparameters(X, y)

print("Step 1: Optimized XGBoost Parameters")
print(best_xgb_params)

# Second: Use optimized parameters with ML Optimization Suite algorithm tuning
print("\nStep 2: Tuning optimizer hyperparameters would follow...")
```

## 7. Early Stopping with Framework

```python
from ml_optimization_suite.framework import XGBoostOptimizer
from sklearn.datasets import make_classification

X, y = make_classification(n_samples=1000, n_features=30)

# Phase 1: Quick optimization
xgb_opt1 = XGBoostOptimizer(
    param_bounds={
        'max_depth': (3, 10),
        'learning_rate': (0.01, 0.3),
    },
    n_iterations=10  # Quick survey
)
params1 = xgb_opt1.optimize_hyperparameters(X, y)

# Phase 2: Refinement around best parameters
xgb_opt2 = XGBoostOptimizer(
    param_bounds={
        'max_depth': (int(params1['max_depth']) - 1, int(params1['max_depth']) + 1),
        'learning_rate': (max(0.01, params1['learning_rate'] - 0.05),
                         min(0.3, params1['learning_rate'] + 0.05)),
    },
    n_iterations=20  # Detailed search
)
params2 = xgb_opt2.optimize_hyperparameters(X, y)

print(f"Phase 1 params: {params1}")
print(f"Phase 2 params: {params2}")
```

## 8. Reproducibility & Reporting

```python
import json
from datetime import datetime

# Optimize framework
xgb_optimizer = XGBoostOptimizer(n_iterations=25)
best_params = xgb_optimizer.optimize_hyperparameters(X_train, y_train)

# Generate report
report = {
    'timestamp': datetime.now().isoformat(),
    'framework': 'XGBoost',
    'optimizer_algorithm': 'Differential Evolution',
    'data_shape': X_train.shape,
    'best_params': best_params,
    'optimization_iterations': 25,
}

# Save report
with open('optimization_report.json', 'w') as f:
    json.dump(report, f, indent=2)

print(f"Report saved: optimization_report.json")
```

## Best Practices

1. **Start with Limited Iterations**
   - Use 10-20 iterations for initial exploration
   - Scale up based on results

2. **Use Appropriate Bounds**
   - Keep bounds realistic
   - Use domain knowledge
   - Consider default parameter ranges

3. **Validate Results**
   - Always test on held-out data
   - Use cross-validation
   - Compare with baselines

4. **Monitor Convergence**
   - Track optimization progress
   - Check for early plateau
   - Adjust iterations if needed

5. **Document Everything**
   - Save parameters and results
   - Record data preprocessing
   - Note timestamp and system info

## Summary
This example demonstrated:
- TensorFlow/Keras hyperparameter optimization
- XGBoost parameter tuning
- LightGBM optimization
- PyTorch model tuning
- Multi-framework comparison
- Nested optimization strategies
- Best practices for framework integration
