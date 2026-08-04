from dataclasses import dataclass
from typing import List

def clean(val, default=0.0):
    if val is None or val=="":
        return default
    return float(val)

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
            gap_penalty=clean(data.get("gapPenalty", -1)),
            match_bonus=clean(data.get("matchBonus", 5)),
            mismatch_penalty=clean(data.get("mismatchPenalty", -1)),
            special=data.get("special", []),
            special_other=bool(data.get("specialOther", False)),
            special_bonus=clean(data.get("specialBonus", 10)),
            affine_penalty=clean(data.get("affinePenalty", -0.5)),
            is_plot=bool(data.get("isPlot", True))
        )


@dataclass
class PlotSettings:
    plot_type: str
    perplexity: float
    theta: float
    colors: str
    color_text: bool

    @classmethod
    def from_dict(cls, data:dict) -> "PlotSettings":
        return cls(
            plot_type=str(data.get("plotType", "3da")),
            perplexity=clean(data.get("perplexity", 1)),
            theta=clean(data.get("theta", 0.5)),
            colors = str(data.get("colors", "black")),
            color_text = bool(data.get("colorText", False))
        )