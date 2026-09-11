#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
PyPI Upload Helper Script

This script helps you upload ml-optimization-suite to PyPI securely.
It uses twine to handle the upload with proper credentials management.
"""

import subprocess
import sys
import os
from pathlib import Path


def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 80)
    print(text.center(80))
    print("=" * 80)


def check_files():
    """Check if distribution files exist"""
    print_header("Checking Distribution Files")

    dist_dir = Path("dist")
    if not dist_dir.exists():
        print("ERROR: dist/ directory not found!")
        print("Run: python -m build")
        sys.exit(1)

    files = list(dist_dir.glob("ml_optimization_suite-1.0.0*"))
    if not files:
        print("ERROR: No distribution files found!")
        print("Run: python -m build")
        sys.exit(1)

    print("\nFound distribution files:")
    for f in sorted(files):
        if f.suffix in ['.whl', '.gz']:
            size = f.stat().st_size / 1024
            print(f"  [OK] {f.name} ({size:.1f} KB)")

    return files


def validate_files():
    """Validate files with twine"""
    print_header("Validating Files with Twine")

    result = subprocess.run(
        ["python", "-m", "twine", "check", "dist/ml_optimization_suite-1.0.0*"],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print("ERROR: Validation failed!")
        print(result.stdout)
        print(result.stderr)
        sys.exit(1)

    print("\n[OK] All files validated successfully!")
    print(result.stdout)


def get_upload_option():
    """Get user's upload preference"""
    print_header("Choose Upload Method")

    print("\nOptions:")
    print("  1. Upload to TestPyPI first (RECOMMENDED)")
    print("  2. Upload directly to PyPI")
    print("  3. Cancel")

    while True:
        choice = input("\nEnter choice (1-3): ").strip()
        if choice in ['1', '2', '3']:
            return choice
        print("Invalid choice. Please enter 1, 2, or 3.")


def upload_testpypi():
    """Upload to TestPyPI"""
    print_header("Uploading to TestPyPI")

    print("\nIMPORTANT: TestPyPI requires separate credentials")
    print("1. Create account at: https://test.pypi.org/account/register/")
    print("2. Generate API token at: https://test.pypi.org/account/")
    print("3. Have your token ready\n")

    input("Press Enter when ready to upload to TestPyPI...")

    print("\nUploading...")
    result = subprocess.run(
        [
            "python", "-m", "twine", "upload",
            "--repository", "testpypi",
            "dist/ml_optimization_suite-1.0.0*"
        ]
    )

    if result.returncode == 0:
        print_header("TestPyPI Upload Successful!")
        print("\nTest installation:")
        print("  pip install --index-url https://test.pypi.org/simple/ ml-optimization-suite")
        print("\nThen test it:")
        print("  python -c \"from ml_optimization_suite import GeneticAlgorithm; print('Success!')\"")
        print("\nReady for production PyPI? Run this script again and choose option 2.")
    else:
        print_header("Upload Failed")
        print("Check your credentials and try again.")
        sys.exit(1)


def upload_pypi():
    """Upload to production PyPI"""
    print_header("Uploading to PyPI (Production)")

    print("\nIMPORTANT: Production PyPI upload is PERMANENT")
    print("1. Create account at: https://pypi.org/account/register/")
    print("2. Generate API token at: https://pypi.org/account/")
    print("3. Have your token ready\n")

    print("[WARNING]  WARNING: This action is permanent!")
    print("    The package will be available to all Python users via pip.")
    print("    The version cannot be deleted (only yanked).\n")

    confirm = input("Do you want to proceed? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("Upload cancelled.")
        sys.exit(0)

    print("\nUploading to PyPI...")
    result = subprocess.run(
        ["python", "-m", "twine", "upload", "dist/ml_optimization_suite-1.0.0*"]
    )

    if result.returncode == 0:
        print_header("PyPI Upload Successful!")
        print("\nYour package is now published!")
        print("\nInstall with:")
        print("  pip install ml-optimization-suite")
        print("\nView on PyPI:")
        print("  https://pypi.org/project/ml-optimization-suite/")
        print("\nUsage example:")
        print("  from ml_optimization_suite import GeneticAlgorithm")
        print("  ga = GeneticAlgorithm()")
        print("  solution, fitness = ga.optimize(objective, bounds, 100)")
    else:
        print_header("Upload Failed")
        print("Check your credentials and try again.")
        sys.exit(1)


def main():
    """Main upload workflow"""
    print_header("ML OPTIMIZATION SUITE - PyPI UPLOAD HELPER")

    # Check files exist
    check_files()

    # Validate files
    validate_files()

    # Get upload preference
    choice = get_upload_option()

    if choice == '1':
        upload_testpypi()
    elif choice == '2':
        upload_pypi()
    else:
        print("\nUpload cancelled.")
        sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nUpload cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\nERROR: {e}")
        sys.exit(1)
