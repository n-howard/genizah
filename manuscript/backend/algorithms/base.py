# algorithms/base.py
import io
import contextlib
from dataclasses import dataclass
from pathlib import Path
from typing import List, Callable, Any, Dict, Optional


def run_with_captured_output(
    func: Callable[[List[Path], Any], Any], 
    files: List[Path], 
    settings: Any
) -> Dict[str, Any]:
    """Executes an algorithm function while capturing all print() outputs."""
    buffer = io.StringIO()
    
    # Redirect print() outputs into string buffer
    with contextlib.redirect_stdout(buffer):
        result_data = func(files, settings)
        
    captured_logs = buffer.getvalue()
    
    return {
        "output_logs": captured_logs,
        "data": result_data
    }


@dataclass
class AlgorithmSettings:
    gap_penalty: float
    match_bonus: float
    mismatch_penalty: float
    special: List[str]
    special_other: bool
    special_bonus: float
    special_gap: float
    special_mismatch: float
    affine_penalty: float

    @classmethod
    def from_dict(cls, data: dict) -> "AlgorithmSettings":
        """Maps camelCase keys from Next.js state to snake_case attributes."""
        return cls(
            gap_penalty=float(data.get("gapPenalty", -1)),
            match_bonus=float(data.get("matchBonus", 5)),
            mismatch_penalty=float(data.get("mismatchPenalty", -1)),
            special=data.get("special", []),
            special_other=bool(data.get("specialOther", False)),
            special_bonus=float(data.get("specialBonus", 10)),
            special_gap=float(data.get("specialGap", -1)),
            special_mismatch=float(data.get("specialMismatch", -1)),
            affine_penalty=float(data.get("affinePenalty", -0.5)),
        )