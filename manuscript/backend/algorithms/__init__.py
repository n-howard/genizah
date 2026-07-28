# algorithms/__init__.py
from typing import List
from pathlib import Path
from .. import needleman_wunsch
from ..base import AlgorithmSettings, run_with_captured_output
from .. import smith_waterman

ALGORITHM_REGISTRY = {
    "needleman_wunsch": needleman_wunsch.run,
    "smith_waterman": smith_waterman.run,
}

def execute_algorithm(algo_name: str, files: List[Path], raw_settings: dict, baseText) -> dict:
    key = algo_name.lower().strip().replace(" ", "_")
    if key not in ALGORITHM_REGISTRY:
        raise ValueError(f"Unknown algorithm '{algo_name}'")

    settings = AlgorithmSettings.from_dict(raw_settings)
    runner = ALGORITHM_REGISTRY[key]

    # Runs the function and catches all printed output
    return run_with_captured_output(runner, files, settings)