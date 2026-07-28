import json
import tempfile
import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import io
import contextlib
import os
import pandas as pd
import subprocess
import uuid
import json
import tempfile
import shutil
from typing import List, Callable, Any, Dict, Optional

from base import AlgorithmSettings
from needleman_wunsch import run_nw
from smith_waterman import run_sw

app = FastAPI()

# Directory to hold temporary matrix caches
CACHE_DIR = Path(tempfile.gettempdir()) / "alignment_cache"
CACHE_DIR.mkdir(exist_ok=True)


# @app.post("/api/process")
# def process_data(
#     algorithm: str = Form(...),
#     settings: str = Form(...),
#     multi: str = Form("false"),
#     files: list[UploadFile] = File(None),
#     base_text: UploadFile = File(None),
#     subsections_metadata: str = Form(None)
# ):
#     raw_settings = json.loads(settings)
#     is_multi = multi.lower() == "true"
#     if "ndw" not in algorithm and "sw" not in algorithm:
#         algorithm = "ndw"

#     job_id = str(uuid.uuid4())

#     with tempfile.TemporaryDirectory() as temp_dir:
#         root_dir = Path(temp_dir)
#         files_folder = root_dir / "Alignment Data0"
#         files_folder.mkdir(parents=True, exist_ok=True)

#         # Save files logic...
#         if is_multi and subsections_metadata:
#             subsections_info = json.loads(subsections_metadata)
#             for sub_obj in subsections_info:
#                 for section_name, filenames in sub_obj.items():
#                     subfolder = files_folder / section_name
#                     subfolder.mkdir(parents=True, exist_ok=True)
#                     matching_files = [f for f in files if Path(f.filename).name in filenames] if files else []
#                     for f in matching_files:
#                         f.file.seek(0)
#                         with open(subfolder / Path(f.filename).name, "wb") as buffer:
#                             shutil.copyfileobj(f.file, buffer)
#         else:
#             subfolder = files_folder / "transcriptions"
#             subfolder.mkdir(parents=True, exist_ok=True)
#             if files:
#                 for f in files:
#                     f.file.seek(0)
#                     with open(subfolder / Path(f.filename).name, "wb") as buffer:
#                         shutil.copyfileobj(f.file, buffer)

#         parsed_settings = AlgorithmSettings.from_dict(raw_settings)
#         original_cwd = os.getcwd()
#         buffer = io.StringIO()

#         if not base_text and files:
#             base_text = files[0]
#         clean_base_text = Path(base_text.filename).name if base_text else ""
#         base_text_pattern = clean_base_text.split("_")[0]

#         try:
#             os.chdir(root_dir)
            
#             # 1. Capture output logs
#             with contextlib.redirect_stdout(buffer):
#                 if "ndw" in algorithm:
#                     result_data = run_nw(root_dir, parsed_settings, base_text_pattern)
#                 else:
#                     result_data = run_sw(root_dir, parsed_settings, base_text_pattern)

#             # 2. ALSO build the full base_texts scores table and cache it to disk for potential plotting
#             base_texts = set([Path(f.filename).name.split("_")[0] for f in files]) if files else set()
#             all_scores_table = {}

#             for bt in base_texts:
#                 if "ndw" in algorithm:
#                     all_scores_table[bt] = run_nw(root_dir, parsed_settings, bt)
#                 else:
#                     all_scores_table[bt] = run_sw(root_dir, parsed_settings, bt)

#             # Cache matrix dataframe as CSV
#             df = pd.DataFrame.from_dict(all_scores_table, orient="index")
#             df.to_csv(CACHE_DIR / f"{job_id}.csv", index=True)

#         finally:
#             os.chdir(original_cwd)

#         return {
#             "status": "success",
#             "job_id": job_id,  # Send job_id back to frontend!
#             "algorithm": algorithm,
#             "output_logs": buffer.getvalue(),
#             "data": result_data
#         }
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/process")
def process_data(
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
    job_id = str(uuid.uuid4())
    is_multi = multi.lower() == "true"

    if "ndw" not in algorithm and "sw" not in algorithm:
        algorithm = "ndw"

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

                    matching_files = [f for f in files if Path(f.filename).name in filenames] if files else []
                    
                    for f in matching_files:
                        f.file.seek(0)
                        clean_filename = Path(f.filename).name
                        file_path = subfolder / clean_filename
                        with open(file_path, "wb") as buffer:
                            shutil.copyfileobj(f.file, buffer)
            
        else:
            subfolder = files_folder / "transcriptions"
            subfolder.mkdir(parents=True, exist_ok=True)
            if files:
                for f in files:
                    f.file.seek(0)
                    clean_filename = Path(f.filename).name
                    file_path = subfolder / clean_filename
                    with open(file_path, "wb") as buffer:
                        shutil.copyfileobj(f.file, buffer)
                
        
        settings = AlgorithmSettings.from_dict(raw_settings)

        original_cwd = os.getcwd()
        buffer = io.StringIO()
        
      
            # temp code! need to let users choose how to split it
            
        if not base_text:
            base_text = files[0]
            
        clean_base_text = Path(base_text.filename).name
        # temp code! need to let users choose how to split it
        base_text_pattern = clean_base_text.split("_")[0]
            
        
        try:
            os.chdir(root_dir)
            
            if "ndw" in algorithm:
                
                
                # Redirect print() outputs into string buffer
                with contextlib.redirect_stdout(buffer):
                    result_data = run_nw(root_dir, settings, base_text_pattern)
                    
                
            elif "sw" in algorithm:
                # Redirect print() outputs into string buffer
                with contextlib.redirect_stdout(buffer):
                    result_data = run_sw(root_dir, settings, base_text_pattern)
            base_texts = set([Path(f.filename).name.split("_")[0] for f in files]) if files else set()
            all_scores_table = {}

            for bt in base_texts:
                if "ndw" in algorithm:
                    all_scores_table[bt] = run_nw(root_dir, settings, bt)
                else:
                    all_scores_table[bt] = run_sw(root_dir, settings, bt)

            # Cache matrix dataframe as CSV
            df = pd.DataFrame.from_dict(all_scores_table, orient="index")
            df.to_excel(CACHE_DIR / f"{job_id}.xlsx", index=True)
                    
            
        finally: 
            os.chdir(original_cwd)
        captured_logs = buffer.getvalue()
        return {
            "status": "success",
            "algorithm": algorithm,
            "output_logs": captured_logs,
            "job_id": job_id,
            "data": result_data
        }

      



@app.get("/api/plot/{job_id}")
def generate_plot(job_id: str):
    cached_csv = CACHE_DIR / f"{job_id}.xlsx"

    if not cached_csv.exists():
        raise HTTPException(status_code=404, detail="Cached matrix data not found. Please re-run processing.")

    output_html_path = CACHE_DIR / f"{job_id}_plot.html"

    try:
        # Run R script directly on the cached CSV
        subprocess.run(
            ["Rscript", "t-SNE.R", str(cached_csv), str(output_html_path)],
            check=True,
            capture_output=True,
            text=True
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"R script failed: {e.stderr}")

    return FileResponse(output_html_path, media_type="text/html", headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    })

# import json
# import tempfile
# import shutil
# from pathlib import Path
# from fastapi import FastAPI, UploadFile, File, Form, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import FileResponse
# import io
# import contextlib
# from dataclasses import dataclass
# from typing import List, Callable, Any, Dict, Optional
# import os
# import pandas as pd
# import subprocess

# from base import AlgorithmSettings
# from needleman_wunsch import run_nw
# from smith_waterman import run_sw

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.post("/api/process")
# def process_data(
#     algorithm: str = Form(...),
#     settings: str = Form(...),
#     multi: Optional[str] = Form("false"),
#     files: List[UploadFile] = File(None),
#     base_text: Optional[UploadFile] = File(None),
#     subsections_metadata: Optional[str] = Form(None)
# ):
#     try:
#         raw_settings = json.loads(settings)
#     except Exception:
#         raise HTTPException(status_code=400, detail="Invalid settings JSON format.")

#     is_multi = multi.lower() == "true"

#     if "ndw" not in algorithm and "sw" not in algorithm:
#         algorithm = "ndw"

#     with tempfile.TemporaryDirectory() as temp_dir:
#         root_dir = Path(temp_dir)
#         files_folder = root_dir / "Alignment Data0"
#         files_folder.mkdir(parents=True, exist_ok=True)

#         # 1. Store files in filesFolder structure
#         if is_multi and subsections_metadata:
#             subsections_info = json.loads(subsections_metadata)
#             for sub_obj in subsections_info:
#                 for section_name, filenames in sub_obj.items():
#                     subfolder = files_folder / section_name
#                     subfolder.mkdir(parents=True, exist_ok=True)

#                     matching_files = [f for f in files if Path(f.filename).name in filenames] if files else []
                    
#                     for f in matching_files:
#                         f.file.seek(0)
#                         clean_filename = Path(f.filename).name
#                         file_path = subfolder / clean_filename
#                         with open(file_path, "wb") as buffer:
#                             shutil.copyfileobj(f.file, buffer)
            
#         else:
#             subfolder = files_folder / "transcriptions"
#             subfolder.mkdir(parents=True, exist_ok=True)
#             if files:
#                 for f in files:
#                     f.file.seek(0)
#                     clean_filename = Path(f.filename).name
#                     file_path = subfolder / clean_filename
#                     with open(file_path, "wb") as buffer:
#                         shutil.copyfileobj(f.file, buffer)
                
        
#         settings = AlgorithmSettings.from_dict(raw_settings)

#         original_cwd = os.getcwd()
#         buffer = io.StringIO()
        
#         if not settings.is_plot:
#             # temp code! need to let users choose how to split it
            
#             if not base_text:
#                 base_text = files[0]
                
#             clean_base_text = Path(base_text.filename).name
#             # temp code! need to let users choose how to split it
#             base_text_pattern = clean_base_text.split("_")[0]
                
            
#             try:
#                 os.chdir(root_dir)
                
#                 if "ndw" in algorithm:
                    
                    
#                     # Redirect print() outputs into string buffer
#                     with contextlib.redirect_stdout(buffer):
#                         result_data = run_nw(root_dir, settings, base_text_pattern)
                        
                    
#                 elif "sw" in algorithm:
#                     # Redirect print() outputs into string buffer
#                     with contextlib.redirect_stdout(buffer):
#                         result_data = run_sw(root_dir, settings, base_text_pattern)
                        
                
#             finally: 
#                 os.chdir(original_cwd)
#             captured_logs = buffer.getvalue()
#             return {
#                 "status": "success",
#                 "algorithm": algorithm,
#                 "output_logs": captured_logs,
#                 "data": result_data
#             }
#         else:
#             # need to let user choose something to split on (figure out how to explain)
#             base_texts = set([Path(f.filename).name.split("_")[0] for f in files])
#             all_scores_table = {}
#             outputName = "plot.html"
#             try:
#                 os.chdir(root_dir)
#                 for bt in base_texts:
#                     if "ndw" in algorithm:
#                         all_scores_table[bt] = run_nw(root_dir, settings, bt)
#                     else:
#                         all_scores_table[bt] = run_sw(root_dir, settings, bt)
#                 df = pd.DataFrame.from_dict(all_scores_table, orient="index")
#                 exFile = df.to_excel("Fingerprint2.xlsx", index=True)
#                 subprocess.run(
#                    [ "Rscript", "t-SNE.R", exFile, outputName],
#                    check=True,
#                    capture_output=True,
#                    text=True
#                 )
#             finally: 
#                 os.chdir(original_cwd)
#             return FileResponse(outputName, media_type="text/html")

        

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