#!/usr/bin/env python
"""
ML Optimization Suite - Setup configuration
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="ml-optimization-suite",
    version="1.0.0",
    author="Claude & Team",
    description="Advanced metaheuristic optimization algorithms for Python",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/marcelortz/xio-agents-2b",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Scientific/Engineering",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    install_requires=[
        "numpy>=1.20.0",
        "scipy>=1.7.0",
    ],
    extras_require={
        "sklearn": ["scikit-learn>=0.24.0"],
        "tensorflow": ["tensorflow>=2.0.0"],
        "torch": ["torch>=1.9.0"],
        "xgboost": ["xgboost>=1.4.0"],
        "lightgbm": ["lightgbm>=3.1.0"],
        "catboost": ["catboost>=0.25.0"],
        "dev": [
            "pytest>=6.0.0",
            "pytest-cov>=2.12.0",
            "black>=21.0",
            "flake8>=3.9.0",
            "mypy>=0.900",
        ],
        "docs": [
            "sphinx>=4.0.0",
            "sphinx-rtd-theme>=1.0.0",
            "jupyter>=1.0.0",
            "notebook>=6.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "ml-optimize=ml_optimization_suite.cli:main",
        ],
    },
)
