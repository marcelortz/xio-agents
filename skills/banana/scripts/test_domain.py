"""
Unit tests for domain.py

Validates Domain dataclass and predefined domains.
Tests run before any script adoption (Sprint 3.1).

Run: python -m pytest test_domain.py -v
"""

import pytest
from domain import Domain, DOMAINS, get_domain, list_domains


class TestDomainClass:
    """Test Domain dataclass"""

    def test_domain_creation(self):
        """Create domain with basic parameters"""
        domain = Domain(
            name="test",
            aspect_ratio="16:9",
            resolution="2K",
            description="Test domain"
        )
        assert domain.name == "test"
        assert domain.aspect_ratio == "16:9"
        assert domain.resolution == "2K"
        assert domain.description == "Test domain"
        assert domain.style_hints == []

    def test_domain_with_hints(self):
        """Domain with style hints"""
        domain = Domain(
            name="custom",
            aspect_ratio="1:1",
            resolution="1K",
            description="Custom domain",
            style_hints=["hint1", "hint2", "hint3"]
        )
        assert len(domain.style_hints) == 3
        assert domain.get_prompt_enhancement() == "hint1, hint2, hint3"

    def test_domain_no_hints(self):
        """Domain without hints returns empty string"""
        domain = Domain(
            name="simple",
            aspect_ratio="16:9",
            resolution="1K"
        )
        assert domain.get_prompt_enhancement() == ""

    def test_domain_repr(self):
        """__repr__ is useful for debugging"""
        domain = Domain(
            name="test",
            aspect_ratio="16:9",
            resolution="2K",
            style_hints=["hint1", "hint2"]
        )
        repr_str = repr(domain)
        assert "Domain" in repr_str
        assert "test" in repr_str
        assert "16:9" in repr_str
        assert "hints=2" in repr_str


class TestPredefinedDomains:
    """Test predefined domain presets"""

    def test_landscape_domain(self):
        """Landscape domain has correct defaults"""
        domain = DOMAINS["landscape"]
        assert domain.name == "landscape"
        assert domain.aspect_ratio == "16:9"
        assert domain.resolution == "2K"
        assert len(domain.style_hints) > 0

    def test_portrait_domain(self):
        """Portrait domain has correct defaults"""
        domain = DOMAINS["portrait"]
        assert domain.name == "portrait"
        assert domain.aspect_ratio == "9:16"
        assert domain.resolution == "2K"

    def test_product_domain(self):
        """Product domain is square with 2K resolution"""
        domain = DOMAINS["product"]
        assert domain.aspect_ratio == "1:1"
        assert domain.resolution == "2K"

    def test_ui_domain(self):
        """UI domain uses 1K (less resolution than product)"""
        domain = DOMAINS["ui"]
        assert domain.aspect_ratio == "16:9"
        assert domain.resolution == "1K"

    def test_editorial_domain(self):
        """Editorial domain is landscape-like"""
        domain = DOMAINS["editorial"]
        assert domain.aspect_ratio == "16:9"
        assert domain.resolution == "2K"

    def test_logo_domain(self):
        """Logo domain is square"""
        domain = DOMAINS["logo"]
        assert domain.aspect_ratio == "1:1"
        assert domain.resolution == "2K"

    def test_all_domains_have_descriptions(self):
        """All predefined domains have descriptions"""
        for name, domain in DOMAINS.items():
            assert domain.description, f"Domain {name} missing description"
            assert len(domain.description) > 5

    def test_all_domains_have_hints(self):
        """All predefined domains have style hints"""
        for name, domain in DOMAINS.items():
            assert len(domain.style_hints) > 0, f"Domain {name} has no style hints"


class TestGetDomain:
    """Test get_domain() function"""

    def test_get_existing_domain(self):
        """get_domain returns valid domain"""
        domain = get_domain("landscape")
        assert domain.name == "landscape"

    def test_get_all_predefined_domains(self):
        """Can retrieve all predefined domains by name"""
        for name in DOMAINS.keys():
            domain = get_domain(name)
            assert domain.name == name

    def test_get_invalid_domain(self):
        """get_domain raises ValueError for unknown domain"""
        with pytest.raises(ValueError, match="Unknown domain"):
            get_domain("nonexistent")

    def test_error_message_lists_supported(self):
        """Error message includes list of supported domains"""
        try:
            get_domain("invalid")
        except ValueError as e:
            error_msg = str(e)
            assert "Supported:" in error_msg
            assert "landscape" in error_msg
            assert "portrait" in error_msg


class TestListDomains:
    """Test list_domains() function"""

    def test_list_domains_returns_list(self):
        """list_domains returns a list"""
        domains = list_domains()
        assert isinstance(domains, list)

    def test_list_domains_sorted(self):
        """list_domains returns sorted list"""
        domains = list_domains()
        assert domains == sorted(domains)

    def test_list_domains_count(self):
        """list_domains returns all predefined domains"""
        domains = list_domains()
        assert len(domains) == 6

    def test_list_domains_contains_expected(self):
        """list_domains includes all expected domain names"""
        domains = list_domains()
        expected = ["editorial", "landscape", "logo", "portrait", "product", "ui"]
        assert domains == expected


class TestDomainIntegration:
    """Integration tests for domain usage"""

    def test_domain_can_be_used_with_imageconfig(self):
        """Domain aspect_ratio and resolution work with ImageConfig"""
        from image_config import ImageConfig

        domain = DOMAINS["landscape"]
        config = ImageConfig(
            aspect_ratio=domain.aspect_ratio,
            resolution=domain.resolution
        )
        assert config.aspect_ratio == "16:9"
        assert config.resolution == "2K"

    def test_all_domain_params_valid_for_imageconfig(self):
        """All predefined domains produce valid ImageConfig"""
        from image_config import ImageConfig

        for name, domain in DOMAINS.items():
            config = ImageConfig(
                aspect_ratio=domain.aspect_ratio,
                resolution=domain.resolution
            )
            assert config.aspect_ratio == domain.aspect_ratio
            assert config.resolution == domain.resolution


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
