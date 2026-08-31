# Banana Claude Skill - User Guide

## Quick Start

### Single Image Generation

```bash
# Basic generation with domain
generate.py --prompt "a mountain landscape at sunset" --domain landscape

# Override default parameters
generate.py --prompt "portrait" --domain portrait --resolution 4K

# Custom aspect ratio
generate.py --prompt "banner" --aspect-ratio 21:9 --resolution 2K
```

### Batch Processing

Create a CSV file `requests.csv`:
```
prompt,workflow,domain
"hero image",generate_and_edit,landscape
"photo series",multi_variant,
"custom product",generate_only,product
```

Then run:
```bash
batch.py --csv requests.csv
```

## Using Domains

Domains auto-select aspect ratio, resolution, and add style hints to your prompt.

### Available Domains

| Domain | Size | Use Case | Parameters |
|--------|------|----------|------------|
| **landscape** | 16:9 @ 2K | Scenic, backgrounds, wide shots | atmosphere, depth, composition |
| **portrait** | 9:16 @ 2K | People, characters, vertical framing | detail, lighting, focus |
| **product** | 1:1 @ 2K | E-commerce, studio photography | centered, clean, sharp |
| **ui** | 16:9 @ 1K | Mockups, diagrams, interface design | structured, typography, flat |
| **editorial** | 16:9 @ 2K | Blog headers, articles, covers | bold, narrative, contemporary |
| **logo** | 1:1 @ 2K | Branding, marks, icons | geometric, memorable, scalable |

### Domain Examples

```bash
# Landscape (16:9 @ 2K)
generate.py --prompt "mountain range" --domain landscape
# Uses: 16:9 aspect ratio, 2K resolution
# Adds hints: atmospheric depth, widescreen composition, natural lighting

# Portrait (9:16 @ 2K)
generate.py --prompt "professional headshot" --domain portrait
# Uses: 9:16 aspect ratio, 2K resolution
# Adds hints: fine facial detail, shoulder composition, professional lighting

# Product (1:1 @ 2K)
generate.py --prompt "coffee cup on marble" --domain product
# Uses: 1:1 aspect ratio, 2K resolution
# Adds hints: centered subject, clean background, studio lighting, sharp focus

# UI (16:9 @ 1K) - Note: lower resolution
generate.py --prompt "dashboard mockup" --domain ui
# Uses: 16:9 aspect ratio, 1K resolution
# Adds hints: structured layout, clear typography, flat design, grid-aligned
```

### Override Domain Defaults

```bash
# Use portrait domain but with custom aspect ratio
generate.py --prompt "tall banner" --domain portrait --aspect-ratio 1:1 --resolution 4K

# Explicit parameters always win over domain defaults
generate.py --prompt "custom" --domain landscape --aspect-ratio 21:9
# Result: 21:9 aspect ratio (from explicit arg), 2K resolution (from landscape domain)
```

## Using Workflows

Workflows chain multiple operations together.

### Available Workflows

| Workflow | Steps | Time | Use Case |
|----------|-------|------|----------|
| **generate_only** | Generate | ~2 min | Single image |
| **generate_and_edit** | Generate → Edit | ~5 min | Generate then refine |
| **multi_variant** | Generate × 3 | ~6 min | Compare variations |

### Workflow Examples

```bash
# Single generation (workflow not required, but explicit)
batch.py --csv single_image.csv
# CSV: prompt,workflow
#      "hero shot",generate_only

# Generate then edit
batch.py --csv generate_and_edit.csv
# CSV: prompt,workflow,domain
#      "base image",generate_and_edit,landscape
#      "base image",generate_and_edit,product

# Multi-variant (generates 3 variations automatically)
batch.py --csv variants.csv
# CSV: prompt,workflow
#      "explore styles",multi_variant
```

## Batch Processing (CSV Format)

### Full CSV Format

```
prompt,workflow,domain,ratio,resolution,model,preset
```

**Required column:**
- `prompt`: The image generation prompt

**Optional columns:**
- `workflow`: Multi-step operation (generate_only, generate_and_edit, multi_variant)
- `domain`: Image type (landscape, portrait, product, ui, editorial, logo)
- `ratio`: Aspect ratio (1:1, 16:9, 9:16, 21:9, etc.)
- `resolution`: Resolution tier (512, 1K, 2K, 4K)
- `model`: Model ID (defaults to gemini-3.1-flash-image-preview)
- `preset`: Brand/style preset name

### Parameter Resolution

When processing a CSV row, parameters are resolved in this order:

1. **Explicit values in CSV** (highest priority)
   - If ratio or resolution specified in CSV, use it
2. **Workflow defaults** (if workflow column used)
   - Workflow suggests domain and parameters from first step
3. **Domain defaults** (if domain column used)
   - Landscape domain → 16:9 @ 2K
   - Portrait domain → 9:16 @ 2K
   - etc.
4. **Script defaults** (lowest priority)
   - 1:1 aspect ratio, 1K resolution

### CSV Examples

#### Example 1: Domain-Based Generation

```
prompt,domain
"mountain landscape",landscape
"person portrait",portrait
"coffee product",product
"app mockup",ui
```

Result:
- Row 1: 16:9 @ 2K (landscape defaults)
- Row 2: 9:16 @ 2K (portrait defaults)
- Row 3: 1:1 @ 2K (product defaults)
- Row 4: 16:9 @ 1K (ui defaults, note lower resolution)

#### Example 2: Workflow-Based Generation

```
prompt,workflow,domain
"hero shot for blog",generate_and_edit,landscape
"explore variations",multi_variant,
"quick proof",generate_only,product
```

Result:
- Row 1: 2-step workflow (generate + edit) with landscape domain
- Row 2: 3-step workflow generating 3 variants (landscape, portrait, product)
- Row 3: 1-step workflow with product domain (1:1 @ 2K)

#### Example 3: Override Defaults

```
prompt,workflow,domain,ratio,resolution
"standard hero",generate_and_edit,landscape,,
"custom product",generate_only,product,16:9,4K
"tall banner",generate_and_edit,,21:9,2K
```

Result:
- Row 1: generate_and_edit workflow + landscape domain (16:9 @ 2K)
- Row 2: generate_only workflow, custom ratio (16:9 @ 4K instead of 1:1 @ 2K)
- Row 3: generate_and_edit workflow, custom ratio (21:9 @ 2K), no domain

## Cost Estimation

### Cost Calculation

Cost = base_price × resolution_multiplier

**Resolution multipliers:**
- 512: 0.5x
- 1K: 1.0x
- 2K: 2.0x
- 4K: 4.0x

**Example calculation:**
```
Base cost: $0.001 per image
2K resolution: 2.0x multiplier
Total per image: $0.001 × 2.0 = $0.002
Per 100 images: $0.20
```

### Check Costs Before Running

```bash
# batch.py shows estimated cost before processing
batch.py --csv requests.csv
# Output includes:
#   "estimated_cost": 0.008,  # Total for all rows
#   "exceeds_free_tier": false,
#   "free_tier_limit": 100
```

### Free Tier Limits

- **Limit:** 100 free images per month
- **Cost:** No overage charges (batched)
- **Reset:** Monthly (first of month)

If a batch exceeds the free tier:
```bash
# Get warning, then confirm
batch.py --csv large_batch.csv

# ⚠️  WARNING: Operation exceeds Free Tier Limits
#    Images to generate: 150
#    Free Tier: 100 images/month
#    Use --force to proceed without warning

# Override the warning
batch.py --csv large_batch.csv --force
```

## Advanced Usage

### Combining Features

```bash
# Workflow + domain + explicit override
batch.py --csv advanced.csv
```

CSV content:
```
prompt,workflow,domain,ratio,resolution
"generate base then edit",generate_and_edit,landscape,,
"explore with custom aspect",multi_variant,landscape,4:1,2K
"product shot custom",generate_only,product,,4K
```

### Using Presets with Domains

```bash
# Generate with brand preset + domain
generate.py --prompt "marketing hero" --domain landscape --model gemini-3.1-flash-image-preview

# In batch (if preset column implemented)
batch.py --csv with_presets.csv
# CSV: prompt,preset,domain
#      "hero",tech-saas,landscape
```

## Troubleshooting

### Invalid Aspect Ratio Error

```
Error: Invalid aspect ratio: '99:1'
Supported: 1:1, 16:9, 9:16, 3:4, 4:3, 3:2, 2:3, 21:9, 9:21, 5:4, 4:5, 1:2, 2:1
```

**Solution:** Use a supported aspect ratio from the list.

### Invalid Resolution Error

```
Error: Invalid resolution: '3K'
Supported: 512, 1K, 2K, 4K
```

**Solution:** Use 512, 1K, 2K, or 4K (not 3K).

### Invalid Domain Error

```
Error: Unknown domain: 'cinema'
Supported: editorial, landscape, logo, portrait, product, ui
```

**Solution:** Use one of the supported domains.

### Missing API Key

```
Error: No API key. Set GOOGLE_AI_API_KEY env or pass --api-key
```

**Solution:**
```bash
# Option 1: Environment variable
export GOOGLE_AI_API_KEY="your-key-here"
generate.py --prompt "test"

# Option 2: Command-line argument
generate.py --prompt "test" --api-key "your-key-here"
```

### Batch CSV Errors

```
Validation errors:
  - Row 3: missing prompt
  - Row 5: Invalid aspect ratio: '1:99'
```

**Solution:** Fix the CSV and retry. The error message shows which rows have problems.

## Best Practices

### 1. Use Domains First

Domains handle aspect ratio and resolution for you:
```bash
# ✓ Good: Let domain decide
generate.py --prompt "landscape" --domain landscape

# ✗ Less optimal: Manual specification
generate.py --prompt "landscape" --aspect-ratio 16:9 --resolution 2K
```

### 2. Batch Before Generate

For multiple images, use batch processing:
```bash
# ✓ Good: Batch processing with cost visibility
batch.py --csv requests.csv

# ✗ Less efficient: Multiple individual calls
for i in {1..10}; do
  generate.py --prompt "prompt $i" --domain landscape
done
```

### 3. Override Only When Needed

Let defaults work for you:
```bash
# ✓ Good: Use domain defaults
generate.py --prompt "banner" --domain ui  # 16:9 @ 1K

# ✗ Unnecessary: Override for no reason
generate.py --prompt "banner" --domain ui --aspect-ratio 16:9 --resolution 1K
```

### 4. Check Costs Before Large Batches

```bash
# Use --dry-run to preview without API calls
batch.py --csv large_batch.csv --dry-run

# Review the output:
# - estimated_cost
# - exceeds_free_tier
# - any validation errors
```

## API Reference

See `references/ARCHITECTURE.md` for detailed module documentation.

Quick reference:
- `ImageConfig` - Validated image parameters (image_config.py)
- `Domain` - Image type preset (domain.py)
- `Workflow` - Multi-step operations (workflow.py)
- `generate_image()` - Generate images (generate.py)
- `edit_image()` - Edit images (edit.py)

## Getting Help

- Check `--help` on any script: `generate.py --help`
- Review error messages (they suggest fixes)
- See `references/ARCHITECTURE.md` for design details
- Check `references/gemini-models.md` for API information
