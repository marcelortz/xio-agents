# PyPI Publishing Guide

## Package Status

✅ **Distribution files built successfully:**
- `dist/ml_optimization_suite-1.0.0-py3-none-any.whl` (17 KB)
- `dist/ml_optimization_suite-1.0.0.tar.gz` (20 KB)
- Both files passed twine validation

---

## Step 1: Create PyPI Account

### Option A: Register on PyPI (if you don't have an account)

1. Visit: https://pypi.org/account/register/
2. Fill in username, email, password
3. Verify your email
4. Enable two-factor authentication (recommended)

### Option B: Use Existing PyPI Account

If you already have a PyPI account, proceed to Step 2.

---

## Step 2: Create PyPI API Token

### Generate Personal Access Token

1. Go to: https://pypi.org/account/
2. Click "Create token for projects you own"
3. Give it a name (e.g., "ml-optimization-suite")
4. Select "Entire account" scope
5. Copy the token (starts with `pypi-`)
6. **Store it securely** - you'll only see it once!

### Create .pypirc File

Create `~/.pypirc` (or `%APPDATA%\pip\pip.ini` on Windows):

```ini
[distutils]
index-servers =
    pypi
    testpypi

[pypi]
username = __token__
password = pypi-YOUR_TOKEN_HERE

[testpypi]
repository = https://test.pypi.org/legacy/
username = __token__
password = pypi-YOUR_TEST_TOKEN_HERE
```

**Replace `pypi-YOUR_TOKEN_HERE` with your actual token!**

---

## Step 3: Test with TestPyPI (Recommended)

### Generate Test Token

1. Go to: https://test.pypi.org/account/
2. Create API token
3. Add to `.pypirc` as shown above

### Upload to TestPyPI

```bash
python -m twine upload --repository testpypi dist/*
```

Output will show:
```
Uploading ml_optimization_suite-1.0.0-py3-none-any.whl
Uploading ml_optimization_suite-1.0.0.tar.gz
```

### Install from TestPyPI

```bash
pip install --index-url https://test.pypi.org/simple/ ml-optimization-suite
```

### Verify Installation

```python
from ml_optimization_suite import GeneticAlgorithm
print("Success! Package installed from TestPyPI")
```

---

## Step 4: Publish to Production PyPI

### Upload to PyPI

```bash
python -m twine upload dist/*
```

### What Happens

1. Twine uploads both `.tar.gz` and `.whl`
2. PyPI processes the files
3. Package becomes available via `pip install`
4. Appears on: https://pypi.org/project/ml-optimization-suite/

### Install from PyPI

```bash
pip install ml-optimization-suite
```

### Verify Installation

```python
from ml_optimization_suite import GeneticAlgorithm
ga = GeneticAlgorithm(population_size=50)
print("Package installed from PyPI successfully!")
```

---

## Complete Publishing Checklist

Before publishing, verify:

- ✅ Package built successfully
- ✅ Distribution files validated with twine
- ✅ README.md is comprehensive
- ✅ Version number in setup.py/pyproject.toml
- ✅ All algorithms working (tested)
- ✅ Code is production-ready
- ✅ PyPI account created
- ✅ API token generated and stored
- ✅ Tested on TestPyPI (recommended)

---

## Package Information

### Package Name
- **PyPI Name**: `ml-optimization-suite`
- **Import Name**: `ml_optimization_suite`
- **Version**: 1.0.0

### Key Metadata
- **Author**: Claude & Team
- **License**: MIT
- **Python Version**: 3.8+
- **Repository**: https://github.com/marcelortz/xio-agents-2b

### Dependencies
- **Required**: numpy>=1.20.0, scipy>=1.7.0, click>=8.0.0
- **Optional**: sklearn, tensorflow, torch, xgboost, lightgbm

### Entry Points
- **CLI Command**: `ml-optimize`
  ```bash
  ml-optimize list-algorithms
  ml-optimize optimize --algorithm genetic --bounds "[[−5,5]]" --iterations 100
  ml-optimize benchmark --algorithm pso
  ml-optimize info
  ```

---

## After Publishing

### Update Documentation

After publishing, update your project with PyPI information:

```bash
# Update README badges
# Update links to PyPI page
# Add installation instructions to documentation
```

### Monitor Package

1. Check PyPI stats: https://pypi.org/project/ml-optimization-suite/
2. Monitor download statistics
3. Watch for issues/pull requests
4. Keep version updated in future releases

### Future Releases

For future versions:

```bash
# Update version in pyproject.toml and setup.py
# Make code changes
# Rebuild: python -m build
# Upload: python -m twine upload dist/*
```

---

## Troubleshooting

### "Invalid token" error
- Verify token in `.pypirc` is correct
- Check it hasn't expired
- Ensure `username = __token__` (literal)

### "Package already exists" error
- Version number already published
- Increment version number
- Rebuild and upload with new version

### "Repository not found" error
- Verify `.pypirc` repository URL
- For TestPyPI: `https://test.pypi.org/legacy/`
- For PyPI: default (no URL needed)

### Upload stuck/slow
- Check internet connection
- Verify file sizes are reasonable
- Try uploading one file at a time

---

## Security Notes

🔒 **Important Security Practices:**

1. **Never commit tokens** to git
2. **Never hardcode credentials** in scripts
3. **Store in `.pypirc`** with restricted permissions (600)
4. **Enable 2FA** on PyPI account
5. **Use different tokens** for different purposes
6. **Rotate tokens regularly** for security

---

## Success Indicators

After publishing, you should see:

✅ Package on https://pypi.org/project/ml-optimization-suite/
✅ Can install via `pip install ml-optimization-suite`
✅ Version 1.0.0 listed
✅ All metadata displayed correctly
✅ Download statistics tracking

---

## Next Steps After Publishing

1. **Announce Release**
   - Tweet/announce publicly
   - Post on GitHub releases
   - Share in ML communities

2. **Gather Feedback**
   - Monitor GitHub issues
   - Track usage statistics
   - Collect user feedback

3. **Plan Updates**
   - Fix bugs reported
   - Add features based on feedback
   - Improve documentation

4. **Maintain Package**
   - Keep dependencies updated
   - Ensure compatibility with new Python versions
   - Release updates regularly

---

## Commands Reference

```bash
# Build distribution
python -m build

# Validate files
python -m twine check dist/*

# Upload to TestPyPI
python -m twine upload --repository testpypi dist/*

# Upload to PyPI (PRODUCTION)
python -m twine upload dist/*

# Install from PyPI
pip install ml-optimization-suite

# Install from TestPyPI
pip install --index-url https://test.pypi.org/simple/ ml-optimization-suite

# Upgrade to latest version
pip install --upgrade ml-optimization-suite

# Show package info
pip show ml-optimization-suite
```

---

## Links

- **PyPI**: https://pypi.org/
- **TestPyPI**: https://test.pypi.org/
- **Twine Docs**: https://twine.readthedocs.io/
- **Python Packaging**: https://packaging.python.org/

---

## Summary

Your ML Optimization Suite is ready for PyPI publication! 

**Current Status:**
- ✅ Code tested and working
- ✅ Distribution files built
- ✅ Metadata validated
- ✅ Ready to upload

**Next Action:**
1. Create/verify PyPI account
2. Generate API token
3. Upload to TestPyPI (recommended)
4. Test installation
5. Upload to production PyPI

**Then:**
- Package will be available via `pip install ml-optimization-suite`
- Developers worldwide can use your optimization library
- Community can contribute improvements

🎉 **Let's make optimization accessible to everyone!**

---

*Generated: 2026-09-11*
