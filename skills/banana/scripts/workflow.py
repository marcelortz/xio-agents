"""
Workflow definitions for multi-step Banana operations.

A workflow chains together multiple Banana scripts (generate, edit, etc.)
to accomplish complex image tasks in a coordinated manner.

Each workflow is a sequence of steps, where each step specifies:
- Which script to run (generate.py, edit.py, etc.)
- What parameters to use (domain, model, resolution, etc.)
- Optional conditions or data transformations

Usage:
    from workflow import WORKFLOWS, get_workflow
    workflow = WORKFLOWS["generate_and_edit"]
    # workflow.steps[0] → GenerateStep
    # workflow.steps[1] → EditStep
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


@dataclass
class WorkflowStep:
    """
    A single step in a workflow.

    Represents one operation (generate, edit, etc.) with its parameters.

    Attributes:
        script: Script to run (e.g., "generate.py", "edit.py")
        description: Human-readable description of this step
        params: Dictionary of parameters to pass to the script
        output_var: Optional variable name to store this step's output
        input_var: Optional variable to use as input from previous step
    """

    script: str
    description: str = ""
    params: Dict[str, Any] = field(default_factory=dict)
    output_var: Optional[str] = None
    input_var: Optional[str] = None

    def __repr__(self) -> str:
        """String representation for debugging"""
        return (
            f"WorkflowStep(script={self.script!r}, params_count={len(self.params)}, "
            f"output_var={self.output_var!r})"
        )


@dataclass
class Workflow:
    """
    A multi-step workflow for coordinated image operations.

    Workflows allow users to chain together multiple Banana scripts
    in a single operation, with results from one step feeding into the next.

    Attributes:
        name: Workflow identifier (e.g., "generate_and_edit")
        description: Human-readable description of what the workflow does
        steps: List of WorkflowStep objects in execution order
        estimated_time_minutes: Rough estimate of workflow duration
    """

    name: str
    description: str = ""
    steps: List[WorkflowStep] = field(default_factory=list)
    estimated_time_minutes: int = 5

    def get_scripts_used(self) -> List[str]:
        """Get list of scripts used in this workflow.

        Returns:
            List[str]: Sorted unique script names
        """
        scripts = sorted(set(step.script for step in self.steps))
        return scripts

    def get_total_operations(self) -> int:
        """Count total operations in this workflow.

        Returns:
            int: Number of steps
        """
        return len(self.steps)

    def __repr__(self) -> str:
        """String representation for debugging"""
        return (
            f"Workflow(name={self.name!r}, steps={len(self.steps)}, "
            f"time_mins={self.estimated_time_minutes})"
        )


# Predefined workflows based on common image generation patterns

WORKFLOWS = {
    "generate_only": Workflow(
        name="generate_only",
        description="Generate a single image from prompt",
        steps=[
            WorkflowStep(
                script="generate.py",
                description="Generate image with domain and model",
                params={"domain": "landscape", "model": "gemini-3.1-flash-image-preview"},
                output_var="generated_image"
            )
        ],
        estimated_time_minutes=2
    ),

    "generate_and_edit": Workflow(
        name="generate_and_edit",
        description="Generate base image, then apply edits",
        steps=[
            WorkflowStep(
                script="generate.py",
                description="Generate base image",
                params={"domain": "landscape", "model": "gemini-3.1-flash-image-preview"},
                output_var="base_image"
            ),
            WorkflowStep(
                script="edit.py",
                description="Edit the generated image",
                params={"domain": "landscape"},
                input_var="base_image",
                output_var="edited_image"
            )
        ],
        estimated_time_minutes=5
    ),

    "multi_variant": Workflow(
        name="multi_variant",
        description="Generate multiple image variants for comparison",
        steps=[
            WorkflowStep(
                script="generate.py",
                description="Generate variant 1: Landscape",
                params={"domain": "landscape"},
                output_var="variant_landscape"
            ),
            WorkflowStep(
                script="generate.py",
                description="Generate variant 2: Portrait",
                params={"domain": "portrait"},
                output_var="variant_portrait"
            ),
            WorkflowStep(
                script="generate.py",
                description="Generate variant 3: Product",
                params={"domain": "product"},
                output_var="variant_product"
            )
        ],
        estimated_time_minutes=6
    ),
}


def get_workflow(name: str) -> Workflow:
    """Get workflow by name.

    Args:
        name: Workflow identifier (e.g., "generate_and_edit")

    Returns:
        Workflow: The requested workflow

    Raises:
        ValueError: If workflow name is not found
    """
    if name not in WORKFLOWS:
        supported = ", ".join(sorted(WORKFLOWS.keys()))
        raise ValueError(
            f"Unknown workflow: {name!r}\n"
            f"Supported: {supported}"
        )
    return WORKFLOWS[name]


def list_workflows() -> List[str]:
    """List all available workflow names.

    Returns:
        List[str]: Sorted list of workflow identifiers
    """
    return sorted(WORKFLOWS.keys())


if __name__ == "__main__":
    # Quick demo
    print("Available workflows:\n")
    for name, workflow in sorted(WORKFLOWS.items()):
        print(f"  {name:20} ({workflow.get_total_operations()} steps, ~{workflow.estimated_time_minutes}min)")
        print(f"    {workflow.description}")
        for i, step in enumerate(workflow.steps, 1):
            print(f"    {i}. {step.script:15} → {step.description}")
        print()
