# Example 2: scikit-learn Integration

## Overview
The ML Optimization Suite integrates seamlessly with scikit-learn, allowing use with GridSearchCV, RandomizedSearchCV, and Pipelines.

## 1. Basic scikit-learn Compatibility

```python
from ml_optimization_suite import SKLearnOptimizer
from sklearn.datasets import make_regression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
import numpy as np

# Generate data
X, y = make_regression(n_samples=200, n_features=20, noise=10, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create optimizer (scikit-learn compatible estimator)
optimizer = SKLearnOptimizer(
    algorithm='genetic',
    n_iterations=100,
    population_size=30,
    random_state=42
)

# Fit and predict
optimizer.fit(X_train, y_train)
y_pred = optimizer.predict(X_test)

# Evaluate
r2 = optimizer.score(X_test, y_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print(f"R² Score: {r2:.4f}")
print(f"RMSE: {rmse:.4f}")
```

## 2. Grid Search for Algorithm Selection

```python
from ml_optimization_suite import GridSearchOptimizer
from sklearn.datasets import make_classification
import pandas as pd

# Generate classification data
X, y = make_classification(
    n_samples=300,
    n_features=20,
    n_informative=10,
    n_redundant=5,
    random_state=42
)

# Define parameter grid
param_grid = {
    'algorithm': ['genetic', 'pso', 'de', 'sa'],
    'n_iterations': [50, 100],
    'population_size': [20, 50],
}

# Run grid search
grid_search = GridSearchOptimizer(param_grid=param_grid, cv=5, verbose=1)
grid_search.fit(X, y)

print(f"\nBest Parameters:")
for param, value in grid_search.best_params_.items():
    print(f"  {param}: {value}")
print(f"Best Score: {grid_search.best_score_:.4f}")

# Get all results
results_df = pd.DataFrame({
    'algorithm': [p['algorithm'] for p in param_grid['algorithm']],
    'iterations': [p['n_iterations'] for p in param_grid['n_iterations']],
})
```

## 3. Random Search for Hyperparameter Tuning

```python
from ml_optimization_suite import RandomSearchOptimizer
import numpy as np

# Generate data
X, y = make_regression(n_samples=500, n_features=30, random_state=42)

# Define parameter distributions
param_distributions = {
    'algorithm': ['genetic', 'pso', 'de', 'aco', 'hs'],
    'n_iterations': (50, 200),
    'population_size': (20, 100),
}

# Run random search
random_search = RandomSearchOptimizer(
    param_distributions=param_distributions,
    n_iter=20,
    cv=5,
    random_state=42,
    verbose=1
)

random_search.fit(X, y)

print(f"Best Parameters: {random_search.best_params_}")
print(f"Best Score: {random_search.best_score_:.4f}")
```

## 4. Pipeline Integration

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from ml_optimization_suite import SKLearnOptimizer

# Create pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('optimizer', SKLearnOptimizer(
        algorithm='pso',
        n_iterations=50
    ))
])

# Fit pipeline
pipeline.fit(X_train, y_train)

# Predict
y_pred = pipeline.predict(X_test)

# Score
score = pipeline.score(X_test, y_test)
print(f"Pipeline Score: {score:.4f}")
```

## 5. Cross-Validation

```python
from sklearn.model_selection import cross_val_score, KFold
from ml_optimization_suite import SKLearnOptimizer

# Create optimizer
optimizer = SKLearnOptimizer(algorithm='de', n_iterations=50)

# Perform cross-validation
kfold = KFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(
    optimizer,
    X,
    y,
    cv=kfold,
    scoring='r2'
)

print(f"CV Scores: {cv_scores}")
print(f"Mean CV Score: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
```

## 6. Feature Selection with Optimization

```python
from sklearn.feature_selection import SelectKBest, f_regression
from ml_optimization_suite import SKLearnOptimizer

# Create pipeline with feature selection
pipeline = Pipeline([
    ('feature_selection', SelectKBest(f_regression, k=10)),
    ('optimizer', SKLearnOptimizer(algorithm='genetic', n_iterations=50))
])

pipeline.fit(X_train, y_train)
score = pipeline.score(X_test, y_test)

print(f"Score with feature selection: {score:.4f}")
```

## 7. Custom Metrics

```python
from sklearn.metrics import make_scorer
from sklearn.model_selection import cross_val_score
import numpy as np

# Define custom scoring function
def custom_metric(y_true, y_pred):
    mse = np.mean((y_true - y_pred) ** 2)
    # Penalize large errors
    large_errors = np.sum((np.abs(y_true - y_pred) > 10).astype(float))
    return -mse - 10 * large_errors

# Create scorer
custom_scorer = make_scorer(custom_metric, greater_is_better=False)

# Use in cross-validation
optimizer = SKLearnOptimizer()
cv_scores = cross_val_score(
    optimizer,
    X,
    y,
    cv=5,
    scoring=custom_scorer
)

print(f"Custom Metric CV Scores: {cv_scores}")
```

## 8. Hyperparameter Evolution Across Folds

```python
from sklearn.model_selection import KFold

# Track best parameters per fold
fold_results = []

kfold = KFold(n_splits=5)
for fold, (train_idx, val_idx) in enumerate(kfold.split(X)):
    X_train_fold = X[train_idx]
    y_train_fold = y[train_idx]
    X_val_fold = X[val_idx]
    y_val_fold = y[val_idx]
    
    optimizer = SKLearnOptimizer(
        algorithm='pso',
        n_iterations=50,
        random_state=fold
    )
    
    optimizer.fit(X_train_fold, y_train_fold)
    score = optimizer.score(X_val_fold, y_val_fold)
    
    fold_results.append({
        'fold': fold,
        'score': score,
        'params': optimizer.get_params()
    })
    
    print(f"Fold {fold}: {score:.4f}")

# Analyze results
import pandas as pd
results_df = pd.DataFrame(fold_results)
print(f"\nMean Score: {results_df['score'].mean():.4f}")
```

## 9. Comparison with Other Optimizers

```python
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from ml_optimization_suite import SKLearnOptimizer
from sklearn.model_selection import cross_val_score

estimators = {
    'Ridge': Ridge(),
    'RandomForest': RandomForestRegressor(random_state=42),
    'ML Optimization': SKLearnOptimizer(algorithm='de', n_iterations=50),
}

scores = {}
for name, estimator in estimators.items():
    cv_scores = cross_val_score(
        estimator,
        X,
        y,
        cv=5,
        scoring='r2'
    )
    scores[name] = cv_scores.mean()
    print(f"{name:20} R²: {scores[name]:.4f}")
```

## 10. Best Practices

### 1. Normalize Features
```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

### 2. Avoid Data Leakage
```python
# Fit scaler ONLY on training data
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

### 3. Use Stratification for Classification
```python
from sklearn.model_selection import StratifiedKFold

skfold = StratifiedKFold(n_splits=5, shuffle=True)
```

### 4. Set Random State for Reproducibility
```python
optimizer = SKLearnOptimizer(random_state=42)
kfold = KFold(n_splits=5, random_state=42)
```

### 5. Early Stopping
```python
# Use smaller iterations initially for fast feedback
optimizer = SKLearnOptimizer(n_iterations=20)
optimizer.fit(X_train, y_train)

# Scale up if needed
if optimizer.best_score_ < 0.7:
    optimizer.n_iterations = 100
    optimizer.fit(X_train, y_train)
```

## Summary
This example demonstrated:
- scikit-learn compatible API usage
- Grid and random search for algorithm selection
- Pipeline integration with preprocessing
- Cross-validation and evaluation
- Custom metrics and scoring
- Best practices for sklearn workflows
