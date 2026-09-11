"""
Command-line interface for ML Optimization Suite
"""

import click
import json
import csv
import sys
from pathlib import Path
from typing import Optional
import numpy as np
from .algorithms import (
    GeneticAlgorithm,
    ParticleSwarmOptimizer,
    SimulatedAnnealing,
    AntColonyOptimization,
    DifferentialEvolution,
    HarmonySearch,
    TabuSearch,
)


@click.group()
@click.version_option(version="1.0.0")
def main():
    """ML Optimization Suite - Advanced metaheuristic algorithms for Python"""
    pass


@main.command()
def list_algorithms():
    """List available optimization algorithms"""
    algorithms = {
        "genetic": "Genetic Algorithm - Population-based evolutionary algorithm",
        "pso": "Particle Swarm Optimization - Social behavior simulation",
        "sa": "Simulated Annealing - Temperature-based local search",
        "aco": "Ant Colony Optimization - Pheromone-based swarm intelligence",
        "de": "Differential Evolution - Population-based continuous optimization",
        "hs": "Harmony Search - Music improvisation inspired algorithm",
        "tabu": "Tabu Search - Local search with memory",
    }

    click.echo("\n📊 Available Algorithms:\n")
    for name, description in algorithms.items():
        click.echo(f"  {click.style(name.upper(), fg='cyan', bold=True)}")
        click.echo(f"    {description}\n")


@main.command()
@click.option(
    "--algorithm",
    type=click.Choice(["genetic", "pso", "sa", "aco", "de", "hs", "tabu"]),
    default="genetic",
    help="Optimization algorithm to use",
)
@click.option(
    "--bounds",
    type=str,
    required=True,
    help="Parameter bounds as JSON: '[[min1, max1], [min2, max2], ...]'",
)
@click.option(
    "--iterations",
    type=int,
    default=100,
    help="Maximum iterations",
)
@click.option(
    "--input",
    type=click.Path(exists=True),
    help="Input CSV file with objective function values",
)
@click.option(
    "--output",
    type=click.Path(),
    help="Output file for results (JSON or CSV)",
)
def optimize(algorithm: str, bounds: str, iterations: int, input: Optional[str], output: Optional[str]):
    """Run optimization"""
    try:
        bounds_list = json.loads(bounds)
    except json.JSONDecodeError:
        click.echo(click.style("Error: Invalid bounds JSON format", fg="red"), err=True)
        sys.exit(1)

    # Initialize optimizer
    optimizers = {
        "genetic": GeneticAlgorithm,
        "pso": ParticleSwarmOptimizer,
        "sa": SimulatedAnnealing,
        "aco": AntColonyOptimization,
        "de": DifferentialEvolution,
        "hs": HarmonySearch,
        "tabu": TabuSearch,
    }

    OptimizerClass = optimizers[algorithm]
    optimizer = OptimizerClass(random_state=42)

    # Simple benchmark function if no input provided
    if input is None:
        def objective_func(x):
            return -np.sum(x**2)  # Sphere function
    else:
        # Load data from CSV
        data = []
        with open(input, 'r') as f:
            reader = csv.reader(f)
            next(reader)  # Skip header
            for row in reader:
                data.append([float(v) for v in row])
        data = np.array(data)

        def objective_func(x):
            # Find closest point in data
            distances = np.linalg.norm(data - x, axis=1)
            closest_idx = np.argmin(distances)
            return -distances[closest_idx]

    # Run optimization
    click.echo(f"\n🚀 Running {algorithm.upper()} optimization...")
    click.echo(f"   Iterations: {iterations}")
    click.echo(f"   Dimensions: {len(bounds_list)}\n")

    best_solution, best_fitness = optimizer.optimize(
        objective_func,
        bounds_list,
        max_iterations=iterations,
    )

    # Display results
    click.echo(click.style("✅ Optimization Complete!", fg="green", bold=True))
    click.echo(f"\n📈 Results:")
    click.echo(f"   Best Fitness: {best_fitness:.6f}")
    click.echo(f"   Best Solution: {best_solution}")
    click.echo(f"   Iterations: {len(optimizer.get_history())}\n")

    # Save results if output specified
    if output:
        if output.endswith(".json"):
            results = {
                "algorithm": algorithm,
                "best_fitness": float(best_fitness),
                "best_solution": best_solution.tolist(),
                "iterations": len(optimizer.get_history()),
                "history": optimizer.get_history(),
            }
            with open(output, 'w') as f:
                json.dump(results, f, indent=2)
            click.echo(f"💾 Results saved to {output}")
        elif output.endswith(".csv"):
            with open(output, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["Parameter", "Value"])
                for i, val in enumerate(best_solution):
                    writer.writerow([f"x{i}", val])
                writer.writerow(["Best Fitness", best_fitness])
            click.echo(f"💾 Results saved to {output}")


@main.command()
@click.option(
    "--algorithm",
    type=click.Choice(["genetic", "pso", "sa", "aco", "de", "hs", "tabu"]),
    default="genetic",
    help="Algorithm to benchmark",
)
@click.option(
    "--iterations",
    type=int,
    default=100,
    help="Number of iterations",
)
@click.option(
    "--dimensions",
    type=int,
    default=5,
    help="Problem dimensionality",
)
def benchmark(algorithm: str, iterations: int, dimensions: int):
    """Run benchmark on Sphere function"""
    optimizers = {
        "genetic": GeneticAlgorithm,
        "pso": ParticleSwarmOptimizer,
        "sa": SimulatedAnnealing,
        "aco": AntColonyOptimization,
        "de": DifferentialEvolution,
        "hs": HarmonySearch,
        "tabu": TabuSearch,
    }

    OptimizerClass = optimizers[algorithm]
    optimizer = OptimizerClass(random_state=42)

    # Sphere function
    def sphere(x):
        return -np.sum(x**2)

    bounds = [(-5.0, 5.0) for _ in range(dimensions)]

    click.echo(f"\n🔬 Benchmarking {algorithm.upper()}")
    click.echo(f"   Function: Sphere (D={dimensions})")
    click.echo(f"   Iterations: {iterations}\n")

    import time
    start = time.time()
    best_solution, best_fitness = optimizer.optimize(
        sphere,
        bounds,
        max_iterations=iterations,
    )
    elapsed = time.time() - start

    click.echo(click.style("Results:", fg="green", bold=True))
    click.echo(f"   Best Fitness: {best_fitness:.6f}")
    click.echo(f"   Best Solution: {best_solution}")
    click.echo(f"   Time: {elapsed:.2f}s")
    click.echo(f"   Iterations/sec: {iterations/elapsed:.2f}\n")


@main.command()
@click.option(
    "--config",
    type=click.Path(exists=True),
    help="Configuration file (JSON)",
)
@click.option(
    "--data",
    type=click.Path(exists=True),
    help="Input data file (CSV)",
)
def tune(config: Optional[str], data: Optional[str]):
    """Hyperparameter tuning mode"""
    if config is None:
        config_data = {
            "algorithm": "genetic",
            "iterations": 50,
            "population_size": 30,
        }
    else:
        with open(config, 'r') as f:
            config_data = json.load(f)

    click.echo(f"\n⚙️  Hyperparameter Tuning")
    click.echo(f"   Algorithm: {config_data.get('algorithm', 'genetic')}")
    click.echo(f"   Iterations: {config_data.get('iterations', 100)}")

    if data:
        click.echo(f"   Data: {data}\n")

    click.echo("✅ Ready to optimize!")


@main.command()
def info():
    """Show package information"""
    click.echo("""
╔════════════════════════════════════════════════════════════════╗
║         ML Optimization Suite v1.0.0                          ║
║     Advanced Metaheuristic Optimization Algorithms           ║
╚════════════════════════════════════════════════════════════════╝

📚 Features:
  • 7 optimization algorithms (GA, PSO, SA, ACO, DE, HS, TS)
  • scikit-learn compatible API
  • Framework integrations (TensorFlow, PyTorch, XGBoost, LightGBM)
  • Real-time streaming results
  • Export and visualization

📖 Usage:
  ml-optimize list-algorithms      # Show available algorithms
  ml-optimize optimize --help       # Run optimization
  ml-optimize benchmark --help      # Run benchmarks
  ml-optimize tune --help           # Hyperparameter tuning

🔗 Links:
  GitHub: https://github.com/marcelortz/xio-agents-2b
  Docs: https://ml-optimization-suite.dev

💡 Quick Start:
  1. Import: from ml_optimization_suite import GeneticAlgorithm
  2. Create: ga = GeneticAlgorithm(population_size=50)
  3. Run: solution, fitness = ga.optimize(objective_func, bounds, max_iterations=100)
    """)


if __name__ == "__main__":
    main()
