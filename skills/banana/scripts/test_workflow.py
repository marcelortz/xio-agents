"""
Unit tests for workflow.py

Validates Workflow and WorkflowStep dataclasses.
Tests run before script integration (Sprint 4.1).

Run: python -m pytest test_workflow.py -v
"""

import pytest
from workflow import WorkflowStep, Workflow, WORKFLOWS, get_workflow, list_workflows


class TestWorkflowStep:
    """Test WorkflowStep dataclass"""

    def test_step_creation_minimal(self):
        """Create step with just script name"""
        step = WorkflowStep(script="generate.py")
        assert step.script == "generate.py"
        assert step.description == ""
        assert step.params == {}
        assert step.output_var is None
        assert step.input_var is None

    def test_step_creation_full(self):
        """Create step with all parameters"""
        step = WorkflowStep(
            script="edit.py",
            description="Edit the image",
            params={"domain": "landscape", "model": "test"},
            output_var="edited_image",
            input_var="base_image"
        )
        assert step.script == "edit.py"
        assert step.description == "Edit the image"
        assert len(step.params) == 2
        assert step.output_var == "edited_image"
        assert step.input_var == "base_image"

    def test_step_repr(self):
        """__repr__ is useful for debugging"""
        step = WorkflowStep(
            script="generate.py",
            params={"domain": "landscape", "resolution": "2K"},
            output_var="my_image"
        )
        repr_str = repr(step)
        assert "WorkflowStep" in repr_str
        assert "generate.py" in repr_str
        assert "params_count=2" in repr_str
        assert "my_image" in repr_str


class TestWorkflow:
    """Test Workflow dataclass"""

    def test_workflow_creation_empty(self):
        """Create workflow with no steps"""
        workflow = Workflow(
            name="empty",
            description="Empty workflow"
        )
        assert workflow.name == "empty"
        assert workflow.description == "Empty workflow"
        assert workflow.steps == []
        assert workflow.estimated_time_minutes == 5

    def test_workflow_with_steps(self):
        """Create workflow with steps"""
        steps = [
            WorkflowStep(script="generate.py"),
            WorkflowStep(script="edit.py"),
        ]
        workflow = Workflow(
            name="test",
            steps=steps,
            estimated_time_minutes=10
        )
        assert len(workflow.steps) == 2
        assert workflow.estimated_time_minutes == 10

    def test_workflow_get_scripts_used(self):
        """get_scripts_used returns unique scripts"""
        workflow = Workflow(
            name="test",
            steps=[
                WorkflowStep(script="generate.py"),
                WorkflowStep(script="generate.py"),  # Duplicate
                WorkflowStep(script="edit.py"),
            ]
        )
        scripts = workflow.get_scripts_used()
        assert scripts == ["edit.py", "generate.py"]  # Sorted, unique

    def test_workflow_get_total_operations(self):
        """get_total_operations returns step count"""
        workflow = Workflow(
            name="test",
            steps=[
                WorkflowStep(script="generate.py"),
                WorkflowStep(script="edit.py"),
                WorkflowStep(script="generate.py"),
            ]
        )
        assert workflow.get_total_operations() == 3

    def test_workflow_repr(self):
        """__repr__ is useful for debugging"""
        workflow = Workflow(
            name="test",
            steps=[
                WorkflowStep(script="generate.py"),
                WorkflowStep(script="edit.py"),
            ],
            estimated_time_minutes=8
        )
        repr_str = repr(workflow)
        assert "Workflow" in repr_str
        assert "test" in repr_str
        assert "steps=2" in repr_str
        assert "time_mins=8" in repr_str


class TestPredefinedWorkflows:
    """Test predefined workflow presets"""

    def test_generate_only_workflow(self):
        """Generate-only workflow has one step"""
        workflow = WORKFLOWS["generate_only"]
        assert workflow.name == "generate_only"
        assert len(workflow.steps) == 1
        assert workflow.steps[0].script == "generate.py"

    def test_generate_and_edit_workflow(self):
        """Generate-and-edit workflow has two steps"""
        workflow = WORKFLOWS["generate_and_edit"]
        assert workflow.name == "generate_and_edit"
        assert len(workflow.steps) == 2
        assert workflow.steps[0].script == "generate.py"
        assert workflow.steps[1].script == "edit.py"

    def test_multi_variant_workflow(self):
        """Multi-variant workflow has three generate steps"""
        workflow = WORKFLOWS["multi_variant"]
        assert workflow.name == "multi_variant"
        assert len(workflow.steps) == 3
        # All steps should be generate.py
        for step in workflow.steps:
            assert step.script == "generate.py"

    def test_all_workflows_have_descriptions(self):
        """All predefined workflows have descriptions"""
        for name, workflow in WORKFLOWS.items():
            assert workflow.description, f"Workflow {name} missing description"
            assert len(workflow.description) > 5

    def test_all_workflows_have_output_vars(self):
        """All workflow steps should have output variables"""
        for name, workflow in WORKFLOWS.items():
            for i, step in enumerate(workflow.steps):
                assert step.output_var, f"Workflow {name} step {i} missing output_var"

    def test_workflow_time_estimates_reasonable(self):
        """Workflow time estimates should be reasonable"""
        for name, workflow in WORKFLOWS.items():
            assert 1 <= workflow.estimated_time_minutes <= 60, \
                f"Workflow {name} has unreasonable time estimate: {workflow.estimated_time_minutes}"


class TestGetWorkflow:
    """Test get_workflow() function"""

    def test_get_existing_workflow(self):
        """get_workflow returns valid workflow"""
        workflow = get_workflow("generate_only")
        assert workflow.name == "generate_only"

    def test_get_all_predefined_workflows(self):
        """Can retrieve all predefined workflows by name"""
        for name in WORKFLOWS.keys():
            workflow = get_workflow(name)
            assert workflow.name == name

    def test_get_invalid_workflow(self):
        """get_workflow raises ValueError for unknown workflow"""
        with pytest.raises(ValueError, match="Unknown workflow"):
            get_workflow("nonexistent")

    def test_error_message_lists_supported(self):
        """Error message includes list of supported workflows"""
        try:
            get_workflow("invalid")
        except ValueError as e:
            error_msg = str(e)
            assert "Supported:" in error_msg
            assert "generate_only" in error_msg


class TestListWorkflows:
    """Test list_workflows() function"""

    def test_list_workflows_returns_list(self):
        """list_workflows returns a list"""
        workflows = list_workflows()
        assert isinstance(workflows, list)

    def test_list_workflows_sorted(self):
        """list_workflows returns sorted list"""
        workflows = list_workflows()
        assert workflows == sorted(workflows)

    def test_list_workflows_count(self):
        """list_workflows returns all predefined workflows"""
        workflows = list_workflows()
        assert len(workflows) == 3

    def test_list_workflows_contains_expected(self):
        """list_workflows includes expected workflow names"""
        workflows = list_workflows()
        expected = ["generate_and_edit", "generate_only", "multi_variant"]
        assert workflows == expected


class TestWorkflowIntegration:
    """Integration tests for workflow usage"""

    def test_workflow_steps_are_executable_scripts(self):
        """All workflow steps reference valid scripts"""
        valid_scripts = {"generate.py", "edit.py", "batch.py"}
        for name, workflow in WORKFLOWS.items():
            for step in workflow.steps:
                assert step.script in valid_scripts, \
                    f"Workflow {name} references unknown script: {step.script}"

    def test_workflow_can_chain_variables(self):
        """Workflows with input/output vars can chain data"""
        workflow = WORKFLOWS["generate_and_edit"]
        # First step produces base_image
        assert workflow.steps[0].output_var == "base_image"
        # Second step consumes base_image
        assert workflow.steps[1].input_var == "base_image"

    def test_workflow_has_reasonable_params(self):
        """All workflow steps have documented parameters"""
        for name, workflow in WORKFLOWS.items():
            for i, step in enumerate(workflow.steps):
                if step.params:
                    # Params should be reasonable (not empty dicts)
                    assert len(step.params) > 0, \
                        f"Workflow {name} step {i} has empty params dict"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
