# Banana Claude Skill - Architecture Guide

## Overview

Banana is a modular image generation skill that orchestrates Gemini API calls through a layered architecture. The design prioritizes:
- **Single source of truth** (config.json)
- **Reusable dataclasses** (ImageConfig, Domain, Workflow)
- **Minimal duplication** across scripts
- **Full backward compatibility**

## Architecture Layers

```
┌──────────────────────────────────────────┐
│  User Interface Layer (generate.py, batch.py)
│  - CLI argument parsing
│  - User-friendly error messages
│  - CSV batch processing
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Orchestration Layer (Workflow)
│  - Multi-step operations
│  - Parameter chaining
│  - Predefined patterns
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Domain Layer (Domain, ImageConfig)
│  - Image type presets (landscape, portrait, etc.)
│  - Parameter validation
│  - Cost calculation
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  Configuration Layer (config.json)
│  - Centralized settings
│  - Supported values
│  - Pricing table
└────────────────┬───────────────────────┘
                 │
┌────────────────▼───────────────────────┐
│  API Layer (generate_image, edit_image)
│  - Gemini REST API calls
│  - Retry logic
│  - Image encoding/decoding
└──────────────────────────────────────────┘
```

## Module Reference

### 1. config.json (Configuration)

**Single source of truth** for all Banana settings.

```json
{
  "free_tier_images_per_month": 100,
  "default_model": "gemini-3.1-flash-image-preview",
  "supported_aspect_ratios": ["1:1", "16:9", "9:16", ...],
  "supported_resolutions": ["512", "1K", "2K", "4K"],
  "pricing": {
    "gemini-3.1-flash-image-preview": 0.001,
    ...
  },
  "free_tier_warning_threshold": 0.8
}
```

**Used by:** All scripts and modules for validation and cost calculation.

### 2. image_config.py (Domain Logic)

Dataclass for validated image parameters.

```python
from image_config import ImageConfig

config = ImageConfig(
    aspect_ratio="16:9",
    resolution="2K",
    safety_filter="on"
)

# Validation happens in __post_init__
# Raises ValueError if invalid

# Use for cost calculation
multiplier = config.get_cost_multiplier()  # 2.0

# Convert to API parameters
params = config.to_api_params()
# → {"aspect_ratio": "16:9", "resolution": "2K", "safety_filter": true}
```

**Validation rules:**
- aspect_ratio must be in config.json:supported_aspect_ratios
- resolution must be in config.json:supported_resolutions
- safety_filter must be "on" or "off"

**Cost multipliers:**
- 512: 0.5x
- 1K: 1.0x
- 2K: 2.0x
- 4K: 4.0x

### 3. domain.py (Image Type Presets)

Predefined configurations for common image types.

```python
from domain import get_domain, DOMAINS

domain = DOMAINS["landscape"]
# → Domain(name="landscape", aspect_ratio="16:9", resolution="2K")

# Get by name with validation
domain = get_domain("landscape")  # Returns Domain
domain = get_domain("invalid")    # Raises ValueError

# Get prompt enhancement hints
hints = domain.get_prompt_enhancement()
# → "atmospheric depth, widescreen composition, natural lighting"
```

**Predefined domains:**
- `landscape` (16:9 @ 2K) - Wide scenic shots
- `portrait` (9:16 @ 2K) - Vertical portraits
- `product` (1:1 @ 2K) - Product photography
- `ui` (16:9 @ 1K) - UI/diagrams
- `editorial` (16:9 @ 2K) - Blog/article images
- `logo` (1:1 @ 2K) - Logo design

### 4. workflow.py (Multi-Step Operations)

Dataclasses for orchestrating multiple image operations.

```python
from workflow import get_workflow, WORKFLOWS

workflow = WORKFLOWS["generate_and_edit"]
# → Workflow with 2 steps: generate.py → edit.py

# Access workflow steps
for step in workflow.steps:
    print(step.script)       # "generate.py" or "edit.py"
    print(step.params)       # {"domain": "landscape"}
    print(step.output_var)   # "base_image" or "edited_image"

# Get metadata
workflow.get_total_operations()  # 2
workflow.get_scripts_used()      # ["edit.py", "generate.py"]
```

**Predefined workflows:**
- `generate_only` (1 step) - Single image generation
- `generate_and_edit` (2 steps) - Generate then edit
- `multi_variant` (3 steps) - Generate 3 variants

### 5. generate.py (Image Generation)

Script that generates images using Gemini API.

```bash
# Basic usage
generate.py --prompt "a cat in space" --domain landscape

# Override domain defaults
generate.py --domain landscape --aspect-ratio 1:1

# Explicit parameters
generate.py --prompt "test" --aspect-ratio 16:9 --resolution 2K
```

**Features:**
- Domain-based parameter selection
- ImageConfig validation
- Style hint injection via domain
- Retry logic with exponential backoff
- Cost tracking in output

### 6. edit.py (Image Editing)

Script that edits existing images using Gemini API.

```bash
# Basic usage
edit.py --image generated.png --prompt "remove sky"

# With domain hints
edit.py --image photo.png --prompt "edit" --domain landscape
```

**Features:**
- ImageConfig validation (optional)
- Multiple image format support (PNG, JPG, WebP, GIF)
- Retry logic
- Error handling for image not found

### 7. batch.py (Batch Processing)

Script that processes CSV files with image generation requests.

```bash
batch.py --csv requests.csv
```

**CSV format:**
```
prompt,workflow,domain,ratio,resolution,model,preset
"hero image",generate_and_edit,landscape,,
"photo series",multi_variant,,1:1,
"custom",generate_only,product,4:3,2K
```

**Features:**
- Workflow support
- Domain support
- Parameter override hierarchy
- Cost estimation
- Free tier warning
- Row validation with error reporting

## Data Flow

### Single Image Generation

```
User Input (--domain landscape)
    ↓
generate.py
    ↓
Domain lookup → get_domain("landscape")
    ↓
ImageConfig creation → ImageConfig(aspect_ratio="16:9", resolution="2K")
    ↓
Validation (config.json rules)
    ↓
API call → generate_image(...)
    ↓
Result with cost tracking
```

### Batch Processing

```
CSV file (workflow, domain, ratio, resolution columns)
    ↓
batch.py reads row
    ↓
Workflow lookup (optional) → get_workflow("generate_and_edit")
    ↓
Domain lookup (optional) → get_domain("landscape")
    ↓
Parameter resolution: workflow defaults → domain defaults → explicit values
    ↓
ImageConfig creation per row
    ↓
Cost calculation via ImageConfig.get_cost_multiplier()
    ↓
JSON output with rows, costs, validation errors
```

## Design Patterns

### 1. Single Source of Truth
All configuration comes from `config.json`. Scripts don't have hardcoded values.

```python
# ✓ GOOD
CONFIG = load_config()
supported_ratios = CONFIG.get("supported_aspect_ratios", [])

# ✗ BAD
VALID_RATIOS = {"1:1", "16:9", ...}  # Hardcoded
```

### 2. Validation at Construction
Dataclasses validate in `__post_init__()`, catching errors early.

```python
# ✓ GOOD
try:
    config = ImageConfig(aspect_ratio="invalid")
except ValueError as e:
    print(f"Error: {e}")

# ✗ BAD
config = {"aspect_ratio": "invalid"}  # No validation
```

### 3. Parameter Override Hierarchy
More specific values override less specific ones.

```
Explicit CLI args > Workflow defaults > Domain defaults > Script defaults
```

### 4. Minimal Coupling
Modules are independent; they pass data through parameters, not shared state.

```python
# ✓ GOOD
config = ImageConfig(aspect_ratio=domain.aspect_ratio)

# ✗ BAD
GLOBAL_DOMAIN = domain  # Shared state
config = ImageConfig()  # Uses GLOBAL_DOMAIN
```

## Testing Strategy

### Unit Tests (89 tests)
- Test each dataclass in isolation
- Verify validation rules
- Check predefined values

### Integration Tests (31 tests)
- Config → ImageConfig → Domain → Workflow data flow
- End-to-end scenarios (landscape generation, batch processing)
- Error handling and edge cases
- Data consistency across modules

### Manual Testing (via generate.py, batch.py)
- CLI argument parsing
- CSV batch processing
- Workflow execution
- Cost calculation accuracy

## Extension Points

### Adding a New Domain

1. Edit `domain.py` and add to `DOMAINS` dict
2. Ensure aspect_ratio and resolution exist in config.json
3. Run tests to verify integration

```python
DOMAINS["my_domain"] = Domain(
    name="my_domain",
    aspect_ratio="16:9",
    resolution="2K",
    description="...",
    style_hints=[...]
)
```

### Adding a New Workflow

1. Edit `workflow.py` and add to `WORKFLOWS` dict
2. Reference valid scripts in WorkflowSteps
3. Run tests to verify

```python
WORKFLOWS["my_workflow"] = Workflow(
    name="my_workflow",
    steps=[
        WorkflowStep(script="generate.py", ...),
        WorkflowStep(script="edit.py", ...),
    ],
    estimated_time_minutes=5
)
```

### Adding a New Config Value

1. Edit `config.json` and add the key
2. Update docstrings referencing the value
3. Update tests if validation changed

```json
{
  "new_setting": "value",
  ...
}
```

## Performance Considerations

- **Config loading:** Happens once at module import (cached in memory)
- **Validation:** O(n) lookup in config.json lists
- **Cost calculation:** O(1) dictionary lookup
- **Batch processing:** O(n) where n = number of rows

## Backward Compatibility

All changes maintain backward compatibility:
- New parameters are optional (default values provided)
- Explicit CLI args always work (domain/workflow are opt-in)
- CSV format is extensible (new columns ignored if unused)
- Config.json structure unchanged (values can be added)

## Security Considerations

- **Input validation:** All user input validated against config.json
- **API keys:** Only passed as command-line args or environment variables
- **Path sanitization:** CSV preset names sanitized to prevent path traversal
- **No shell injection:** All user input escaped properly
