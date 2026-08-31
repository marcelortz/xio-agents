"""
Unit tests for image_config.py

Validates ImageConfig dataclass in isolation.
Tests run before any script adoption (Sprint 2.1a).

Run: python -m pytest test_image_config.py -v
"""

import pytest
from image_config import ImageConfig, validate_config, CONFIG


class TestImageConfigValid:
    """Test valid ImageConfig creation"""

    def test_default_config(self):
        """Default config should be valid"""
        config = ImageConfig()
        assert config.aspect_ratio == "1:1"
        assert config.resolution == "1K"
        assert config.safety_filter == "on"

    def test_custom_valid_config(self):
        """Custom valid config should work"""
        config = ImageConfig(
            aspect_ratio="16:9",
            resolution="2K",
            safety_filter="off"
        )
        assert config.aspect_ratio == "16:9"
        assert config.resolution == "2K"
        assert config.safety_filter == "off"

    def test_all_supported_aspect_ratios(self):
        """All ratios in config.json should be valid"""
        for ratio in CONFIG.get("supported_aspect_ratios", []):
            config = ImageConfig(aspect_ratio=ratio)
            assert config.aspect_ratio == ratio

    def test_all_supported_resolutions(self):
        """All resolutions in config.json should be valid"""
        for resolution in CONFIG.get("supported_resolutions", []):
            config = ImageConfig(resolution=resolution)
            assert config.resolution == resolution


class TestImageConfigInvalid:
    """Test invalid ImageConfig creation"""

    def test_invalid_aspect_ratio(self):
        """Invalid aspect ratio should raise ValueError"""
        with pytest.raises(ValueError, match="Invalid aspect ratio"):
            ImageConfig(aspect_ratio="99:1")

    def test_invalid_resolution(self):
        """Invalid resolution should raise ValueError"""
        with pytest.raises(ValueError, match="Invalid resolution"):
            ImageConfig(resolution="9999x9999")

    def test_empty_aspect_ratio(self):
        """Empty aspect ratio should raise ValueError"""
        with pytest.raises(ValueError):
            ImageConfig(aspect_ratio="")

    def test_empty_resolution(self):
        """Empty resolution should raise ValueError"""
        with pytest.raises(ValueError):
            ImageConfig(resolution="")


class TestCostMultiplier:
    """Test resolution-based cost multiplier"""

    def test_512_multiplier(self):
        """512 should be 0.5x base"""
        config = ImageConfig(resolution="512")
        assert config.get_cost_multiplier() == 0.5

    def test_1k_multiplier(self):
        """1K should be 1.0x base"""
        config = ImageConfig(resolution="1K")
        assert config.get_cost_multiplier() == 1.0

    def test_2k_multiplier(self):
        """2K should be 2.0x"""
        config = ImageConfig(resolution="2K")
        assert config.get_cost_multiplier() == 2.0

    def test_4k_multiplier(self):
        """4K should be 4.0x"""
        config = ImageConfig(resolution="4K")
        assert config.get_cost_multiplier() == 4.0


class TestToApiParams:
    """Test API parameter conversion"""

    def test_to_api_params_default(self):
        """Default config should convert correctly"""
        config = ImageConfig()
        params = config.to_api_params()
        assert params["aspect_ratio"] == "1:1"
        assert params["resolution"] == "1K"
        assert params["safety_filter"] is True

    def test_to_api_params_safety_off(self):
        """safety_filter='off' should convert to False"""
        config = ImageConfig(safety_filter="off")
        params = config.to_api_params()
        assert params["safety_filter"] is False

    def test_to_api_params_wide_aspect(self):
        """16:9 aspect should be in params"""
        config = ImageConfig(aspect_ratio="16:9")
        params = config.to_api_params()
        assert params["aspect_ratio"] == "16:9"


class TestValidateConfigFunction:
    """Test validate_config() function"""

    def test_validate_valid_config(self):
        """Valid config should return True"""
        config = ImageConfig(aspect_ratio="16:9")
        assert validate_config(config) is True

    def test_validate_invalid_config(self):
        """Invalid config should return False (no exception)"""
        config = ImageConfig.__new__(ImageConfig)
        config.aspect_ratio = "99:1"
        config.resolution = "1024x1024"
        config.safety_filter = "on"
        assert validate_config(config) is False


class TestConfigRepr:
    """Test string representation"""

    def test_repr_format(self):
        """__repr__ should be useful for debugging"""
        config = ImageConfig(aspect_ratio="16:9")
        repr_str = repr(config)
        assert "ImageConfig" in repr_str
        assert "16:9" in repr_str
        assert "1K" in repr_str


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
