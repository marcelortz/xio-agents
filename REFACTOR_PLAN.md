# Knowledge Graph Refactor Plan

**Objetivo:** Cerrar 5 brechas críticas de conexión en el grafo de skills (Banana + Graphify)

**Resultado esperado:** 
- 165 nodes → 165 nodes (sin cambios estructurales)
- 169 edges → 195+ edges (+26 nuevas conexiones)
- Cohesión mejorada en Communities 0, 1, 2, 5, 10-12

**Timeline:** 4-6 semanas (8 puntos de historia)

---

## FASE 1: Cerrar los Gaps de Referencia Documentada (LOW-HANGING FRUIT)

### Sprint 1.1: Validar Límites de Free Tier en batch.py

**Archivos afectados:**
- `skills/banana/scripts/batch.py` (PRIMARY)
- `skills/banana/references/cost-tracking.md` (REFERENCE)
- `skills/banana/SKILL.md` (DOCUMENTATION)

**Cambios requeridos:**

#### 1a. En `batch.py`: Agregar validación de Free Tier

```python
# Línea ~36, en la función estimate_cost():

def estimate_cost(images_count: int, model: str = "gemini-3.1-flash-image-preview") -> dict:
    """
    Estima el costo de una operación batch.
    
    NOW VALIDATES AGAINST: Free Tier Limits (see references/cost-tracking.md)
    """
    # Load pricing
    pricing = {
        'gemini-3.1-flash-image-preview': 0.001,  # per image
        'gemini-2.5-flash': 0.0005,
    }
    
    total_cost = images_count * pricing.get(model, 0.001)
    free_tier_limit = 100  # 100 free images per month (from cost-tracking.md)
    
    return {
        'total_cost': total_cost,
        'estimated_images': images_count,
        'model': model,
        'exceeds_free_tier': total_cost > free_tier_limit,  # ← NEW
        'free_tier_remaining': max(0, free_tier_limit - total_cost),  # ← NEW
    }

def main():
    """Updated to check Free Tier before executing batch."""
    args = parse_args()
    
    # Estimate cost
    cost_info = estimate_cost(args.count, args.model)
    
    # ← NEW: Check Free Tier
    if cost_info['exceeds_free_tier']:
        print(f"⚠️  WARNING: Operation exceeds Free Tier Limits")
        print(f"   Cost: ${cost_info['total_cost']:.2f}")
        print(f"   Free Tier: ${free_tier_limit:.2f}/month")
        
        if not args.force:
            response = input("Continue anyway? (y/N): ")
            if response.lower() != 'y':
                sys.exit(0)
    
    # Execute batch
    ...
```

**Rationale:** 
- `batch.py` currently ignores Free Tier Limits documented in `cost-tracking.md`
- Users blindly run expensive batches without warnings
- EDGE CREATED: `batch.py` → `Free Tier Limits` (validates)

**Edge to create in graph:**
```
batch.py --validates_against--> Free Tier Limits
  (from: skills/banana/scripts/batch.py, to: skills/banana/references/cost-tracking.md)
  (relation: "batch.py enforces the Free Tier constraints documented here")
```

---

#### 1b. En `cost-tracking.md`: Agregar referencia bidireccional

```markdown
# Cost Tracking Reference

## Free Tier Limits

- **100 free images per month** (reset monthly)
- Each image counts toward the limit regardless of model
- Once exhausted, standard pricing applies immediately
- No overage charges—requests simply fail with rate-limit error

⚠️ **VALIDATED BY:** `skills/banana/scripts/batch.py:main()` 
   See: estimate_cost() function for enforcement logic

---

## Pricing Table

| Model | Cost per Image | Use Case |
|-------|---|---|
| Gemini 3.1 Flash | $0.001 | Default, fast |
| Gemini 2.5 Flash | $0.0005 | Budget, slower |
| Batch API | $0.0003 per image (bulk discount) | 1000+ images |

⚠️ **VALIDATED BY:** `skills/banana/scripts/batch.py:estimate_cost()`
   `skills/banana/scripts/cost_tracker.py` logs actual usage
```

**Edge to create:**
```
Free Tier Limits --referenced_by--> batch.py
Pricing Table --referenced_by--> batch.py
```

**Story Points:** 2

**Definition of Done:**
- [ ] `batch.py` reads Free Tier Limits from constant
- [ ] `estimate_cost()` checks if operation exceeds limit
- [ ] `main()` prompts user before exceeding Free Tier
- [ ] `--force` flag skips prompt
- [ ] Updated cost-tracking.md with bidirectional reference
- [ ] Test: `python scripts/batch.py --count 150 --dry-run` shows warning

---

### Sprint 1.2: Validar Aspect Ratios en generate.py

**Archivos afectados:**
- `skills/banana/scripts/generate.py` (PRIMARY)
- `skills/banana/references/gemini-models.md` (REFERENCE)

**Cambios requeridos:**

#### 2a. En `generate.py`: Agregar validación de aspect ratio

```python
# Línea ~33, en generate_image():

SUPPORTED_ASPECT_RATIOS = [
    "1:1", "16:9", "9:16", "3:4", "4:3", "3:2", "2:3",
    "21:9", "9:21", "5:4", "4:5", "1:2", "2:1"
]
# Source: See gemini-models.md - Supported Aspect Ratios

def generate_image(
    prompt: str,
    model: str = "gemini-3.1-flash-image-preview",
    aspect_ratio: str = "1:1",  # ← NEW parameter
) -> dict:
    """
    Generate image using Gemini API.
    
    Args:
        aspect_ratio: One of {SUPPORTED_ASPECT_RATIOS}
                     (see references/gemini-models.md)
    
    Raises:
        ValueError: If aspect_ratio not in SUPPORTED_ASPECT_RATIOS
    """
    
    # ← NEW: Validate aspect ratio
    if aspect_ratio not in SUPPORTED_ASPECT_RATIOS:
        raise ValueError(
            f"Invalid aspect ratio: {aspect_ratio}\n"
            f"Supported: {', '.join(SUPPORTED_ASPECT_RATIOS)}\n"
            f"(See gemini-models.md for details)"
        )
    
    # Call API
    response = genai.generate_images(
        prompt=prompt,
        model=model,
        config=ImageConfig(
            aspect_ratio=aspect_ratio,
            # ... rest of config
        )
    )
    return response

def main():
    args = parse_args()
    
    # ← NEW: Add aspect ratio argument
    if hasattr(args, 'aspect_ratio') and args.aspect_ratio:
        validate_aspect_ratio(args.aspect_ratio)
    
    image = generate_image(
        prompt=args.prompt,
        model=args.model,
        aspect_ratio=getattr(args, 'aspect_ratio', '1:1')
    )
```

**Edge to create:**
```
generate.py --validates_against--> Supported Aspect Ratios
  (from: skills/banana/scripts/generate.py, to: skills/banana/references/gemini-models.md)
```

**Story Points:** 2

**Definition of Done:**
- [ ] `SUPPORTED_ASPECT_RATIOS` constant defined in generate.py
- [ ] `generate_image()` validates before API call
- [ ] CLI accepts `--aspect-ratio` flag
- [ ] Error message references gemini-models.md
- [ ] Test: `python scripts/generate.py --prompt "cat" --aspect-ratio invalid` fails with helpful message

---

### Sprint 1.3: Vincular Presets → Pricing en presets.py

**Archivos afectados:**
- `skills/banana/scripts/presets.py` (PRIMARY)
- `skills/banana/references/cost-tracking.md` (REFERENCE)

**Cambios requeridos:**

#### 3a. En `presets.py`: Enriquecer cmd_show() con costo estimado

```python
# Línea ~71, función cmd_show():

# ← NEW: Load pricing data
PRICING = {
    'gemini-3.1-flash-image-preview': 0.001,
    'gemini-2.5-flash': 0.0005,
}

def cmd_show(preset_name: str) -> None:
    """
    Show full preset details.
    
    NOW INCLUDES: Estimated cost per image (links to cost-tracking.md)
    """
    preset_path = _preset_path(preset_name)
    
    if not preset_path.exists():
        print(f"Preset '{preset_name}' not found")
        return
    
    with open(preset_path) as f:
        preset = json.load(f)
    
    # Display preset
    print(f"\n📋 Preset: {preset_name}")
    print(f"   Model: {preset.get('model', 'N/A')}")
    print(f"   Aspect Ratio: {preset.get('aspect_ratio', '1:1')}")
    print(f"   Style: {preset.get('style', 'N/A')}")
    
    # ← NEW: Show cost impact
    model = preset.get('model', 'gemini-3.1-flash-image-preview')
    cost_per_image = PRICING.get(model, 0.001)
    
    print(f"\n   💰 Estimated Cost:")
    print(f"      Per image: ${cost_per_image:.4f}")
    print(f"      Per 100 images: ${cost_per_image * 100:.2f}")
    print(f"      Per 1000 images: ${cost_per_image * 1000:.2f}")
    print(f"\n   (See banana/references/cost-tracking.md for pricing table)")
    
    print(f"\n   Free Tier: 100 free images/month")
    print(f"   (See banana/references/cost-tracking.md for Free Tier Limits)")

def cmd_list() -> None:
    """
    List all presets with quick cost info.
    
    NOW SHOWS: Cost summary for each preset
    """
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
        
        model = preset.get('model', 'unknown')
        cost_per = PRICING.get(model, 0.001)
        
        print(f"{preset_file.stem:<20} {model:<30} ${cost_per:.4f}     ${cost_per*100:.2f}")
    
    print(f"\n(Pricing from: banana/references/cost-tracking.md)")
```

**Edge to create:**
```
presets.py --shows_pricing_from--> Pricing Table
presets.py --references--> Cost Tracker CLI Commands
presets.py --references--> Free Tier Limits
```

**Story Points:** 2

**Definition of Done:**
- [ ] `cmd_show()` displays cost per image
- [ ] `cmd_list()` shows cost column
- [ ] References cost-tracking.md in output
- [ ] Test: `banana preset show default` displays "Cost/img: $0.0010"
- [ ] Test: `banana preset list` shows costs for all presets

---

## FASE 2: Crear Interfaz Compartida (Script Integration)

### Sprint 2.1: Extractar ImageConfig Compartido

**Archivos afectados:**
- `skills/banana/scripts/image_config.py` (NEW)
- `skills/banana/scripts/generate.py` (REFACTOR)
- `skills/banana/scripts/edit.py` (REFACTOR)
- `skills/banana/scripts/batch.py` (REFACTOR)

**Cambios requeridos:**

#### 4a. Crear nuevo módulo `image_config.py`

```python
# skills/banana/scripts/image_config.py
"""Shared ImageConfig interface for all Banana scripts.

Prevents duplication across generate.py, edit.py, batch.py
"""

from typing import Literal, Optional
from dataclasses import dataclass

# ← NEW: Reference to gemini-models.md
SUPPORTED_ASPECT_RATIOS = [
    "1:1", "16:9", "9:16", "3:4", "4:3", "3:2", "2:3",
    "21:9", "9:21", "5:4", "4:5", "1:2", "2:1"
]

SUPPORTED_RESOLUTIONS = [
    "256x256", "512x512", "768x768", "1024x1024",
    "1024x1280", "1280x1024"
]

@dataclass
class ImageConfig:
    """Validates and holds image generation parameters.
    
    Used by:
    - generate.py (generate_image)
    - edit.py (edit_image)
    - batch.py (estimate_cost)
    
    See gemini-models.md for valid values.
    """
    
    aspect_ratio: str = "1:1"
    resolution: str = "1024x1024"
    safety_filter_level: Literal["off", "on"] = "on"
    
    def __post_init__(self):
        """Validate parameters against gemini-models.md constraints."""
        if self.aspect_ratio not in SUPPORTED_ASPECT_RATIOS:
            raise ValueError(
                f"Invalid aspect ratio: {self.aspect_ratio}\n"
                f"Supported: {', '.join(SUPPORTED_ASPECT_RATIOS)}\n"
                f"(See gemini-models.md - Supported Aspect Ratios)"
            )
        
        if self.resolution not in SUPPORTED_RESOLUTIONS:
            raise ValueError(
                f"Invalid resolution: {self.resolution}\n"
                f"Supported: {', '.join(SUPPORTED_RESOLUTIONS)}\n"
                f"(See gemini-models.md - Resolution Tiers)"
            )
    
    def get_cost_multiplier(self) -> float:
        """
        Return cost multiplier based on resolution.
        
        Base cost (1x) = 256x256
        Higher resolutions cost more.
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

def validate_config(config: ImageConfig) -> bool:
    """Validate that config is valid before API call."""
    try:
        config.__post_init__()  # Triggers validation
        return True
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        return False
```

**Edges to create:**
```
image_config.py --defines_shared_interface--> generate.py
image_config.py --defines_shared_interface--> edit.py
image_config.py --defines_shared_interface--> batch.py

image_config.py --references--> Supported Aspect Ratios
image_config.py --references--> imageSize Resolution Tiers
image_config.py --references--> Key Limitations (no transparent bg, ...)
```

#### 4b. Refactorizar `generate.py` para usar ImageConfig

```python
# skills/banana/scripts/generate.py
# Line 33+

from image_config import ImageConfig, validate_config

def generate_image(
    prompt: str,
    model: str = "gemini-3.1-flash-image-preview",
    config: Optional[ImageConfig] = None,
) -> dict:
    """
    Generate image using shared ImageConfig.
    
    Now validates aspect_ratio and resolution before API call.
    (Shared validation in image_config.py)
    """
    
    if config is None:
        config = ImageConfig()
    
    # ← NEW: Validate using shared interface
    if not validate_config(config):
        raise ValueError("Invalid image configuration")
    
    # Call API
    response = genai.generate_images(
        prompt=prompt,
        model=model,
        # Unpack validated config
        aspect_ratio=config.aspect_ratio,
        resolution=config.resolution,
        safety_filter_level=config.safety_filter_level,
    )
    return response
```

#### 4c. Refactorizar `edit.py` para usar ImageConfig

```python
# skills/banana/scripts/edit.py
# Line 27+

from image_config import ImageConfig, validate_config

def edit_image(
    image_path: str,
    prompt: str,
    config: Optional[ImageConfig] = None,
) -> dict:
    """
    Edit image using shared ImageConfig.
    
    Now validates before API call (shared with generate.py).
    """
    
    if config is None:
        config = ImageConfig()
    
    if not validate_config(config):
        raise ValueError("Invalid image configuration")
    
    response = genai.edit_images(
        image=image_path,
        prompt=prompt,
        aspect_ratio=config.aspect_ratio,
        resolution=config.resolution,
    )
    return response
```

#### 4d. Refactorizar `batch.py` para usar ImageConfig

```python
# skills/banana/scripts/batch.py
# Line 36+

from image_config import ImageConfig, validate_config

def estimate_cost(
    images_count: int,
    model: str = "gemini-3.1-flash-image-preview",
    config: Optional[ImageConfig] = None,
) -> dict:
    """
    Estimate cost using SHARED config parameters.
    
    Now respects resolution multipliers from image_config.py
    """
    
    if config is None:
        config = ImageConfig()
    
    if not validate_config(config):
        raise ValueError("Invalid image configuration")
    
    pricing = {
        'gemini-3.1-flash-image-preview': 0.001,
        'gemini-2.5-flash': 0.0005,
    }
    
    base_cost = images_count * pricing.get(model, 0.001)
    cost_multiplier = config.get_cost_multiplier()  # ← NEW: Uses shared config
    total_cost = base_cost * cost_multiplier
    
    return {
        'total_cost': total_cost,
        'estimated_images': images_count,
        'model': model,
        'resolution': config.resolution,
        'resolution_multiplier': cost_multiplier,
        'base_cost_per_image': pricing.get(model),
        'adjusted_cost_per_image': pricing.get(model) * cost_multiplier,
    }
```

**Story Points:** 4

**Definition of Done:**
- [ ] `image_config.py` created with ImageConfig dataclass
- [ ] All three scripts import and use ImageConfig
- [ ] generate.py accepts config parameter
- [ ] edit.py accepts config parameter
- [ ] batch.py uses config for cost calculation
- [ ] Tests pass for all three scripts
- [ ] EDGES: generate ↔ edit ↔ batch via image_config

---

## FASE 3: Conectar Domain Modes

### Sprint 3.1: Crear Relaciones Entre Domain Modes

**Archivos afectados:**
- `skills/banana/references/prompt-engineering.md` (PRIMARY)
- Graph edges (12 new relational edges)

**Cambios requeridos:**

#### 5a. En `prompt-engineering.md`: Documentar similitudes

```markdown
# Domain Modes Guide

## Visual Style Classifications

### Group 1: High-Contrast & Dramatic
- **Abstract** — Geometric forms, bold shapes, emotional intensity
- **Cinema** — Cinematic framing, dramatic lighting, mood-focused
- **Editorial** — Photojournalistic style, natural light, story-driven

**Relationship:** These three share high-contrast aesthetics and emotional storytelling.
Use Abstract for non-representational, Cinema for scene/mood, Editorial for documentary.

**Related to:** Logo (clean lines), Product (professional presentation)

---

### Group 2: Commercial & Brand
- **Logo** — Brand identity, clean composition, symbolic
- **Product** — Commercial photography, lighting, professional
- **UI/Web** — Digital interfaces, clean hierarchy, functional

**Relationship:** All focus on professional, commercial presentation.
Logo for identity, Product for commerce, UI/Web for digital.

**Related to:** Editorial (documentary quality)

---

### Group 3: Environmental & Natural
- **Landscape** — Natural scenes, environmental context, spatial
- **Infographic** — Data visualization, information hierarchy, editorial
- **Portrait** — Portraiture, human focus, environmental context

**Relationship:** These emphasize environmental/contextual framing.
Landscape for spaces, Infographic for data, Portrait for human subjects.

---

## Similarity Matrix

(See SKILL.md "Domain Mode Relationships" for visual)

| From | To | Similarity | Reason |
|------|----|---------|----|
| Abstract | Cinema | HIGH | Both dramatic, high-contrast, emotional |
| Abstract | Logo | MEDIUM | Both clean lines, symbolic |
| Cinema | Editorial | HIGH | Both mood-focused, natural lighting |
| Editorial | Portrait | MEDIUM | Both human/environmental focus |
| Logo | Product | HIGH | Both commercial, professional |
| Product | UI/Web | MEDIUM | Both professional, functional |
| Landscape | Infographic | MEDIUM | Both data-focused, spatial |
| Landscape | Portrait | MEDIUM | Both environmental context |
| Infographic | Editorial | MEDIUM | Both information-driven |

---

## Usage Recommendations

When a user chooses a Domain Mode, suggest:
- **Similar modes** (HIGH similarity) for stylistic variants
- **Complementary modes** (MEDIUM similarity) for different applications

Example: User selects "Cinema" → Suggest "Abstract" (similar drama) or "Editorial" (similar lighting)
```

**Edges to create:**
```
Abstract --related_to--> Cinema (HIGH similarity)
Abstract --related_to--> Logo (MEDIUM similarity)
Cinema --related_to--> Editorial (HIGH similarity)
Editorial --related_to--> Portrait (MEDIUM similarity)
Logo --related_to--> Product (HIGH similarity)
Product --related_to--> UI/Web (MEDIUM similarity)
Landscape --related_to--> Infographic (MEDIUM similarity)
Landscape --related_to--> Portrait (MEDIUM similarity)
Infographic --related_to--> Editorial (MEDIUM similarity)

(9 edges total, bidirectional in undirected graph)
```

#### 5b. En `SKILL.md`: Actualizar Creative Director con recomendaciones

```markdown
# Banana Creative Director Pipeline

## Domain Mode Selection Flow

When a user selects a Domain Mode:

1. **Show the selected mode** with description
2. **Show similar modes** (HIGH relationship) as alternatives
3. **Show complementary modes** (MEDIUM relationship) for different use cases

Example output:

```
You selected: 📸 Cinema (cinematic, mood-based)

Similar Styles (try these for variations):
  • Abstract — geometric interpretation of mood
  • Editorial — documentary version of same scene

Complementary Styles (for different applications):
  • Portrait — if focusing on people
  • Product — if selling something in this scene
```

(See prompt-engineering.md for Similarity Matrix)
```

**Story Points:** 2

**Definition of Done:**
- [ ] prompt-engineering.md updated with similarity matrix
- [ ] All 9 domain mode pairs documented
- [ ] Reasons for relationships explained
- [ ] Similarity levels (HIGH/MEDIUM) assigned
- [ ] SKILL.md references the similarity matrix
- [ ] Test: Query graph for "Which modes are similar to Cinema?" → returns Abstract, Editorial

---

## FASE 4: Integración Entre Skills (High-Level)

### Sprint 4.1: Crear Documentación de Workflows Integrados

**Archivos afectados:**
- `CLAUDE.md` (UPDATE)
- `skills/banana/CROSS_SKILL_WORKFLOWS.md` (NEW)
- `skills/graphify/CROSS_SKILL_WORKFLOWS.md` (NEW)

**Cambios requeridos:**

#### 6a. Crear `skills/banana/CROSS_SKILL_WORKFLOWS.md`

```markdown
# Banana + Graphify Integrated Workflows

## Overview

Banana (image generation) and Graphify (knowledge graphs) share the same 
**parallel orchestration architecture**. This allows building workflows that
combine corpus analysis with image generation.

See: ../graphify/CROSS_SKILL_WORKFLOWS.md for Graphify's perspective

---

## Workflow 1: Extract Design Themes from Corpus → Generate Images

**Goal:** Analyze written corpus for design themes, then generate visual examples.

**Steps:**

1. **Query Graphify for design concepts**
   ```bash
   /graphify query "What are the main design themes in this corpus?"
   ```
   → Returns nodes like: "minimalist", "retro", "cyberpunk"

2. **Generate images for each theme**
   ```bash
   /banana generate --prompt "$(theme)" --style cinema --batch 5
   ```
   → Creates 5 variations of each theme

3. **Index generated images back into Graphify**
   ```bash
   /graphify add ./generated-images/
   ```
   → Cross-links original corpus concepts with generated visuals

**Benefits:**
- Design themes stay connected to visual examples
- Can query "show me cyberpunk examples" → finds both docs + images
- Tracks design evolution over time

---

## Workflow 2: Batch Generation with Real-Time Cost Tracking

**Goal:** Generate many images while monitoring cost against Free Tier.

**Steps:**

1. **Estimate total cost BEFORE running**
   ```bash
   banana preset show my-preset
   # Shows: Cost/img: $0.001, Free Tier: 100 images/month
   
   banana batch estimate --count 500 --preset my-preset
   # Shows: Total cost: $0.50, Exceeds Free Tier: 400 images unpaid
   ```

2. **Log the batch operation**
   ```bash
   banana batch generate --count 500 --preset my-preset --log-id "design-exploration"
   ```

3. **Query Graphify for cost analysis**
   ```bash
   /graphify query "Show cost breakdown from banana batch operations"
   ```
   → Returns total cost, images generated, models used

**Benefits:**
- No surprise costs
- Historical tracking of generation expenses
- Can correlate cost with output quality

---

## Architectural Parallel: Why These Skills Work Together

### Banana: Parallel Script Orchestration
```
Creative Director (hub)
├─ generate.py (worker)
├─ edit.py (worker)
├─ batch.py (worker)
└─ presets.py (worker)

Pattern: Multiple independent scripts coordinate through shared ImageConfig
```

### Graphify: Parallel Subagent Orchestration
```
/graphify Full Pipeline (hub)
├─ Step 3 Part A (AST extraction - structural)
├─ Step 3 Part B (Semantic extraction - LLM)
├─ Step 4-5 (Build + Label)
└─ Step 6-9 (Export)

Pattern: Multiple independent subagents coordinate through shared JSON schema
```

**Similarity:** Both designs allow independent workers with centralized coordination.

---

## Required Integration Points

These should be added to CLAUDE.md as explicit skill relationships:

```yaml
banana:
  - related_to: graphify
    pattern: "parallel orchestration"
    integration_docs: "CROSS_SKILL_WORKFLOWS.md"

graphify:
  - related_to: banana
    pattern: "parallel orchestration"
    integration_docs: "CROSS_SKILL_WORKFLOWS.md"
```
```

#### 6b. Crear `skills/graphify/CROSS_SKILL_WORKFLOWS.md`

(Simétrico al de Banana, pero desde perspectiva de Graphify)

```markdown
# Graphify + Banana Integrated Workflows

## Workflow 1: Index Generated Images into Knowledge Graph

**Goal:** Keep AI-generated images connected to the corpus that inspired them.

**Steps:**

1. Generate images using Banana
   ```bash
   /banana generate --prompt "retro design aesthetic" --batch 10
   ```

2. Add to Graphify corpus
   ```bash
   /graphify add ./generated-images/ --contributor "banana-workflow"
   ```

3. Query the integrated graph
   ```bash
   /graphify query "Show me retro design examples with their source concepts"
   ```

**Graph Result:**
```
"retro aesthetic" (document node)
  └─ related_to → "cyberpunk" (document)
  └─ generated_by → "image_001.png" (image node)
                      └─ metadata: model=cinema, aspect_ratio=16:9
```

---

## Why Graphify ↔ Banana Share Architecture

Both skills use **parallel worker coordination**:

- Banana: generate.py, edit.py, batch.py work independently, coordinated via ImageConfig
- Graphify: semantic subagents work independently, coordinated via JSON schema

This pattern allows scaling without central bottleneck.

See: ../../REFACTOR_PLAN.md Phase 4 for architectural justification
```

**Edges to create:**
```
Banana Creative Director --integrated_with--> /graphify Full Pipeline
(relation: "Both use parallel worker orchestration pattern")

CROSS_SKILL_WORKFLOWS.md --documents--> integrated workflows
```

**Story Points:** 3

**Definition of Done:**
- [ ] CROSS_SKILL_WORKFLOWS.md created in skills/banana/
- [ ] CROSS_SKILL_WORKFLOWS.md created in skills/graphify/
- [ ] Both reference the other's workflows
- [ ] Architectural similarities explained
- [ ] At least 2 concrete workflows documented per skill
- [ ] CLAUDE.md updated with cross-skill relationships

---

## FASE 5: Validación y Cierre

### Sprint 5.1: Rebuild Graph y Verificar Edges

**Steps:**

1. **Rebuild the graph locally**
   ```bash
   /graphify .
   ```

2. **Verify new edges exist**
   ```bash
   /graphify query "Show all connections between scripts (generate, edit, batch)"
   /graphify query "Which Domain Modes are related to Abstract?"
   /graphify query "What connects Banana and Graphify?"
   ```

3. **Check cohesion improvements**
   - Community 0 (Domain Modes): 0.1 → 0.4+ (target: HIGH relationship coverage)
   - Community 1 (Presets): 0.22 → 0.5+ (now linked to cost tracking)
   - Community 2 (Cost Tracker): 0.25 → 0.6+ (now linked to presets + batch)
   - Community 10-12 (Scripts): separate → connected via ImageConfig

4. **Validate all edges**
   - [ ] 6 edges: Reference orphans linked to validation code
   - [ ] 3 edges: Scripts → ImageConfig (shared interface)
   - [ ] 9 edges: Domain modes cross-linked
   - [ ] 4 edges: Presets → Pricing
   - [ ] 2 edges: Banana ↔ Graphify (at SKILL.md level)
   - **Total: 24 new edges**

**Story Points:** 2

**Definition of Done:**
- [ ] Graph rebuilt without errors
- [ ] All 24 edges present in graph.json
- [ ] No dangling edges (all source/target nodes exist)
- [ ] Cohesion scores improved across targeted communities
- [ ] /graphify queries return expected results

---

## Summary: Change Matrix

| Phase | Sprint | Files | Edges Added | Story Points | Weeks |
|-------|--------|-------|-------------|--------------|-------|
| 1 | 1.1 | batch.py, cost-tracking.md | 2 | 2 | Week 1 |
| 1 | 1.2 | generate.py, gemini-models.md | 2 | 2 | Week 1 |
| 1 | 1.3 | presets.py, cost-tracking.md | 2 | 2 | Week 2 |
| 2 | 2.1 | image_config.py, generate.py, edit.py, batch.py | 6 | 4 | Week 2-3 |
| 3 | 3.1 | prompt-engineering.md, SKILL.md | 9 | 2 | Week 3 |
| 4 | 4.1 | CROSS_SKILL_WORKFLOWS.md (x2), CLAUDE.md | 2 | 3 | Week 4-5 |
| 5 | 5.1 | validation | 0 | 2 | Week 5-6 |
| | | **TOTAL** | **~25** | **17** | **6 weeks** |

---

## Success Metrics

**Before:** 165 nodes, 169 edges, 40 communities, avg cohesion 0.42

**After:** 165 nodes, 194 edges, 40 communities, avg cohesion 0.58
- Cohesion improvements: +14% (weak communities become medium-strength)
- Edge growth: +15% (better connectivity)
- Zero dangling edges or orphaned nodes

**Qualitative:**
- [ ] Scripts no longer duplicate ImageConfig logic
- [ ] Domain modes show recommendations based on relationships
- [ ] Presets display cost impact before execution
- [ ] Banana ↔ Graphify integration workflows documented
- [ ] Free Tier limits enforced programmatically
- [ ] Aspect ratios validated before API calls

---

## Risk Mitigation

**Risk:** Refactoring scripts breaks existing workflows
- **Mitigation:** Keep backward compatibility; optional new parameters

**Risk:** New edges introduce inconsistencies
- **Mitigation:** Validate all edges after each sprint; run /graphify query tests

**Risk:** Documentation becomes stale
- **Mitigation:** Link docs from code (comments reference files) so changes are visible in graph

**Risk:** Scope creep (15 → 25 story points)
- **Mitigation:** Prioritize phases in order; Phases 1-3 are non-blocking

---

## Rollback Plan

Each sprint creates only forward-compatible changes:
- New code is additive (new functions, not replacements)
- Old code paths still work if new parameters not provided
- Can revert any sprint independently without breaking others

**Critical rollback point:** After Sprint 2.1 (if ImageConfig integration fails, revert scripts to use independent config)

---

## Next Steps

1. **Approve this plan** with priority adjustments if needed
2. **Start Sprint 1.1** (Free Tier validation in batch.py)
3. **Run /graphify .** after each sprint to validate edge creation
4. **Track progress** in the 6-week timeline

**Estimated Effort:** 17 story points ≈ 4-6 weeks for 1 developer
