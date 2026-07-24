import json
from typing import List, Optional
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional: Pydantic model to validate the nested settings
class SettingsModel(BaseModel):
    gapPenalty: int
    matchBonus: int
    mismatchPenalty: int
    special: List[str]
    specialOther: bool
    specialBonus: int
    specialGap: int
    specialMismatch: int
    affinePenalty: int

@app.post("/api/process")
async def process_data(
    algorithm: str = Form(...),
    settings: str = Form(...),                        # Received as JSON string
    base_text: Optional[UploadFile] = File(None),     # Optional single file
    files: List[UploadFile] = File([])                # Array of uploaded files
):
    # Parse the settings JSON string into a Python dict or Pydantic object
    settings_dict = json.loads(settings)
    parsed_settings = SettingsModel(**settings_dict)

    # Read baseText content if provided
    base_text_content = ""
    if base_text:
        base_text_content = (await base_text.read()).decode("utf-8")

    # Read all secondary files
    processed_files_info = []
    for f in files:
        content = await f.read()
        processed_files_info.append({
            "filename": f.filename,
            "size_bytes": len(content)
        })

    # Return response back to Next.js
    return {
        "status": "success",
        "algorithm": algorithm,
        "base_text_filename": base_text.filename if base_text else None,
        "base_text_preview": base_text_content[:50] if base_text_content else None,
        "total_files_processed": len(files),
        "file_details": processed_files_info,
        "applied_settings": parsed_settings.model_dump()
    }