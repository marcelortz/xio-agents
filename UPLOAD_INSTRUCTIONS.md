# PyPI Upload Instructions

## Current Status

Your package is **ready to upload** to PyPI!

```
Distribution Files:
  [OK] ml_optimization_suite-1.0.0-py3-none-any.whl (16.8 KB)
  [OK] ml_optimization_suite-1.0.0.tar.gz (20.0 KB)

Validation: PASSED
```

---

## Step 1: Create PyPI Account (if needed)

Go to: https://pypi.org/account/register/

Fill in:
- Username: (choose your username)
- Email: (your email)
- Password: (strong password)

Click "Register" and verify your email.

---

## Step 2: Generate API Token

1. Log in to PyPI: https://pypi.org/account/
2. Scroll down to "API tokens"
3. Click "Add API token"
4. Configure:
   - Name: `ml-optimization-suite`
   - Scope: `Entire account`
5. Click "Create token"
6. **Copy the token immediately** (you'll only see it once!)
   - It looks like: `pypi-AgEIcHlwaS5vcmc...`

---

## Step 3: Upload to PyPI

### Option A: Using the Helper Script (Easiest)

```bash
python upload_to_pypi.py
```

Then:
1. Select option `2` (Upload directly to PyPI)
2. When prompted for credentials:
   - **Username:** `__token__` (type this literally)
   - **Password:** (paste your API token)
3. Confirm the permanent upload

### Option B: Manual Upload with Twine

```bash
python -m twine upload dist/
```

When prompted:
- **Username:** `__token__`
- **Password:** (paste your API token)

### Option C: Using .pypirc (Recommended for future uploads)

Create `~/.pypirc` on Windows:
```
C:\Users\YourUsername\.pypirc
```

Content:
```ini
[distutils]
index-servers =
    pypi

[pypi]
username = __token__
password = pypi-YOUR_API_TOKEN_HERE
```

Replace `pypi-YOUR_API_TOKEN_HERE` with your actual token.

Then upload:
```bash
python -m twine upload dist/
```

---

## Expected Output

When upload succeeds, you'll see:

```
Uploading ml_optimization_suite-1.0.0-py3-none-any.whl
Uploading ml_optimization_suite-1.0.0.tar.gz
Upload successful
```

---

## Step 4: Verify Upload

### Option 1: Check PyPI Website

Visit: https://pypi.org/project/ml-optimization-suite/

You should see:
- Package name
- Version 1.0.0
- Your README
- Download statistics (starts at 0)

### Option 2: Try Installing

```bash
pip install ml-optimization-suite
```

Then test:
```python
from ml_optimization_suite import GeneticAlgorithm

ga = GeneticAlgorithm()
solution, fitness = ga.optimize(
    lambda x: -sum(x**2),
    [(-5, 5) for _ in range(5)],
    100
)

print(f"Success! Fitness: {fitness}")
```

---

## Common Issues & Solutions

### "Invalid token"
- ✓ Token starts with `pypi-`?
- ✓ Username is `__token__` (literal)?
- ✓ Token hasn't expired?
- ✓ Token has "Entire account" scope?

**Solution:** Generate a new token and try again

### "Package already exists"
- This version is already on PyPI
- To release version 1.0.1, update version in:
  - `setup.py`
  - `pyproject.toml`
- Run: `python -m build`
- Upload again: `python -m twine upload dist/`

### "Connection timeout"
- Check internet connection
- Try uploading single file first: `python -m twine upload dist/ml_optimization_suite-1.0.0-py3-none-any.whl`
- Wait a moment and retry

### "403 Forbidden"
- Wrong credentials
- Check .pypirc file
- Try uploading with `-v` flag for verbose: `python -m twine upload -v dist/`

---

## After Upload

### Announce Release

Share with the community:
- GitHub releases
- Twitter/social media
- ML communities (r/MachineLearning, Hacker News, etc.)

Example tweet:
```
Excited to announce ml-optimization-suite v1.0.0 on PyPI!

7 metaheuristic algorithms:
- Genetic Algorithm
- Particle Swarm Optimization
- Differential Evolution
- And more!

scikit-learn compatible + framework integrations

pip install ml-optimization-suite

https://pypi.org/project/ml-optimization-suite/
https://github.com/marcelortz/xio-agents-2b
```

### Monitor Usage

1. Check PyPI stats: https://pypi.org/project/ml-optimization-suite/#history
2. Monitor GitHub issues
3. Gather user feedback
4. Plan improvements

### Plan Future Updates

Keep a changelog in `CHANGELOG.md`:
```markdown
# Changelog

## [1.0.1] - 2026-09-12
- Bug fix: X
- Feature: Y
- Improvement: Z

## [1.0.0] - 2026-09-11
- Initial release
```

---

## Package Info for Users

Once published, users can:

### Install
```bash
pip install ml-optimization-suite
```

### Use
```python
from ml_optimization_suite import GeneticAlgorithm, PSO
from ml_optimization_suite.framework import XGBoostOptimizer

# Basic usage
ga = GeneticAlgorithm()
solution, fitness = ga.optimize(objective, bounds, 100)

# scikit-learn integration
from ml_optimization_suite import SKLearnOptimizer
opt = SKLearnOptimizer(algorithm='pso')
opt.fit(X, y)

# Framework integration
xgb_opt = XGBoostOptimizer()
params = xgb_opt.optimize_hyperparameters(X, y)
```

### CLI
```bash
ml-optimize list-algorithms
ml-optimize optimize --algorithm genetic --iterations 100
ml-optimize benchmark --algorithm pso --dimensions 10
```

---

## Final Checklist

Before uploading, ensure:

- [ ] PyPI account created
- [ ] API token generated and copied
- [ ] Distribution files exist (2 files in dist/)
- [ ] Files passed twine validation
- [ ] You understand upload is permanent
- [ ] Ready to maintain the package

---

## Ready?

Run the upload:

```bash
python upload_to_pypi.py
```

Or directly:

```bash
python -m twine upload dist/
```

Good luck! Your package is about to reach thousands of Python developers worldwide! 🚀

---

*Generated: 2026-09-11*
*Package: ml-optimization-suite v1.0.0*
