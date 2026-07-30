from dataclasses import dataclass
from typing import List

@dataclass
class AlgorithmSettings:
    gap_penalty: float
    match_bonus: float
    mismatch_penalty: float
    special: List[str]
    special_other: bool
    special_bonus: float
    affine_penalty: float
    is_plot: bool

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
            affine_penalty=float(data.get("affinePenalty", -0.5)),
            is_plot=bool(data.get("isPlot", False))
        )
