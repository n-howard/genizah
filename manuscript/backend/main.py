# main.py
import json
import tempfile
import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import io
import contextlib
from dataclasses import dataclass
from typing import List, Callable, Any, Dict, Optional

from needleman_wunsch import run as nmw_run
from smith_waterman import run as sw_run

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/api/process")
async def process_data(
    algorithm: str = Form(...),
    settings: str = Form(...),
    multi: Optional[str] = Form("false"),
    files: List[UploadFile] = File(None),
    base_text: Optional[UploadFile] = File(None),
    subsections_metadata: Optional[str] = Form(None)
):
    try:
        raw_settings = json.loads(settings)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid settings JSON format.")

    is_multi = multi.lower() == "true"

    with tempfile.TemporaryDirectory() as temp_dir:
        root_dir = Path(temp_dir)
        files_folder = root_dir / "Alignment Data0"
        files_folder.mkdir(parents=True, exist_ok=True)

        # 1. Store files in filesFolder structure
        if is_multi and subsections_metadata:
            subsections_info = json.loads(subsections_metadata)
            for sub_obj in subsections_info:
                for section_name, filenames in sub_obj.items():
                    subfolder = files_folder / section_name
                    subfolder.mkdir(parents=True, exist_ok=True)

                    matching_files = [f for f in files if f.filename in filenames] if files else []
                    for f in matching_files:
                        file_path = subfolder / f.filename
                        with open(file_path, "wb") as buffer:
                            shutil.copyfileobj(f.file, buffer)
        else:
            subfolder = files_folder / "default_subfolder"
            subfolder.mkdir(parents=True, exist_ok=True)
            if files:
                for f in files:
                    file_path = subfolder / f.filename
                    with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(f.file, buffer)

        settings = AlgorithmSettings.from_dict(raw_settings)

        # temp code! need to let users choose how to split it
        base_text_pattern = base_text.name.split("_")[0]

        buffer = io.StringIO()
        if "nmw" in algorithm:
            
                
            # Redirect print() outputs into string buffer
            with contextlib.redirect_stdout(buffer):
                result_data = nmw_run(files, settings, base_text_pattern)
                
            captured_logs = buffer.getvalue()
            return captured_logs
        elif "sw" in algorithm:
            # Redirect print() outputs into string buffer
            with contextlib.redirect_stdout(buffer):
                result_data = sw_run(files, settings, base_text_pattern)
                
            captured_logs = buffer.getvalue()
            return captured_logs

        # # 2. Search through each subfolder and run the chosen algorithm
        # execution_results = {}
        # try:
        #     for subfolder in files_folder.iterdir():
        #         if subfolder.is_dir():
        #             txt_files = list(subfolder.glob("*.txt"))
        #             if txt_files:
        #                 result = execute_algorithm(algorithm, txt_files, raw_settings)
        #                 execution_results[subfolder.name] = result
        # except ValueError as e:
        #     raise HTTPException(status_code=400, detail=str(e))

        # return {
        #     "status": "success",
        #     "selected_algorithm": algorithm,
        #     "processed_folders": len(execution_results),
        #     "results": execution_results
        # }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)