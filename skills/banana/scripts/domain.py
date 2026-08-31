"""
Domain presets for image generation.

Each domain specifies recommended aspect ratio, resolution, and style hints
based on the use case. Domains are derived from gemini-models.md and represent
common image generation patterns.

Usage:
    from domain import DOMAINS
    domain = DOMAINS["landscape"]
    # domain.aspect_ratio → "16:9"
    # domain.resolution → "2K"
    # domain.style_hints → ["atmospheric depth", ...]
"""

from dataclasses import dataclass, field
from typing import List


@dataclass
class Domain:
    """
    Image generation domain preset.

    Each domain represents a common image type (landscape, portrait, product, etc.)
    with recommended aspect ratio, resolution, and style hints.

    Domains are used by scripts to select appropriate parameters when user
    specifies --domain instead of --aspect-ratio and --resolution.

    Attributes:
        name: Domain identifier (e.g., "landscape", "portrait")
        aspect_ratio: Recommended aspect ratio (e.g., "16:9")
        resolution: Default resolution tier (e.g., "2K")
        description: Human-readable description of the domain
        style_hints: List of visual style suggestions for prompts
    """

    name: str
    aspect_ratio: str
    resolution: str
    description: str = ""
    style_hints: List[str] = field(default_factory=list)

    def get_prompt_enhancement(self) -> str:
        """Generate prompt enhancement text based on domain style hints.

        Returns:
            str: Comma-separated style hints for use in prompts
        """
        if not self.style_hints:
            return ""
        return ", ".join(self.style_hints)

    def __repr__(self) -> str:
        """String representation for debugging"""
        return (
            f"Domain(name={self.name!r}, aspect_ratio={self.aspect_ratio!r}, "
            f"resolution={self.resolution!r}, hints={len(self.style_hints)})"
        )


# Predefined domains based on gemini-models.md recommendations
# See: skills/banana/references/gemini-models.md, "Resolution Defaults by Domain"

DOMAINS = {
    "landscape": Domain(
        name="landscape",
        aspect_ratio="16:9",
        resolution="2K",
        description="Wide scenic or environment shots",
        style_hints=["atmospheric depth", "widescreen composition", "natural lighting"]
    ),

    "portrait": Domain(
        name="portrait",
        aspect_ratio="9:16",
        resolution="2K",
        description="Vertical portrait or character-focused images",
        style_hints=["fine facial detail", "shoulder composition", "professional lighting"]
    ),

    "product": Domain(
        name="product",
        aspect_ratio="1:1",
        resolution="2K",
        description="Product photography and e-commerce assets",
        style_hints=["centered subject", "clean background", "studio lighting", "sharp focus"]
    ),

    "ui": Domain(
        name="ui",
        aspect_ratio="16:9",
        resolution="1K",
        description="UI mockups, diagrams, and interface designs",
        style_hints=["structured layout", "clear typography", "flat design", "grid-aligned"]
    ),

    "editorial": Domain(
        name="editorial",
        aspect_ratio="16:9",
        resolution="2K",
        description="Articles, blog headers, and editorial illustrations",
        style_hints=["bold composition", "narrative focus", "editorial style"]
    ),

    "logo": Domain(
        name="logo",
        aspect_ratio="1:1",
        resolution="2K",
        description="Logo and brand mark design",
        style_hints=["simple geometric", "memorable", "scalable", "text rendering"]
    ),
}


def get_domain(name: str) -> Domain:
    """Get domain by name.

    Args:
        name: Domain identifier (e.g., "landscape")

    Returns:
        Domain: The requested domain preset

    Raises:
        ValueError: If domain name is not found
    """
    if name not in DOMAINS:
        supported = ", ".join(sorted(DOMAINS.keys()))
        raise ValueError(
            f"Unknown domain: {name!r}\n"
            f"Supported: {supported}"
        )
    return DOMAINS[name]


def list_domains() -> List[str]:
    """List all available domain names.

    Returns:
        List[str]: Sorted list of domain identifiers
    """
    return sorted(DOMAINS.keys())


if __name__ == "__main__":
    # Quick demo
    print("Available domains:\n")
    for name, domain in sorted(DOMAINS.items()):
        print(f"  {name:12} → {domain.aspect_ratio} @ {domain.resolution}")
        print(f"               {domain.description}")
        if domain.style_hints:
            print(f"               Hints: {', '.join(domain.style_hints)}")
        print()
