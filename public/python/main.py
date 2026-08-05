

import json
import tempfile
from pathlib import Path
import io
import contextlib
import os
import pandas as pd
import subprocess
import uuid
from typing import List, Callable, Any, Dict, Optional
import numpy as np

from base import AlgorithmSettings, PlotSettings
from needleman_wunsch import run_nw
from smith_waterman import run_sw
from needleman_wunsch import compare_two_nw
from smith_waterman import compare_two_sw

# app = FastAPI()

# Directory to hold temporary matrix caches
# CACHE_DIR = Path(tempfile.gettempdir()) / "alignment_cache"
# CACHE_DIR.mkdir(exist_ok=True)
# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=False,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.post("/api/process")
# def process_data(
#     algorithm: str = Form(...),
#     settings: str = Form(...),
#     multi: Optional[str] = Form("false"),
#     files: List[UploadFile] = File(None),
#     base_text: Optional[str] = Form(None),
#     subsections_metadata: Optional[str] = Form(None)
# ):
def run_in_browser_process(algorithm, settings, file_dir, base_text, multi, base_text_list):
    root_dir = file_dir
    # try:
    #     raw_settings = json.loads(settings)
    # except Exception:
    #     raise HTTPException(status_code=400, detail="Invalid settings JSON format.")
    # settings = AlgorithmSettings.from_dict(raw_settings)
    is_plot = True
    # job_id = str(uuid.uuid4())
    # is_multi = multi.lower() == "true"
    # if base_text=="" or not base_text:
    #     base_text = files[0]
        
        
    #     clean_base_text = Path(base_text.filename).name.split("_")[0]
        
    #     base_text = clean_base_text
    base_text_pattern = base_text.split("_")[0]
    

    if "ndw" not in algorithm and "sw" not in algorithm:
        algorithm = "ndw"

    # with tempfile.TemporaryDirectory() as temp_dir:
    #     root_dir = Path(temp_dir)
    #     files_folder = root_dir / "Alignment Data0"
    #     files_folder.mkdir(parents=True, exist_ok=True)

    #     file_bytes_map: Dict[str, bytes] = {}
    #     if files:
    #         for f in files:
    #             f.file.seek(0)
    #             clean_name = Path(f.filename).name
    #             file_bytes_map[clean_name] = f.file.read()

    #     file_names_clean = file_bytes_map.keys()
    #     file_names = {}
    #     if len(file_names_clean)<4:
    #         is_plot = False
    #     # 2. Write files to temporary subdirectories using fresh bytes
        
    #     if is_multi and subsections_metadata:
    #         subsections_info = json.loads(subsections_metadata)
    #         length0 = len(list(subsections_info[0].values())[0])
    #         for sub_obj in subsections_info:
    #             for section_name, filenames in sub_obj.items():
    #                 valid_files = [fname for fname in filenames if Path(fname).name in file_bytes_map]
    #                 if len(filenames)!=length0:
    #                     is_plot=False
    #                 # Skip creating this directory if no valid files exist for this section
    #                 if not valid_files:
    #                     continue
    #                 subfolder = files_folder / section_name
    #                 subfolder.mkdir(parents=True, exist_ok=True)

    #                 for fname in filenames:
    #                     clean_fname = Path(fname).name
    #                     if clean_fname in file_bytes_map:
    #                         file_path = subfolder / clean_fname
    #                         # Open a fresh file for writing each time
    #                         with open(file_path, "wb") as out_file:
    #                             out_file.write(file_bytes_map[clean_fname])
    #     else:
    #         subfolder = files_folder / "transcriptions"
    #         subfolder.mkdir(parents=True, exist_ok=True)
    #         for clean_name, content in file_bytes_map.items():
    #             file_path = subfolder / clean_name
    #             file_names[clean_name] = file_path
    #             with open(file_path, "wb") as out_file:
    #                 out_file.write(content)
                
                    
        

    original_cwd = os.getcwd()
    buffer = io.StringIO()
    
    
    
        
    
    records = []
    try:
        os.chdir(root_dir)
        print("Running algorithm")
        

        

        if "ndw" in algorithm:
            
            
            # Redirect print() outputs into string buffer
            with contextlib.redirect_stdout(buffer):
                records = records + run_nw(root_dir, settings, base_text_pattern, is_plot, records)
                    
                
        elif "sw" in algorithm:
            # Redirect print() outputs into string buffer
            with contextlib.redirect_stdout(buffer):
                records = records + run_sw(root_dir, settings, base_text_pattern, is_plot, records)
        
        if is_plot:
            # fix this to be customizable
            # base_texts = set([Path(f.filename).name.split("_")[0] for f in files]) if files else set()
            base_texts = set([f.split("_")[0] for f in base_text_list]) if base_text_list else set()
            print("BaseText Prefixes:",base_texts)
            # df = None
            print("Creating matrix")
            
            base_texts = [bt for bt in base_texts if bt!=base_text_pattern ] 

            for bt in base_texts:
                if "ndw" in algorithm:
                    records = records + run_nw(root_dir, settings, bt, True, records)
                else:
                    records = records + run_sw(root_dir, settings, bt, True, records)

                # filtered_records = [{key: value for key, value in dict.items() if (key!="OrigScore"and key!="TextNamePair")} for dict in records]
                # orig_df = pd.DataFrame(filtered_records)
                # df=orig_df.pivot_table(
                #     index="BaseText",
                #     columns="TargetFile",
                #     values="Score"
                # )
                # df = df.fillna(1)
        
                    
                # else:
                #     print("Creating matrix")
                #     n = len(base_texts)
                #     df = pd.DataFrame(
                #     np.ones((n, n)), 
                #         index=base_texts, 
                #         columns=base_texts,
                        
                #     )
                #     for i in range(n):
                #         seq1 = file_names_clean[i]
                    
                        
                        
                #         df.loc[seq1, seq1] = 1  

                #         for j in range(i + 1, n):
                #             seq2 = file_names_clean[j]
                            
                #             # Compute alignment only ONCE for (seq1, seq2)
                #             if "ndw" in algorithm:
                #                 score = compare_two_nw(root_dir, file_names[seq1], file_names[seq2], settings)
                #             elif "sw" in algorithm:
                #                 score = compare_two_sw(root_dir, file_names[seq1], file_names[seq2], settings )
                #             # Mirror the result: (seq1, seq2) == (seq2, seq1)
                #             df.loc[seq1, seq2] = score
                #             df.loc[seq2, seq1] = score
                
            
                
                # def get_suffix_sort_key(col_name):
                #     parts = col_name.rsplit('_', 1)
                #     if len(parts) == 2:
                #         folder_suffix, filename = parts[1], parts[0]
                #         return (folder_suffix, filename) 
                #     return ('', col_name)
                # if multi:
                #     sorted_columns = sorted(df.columns, key=get_suffix_sort_key)
                #     df = df[sorted_columns]
                # df.to_excel(CACHE_DIR / f"{job_id}.xlsx", index=True, index_label="BaseText")
                # this is temp/needs to be a user choice
                
                    
            
    finally: 
        os.chdir(original_cwd)
    captured_logs = buffer.getvalue()
    
    return {
        "status": "success",
        "algorithm": algorithm,
        "output_logs": captured_logs,
        # "job_id": job_id,
        "records": records,
        "is_plot": is_plot
    }

      



# @app.post("/api/plot/{job_id}")
# def generate_plot(job_id: str, plot_settings: str = Form(...)):
#     excel_path = CACHE_DIR / f"{job_id}.xlsx"
    
#     try:
#         raw_plot_settings = json.loads(plot_settings)
#     except Exception:
#         raise HTTPException(status_code=400, detail="Invalid settings JSON format.")
#     plot_settings = PlotSettings.from_dict(raw_plot_settings)
    
    
    

#     if not excel_path.exists():
#         raise HTTPException(status_code=404, detail="Cached matrix data not found. Please re-run processing.")
    
#     output_html_path = CACHE_DIR / f"{job_id}_plot.html"

#     output_image_path = CACHE_DIR / f"{job_id}_static.png"
    
#     try:
#         # Run R script directly on the cached excel
#         subprocess.run(
#             [ "Rscript", "t-SNE.R", str(excel_path), str(output_html_path), str(plot_settings.perplexity), str(plot_settings.theta), str(plot_settings.plot_type), str(output_image_path), str(plot_settings.colors), str(plot_settings.color_text)],
#             check=True,
#             capture_output=True,
#             stdout=None,
#             stderr=None,
#             text=True
#         )
#     except subprocess.CalledProcessError as e:
#         raise HTTPException(status_code=500, detail=f"R script failed: {e.stderr}")
#     if plot_settings.plot_type=="3da":
#         return FileResponse(output_html_path, media_type="text/html", headers={
#             "Access-Control-Allow-Origin": "*",
#             "Access-Control-Allow-Methods": "*",
#             "Access-Control-Allow-Headers": "*",
#         })
#     else:
#         return FileResponse(output_image_path, media_type="text/png", headers={
#             "Access-Control-Allow-Origin": "*",
#             "Access-Control-Allow-Methods": "*",
#             "Access-Control-Allow-Headers": "*",
#         })

# @app.get("/api/sheet/{job_id}")
# def send_sheet(job_id: str):
#     excel_path = CACHE_DIR / f"{job_id}.xlsx"
#     if not excel_path.exists():
#         raise HTTPException(status_code=404, detail="Cached matrix data not found. Please re-run processing.")
#     return FileResponse(
#         path=excel_path,
#         media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
#         filename="alignment_matrix.xlsx" 
#     )




# # import json
# # import tempfile
# # import shutil
# # from pathlib import Path
# # from fastapi import FastAPI, UploadFile, File, Form, HTTPException
# # from fastapi.middleware.cors import CORSMiddleware
# # from fastapi.responses import FileResponse
# # import io
# # import contextlib
# # from dataclasses import dataclass
# # from typing import List, Callable, Any, Dict, Optional
# # import os
# # import pandas as pd
# # import subprocess

# # from base import AlgorithmSettings
# # from needleman_wunsch import run_nw
# # from smith_waterman import run_sw

# # app = FastAPI()

# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["*"],
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )


# # @app.post("/api/process")
# # def process_data(
# #     algorithm: str = Form(...),
# #     settings: str = Form(...),
# #     multi: Optional[str] = Form("false"),
# #     files: List[UploadFile] = File(None),
# #     base_text: Optional[UploadFile] = File(None),
# #     subsections_metadata: Optional[str] = Form(None)
# # ):
# #     try:
# #         raw_settings = json.loads(settings)
# #     except Exception:
# #         raise HTTPException(status_code=400, detail="Invalid settings JSON format.")

# #     is_multi = multi.lower() == "true"

# #     if "ndw" not in algorithm and "sw" not in algorithm:
# #         algorithm = "ndw"

# #     with tempfile.TemporaryDirectory() as temp_dir:
# #         root_dir = Path(temp_dir)
# #         files_folder = root_dir / "Alignment Data0"
# #         files_folder.mkdir(parents=True, exist_ok=True)

# #         # 1. Store files in filesFolder structure
# #         if is_multi and subsections_metadata:
# #             subsections_info = json.loads(subsections_metadata)
# #             for sub_obj in subsections_info:
# #                 for section_name, filenames in sub_obj.items():
# #                     subfolder = files_folder / section_name
# #                     subfolder.mkdir(parents=True, exist_ok=True)

# #                     matching_files = [f for f in files if Path(f.filename).name in filenames] if files else []
                    
# #                     for f in matching_files:
# #                         f.file.seek(0)
# #                         clean_filename = Path(f.filename).name
# #                         file_path = subfolder / clean_filename
# #                         with open(file_path, "wb") as buffer:
# #                             shutil.copyfileobj(f.file, buffer)
            
# #         else:
# #             subfolder = files_folder / "transcriptions"
# #             subfolder.mkdir(parents=True, exist_ok=True)
# #             if files:
# #                 for f in files:
# #                     f.file.seek(0)
# #                     clean_filename = Path(f.filename).name
# #                     file_path = subfolder / clean_filename
# #                     with open(file_path, "wb") as buffer:
# #                         shutil.copyfileobj(f.file, buffer)
                
        
# #         settings = AlgorithmSettings.from_dict(raw_settings)

# #         original_cwd = os.getcwd()
# #         buffer = io.StringIO()
        
# #         if not settings.is_plot:
# #             # temp code! need to let users choose how to split it
            
# #             if not base_text:
# #                 base_text = files[0]
                
# #             clean_base_text = Path(base_text.filename).name
# #             # temp code! need to let users choose how to split it
# #             base_text_pattern = clean_base_text.split("_")[0]
                
            
# #             try:
# #                 os.chdir(root_dir)
                
# #                 if "ndw" in algorithm:
                    
                    
# #                     # Redirect print() outputs into string buffer
# #                     with contextlib.redirect_stdout(buffer):
# #                         result_data = run_nw(root_dir, settings, base_text_pattern)
                        
                    
# #                 elif "sw" in algorithm:
# #                     # Redirect print() outputs into string buffer
# #                     with contextlib.redirect_stdout(buffer):
# #                         result_data = run_sw(root_dir, settings, base_text_pattern)
                        
                
# #             finally: 
# #                 os.chdir(original_cwd)
# #             captured_logs = buffer.getvalue()
# #             return {
# #                 "status": "success",
# #                 "algorithm": algorithm,
# #                 "output_logs": captured_logs,
# #                 "data": result_data
# #             }
# #         else:
# #             # need to let user choose something to split on (figure out how to explain)
# #             base_texts = set([Path(f.filename).name.split("_")[0] for f in files])
# #             all_scores_table = {}
# #             outputName = "plot.html"
# #             try:
# #                 os.chdir(root_dir)
# #                 for bt in base_texts:
# #                     if "ndw" in algorithm:
# #                         all_scores_table[bt] = run_nw(root_dir, settings, bt)
# #                     else:
# #                         all_scores_table[bt] = run_sw(root_dir, settings, bt)
# #                 df = pd.DataFrame.from_dict(all_scores_table, orient="index")
# #                 exFile = df.to_excel("Fingerprint2.xlsx", index=True)
# #                 subprocess.run(
# #                    [ "Rscript", "t-SNE.R", exFile, outputName],
# #                    check=True,
# #                    capture_output=True,
# #                    text=True
# #                 )
# #             finally: 
# #                 os.chdir(original_cwd)
# #             return FileResponse(outputName, media_type="text/html")

        

#         # # 2. Search through each subfolder and run the chosen algorithm
#         # execution_results = {}
#         # try:
#         #     for subfolder in files_folder.iterdir():
#         #         if subfolder.is_dir():
#         #             txt_files = list(subfolder.glob("*.txt"))
#         #             if txt_files:
#         #                 result = execute_algorithm(algorithm, txt_files, raw_settings)
#         #                 execution_results[subfolder.name] = result
#         # except ValueError as e:
#         #     raise HTTPException(status_code=400, detail=str(e))

#         # return {
#         #     "status": "success",
#         #     "selected_algorithm": algorithm,
#         #     "processed_folders": len(execution_results),
#         #     "results": execution_results
#         # }

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)