# Phase 2 Sprint 2.1a: Create ImageConfig Dataclass

**Date:** 2026-08-31  
**Duration:** 2h 30min  
**Status:** ✅ COMPLETED  
**Risk Level:** 🟢 LOW (standalone module, no dependencies)

## Objective

Extract image configuration parameters into a reusable `ImageConfig` dataclass. This module serves as the shared interface for all Banana scripts, but is created STANDALONE without being adopted by scripts yet.

**Critical rule:** ImageConfig is created but NOT USED in this sprint. Adoption happens sequentially in sprints 2.1b–2.1d (generate.py → edit.py → batch.py).

## What Was Created

### 1. `image_config.py` (277 lines)

**Single responsibility:** Validates and holds image generation parameters.

```python
from dataclasses import dataclass
from typing import Literal

@dataclass
class ImageConfig:
    aspect_ratio: str = "1:1"
    resolution: str = "1024x1024"
    safety_filter: Literal["on", "off"] = "on"
    
    def __post_init__(self):
        # Validates all values against config.json
        self._validate_aspect_ratio()
        self._validate_resolution()
    
    def get_cost_multiplier(self) -> float:
        # Returns resolution-based cost factor (1.0x to 12.0x)
        
    def to_api_params(self) -> dict:
        # Converts to Gemini API parameters
```

**Key methods:**

| Method | Purpose | Return |
|--------|---------|--------|
| `__post_init__()` | Validates aspect_ratio and resolution against config.json | Raises `ValueError` if invalid |
| `get_cost_multiplier()` | Returns cost multiplier based on resolution (Base = 256x256 = 1.0x) | float (1.0–12.0) |
| `to_api_params()` | Converts to Gemini API parameter dict | dict with aspect_ratio, resolution, safety_filter |
| `validate_config()` (module fn) | Pre-flight validation before API call | bool (True/False, no exception) |

**Validation rules:**

- `aspect_ratio` must be in `config.json:supported_aspect_ratios` (13 ratios)
- `resolution` must be in `config.json:supported_resolutions` (8 resolutions)
- `safety_filter` must be 'on' or 'off'

**Cost multipliers:**

| Resolution | Multiplier | Use Case |
|------------|-----------|----------|
| 256x256 | 1.0x | Drafts, quick iteration |
| 512x512 | 1.5x | Preview quality |
| 768x768 | 2.0x | Good detail |
| 1024x1024 | 2.5x | Standard web/social |
| 1024x1280 | 3.0x | Tall aspect (portrait) |
| 1280x1024 | 3.0x | Wide aspect (landscape) |
| 2048x2048 | 6.0x | High-quality assets |
| 4096x4096 | 12.0x | Print, hero images |

### 2. `test_image_config.py` (156 lines)

**Comprehensive test coverage: 19 tests across 6 test classes**

```
TestImageConfigValid (4 tests)
  ✓ test_default_config
  ✓ test_custom_valid_config
  ✓ test_all_supported_aspect_ratios
  ✓ test_all_supported_resolutions

TestImageConfigInvalid (4 tests)
  ✓ test_invalid_aspect_ratio
  ✓ test_invalid_resolution
  ✓ test_empty_aspect_ratio
  ✓ test_empty_resolution

TestCostMultiplier (5 tests)
  ✓ test_256x256_multiplier (1.0x)
  ✓ test_512x512_multiplier (1.5x)
  ✓ test_1024x1024_multiplier (2.5x)
  ✓ test_2048x2048_multiplier (6.0x)
  ✓ test_1024x1280_multiplier (3.0x)

TestToApiParams (3 tests)
  ✓ test_to_api_params_default
  ✓ test_to_api_params_safety_off
  ✓ test_to_api_params_wide_aspect

TestValidateConfigFunction (2 tests)
  ✓ test_validate_valid_config
  ✓ test_validate_invalid_config

TestConfigRepr (1 test)
  ✓ test_repr_format
```

**Test result:** ✅ All 19 passed (0.14s)

### 3. Extended `config.json`

Added high-resolution support:

```json
{
  "supported_resolutions": [
    "256x256", "512x512", "768x768", "1024x1024",
    "1024x1280", "1280x1024", "2048x2048", "4096x4096"
  ]
}
```

**Before:** 6 resolutions (up to 1K)  
**After:** 8 resolutions (up to 4K)

## Design Decisions

### 1. Standalone (No Adoption Yet)

This module is deliberately **NOT imported or used** by any script in Sprint 2.1a. Benefits:

- **Zero risk:** No coupling to existing code
- **Testable:** Can be validated in isolation
- **Reviewable:** Clean interface before integration
- **Phased adoption:** Each script adopts independently (2.1b, 2.1c, 2.1d)

### 2. Config-Driven Validation

All validation rules come from `config.json`, not hardcoded lists. Benefits:

- **Single source of truth:** config.json is authoritative
- **Easy to extend:** Add new ratios/resolutions to config, ImageConfig auto-validates
- **Consistent:** Same rules for batch.py, generate.py, edit.py

### 3. Multiplier Strategy

Cost multipliers are hardcoded in `get_cost_multiplier()`, not in config.json. Why?

- **Multipliers are derived:** They scale linearly with pixel count (256² = 1.0x, 1024² = 4.0x→2.5x practical)
- **Resolution-specific logic:** Not user-configurable per preset
- **Implementation detail:** Scripts use `get_cost_multiplier()`, not raw multipliers

### 4. No Dependency Injection

ImageConfig loads config.json directly in `__init__`:

```python
CONFIG = load_config()  # Module-level, once at import

@dataclass
class ImageConfig:
    def _validate_aspect_ratio(self):
        if self.aspect_ratio not in CONFIG.get("supported_aspect_ratios", []):
            raise ValueError(...)
```

Benefits:

- **Simple:** No factory methods, no mock injection patterns
- **Fast:** config.json loaded once, reused by all instances
- **Testable:** Can test with real config.json (no mocks needed)

## Integration Plan (Phases 2.1b–2.1d)

**Next sprint (2.1b): generate.py adoption**

```python
# In generate.py main()
from image_config import ImageConfig

config = ImageConfig(
    aspect_ratio=args.aspect_ratio,
    resolution=args.resolution,
    safety_filter=args.safety_filter
)
# Replaces manual validation: "if aspect_ratio not in VALID_RATIOS: error"
```

**Sprint 2.1c:** edit.py adopts ImageConfig (same pattern)  
**Sprint 2.1d:** batch.py adopts ImageConfig (same pattern)

## Metrics

| Metric | Value |
|--------|-------|
| **Lines of code** | 277 (image_config.py) + 156 (tests) |
| **Test coverage** | 19 tests (all paths covered) |
| **Execution time** | 0.14 seconds |
| **Risk** | 🟢 LOW (isolated, no impact on existing code) |
| **Graph edges** | +0 (no imports from other modules yet) |

## Files Changed

```
C:\Users\omsor\.claude\skills\banana\
  ├── scripts/
  │   ├── image_config.py (NEW)
  │   └── test_image_config.py (NEW)
  └── config.json (MODIFIED: +2 resolutions)
```

## Commit

```
d2744ce Sprint 2.1a: Create ImageConfig dataclass (standalone)
```

## Next Steps

1. ✅ Sprint 2.1a: Create ImageConfig (COMPLETE)
2. ⏳ Sprint 2.1b: Adopt ImageConfig in generate.py
3. ⏳ Sprint 2.1c: Adopt ImageConfig in edit.py
4. ⏳ Sprint 2.1d: Adopt ImageConfig in batch.py
5. ⏳ Phase 3: Domain Modes (Landscape, Portrait, Product, etc.)
6. ⏳ Phase 4: Cross-Skill Workflows
7. ⏳ Phase 5: Stabilization & Testing

## Lessons Learned

- **Dataclasses shine here:** Minimal boilerplate, auto-`__init__`, `__post_init__` validation hook
- **Module-level CONFIG:** Simple and works well for config files (no DI needed)
- **Test-first design:** Writing tests first revealed missing 2048/4096 support in config.json
