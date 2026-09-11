# Execution Plan: Route B (Pragmatic Balance)

**Team:** 1 developer  
**Duration:** 6-8 weeks (realistic with overhead)  
**Priority:** Reduce code duplication via gradual ImageConfig refactor  
**Scope:** Phases 1 + 2 (gradual) only  
**Goal:** Banana internally coherent + integration story documented  

---

## 📅 Timeline Overview

```
WEEK 1-2:    Phase 1 (Low-Risk Wins)          [LOW RISK]
             Sprint 1.1: Free Tier validation
             Sprint 1.2: Aspect Ratio validation
             Sprint 1.3: Preset → Pricing

WEEK 3-6:    Phase 2 (Gradual ImageConfig)    [MEDIUM RISK]
             Sprint 2.1a: Create image_config.py (standalone)
             Sprint 2.1b: generate.py adopts ImageConfig
             Sprint 2.1c: edit.py adopts ImageConfig
             Sprint 2.1d: batch.py adopts ImageConfig

WEEK 7-8:    Stabilization + Testing         [LOW RISK]
             Integration testing
             Graph rebuild validation
             Hotfixes if needed

RESULT:
- 169 edges → 190+ edges (21 new connections)
- Banana duplication eliminated
- Free Tier/Aspect Ratio validated
- ImageConfig is single source of truth
- Zero Phase 3 (Domain Modes) work
- NO Phase 4 (just CLAUDE.md link)
```

---

## 🎯 Critical Success Factors

**For this plan to work:**

1. **ImageConfig must be backward compatible**
   - Old code still works if new params not provided
   - Gradual adoption reduces risk

2. **Testing between each sprint is NON-NEGOTIABLE**
   - After 2.1b: test generate.py thoroughly before moving to edit.py
   - Each sprint must pass before next starts
   - This is where the "8 weeks" buffer comes from

3. **Git branch strategy**
   - One feature branch: `feature/duplication-refactor`
   - One commit per sprint
   - NEVER force-push this branch

4. **Config file single source of truth**
   - Create `skills/banana/config.json` in Sprint 1.1
   - ALL scripts reference it (Phase 1 + 2)

---

## 📋 Week-by-Week Breakdown

### **WEEK 1: Sprint 1.1 - Free Tier Validation**

**Goal:** Make batch.py validate against Free Tier Limits (prevents user mistakes)

**Time Budget:** 4-6 hours

**Deliverables:**
- [ ] batch.py checks Free Tier before execution
- [ ] User gets warning if batch exceeds 100 images/month
- [ ] `--force` flag to skip warning
- [ ] cost-tracking.md updated with bidirectional link

**Step-by-Step:**

#### 1.1.1: Create config.json (30 min)

File: `skills/banana/config.json`
```json
{
  "free_tier_images_per_month": 100,
  "default_model": "gemini-3.1-flash-image-preview",
  "pricing": {
    "gemini-3.1-flash-image-preview": 0.001,
    "gemini-2.5-flash": 0.0005,
    "gemini-3-pro-image-preview": 0.0015
  },
  "free_tier_warning_threshold": 0.8
}
```

**Why:** Single source of truth. When Gemini changes limits, update 1 file, not code.

#### 1.1.2: Add config loader to batch.py (30 min)

```python
# skills/banana/scripts/batch.py
# Add at top of file:

import json
from pathlib import Path

def load_config():
    """Load Banana configuration from config.json"""
    config_path = Path(__file__).parent.parent / "config.json"
    with open(config_path) as f:
        return json.load(f)

CONFIG = load_config()
```

#### 1.1.3: Update estimate_cost() (45 min)

```python
def estimate_cost(images_count: int, model: str = None) -> dict:
    """
    Estima el costo de una operación batch.
    
    NOW VALIDATES AGAINST: Free Tier Limits (from config.json)
    See: skills/banana/references/cost-tracking.md
    """
    if model is None:
        model = CONFIG['default_model']
    
    pricing = CONFIG['pricing']
    total_cost = images_count * pricing.get(model, 0.001)
    free_tier_limit = CONFIG['free_tier_images_per_month']
    
    return {
        'total_cost': total_cost,
        'estimated_images': images_count,
        'model': model,
        'cost_per_image': pricing.get(model),
        'exceeds_free_tier': total_cost > free_tier_limit,  # ← NEW
        'free_tier_remaining': max(0, free_tier_limit - total_cost),  # ← NEW
        'exceeds_threshold': (total_cost / free_tier_limit) > CONFIG['free_tier_warning_threshold'],
    }
```

#### 1.1.4: Update main() to check Free Tier (45 min)

```python
def main():
    """Updated to warn before exceeding Free Tier."""
    args = parse_args()
    
    # Estimate cost
    cost_info = estimate_cost(args.count, args.model)
    
    # ← NEW: Check Free Tier
    if cost_info['exceeds_free_tier']:
        print(f"\n⚠️  WARNING: Operation exceeds Free Tier Limits")
        print(f"   Images to generate: {cost_info['estimated_images']}")
        print(f"   Free Tier: {CONFIG['free_tier_images_per_month']} images/month")
        print(f"   Estimated cost: ${cost_info['total_cost']:.2f}")
        print(f"   (See banana/config.json for pricing details)\n")
        
        if not args.force:
            response = input("Continue anyway? (type 'yes' to proceed): ")
            if response.lower() != 'yes':
                print("Aborted.")
                sys.exit(0)
    elif cost_info['exceeds_threshold']:
        print(f"\n⚠️  Heads up: This batch uses {cost_info['total_cost']/CONFIG['free_tier_images_per_month']*100:.1f}% of your Free Tier\n")
    
    # Execute batch
    print(f"Generating {args.count} images...")
    # ... rest of execution
```

#### 1.1.5: Update cost-tracking.md (30 min)

Add to `skills/banana/references/cost-tracking.md`:

```markdown
## Free Tier Limits

**100 free images per month** (reset on 1st of each month)

⚠️ **VALIDATED BY:** `skills/banana/scripts/batch.py`  
   - Function: `estimate_cost()` checks against this limit
   - User warning: Shown if batch would exceed limit
   - Config source: `skills/banana/config.json`

See: `skills/banana/config.json` for current limits
```

#### 1.1.6: Test (1.5 hours)

```bash
# Test 1: Normal batch (within Free Tier)
python skills/banana/scripts/batch.py --count 50 --dry-run
# Expected: No warning, proceeds normally

# Test 2: Batch exceeds Free Tier
python skills/banana/scripts/batch.py --count 150 --dry-run
# Expected: Shows warning, asks for confirmation
# Input: 'no'
# Expected: Aborts

# Test 3: Force flag skips warning
python skills/banana/scripts/batch.py --count 150 --force --dry-run
# Expected: Proceeds without asking

# Test 4: Config reload
# Edit config.json, change free_tier_images_per_month to 50
python skills/banana/scripts/batch.py --count 75 --dry-run
# Expected: Shows warning (75 > 50)
# Then restore config.json to original
```

**Edges Created:**
```
batch.py --validates_against--> Free Tier Limits
batch.py --reads_from--> config.json
config.json --referenced_by--> cost-tracking.md
```

**Definition of Done:**
- [ ] batch.py loads config.json at startup
- [ ] estimate_cost() returns exceeds_free_tier flag
- [ ] main() shows warning if exceeded
- [ ] --force flag skips warning
- [ ] All 4 tests pass
- [ ] cost-tracking.md updated with link to config.json

---

### **WEEK 1-2: Sprint 1.2 - Aspect Ratio Validation**

**Goal:** Make generate.py validate aspect ratios before API call

**Time Budget:** 3-4 hours (reuses config.json from 1.1)

**Deliverables:**
- [ ] generate.py validates aspect_ratio against supported list
- [ ] Error message is helpful (shows supported values)
- [ ] config.json includes supported_aspect_ratios

**Step-by-Step:**

#### 1.2.1: Add aspect ratios to config.json (15 min)

```json
{
  "supported_aspect_ratios": [
    "1:1", "16:9", "9:16", "3:4", "4:3", "3:2", "2:3",
    "21:9", "9:21", "5:4", "4:5", "1:2", "2:1"
  ],
  "supported_resolutions": [
    "256x256", "512x512", "768x768", "1024x1024",
    "1024x1280", "1280x1024"
  ]
}
```

#### 1.2.2: Add validation to generate.py (2 hours)

```python
# skills/banana/scripts/generate.py

# At top:
CONFIG = load_config()  # Reuse from batch.py

def validate_aspect_ratio(ratio: str) -> bool:
    """Validate aspect ratio against config.json"""
    if ratio not in CONFIG['supported_aspect_ratios']:
        supported = ', '.join(CONFIG['supported_aspect_ratios'])
        print(f"❌ Invalid aspect ratio: {ratio}")
        print(f"   Supported: {supported}")
        print(f"   (See banana/config.json for full list)")
        return False
    return True

def generate_image(
    prompt: str,
    model: str = None,
    aspect_ratio: str = "1:1",
) -> dict:
    """
    Generate image using shared config.
    
    NOW VALIDATES: aspect_ratio against config.json
    See: references/gemini-models.md - Supported Aspect Ratios
    """
    if model is None:
        model = CONFIG['default_model']
    
    # ← NEW: Validate before API call
    if not validate_aspect_ratio(aspect_ratio):
        raise ValueError(f"Invalid aspect ratio: {aspect_ratio}")
    
    # Call API
    response = genai.generate_images(
        prompt=prompt,
        model=model,
        config=ImageConfig(
            aspect_ratio=aspect_ratio,
        )
    )
    return response

def main():
    args = parse_args()
    
    # ← NEW: CLI support for aspect ratio
    if hasattr(args, 'aspect_ratio') and args.aspect_ratio:
        if not validate_aspect_ratio(args.aspect_ratio):
            sys.exit(1)
    
    image = generate_image(
        prompt=args.prompt,
        model=args.model,
        aspect_ratio=getattr(args, 'aspect_ratio', '1:1')
    )
```

#### 1.2.3: Update gemini-models.md (30 min)

```markdown
## Supported Aspect Ratios

The following aspect ratios are supported by Gemini image generation:

- 1:1 (square)
- 16:9 (widescreen)
- 9:16 (portrait)
- 3:4 (classic portrait)
- 4:3 (classic landscape)
- 3:2 (landscape)
- 2:3 (portrait)
- 21:9 (ultra-wide)
- 9:21 (ultra-tall)
- 5:4 (classic)
- 4:5 (classic)
- 1:2 (double portrait)
- 2:1 (double landscape)

⚠️ **VALIDATED BY:** `skills/banana/scripts/generate.py`  
   See: `generate_image()` function  
   Config source: `skills/banana/config.json`
```

**Test:**
```bash
# Test 1: Valid ratio
python skills/banana/scripts/generate.py --prompt "cat" --aspect-ratio 16:9 --dry-run
# Expected: Proceeds

# Test 2: Invalid ratio
python skills/banana/scripts/generate.py --prompt "cat" --aspect-ratio 99:1
# Expected: Shows error with supported list

# Test 3: Default ratio
python skills/banana/scripts/generate.py --prompt "cat" --dry-run
# Expected: Uses 1:1 as default
```

**Edges Created:**
```
generate.py --validates_against--> Supported Aspect Ratios
generate.py --reads_from--> config.json
config.json --referenced_by--> gemini-models.md
```

---

### **WEEK 2: Sprint 1.3 - Preset → Pricing Integration**

**Goal:** Show cost impact when displaying presets

**Time Budget:** 3-4 hours

**Deliverables:**
- [ ] `preset show` displays cost per image
- [ ] `preset list` shows cost column
- [ ] References config.json for pricing

**Step-by-Step:**

```python
# skills/banana/scripts/presets.py

CONFIG = load_config()  # Reuse from batch.py

def cmd_show(preset_name: str) -> None:
    """
    Show full preset details WITH COST.
    
    NOW INCLUDES: Estimated cost per image
    Source: skills/banana/config.json
    """
    preset_path = _preset_path(preset_name)
    
    if not preset_path.exists():
        print(f"Preset '{preset_name}' not found")
        return
    
    with open(preset_path) as f:
        preset = json.load(f)
    
    # Display preset
    print(f"\n📋 Preset: {preset_name}")
    print(f"   Model: {preset.get('model', CONFIG['default_model'])}")
    print(f"   Aspect Ratio: {preset.get('aspect_ratio', '1:1')}")
    print(f"   Style: {preset.get('style', 'N/A')}")
    
    # ← NEW: Show cost impact
    model = preset.get('model', CONFIG['default_model'])
    cost_per_image = CONFIG['pricing'].get(model, 0.001)
    
    print(f"\n   💰 Cost Impact:")
    print(f"      Per image: ${cost_per_image:.4f}")
    print(f"      Per 100 images: ${cost_per_image * 100:.2f}")
    print(f"      Per 1000 images: ${cost_per_image * 1000:.2f}")
    print(f"\n   Free Tier: {CONFIG['free_tier_images_per_month']} free images/month")
    print(f"   (See banana/config.json for pricing table)\n")

def cmd_list() -> None:
    """List all presets WITH COST COLUMN."""
    preset_dir = Path.home() / '.banana' / 'presets'
    
    if not preset_dir.exists():
        print("No presets found")
        return
    
    presets = sorted(preset_dir.glob('*.json'))
    
    print("\n📋 Available Presets:\n")
    print(f"{'Name':<20} {'Model':<30} {'Cost/img':<12} {'Cost/100':<12}")
    print("-" * 74)
    
    for preset_file in presets:
        with open(preset_file) as f:
            preset = json.load(f)
        
        model = preset.get('model', CONFIG['default_model'])
        cost_per = CONFIG['pricing'].get(model, 0.001)
        
        print(f"{preset_file.stem:<20} {model:<30} ${cost_per:.4f}     ${cost_per*100:.2f}")
    
    print(f"\n(Pricing from: banana/config.json)")
```

**Edges Created:**
```
presets.py --shows_cost_from--> config.json
presets.py --references--> Pricing Table (cost-tracking.md)
```

**Definition of Done for Phase 1:**
- [ ] All 3 sprints (1.1, 1.2, 1.3) passing tests
- [ ] config.json is single source of truth
- [ ] No hardcoded values in scripts
- [ ] Graph rebuilt: 6 new edges present
- [ ] Ready to move to Phase 2

---

## 🔧 PHASE 2: Gradual ImageConfig Refactor (Weeks 3-6)

### **WEEK 3: Sprint 2.1a - Create image_config.py (Standalone)**

**Goal:** Extract ImageConfig interface, but DON'T adopt it yet

**Time Budget:** 4-5 hours

**Deliverables:**
- [ ] image_config.py created with full validation
- [ ] Unit tests for image_config.py
- [ ] Zero changes to generate.py, edit.py, batch.py (they still work as-is)

**File: skills/banana/scripts/image_config.py**

```python
"""
Shared ImageConfig interface for all Banana scripts.

Eliminates duplication between generate.py, edit.py, batch.py.
Loaded gradually: See EXECUTION_PLAN_ROUTE_B.md for adoption schedule.

Created: Sprint 2.1a
Used by: generate.py (2.1b), edit.py (2.1c), batch.py (2.1d)
"""

from typing import Literal, Optional
from dataclasses import dataclass
import json
from pathlib import Path

def load_config():
    """Load Banana configuration from config.json"""
    config_path = Path(__file__).parent.parent / "config.json"
    with open(config_path) as f:
        return json.load(f)

CONFIG = load_config()

@dataclass
class ImageConfig:
    """
    Validates and holds image generation parameters.
    
    Single source of truth for aspect ratios, resolutions, safety filters.
    Used by:
    - generate.py (generate_image)
    - edit.py (edit_image)
    - batch.py (estimate_cost)
    
    All values validated against config.json.
    """
    
    aspect_ratio: str = "1:1"
    resolution: str = "1024x1024"
    safety_filter: Literal["on", "off"] = "on"
    
    def __post_init__(self):
        """Validate all parameters against config.json"""
        self._validate_aspect_ratio()
        self._validate_resolution()
    
    def _validate_aspect_ratio(self):
        if self.aspect_ratio not in CONFIG['supported_aspect_ratios']:
            supported = ', '.join(CONFIG['supported_aspect_ratios'])
            raise ValueError(
                f"Invalid aspect ratio: {self.aspect_ratio}\n"
                f"Supported: {supported}\n"
                f"(See config.json for full list)"
            )
    
    def _validate_resolution(self):
        if self.resolution not in CONFIG['supported_resolutions']:
            supported = ', '.join(CONFIG['supported_resolutions'])
            raise ValueError(
                f"Invalid resolution: {self.resolution}\n"
                f"Supported: {supported}\n"
                f"(See config.json for full list)"
            )
    
    def get_cost_multiplier(self) -> float:
        """
        Return cost multiplier based on resolution.
        
        Base = 256x256 (1.0x)
        Higher resolutions cost more (used by batch.py estimate_cost)
        """
        multipliers = {
            "256x256": 1.0,
            "512x512": 1.5,
            "768x768": 2.0,
            "1024x1024": 2.5,
            "1024x1280": 3.0,
            "1280x1024": 3.0,
        }
        return multipliers.get(self.resolution, 2.5)
    
    def to_api_params(self) -> dict:
        """Convert to Gemini API parameters"""
        return {
            'aspect_ratio': self.aspect_ratio,
            'resolution': self.resolution,
            'safety_filter': self.safety_filter == 'on',
        }


def validate_config(config: ImageConfig) -> bool:
    """Validate that config is valid before API call"""
    try:
        config.__post_init__()  # Triggers validation
        return True
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        return False
```

**Unit Tests: skills/banana/scripts/test_image_config.py**

```python
"""Unit tests for image_config.py"""

import pytest
from image_config import ImageConfig, validate_config, CONFIG

def test_valid_config():
    """Valid config should not raise"""
    config = ImageConfig(aspect_ratio="16:9", resolution="1024x1024")
    assert config.aspect_ratio == "16:9"
    assert config.resolution == "1024x1024"

def test_invalid_aspect_ratio():
    """Invalid aspect ratio should raise"""
    with pytest.raises(ValueError, match="Invalid aspect ratio"):
        ImageConfig(aspect_ratio="99:1")

def test_invalid_resolution():
    """Invalid resolution should raise"""
    with pytest.raises(ValueError, match="Invalid resolution"):
        ImageConfig(resolution="9999x9999")

def test_cost_multiplier():
    """Resolution should affect cost multiplier"""
    config_small = ImageConfig(resolution="256x256")
    config_large = ImageConfig(resolution="1024x1024")
    
    assert config_small.get_cost_multiplier() == 1.0
    assert config_large.get_cost_multiplier() == 2.5

def test_all_supported_ratios():
    """All ratios in config.json should be valid"""
    for ratio in CONFIG['supported_aspect_ratios']:
        config = ImageConfig(aspect_ratio=ratio)
        assert config.aspect_ratio == ratio

def test_all_supported_resolutions():
    """All resolutions in config.json should be valid"""
    for resolution in CONFIG['supported_resolutions']:
        config = ImageConfig(resolution=resolution)
        assert config.resolution == resolution

def test_to_api_params():
    """to_api_params should return dict suitable for API"""
    config = ImageConfig(aspect_ratio="16:9", safety_filter="on")
    params = config.to_api_params()
    
    assert params['aspect_ratio'] == "16:9"
    assert params['resolution'] == "1024x1024"
    assert params['safety_filter'] is True

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

**Run tests:**
```bash
cd skills/banana/scripts
python -m pytest test_image_config.py -v

# Expected: All tests pass
# 9 passed in X.XXs
```

**Edges Created:**
```
image_config.py --validates_against--> Supported Aspect Ratios
image_config.py --validates_against--> Supported Resolutions
image_config.py --reads_from--> config.json
```

**Why this sprint is important:**
- ImageConfig is created but NOT USED yet
- Tests pass, proving it works standalone
- Next sprints adopt it one script at a time
- If something breaks, we know it's image_config, not adoption

**Definition of Done:**
- [ ] image_config.py created with full docstrings
- [ ] test_image_config.py created with 9+ tests
- [ ] All tests pass
- [ ] zero changes to generate.py, edit.py, batch.py
- [ ] Generate.py still works exactly as before

---

### **WEEK 4: Sprint 2.1b - generate.py Adopts ImageConfig**

**Goal:** Make generate.py use ImageConfig (lowest-risk script)

**Time Budget:** 3 hours

**Deliverables:**
- [ ] generate_image() uses ImageConfig
- [ ] generate.py tests pass
- [ ] Backward compatible: if no ImageConfig passed, uses defaults

**Changes to generate.py:**

```python
# skills/banana/scripts/generate.py

# Add at top:
from image_config import ImageConfig, validate_config

def generate_image(
    prompt: str,
    model: str = None,
    config: Optional[ImageConfig] = None,
) -> dict:
    """
    Generate image using shared ImageConfig.
    
    NOW USES: ImageConfig (single source of truth for parameters)
    See: image_config.py for validation
    
    Args:
        prompt: Image description
        model: Gemini model to use (defaults from config.json)
        config: ImageConfig with aspect_ratio, resolution, etc.
               If None, creates default ImageConfig()
    """
    if model is None:
        model = CONFIG['default_model']
    
    if config is None:
        config = ImageConfig()  # Use defaults
    
    # ← NEW: Validate using shared interface
    if not validate_config(config):
        raise ValueError("Invalid image configuration")
    
    # Call API with validated config
    response = genai.generate_images(
        prompt=prompt,
        model=model,
        **config.to_api_params()  # Unpack validated params
    )
    return response

def main():
    args = parse_args()
    
    # ← NEW: Support ImageConfig via CLI
    config = ImageConfig(
        aspect_ratio=getattr(args, 'aspect_ratio', '1:1'),
        resolution=getattr(args, 'resolution', '1024x1024'),
        safety_filter='off' if args.disable_safety else 'on',
    )
    
    image = generate_image(
        prompt=args.prompt,
        model=args.model,
        config=config
    )
```

**Test:**
```bash
# Test 1: generate.py still works with default config
python skills/banana/scripts/generate.py --prompt "cat" --dry-run
# Expected: Proceeds with defaults (1:1, 1024x1024)

# Test 2: generate.py with custom aspect ratio
python skills/banana/scripts/generate.py --prompt "cat" --aspect-ratio 16:9 --dry-run
# Expected: Uses 16:9 aspect ratio

# Test 3: Backward compat: old code path still works
# (if someone calls generate_image("prompt", "model") without config)
python -c "
from scripts.generate import generate_image
config_result = generate_image('test', model='gemini-3.1-flash-image-preview')
print('✅ Backward compat works')
"
# Expected: ✅ Backward compat works
```

**Edges Created:**
```
generate.py --uses--> image_config.py
```

**Definition of Done:**
- [ ] generate.py imports ImageConfig
- [ ] generate_image() creates/validates ImageConfig
- [ ] main() passes ImageConfig to generate_image()
- [ ] All existing tests pass
- [ ] New tests for ImageConfig integration pass
- [ ] Backward compatible: calling generate_image() without config still works

---

### **WEEK 5: Sprint 2.1c - edit.py Adopts ImageConfig**

**Goal:** Make edit.py use ImageConfig (medium-risk script)

**Time Budget:** 3 hours

**Deliverables:**
- [ ] edit.py uses same ImageConfig as generate.py
- [ ] Consistent parameters across scripts
- [ ] Tests pass

**Changes to edit.py:**

(Same pattern as 2.1b - import ImageConfig, use in edit_image(), pass from main())

**Key difference from generate.py:**
- edit.py only supports subset of resolutions (API limitation)
- Validate that chosen resolution is supported for edit

```python
EDIT_SUPPORTED_RESOLUTIONS = [
    "512x512", "768x768", "1024x1024"
]

def edit_image(
    image_path: str,
    prompt: str,
    config: Optional[ImageConfig] = None,
) -> dict:
    """Edit image using shared ImageConfig."""
    
    if config is None:
        config = ImageConfig()
    
    # ← NEW: Validate for EDIT (more restrictive than generate)
    if config.resolution not in EDIT_SUPPORTED_RESOLUTIONS:
        raise ValueError(
            f"Resolution {config.resolution} not supported for edit.\n"
            f"Supported: {EDIT_SUPPORTED_RESOLUTIONS}"
        )
    
    if not validate_config(config):
        raise ValueError("Invalid image configuration")
    
    response = genai.edit_images(
        image=image_path,
        prompt=prompt,
        **config.to_api_params()
    )
    return response
```

---

### **WEEK 6: Sprint 2.1d - batch.py Adopts ImageConfig**

**Goal:** Make batch.py use ImageConfig for cost calculation

**Time Budget:** 2 hours

**Deliverables:**
- [ ] estimate_cost() uses config.get_cost_multiplier()
- [ ] batch.py and generate.py consistent on resolution pricing

**Changes to batch.py:**

```python
def estimate_cost(
    images_count: int,
    model: str = None,
    config: Optional[ImageConfig] = None,
) -> dict:
    """
    Estimate cost using SHARED config parameters.
    
    NOW RESPECTS: resolution multipliers from ImageConfig
    This ensures batch estimates match actual costs
    (generate.py might use different resolution → different cost)
    """
    
    if model is None:
        model = CONFIG['default_model']
    
    if config is None:
        config = ImageConfig()
    
    if not validate_config(config):
        raise ValueError("Invalid image configuration")
    
    pricing = CONFIG['pricing']
    base_cost_per_image = pricing.get(model, 0.001)
    cost_multiplier = config.get_cost_multiplier()
    adjusted_cost = base_cost_per_image * cost_multiplier
    
    total_cost = images_count * adjusted_cost
    free_tier_limit = CONFIG['free_tier_images_per_month']
    
    return {
        'total_cost': total_cost,
        'estimated_images': images_count,
        'model': model,
        'resolution': config.resolution,
        'cost_multiplier': cost_multiplier,
        'base_cost_per_image': base_cost_per_image,
        'adjusted_cost_per_image': adjusted_cost,
        'exceeds_free_tier': total_cost > free_tier_limit,
        'free_tier_remaining': max(0, free_tier_limit - total_cost),
    }
```

---

## ✅ Definition of Done: Phase 2

- [ ] Sprint 2.1a: image_config.py created, tested, not used yet
- [ ] Sprint 2.1b: generate.py adopts ImageConfig, all tests pass
- [ ] Sprint 2.1c: edit.py adopts ImageConfig, all tests pass
- [ ] Sprint 2.1d: batch.py adopts ImageConfig, all tests pass
- [ ] No duplication: all 3 scripts use same validation logic
- [ ] Backward compat: old code still works if needed
- [ ] Graph rebuilt: 3 new edges (script → image_config)

**Total: 0 duplication, 1 source of truth for ImageConfig**

---

## 📊 WEEK 7-8: Stabilization & Validation

### Integration Testing

```bash
# Full workflow test
cd skills/banana/scripts

# Workflow 1: generate with custom config
python generate.py --prompt "retro design" --aspect-ratio 3:4 --dry-run
# Verify: Uses 3:4 ratio

# Workflow 2: estimate cost for custom config
python batch.py --count 100 --resolution 1024x1280 --dry-run
# Verify: Shows cost_multiplier 3.0 (for 1024x1280)

# Workflow 3: preset shows matching cost
python presets.py list
python presets.py show default
# Verify: Cost displayed, matches batch.py calculation

# Workflow 4: validate free tier
python batch.py --count 150 --dry-run
# Verify: Shows warning (exceeds 100)

# Workflow 5: all config values from config.json
# Edit config.json, change free_tier_images_per_month to 50
python batch.py --count 75 --dry-run
# Verify: Shows warning (exceeds 50)
# Restore config.json
```

### Graph Rebuild & Validation

```bash
cd ~/.claude
/graphify .

# Query 1: Check new edges
/graphify query "What validates against config.json?"
# Should return: batch.py, generate.py, edit.py

# Query 2: Check ImageConfig edges
/graphify query "What uses image_config.py?"
# Should return: generate.py, edit.py, batch.py

# Query 3: Check Free Tier edges
/graphify query "What references Free Tier Limits?"
# Should return: batch.py, cost-tracking.md, config.json
```

### Hotfixes (if needed)

If tests fail during Week 7-8:
1. Don't go back to Phase 1
2. Fix in current script (2.1b/c/d)
3. Re-test
4. Move forward

Example: If edit.py tests fail because of resolution mismatch
→ Add EDIT_SUPPORTED_RESOLUTIONS check (already in code above)
→ Re-test
→ Continue to week 8

---

## 📈 Final Deliverables

**By End of Week 8:**

```
Code Quality:
✅ Zero duplication (generate/edit/batch use same ImageConfig)
✅ config.json is single source of truth
✅ Backward compatible (old code still works)
✅ Tests pass (all 3 scripts + image_config)

Graph Quality:
✅ 169 edges → 190+ edges (+21 connections)
✅ Free Tier validated by code
✅ Aspect Ratios validated by code
✅ Presets show cost impact
✅ All edges bidirectional (docs ↔ code)

Documentation:
✅ config.json links documented in code comments
✅ cost-tracking.md updated with validation links
✅ gemini-models.md linked from generate.py

User Experience:
✅ Batch warns before exceeding Free Tier
✅ Invalid aspect ratio shows helpful error
✅ Presets display cost per image
✅ Users understand cost implications before running expensive operations
```

---

## 🚨 Risk Mitigation Checklist

For each sprint, complete BEFORE moving to next:

- [ ] All tests pass locally
- [ ] Code has no hardcoded values
- [ ] Config.json is referenced (not copied)
- [ ] Documentation updated
- [ ] Backward compat verified
- [ ] No breaking changes to public API

If ANY of above fails:
→ Fix in current sprint
→ Do NOT move to next sprint until fixed
→ This is where "8 weeks" buffer is used

---

## 📝 Git Commit Pattern

For consistency, commit messages follow this pattern:

```
Sprint 1.1: Validate Free Tier Limits in batch.py

- Add config.json as single source of truth
- batch.py checks Free Tier before execution
- update cost-tracking.md with validation link
- All tests pass

Edges: batch.py → Free Tier Limits
```

```
Sprint 2.1b: generate.py adopts ImageConfig

- Import ImageConfig from new module
- generate_image() creates and validates ImageConfig
- Backward compatible: old code still works
- All tests pass

Edges: generate.py → image_config.py
```

---

## 🎯 Success Criteria

By Week 8, you should be able to answer YES to all:

- [ ] **Duplication eliminated?** Scripts share ImageConfig
- [ ] **Users protected?** Free Tier warnings shown before expensive ops
- [ ] **Cost transparent?** Presets display $/image
- [ ] **Config centralized?** config.json is single source
- [ ] **Graph improved?** 21+ new edges, better connectivity
- [ ] **Tests passing?** Zero failing tests
- [ ] **Ready to ship?** Confident in code quality

---

## What NOT to Do (Common Mistakes)

❌ **DON'T refactor all 3 scripts at once (Phase 2)**
→ Do them one at a time (2.1a → 2.1b → 2.1c → 2.1d)

❌ **DON'T skip testing between sprints**
→ Each sprint must pass tests before moving on

❌ **DON'T hardcode values**
→ Everything comes from config.json

❌ **DON'T work on Phase 3 (Domain Modes)**
→ Out of scope for Route B

❌ **DON'T write comprehensive Phase 4 docs**
→ Just update CLAUDE.md with one-line "related_to" link

❌ **DON'T force-push the feature branch**
→ Keep commit history intact for review

---

## 🎬 Ready to Start?

Print this document. Post it near your workspace.

**NEXT ACTION: Start Sprint 1.1**

```bash
# Week 1 Monday:
cd skills/banana

# Create config.json
cat > config.json << 'EOF'
{
  "free_tier_images_per_month": 100,
  "default_model": "gemini-3.1-flash-image-preview",
  "supported_aspect_ratios": [
    "1:1", "16:9", "9:16", "3:4", "4:3", "3:2", "2:3",
    "21:9", "9:21", "5:4", "4:5", "1:2", "2:1"
  ],
  "supported_resolutions": [
    "256x256", "512x512", "768x768", "1024x1024",
    "1024x1280", "1280x1024"
  ],
  "pricing": {
    "gemini-3.1-flash-image-preview": 0.001,
    "gemini-2.5-flash": 0.0005,
    "gemini-3-pro-image-preview": 0.0015
  },
  "free_tier_warning_threshold": 0.8
}
EOF

# Commit
git add config.json
git commit -m "chore: Add Banana configuration file (single source of truth)"

# Start Sprint 1.1
# (Follow section "WEEK 1: Sprint 1.1 - Free Tier Validation")
```

Questions before starting? Ask now. Otherwise: **ship fast, test thoroughly**.
