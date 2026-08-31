#!/usr/bin/env python3
"""Banana Claude -- CSV Batch Workflow

Parse a CSV file of image generation requests and output a structured plan.
Claude then executes each row via MCP.

Usage:
    batch.py --csv path/to/file.csv

CSV columns:
    prompt (required), workflow, domain, ratio, resolution, model, preset (all optional)

Workflow column: Multi-step operations (generate_only, generate_and_edit, multi_variant)
Domain column: Image type preset (landscape, portrait, product, ui, editorial, logo)
Explicit ratio/resolution override both workflow and domain defaults.

Example CSV:
    prompt,workflow,domain,ratio,resolution
    "hero image",generate_and_edit,landscape,,
    "photo series",multi_variant,,1:1,
    "custom product",generate_only,product,4:3,2K
"""

import argparse
import csv
import json
import sys
from pathlib import Path

from image_config import ImageConfig
from domain import get_domain
from workflow import get_workflow

# Load config from config.json (single source of truth)
def load_config():
    """Load Banana configuration from config.json"""
    config_path = Path(__file__).parent.parent / "config.json"
    try:
        with open(config_path) as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ ERROR: config.json not found at {config_path}", file=sys.stderr)
        print("   Run this from skills/banana/scripts/ or ensure config.json exists", file=sys.stderr)
        sys.exit(1)

CONFIG = load_config()

DEFAULT_MODEL = CONFIG.get("default_model", "gemini-3.1-flash-image-preview")
DEFAULT_RESOLUTION = "1K"
DEFAULT_RATIO = "1:1"
FREE_TIER_LIMIT = CONFIG.get("free_tier_images_per_month", 100)


def estimate_cost(model, config):
    """Estimate cost for a single image using ImageConfig resolution multiplier.

    Args:
        model: Model ID (e.g., "gemini-3.1-flash-image-preview")
        config: ImageConfig instance with validated resolution

    Returns:
        float: Estimated cost per image
    """
    base_cost = CONFIG.get("pricing", {}).get(model, 0.001)
    multiplier = config.get_cost_multiplier()
    return base_cost * multiplier


def main():
    parser = argparse.ArgumentParser(description="Parse CSV batch and output generation plan")
    parser.add_argument("--csv", required=True, help="Path to CSV file")
    parser.add_argument("--force", action="store_true", help="Skip Free Tier warning")
    parser.add_argument("--dry-run", action="store_true", help="Show plan without executing")
    args = parser.parse_args()

    csv_path = Path(args.csv).resolve()
    if not csv_path.exists():
        print(json.dumps({"error": True, "message": f"CSV not found: {csv_path}"}))
        sys.exit(1)

    rows = []
    errors = []

    try:
        with open(csv_path, "r", newline="") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames or "prompt" not in reader.fieldnames:
                print(json.dumps({"error": True, "message": "CSV must have a 'prompt' column header"}))
                sys.exit(1)
            for i, row in enumerate(reader, start=2):  # Line 2+ (1 is header)
                prompt = row.get("prompt", "").strip()
                if not prompt:
                    errors.append(f"Row {i}: missing prompt")
                    continue

                # Resolve workflow, domain, and parameters
                workflow_name = row.get("workflow", "").strip() or None
                workflow = None
                domain_name = row.get("domain", "").strip() or None
                domain = None
                ratio = row.get("ratio", "").strip() or None
                resolution = row.get("resolution", "").strip() or None
                model = row.get("model", "").strip() or DEFAULT_MODEL

                # If workflow specified, use its default domain (if any)
                if workflow_name:
                    try:
                        workflow = get_workflow(workflow_name)
                        # Workflows can suggest a domain via first step params
                        if workflow.steps and "domain" in workflow.steps[0].params:
                            if not domain_name:
                                domain_name = workflow.steps[0].params["domain"]
                    except ValueError as e:
                        errors.append(f"Row {i}: {str(e).split(chr(10))[0]}")
                        continue

                # If domain specified, use its defaults (but allow explicit overrides)
                if domain_name:
                    try:
                        domain = get_domain(domain_name)
                        if not ratio:
                            ratio = domain.aspect_ratio
                        if not resolution:
                            resolution = domain.resolution
                    except ValueError as e:
                        errors.append(f"Row {i}: {str(e).split(chr(10))[0]}")
                        continue

                # Apply script defaults if still not set
                ratio = ratio or DEFAULT_RATIO
                resolution = resolution or DEFAULT_RESOLUTION

                # Validate configuration using ImageConfig
                try:
                    config = ImageConfig(
                        aspect_ratio=ratio,
                        resolution=resolution,
                        safety_filter="on"
                    )
                except ValueError as e:
                    errors.append(f"Row {i}: {str(e).split(chr(10))[0]}")
                    continue

                rows.append({
                    "row": i,
                    "prompt": prompt,
                    "workflow": workflow_name,
                    "domain": domain_name,
                    "ratio": ratio,
                    "resolution": resolution,
                    "model": model,
                    "preset": row.get("preset", "").strip() or None,
                    "_config": config,  # Internal: used for cost calculation
                })
    except (csv.Error, UnicodeDecodeError) as e:
        print(json.dumps({"error": True, "message": f"Failed to parse CSV: {e}"}))
        sys.exit(1)

    if errors:
        print("Validation errors:")
        for e in errors:
            print(f"  - {e}")
        if not rows:
            sys.exit(1)
        print()

    # Cost estimate using ImageConfig multipliers
    total_cost = sum(estimate_cost(r["model"], r["_config"]) for r in rows)

    # ← NEW: Check Free Tier Limits (from config.json)
    # See: skills/banana/references/cost-tracking.md
    images_count = len(rows)
    exceeds_free_tier = images_count > FREE_TIER_LIMIT

    if exceeds_free_tier and not args.force:
        print(f"\n⚠️  WARNING: Operation exceeds Free Tier Limits", file=sys.stderr)
        print(f"   Images to generate: {images_count}", file=sys.stderr)
        print(f"   Free Tier: {FREE_TIER_LIMIT} images/month", file=sys.stderr)
        print(f"   Estimated cost: ${total_cost:.2f}", file=sys.stderr)
        print(f"   ", file=sys.stderr)
        print(f"   See: skills/banana/config.json for Free Tier settings", file=sys.stderr)
        print(f"   Use --force to proceed without warning", file=sys.stderr)
        print()
        if not args.dry_run:
            response = input("Continue anyway? (type 'yes' to proceed, 'no' to cancel): ")
            if response.lower() != 'yes':
                print(json.dumps({"error": True, "message": "Cancelled by user (exceeded Free Tier)",
                                 "rows_attempted": len(rows), "free_tier_limit": FREE_TIER_LIMIT}))
                sys.exit(0)
    elif exceeds_free_tier and args.force:
        print(f"⚠️  Proceeding despite exceeding Free Tier ({images_count} > {FREE_TIER_LIMIT})", file=sys.stderr)

    # Output structured JSON for Claude to consume
    # Remove internal _config objects (not JSON-serializable)
    clean_rows = [{k: v for k, v in r.items() if k != "_config"} for r in rows]
    print(json.dumps({"rows": clean_rows, "total_count": len(rows),
                       "estimated_cost": round(total_cost, 3),
                       "exceeds_free_tier": exceeds_free_tier,
                       "free_tier_limit": FREE_TIER_LIMIT,
                       "errors": errors}, indent=2))


if __name__ == "__main__":
    main()
