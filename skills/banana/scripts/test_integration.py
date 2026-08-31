"""
Integration tests for Banana Claude skill.

Tests verify that all modules (ImageConfig, Domain, Workflow) work together
in realistic end-to-end scenarios.

Run: python -m pytest test_integration.py -v
"""

import pytest
from image_config import ImageConfig, CONFIG as IMAGE_CONFIG
from domain import get_domain, DOMAINS
from workflow import get_workflow, WORKFLOWS


class TestConfigIntegration:
    """Test that config.json is accessible and valid across all modules"""

    def test_config_loaded_successfully(self):
        """Config should be loaded without errors"""
        assert IMAGE_CONFIG is not None
        assert "supported_aspect_ratios" in IMAGE_CONFIG
        assert "supported_resolutions" in IMAGE_CONFIG

    def test_config_has_required_keys(self):
        """Config should have all required sections"""
        required_keys = ["free_tier_images_per_month", "default_model",
                        "supported_aspect_ratios", "supported_resolutions", "pricing"]
        for key in required_keys:
            assert key in IMAGE_CONFIG, f"Config missing required key: {key}"

    def test_config_values_valid(self):
        """Config values should be valid"""
        assert isinstance(IMAGE_CONFIG.get("free_tier_images_per_month"), int)
        assert isinstance(IMAGE_CONFIG.get("default_model"), str)
        assert len(IMAGE_CONFIG.get("supported_aspect_ratios", [])) > 0
        assert len(IMAGE_CONFIG.get("supported_resolutions", [])) > 0
        assert isinstance(IMAGE_CONFIG.get("pricing", {}), dict)


class TestImageConfigIntegration:
    """Test ImageConfig with real config values"""

    def test_all_config_aspect_ratios_valid(self):
        """All aspect ratios from config should create valid ImageConfigs"""
        for ratio in IMAGE_CONFIG.get("supported_aspect_ratios", []):
            config = ImageConfig(aspect_ratio=ratio)
            assert config.aspect_ratio == ratio

    def test_all_config_resolutions_valid(self):
        """All resolutions from config should create valid ImageConfigs"""
        for resolution in IMAGE_CONFIG.get("supported_resolutions", []):
            config = ImageConfig(resolution=resolution)
            assert config.resolution == resolution

    def test_cost_multiplier_for_all_resolutions(self):
        """All resolutions should have valid cost multipliers"""
        for resolution in IMAGE_CONFIG.get("supported_resolutions", []):
            config = ImageConfig(resolution=resolution)
            multiplier = config.get_cost_multiplier()
            assert 0.0 < multiplier <= 12.0, f"Invalid multiplier for {resolution}: {multiplier}"

    def test_api_params_conversion(self):
        """API params should convert correctly for all valid configs"""
        for ratio in IMAGE_CONFIG.get("supported_aspect_ratios", [])[:3]:  # Sample
            for resolution in IMAGE_CONFIG.get("supported_resolutions", [])[:3]:
                config = ImageConfig(aspect_ratio=ratio, resolution=resolution)
                params = config.to_api_params()
                assert params["aspect_ratio"] == ratio
                assert params["resolution"] == resolution
                assert isinstance(params["safety_filter"], bool)


class TestDomainIntegration:
    """Test Domain with ImageConfig"""

    def test_all_domains_have_valid_image_config(self):
        """All domain parameters should create valid ImageConfigs"""
        for name, domain in DOMAINS.items():
            config = ImageConfig(
                aspect_ratio=domain.aspect_ratio,
                resolution=domain.resolution
            )
            assert config.aspect_ratio == domain.aspect_ratio
            assert config.resolution == domain.resolution

    def test_all_domains_have_valid_cost_multipliers(self):
        """All domain resolutions should have valid cost multipliers"""
        for name, domain in DOMAINS.items():
            config = ImageConfig(resolution=domain.resolution)
            multiplier = config.get_cost_multiplier()
            assert multiplier > 0, f"Domain {name} has invalid multiplier: {multiplier}"

    def test_domain_aspect_ratios_match_config(self):
        """All domain aspect ratios should be in config"""
        supported_ratios = IMAGE_CONFIG.get("supported_aspect_ratios", [])
        for name, domain in DOMAINS.items():
            assert domain.aspect_ratio in supported_ratios, \
                f"Domain {name} uses unsupported ratio: {domain.aspect_ratio}"

    def test_domain_resolutions_match_config(self):
        """All domain resolutions should be in config"""
        supported_resolutions = IMAGE_CONFIG.get("supported_resolutions", [])
        for name, domain in DOMAINS.items():
            assert domain.resolution in supported_resolutions, \
                f"Domain {name} uses unsupported resolution: {domain.resolution}"

    def test_domain_style_hints_non_empty(self):
        """All domains should have style hints for prompt enhancement"""
        for name, domain in DOMAINS.items():
            hints = domain.get_prompt_enhancement()
            assert len(hints) > 0, f"Domain {name} has no style hints"


class TestWorkflowIntegration:
    """Test Workflow with ImageConfig and Domain"""

    def test_all_workflow_steps_valid(self):
        """All workflow steps should reference valid scripts"""
        valid_scripts = {"generate.py", "edit.py", "batch.py"}
        for name, workflow in WORKFLOWS.items():
            for step in workflow.steps:
                assert step.script in valid_scripts, \
                    f"Workflow {name} uses invalid script: {step.script}"

    def test_workflow_params_include_valid_domains(self):
        """Workflow step parameters should use valid domains"""
        for name, workflow in WORKFLOWS.items():
            for step in workflow.steps:
                if "domain" in step.params:
                    domain_name = step.params["domain"]
                    domain = get_domain(domain_name)
                    assert domain is not None

    def test_workflow_domain_creates_valid_config(self):
        """Domain from workflow should create valid ImageConfig"""
        for name, workflow in WORKFLOWS.items():
            for step in workflow.steps:
                if "domain" in step.params:
                    domain = get_domain(step.params["domain"])
                    config = ImageConfig(
                        aspect_ratio=domain.aspect_ratio,
                        resolution=domain.resolution
                    )
                    assert config is not None

    def test_workflow_time_estimates_reasonable(self):
        """Workflow time estimates should be reasonable"""
        for name, workflow in WORKFLOWS.items():
            total_time = sum(1 for _ in workflow.steps) * 2  # Rough estimate
            assert workflow.estimated_time_minutes >= total_time, \
                f"Workflow {name} time estimate too low: {workflow.estimated_time_minutes}min for {len(workflow.steps)} steps"


class TestEndToEndScenarios:
    """Test realistic end-to-end scenarios"""

    def test_landscape_generation_scenario(self):
        """Landscape generation: domain → config → cost"""
        domain = get_domain("landscape")
        config = ImageConfig(
            aspect_ratio=domain.aspect_ratio,
            resolution=domain.resolution
        )
        multiplier = config.get_cost_multiplier()
        base_cost = IMAGE_CONFIG.get("pricing", {}).get("gemini-3.1-flash-image-preview", 0.001)
        total_cost = base_cost * multiplier

        assert config.aspect_ratio == "16:9"
        assert config.resolution == "2K"
        assert total_cost > 0

    def test_product_photography_scenario(self):
        """Product photography: workflow → domain → config"""
        workflow = get_workflow("generate_only")
        domain = get_domain("product")
        config = ImageConfig(
            aspect_ratio=domain.aspect_ratio,
            resolution=domain.resolution
        )

        assert config.aspect_ratio == "1:1"
        assert config.resolution == "2K"
        assert len(workflow.steps) == 1

    def test_multi_variant_scenario(self):
        """Multi-variant: workflow with multiple domains"""
        workflow = get_workflow("multi_variant")
        configs = []

        # Generate configs for each variant
        variant_domains = ["landscape", "portrait", "product"]
        for domain_name in variant_domains:
            domain = get_domain(domain_name)
            config = ImageConfig(
                aspect_ratio=domain.aspect_ratio,
                resolution=domain.resolution
            )
            configs.append(config)

        # Verify all configs are valid and different
        assert len(configs) == 3
        assert configs[0].aspect_ratio != configs[1].aspect_ratio  # landscape vs portrait
        assert configs[1].aspect_ratio != configs[2].aspect_ratio  # portrait vs product

    def test_batch_processing_scenario(self):
        """Batch: CSV row → domain → config → cost"""
        # Simulate batch row processing
        rows = [
            {"domain": "landscape", "ratio": "", "resolution": ""},
            {"domain": "product", "ratio": "4:3", "resolution": "2K"},
            {"domain": "", "ratio": "16:9", "resolution": "1K"},
        ]

        configs = []
        for row in rows:
            domain_name = row.get("domain", "").strip() or None
            ratio = row.get("ratio", "").strip() or None
            resolution = row.get("resolution", "").strip() or None

            if domain_name:
                domain = get_domain(domain_name)
                if not ratio:
                    ratio = domain.aspect_ratio
                if not resolution:
                    resolution = domain.resolution

            ratio = ratio or "1:1"
            resolution = resolution or "1K"

            config = ImageConfig(aspect_ratio=ratio, resolution=resolution)
            configs.append(config)

        # Verify all configs created successfully
        assert len(configs) == 3
        assert all(isinstance(c, ImageConfig) for c in configs)


class TestErrorHandling:
    """Test error handling and edge cases"""

    def test_invalid_aspect_ratio_rejected(self):
        """Invalid aspect ratios should be rejected"""
        with pytest.raises(ValueError):
            ImageConfig(aspect_ratio="99:1")

    def test_invalid_resolution_rejected(self):
        """Invalid resolutions should be rejected"""
        with pytest.raises(ValueError):
            ImageConfig(resolution="9999x9999")

    def test_invalid_domain_rejected(self):
        """Invalid domains should be rejected"""
        with pytest.raises(ValueError):
            get_domain("invalid_domain")

    def test_invalid_workflow_rejected(self):
        """Invalid workflows should be rejected"""
        with pytest.raises(ValueError):
            get_workflow("invalid_workflow")

    def test_empty_string_parameters(self):
        """Empty string parameters should be handled"""
        with pytest.raises(ValueError):
            ImageConfig(aspect_ratio="")

    def test_case_sensitivity(self):
        """Parameter matching should be case-sensitive"""
        # Domains are lowercase
        domain = get_domain("landscape")
        assert domain.name == "landscape"

        # Resolutions must match config exactly
        with pytest.raises(ValueError):
            ImageConfig(resolution="1k")  # lowercase


class TestDataConsistency:
    """Test consistency across all modules"""

    def test_config_pricing_has_all_models(self):
        """Pricing should cover all mentioned models"""
        pricing = IMAGE_CONFIG.get("pricing", {})
        default_model = IMAGE_CONFIG.get("default_model")
        assert default_model in pricing, f"Default model {default_model} not in pricing"

    def test_no_duplicate_domains(self):
        """Domain names should be unique"""
        domain_names = list(DOMAINS.keys())
        assert len(domain_names) == len(set(domain_names))

    def test_no_duplicate_workflows(self):
        """Workflow names should be unique"""
        workflow_names = list(WORKFLOWS.keys())
        assert len(workflow_names) == len(set(workflow_names))

    def test_all_config_ratios_usable(self):
        """All config aspect ratios should be usable"""
        for ratio in IMAGE_CONFIG.get("supported_aspect_ratios", []):
            # Should not raise
            ImageConfig(aspect_ratio=ratio)

    def test_all_config_resolutions_usable(self):
        """All config resolutions should be usable"""
        for resolution in IMAGE_CONFIG.get("supported_resolutions", []):
            # Should not raise
            ImageConfig(resolution=resolution)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
