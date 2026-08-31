"""
Shared ImageConfig interface for all Banana scripts.

Eliminates duplication between generate.py, edit.py, batch.py.
This module is created in Sprint 2.1a but NOT USED by scripts yet.
Scripts adopt it gradually: generate.py (2.1b) → edit.py (2.1c) → batch.py (2.1d)

Validation rules:
- aspect_ratio must be in config.json:supported_aspect_ratios
- resolution must be in config.json:supported_resolutions
- safety_filter must be 'on' or 'off'

All values validated against config.json on instantiation (__post_init__).
"""

from typing import Literal, Optional
from dataclasses import dataclass
import json
from pathlib import Path


def load_config():
    """Load Banana configuration from config.json"""
    config_path = Path(__file__).parent.parent / "config.json"
    try:
        with open(config_path) as f:
            return json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"config.json not found at {config_path}")


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

    Example:
        config = ImageConfig(aspect_ratio="16:9", resolution="1K")
        # Raises ValueError if invalid
        config.get_cost_multiplier()  # → 1.0
    """

    aspect_ratio: str = "1:1"
    resolution: str = "1K"
    safety_filter: Literal["on", "off"] = "on"

    def __post_init__(self):
        """Validate all parameters against config.json"""
        self._validate_aspect_ratio()
        self._validate_resolution()

    def _validate_aspect_ratio(self):
        if self.aspect_ratio not in CONFIG.get("supported_aspect_ratios", []):
            supported = ", ".join(CONFIG.get("supported_aspect_ratios", []))
            raise ValueError(
                f"Invalid aspect ratio: {self.aspect_ratio}\n"
                f"Supported: {supported}\n"
                f"(See config.json for full list)"
            )

    def _validate_resolution(self):
        if self.resolution not in CONFIG.get("supported_resolutions", []):
            supported = ", ".join(CONFIG.get("supported_resolutions", []))
            raise ValueError(
                f"Invalid resolution: {self.resolution}\n"
                f"Supported: {supported}\n"
                f"(See config.json for full list)"
            )

    def get_cost_multiplier(self) -> float:
        """
        Return cost multiplier based on resolution.

        Base = 512 (1.0x), scales to 1K (1.0x), 2K (2.0x), 4K (4.0x)

        Returns:
            float: Multiplier to apply to base cost per image
        """
        multipliers = {
            "512": 0.5,
            "1K": 1.0,
            "2K": 2.0,
            "4K": 4.0,
        }
        return multipliers.get(self.resolution, 1.0)

    def to_api_params(self) -> dict:
        """Convert to Gemini API parameters"""
        return {
            "aspect_ratio": self.aspect_ratio,
            "resolution": self.resolution,
            "safety_filter": self.safety_filter == "on",
        }

    def __repr__(self) -> str:
        """String representation for debugging"""
        return (
            f"ImageConfig(aspect_ratio={self.aspect_ratio!r}, "
            f"resolution={self.resolution!r}, "
            f"safety_filter={self.safety_filter!r})"
        )


def validate_config(config: ImageConfig) -> bool:
    """Validate that config is valid before API call"""
    try:
        config.__post_init__()  # Triggers validation
        return True
    except ValueError as e:
        print(f"Configuration error: {e}")
        return False


if __name__ == "__main__":
    # Quick sanity check
    try:
        c = ImageConfig()
        print(f"Default config valid: {c}")
        print(f"Cost multiplier: {c.get_cost_multiplier()}x")
    except Exception as e:
        print(f"Error: {e}")
