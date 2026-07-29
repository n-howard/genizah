"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Trash2,
  Eraser,
  FileCheck,
  CirclePlus,
  FolderOpen,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

export interface Subsection {
  [key: string]: File[];
}

export default function Pages() {
  const [currentStep, setCurrentStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);

  // Global Form State
  const [formData, setFormData] = useState<{
    multi: boolean | null;
    files: File[];
    subsections: Subsection[];
    algorithm: string;
    baseText: File | null;
    settings: {
      gapPenalty: number;
      matchBonus: number;
      mismatchPenalty: number;
      special: string[];
      specialOther: boolean;
      specialBonus: number;
      specialGap: number;
      specialMismatch: number;
      affinePenalty: number;
      isPlot: boolean;
    };
    
  }>({
    multi: null,
    files: [],
    subsections: [],
    algorithm: "",
    baseText: null,
    settings: {
      gapPenalty: -1,
      matchBonus: 5,
      mismatchPenalty: -1,
      special: [],
      specialOther: false,
      specialBonus: 10,
      specialGap: -1,
      specialMismatch: -1,
      affinePenalty: -0.5,
      isPlot: false,
    },
    
  });

  const [count, setCount] = useState(1);
  const [inputValue, setInputValue] = useState<string>("");
  const [targetSubsection, setTargetSubsection] = useState<string>("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  

  // Drag and drop within subsections
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const [draggedSourceSection, setDraggedSourceSection] = useState<
    string | null
  >(null);

  const folderInput = useRef<HTMLInputElement | null>(null);

  // Subsection creation logic
  const handleSubsection = () => {
    const name =
      inputValue.trim() !== "" ? inputValue.trim() : `Subsection ${count}`;
    if(!inputValue.trim()){
      setCount((prev) => prev + 1);
    }
    // Check if section name already exists
    const exists = formData.subsections.some(
      (sub) => Object.keys(sub)[0] === name,
    );
    if (!exists) {
      setFormData((prev) => ({
        ...prev,
        subsections: [...prev.subsections, { [name]: [] }],
      }));
      if (!targetSubsection) {
        setTargetSubsection(name);
      }
    }
    setInputValue("");
  };

  // React Dropzone Handler
  const {
    getRootProps,
    getInputProps,
    open: openFilePicker,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (formData.multi) {
        // If no subsection target exists, fallback to creating one
        const activeSection = targetSubsection || `Subsection ${count}`;
        if (!targetSubsection) setCount((prev) => prev + 1);

        setFormData((prev) => {
          let updatedSubsections = [...prev.subsections];
          const sectionIndex = updatedSubsections.findIndex(
            (sub) => Object.keys(sub)[0] === activeSection,
          );

          if (sectionIndex > -1) {
            const existingFiles =
              updatedSubsections[sectionIndex][activeSection];
            const existingKeys = new Set(
              existingFiles.map((f) => `${f.name}-${f.size}`),
            );
            const newFiles = acceptedFiles.filter(
              (f) => !existingKeys.has(`${f.name}-${f.size}`),
            );

            updatedSubsections[sectionIndex] = {
              [activeSection]: [...existingFiles, ...newFiles],
            };
          } else {
            updatedSubsections.push({ [activeSection]: acceptedFiles });
          }

          return { ...prev, subsections: updatedSubsections };
        });
      } else {
        // Single mode upload logic
        setFormData((prev) => {
          const existingKeys = new Set(
            prev.files.map((f) => `${f.name}-${f.size}`),
          );
          const newFiles = acceptedFiles.filter(
            (file) => !existingKeys.has(`${file.name}-${file.size}`),
          );
          return {
            ...prev,
            files: [...prev.files, ...newFiles],
          };
        });
      }
    },
    accept: { "text/plain": [".txt"] },
    multiple: true,
    noClick: true,
  });
  //   // Run Algorithm (Simulated)
  const handleRunAlgorithm = () => {
    setIsProcessing(true);
    // Simulate processing time / API call
    setTimeout(() => {
      setResults({
        summary: `Successfully processed ${formData.files.length} file(s) using ${formData.algorithm.toUpperCase()}.`,
        data: [],
      });
      setIsProcessing(false);
      handleStepChange(3);
    }, 1500);
  };
  // Folder Upload Handler
  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploadedFiles = Array.from(e.target.files).filter((file) =>
      file.name.endsWith(".txt"),
    );

    if (formData.multi) {
      const activeSection = targetSubsection || `Subsection ${count}`;
      if (!targetSubsection) setCount((prev) => prev + 1);

      setFormData((prev) => {
        let updatedSubsections = [...prev.subsections];
        const sectionIndex = updatedSubsections.findIndex(
          (sub) => Object.keys(sub)[0] === activeSection,
        );

        if (sectionIndex > -1) {
          const existingFiles = updatedSubsections[sectionIndex][activeSection];
          const existingKeys = new Set(
            existingFiles.map((f) => `${f.name}-${f.size}`),
          );
          const newFiles = uploadedFiles.filter(
            (f) => !existingKeys.has(`${f.name}-${f.size}`),
          );

          updatedSubsections[sectionIndex] = {
            [activeSection]: [...existingFiles, ...newFiles],
          };
        } else {
          updatedSubsections.push({ [activeSection]: uploadedFiles });
        }

        return { ...prev, subsections: updatedSubsections };
      });
    } else {
      setFormData((prev) => {
        const existingKeys = new Set(
          prev.files.map((f) => `${f.name}-${f.size}`),
        );
        const newFiles = uploadedFiles.filter(
          (file) => !existingKeys.has(`${file.name}-${file.size}`),
        );
        return {
          ...prev,
          files: [...prev.files, ...newFiles],
        };
      });
    }
  };

  const removeFile = (file: File) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f !== file),
      baseText: prev.baseText === file ? null : prev.baseText,
    }));
  };

  const removeFileFromSection = (sectionName: string, fileToRemove: File) => {
    setFormData((prev) => ({
      ...prev,
      baseText: prev.baseText === fileToRemove ? null : prev.baseText,
      subsections: prev.subsections.map((sub) => {
        const key = Object.keys(sub)[0];
        if (key === sectionName) {
          return {
            [key]: sub[key].filter((f) => f !== fileToRemove),
          };
        }
        return sub;
      }),
    }));
  };

  // Subsection Drag-and-Drop Handlers
  const handleDragStart = (
    e: React.DragEvent,
    sectionName: string,
    fileIndex: number,
  ) => {
    setDraggedSourceSection(sectionName);
    setDraggedFileIndex(fileIndex);
    e.dataTransfer.setData("text/plain", fileIndex.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSectionName: string) => {
    e.preventDefault();
    if (
      draggedSourceSection === null ||
      draggedFileIndex === null ||
      draggedSourceSection === targetSectionName
    ) {
      return;
    }

    setFormData((prev) => {
      let movedFile: File | null = null;

      const updatedSubsections = prev.subsections.map((sub) => {
        const key = Object.keys(sub)[0];
        if (key === draggedSourceSection) {
          movedFile = sub[key][draggedFileIndex];
          return {
            [key]: sub[key].filter((_, idx) => idx !== draggedFileIndex),
          };
        }
        return sub;
      });

      if (movedFile) {
        return {
          ...prev,
          subsections: updatedSubsections.map((sub) => {
            const key = Object.keys(sub)[0];
            if (key === targetSectionName) {
              return { [key]: [...sub[key], movedFile!] };
            }
            return sub;
          }),
        };
      }
      return prev;
    });

    setDraggedSourceSection(null);
    setDraggedFileIndex(null);
  };

  const handleSettingChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
  };

  const handleStepSkip = (step: number) => {
    if (step <= furthestStep) {
      setCurrentStep(step);
    }
  };

  const handleStepChange = (step: number) => {
    if (step > furthestStep) {
      setFurthestStep(step);
    }
    if (step !== currentStep) {
      setCurrentStep(step);
    }
  };
  const [jobId, setJobId] = useState<string | null>(null);
  const [plotUrl, setPlotUrl] = useState<string>("");
  const handleSubmit = async () => {
    setIsProcessing(true);
    setFormData((prev)=>({...prev, settings:{...prev.settings, ["isPlot"]: true}}))
    const firstSectionCount = Object.values(formData.subsections[0] || {})[0]?.length || 0;
    const hasUnequalSubsections = formData.subsections.some((sub) => {
      const filesInSub = Object.values(sub)[0] || [];
      return filesInSub.length !== firstSectionCount;
    });

    if (hasUnequalSubsections) {
        setFormData((prev)=>({...prev, settings:{...prev.settings, ["isPlot"]: false}}))
    }
    try {
      const payload = new FormData();

      payload.append("algorithm", formData.algorithm);
      payload.append("settings", JSON.stringify(formData.settings));
      payload.append("multi", String(formData.multi));
      

      if (formData.baseText) {
        payload.append("base_text", formData.baseText);
      }

      if (formData.multi) {
        // 1. Serialize the subsection folder mapping structure (names & file lists)
        const metadata = formData.subsections.map((sub) => {
          const key = Object.keys(sub)[0];
          return { [key]: sub[key].map((f) => f.name) };
        });
        payload.append("subsections_metadata", JSON.stringify(metadata));

        // 2. Append all actual files from all subsections
        formData.subsections.forEach((sub) => {
          const key = Object.keys(sub)[0];
          sub[key].forEach((file) => {
            payload.append("files", file);
          });
        });
      } else {
        // Append files directly in single mode
        formData.files.forEach((file) => {
          payload.append("files", file);
        });
      }

      const response = await fetch("http://127.0.0.1:8000/api/process", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Processing failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      if (data.job_id) {
        setJobId(data.job_id);
      }
      setResults(data);
      handleStepChange(currentStep+1); // Advance step after successful run
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsProcessing(false);
      
    }
  };

  const handlePlot = async () => {
    if (formData.files.length>3 || formData.settings.isPlot==true){
      setIsProcessing(true);
      
      if (!jobId) {
        console.error("No processed job available to plot");
        return;
      }

      
      try {
        // Simply point an iframe or fetch directly from the plot endpoint
        const plotEndpoint = `http://127.0.0.1:8000/api/plot/${jobId}`;
        setPlotUrl(plotEndpoint);
      } finally {
        setIsProcessing(false);
        handleStepChange(4)
      }
    }
  };

  const handleDownload = async () => {
    window.location.href = `http://127.0.0.1:8000/api/sheet/${jobId}`;
  }

  const totalFilesCount = formData.multi
    ? formData.subsections.reduce(
        (acc, sub) => acc + Object.values(sub)[0].length,
        0,
      )
    : formData.files.length;

  return (
    <div className="bg-white w-screen h-screen flex flex-col items-center place-content-center content-center justify-items-center justify-content-center">
      <div className="w-[82dvw] h-[82dvh] p-6 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col justify-between">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
            <button
              type="button"
              onClick={() => handleStepSkip(1)}
              className={`${furthestStep >= 1 ? "cursor-pointer" : ""} ${
                currentStep >= 1 ? "text-cyan-600 font-bold" : ""
              }`}
            >
              Upload Files
            </button>
            <button
              type="button"
              onClick={() => handleStepSkip(2)}
              className={`${furthestStep >= 2 ? "cursor-pointer" : ""} ${
                currentStep >= 2 ? "text-cyan-600 font-bold" : ""
              }`}
            >
              Select Algorithm
            </button>
            <button
              type="button"
              onClick={() => handleStepSkip(3)}
              className={`${furthestStep >= 3 ? "cursor-pointer" : ""} ${
                currentStep >= 3 ? "text-cyan-600 font-bold" : ""
              }`}
            >
              View Alignment
            </button>
            <button
              type="button"
              onClick={() => handleStepSkip(4)}
              className={`${furthestStep >= 4 ? "cursor-pointer" : ""} ${
                currentStep >= 4 ? "text-cyan-600 font-bold" : ""
              }`}
            >
              View Plot
            </button>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-600 h-2 transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* STEP 1: UPLOAD FILES */}
        {currentStep === 1 && (
          <div className="flex flex-col justify-between h-[65dvh]">
            <h2 className="text-3xl font-bold text-gray-800">
              Upload Transcription Files or Folders
            </h2>

            {formData.multi === null && (
              <div className="h-full place-content-start">
                <h1 className="text-2xl pt-12 font-semibold text-cyan-600 overflow-wrap">
                  Welcome to the TEXTEVOLVE Data Analysis tool. <br />
                  <br />
                  Please begin by selecting whether you want to compare{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, multi: false }))
                    }
                    className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
                  >
                    entire texts
                  </button>{" "}
                  or{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, multi: true }))
                    }
                    className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
                  >
                    subsections of texts
                  </button>
                  .
                </h1>
              </div>
            )}

            {/* SUBSECTION MULTI-FILE MODE */}
            {formData.multi === true && (
              <div className="flex flex-col gap-4 w-full h-[50dvh]">
                {/* TOP TREE PANEL */}
                <div className="border-2 border-dashed border-gray-300 flex-col overflow-auto h-[28dvh] p-4 text-gray-500 w-full rounded-lg bg-gray-50 flex items-start justify-start">
                  {/* Subsection Form & Tools */}
                  <div className="flex flex-row justify-between items-center w-full pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <p className="text-md font-bold text-cyan-800">
                        Subsections Tree
                      </p>
                      {formData.subsections.length > 0 && (
                        <select
                          value={targetSubsection}
                          onChange={(e) => setTargetSubsection(e.target.value)}
                          className="text-xs bg-white border border-gray-300 rounded p-1 text-cyan-800"
                        >
                          {formData.subsections.map((sub, i) => {
                            const name = Object.keys(sub)[0];
                            return (
                              <option key={i} value={name}>
                                Target: {name}
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>

                    {/* Subsection Creator */}
                    <div className="flex flex-row gap-2 items-center">
                      <div className="cursor-text rounded-md shadow-sm flex flex-row items-center px-2 py-0.5 text-cyan-700 bg-white border border-gray-200">
                        <input
                          type="text"
                          placeholder={`Default: Subsection ${count}`}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          className="outline-none border-none appearance-none p-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleSubsection}
                          className="hover:bg-cyan-50 rounded-full text-cyan-800"
                        >
                          <CirclePlus className="w-5 h-5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            subsections: [],
                            baseText: null,
                          }))
                        }
                        className="hover:bg-gray-200/70 p-1 rounded-sm text-red-600 font-bold cursor-pointer flex flex-row items-center gap-1 text-xs"
                      >
                        <p>Clear All</p>
                        <Eraser className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Base Text Info */}
                  <div className="text-xs font-bold text-cyan-800 my-2">
                    Base Text:{" "}
                    <span className="font-normal text-gray-600">
                      {formData.baseText != null
                        ? formData.baseText.name
                        : "None"}
                    </span>
                  </div>

                  {/* FOLDER & FILE HIERARCHY TREE */}
                  <div className="w-full overflow-y-auto pr-1">
                    {formData.subsections.length > 0 ? (
                      formData.subsections.map((item, subIndex) => {
                        const sectionName = Object.keys(item)[0];
                        const files = item[sectionName] || [];

                        return (
                          <div
                            key={`${sectionName}-${subIndex}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, sectionName)}
                            className={`mb-2 p-2 border rounded-md bg-white shadow-xs transition-all ${
                              targetSubsection === sectionName
                                ? "border-cyan-500 ring-1 ring-cyan-400"
                                : "border-gray-200 hover:border-cyan-300"
                            }`}
                          >
                            <div className="flex items-center justify-between border-b pb-1 mb-1">
                              <div className="flex items-center gap-2 font-bold text-cyan-900 text-sm">
                                <FolderOpen className="w-4 h-4 text-cyan-600" />
                                <span>{sectionName}</span>
                                <span className="text-xs text-gray-400 font-normal">
                                  ({files.length}{" "}
                                  {files.length === 1 ? "file" : "files"})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setTargetSubsection(sectionName)}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  targetSubsection === sectionName
                                    ? "bg-cyan-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {targetSubsection === sectionName
                                  ? "Selected Target"
                                  : "Set Target"}
                              </button>
                            </div>

                            {/* Indented File List */}
                            {files.length > 0 ? (
                              <ul className="pl-4 space-y-1">
                                {files.map((file, fileIndex) => (
                                  <li
                                    key={`${file.name}-${fileIndex}`}
                                    draggable
                                    onDragStart={(e) =>
                                      handleDragStart(e, sectionName, fileIndex)
                                    }
                                    className={`flex items-center justify-between px-2 py-1 rounded border text-xs cursor-grab active:cursor-grabbing ${
                                      file === formData.baseText
                                        ? "bg-cyan-100/60 border-cyan-300"
                                        : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          baseText: file,
                                        }))
                                      }
                                      className="bg-transparent text-cyan-600 w-[43dvh] rounded-lg flex-row flex gap-2 content-center items-center shrink-0 cursor-pointer"
                                    >
                                      {file == formData.baseText ? (
                                        <FileCheck className="w-8 h-8" />
                                      ) : (
                                        <FileText className="w-8 h-8" />
                                      )}
                                <p className="text-md font-medium text-cyan-800 ">
                                  {file.name}
                                </p>
                              </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeFileFromSection(sectionName, file)
                                      }
                                      className="text-red-600 hover:bg-red-50 p-0.5 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="pl-4 text-xs italic text-gray-400 py-1">
                                
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-400 italic py-2 text-center">
                        No subsections created. Add a subsection above to begin
                        organizing.
                      </p>
                    )}
                  </div>
                </div>

                {/* BOTTOM DROPZONE */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed border-gray-300 h-[18dvh] w-full rounded-lg p-4 text-center bg-gray-50 transition flex flex-col place-content-center place-items-center ${
                    isDragReject
                      ? "border-red-500 text-red-600 bg-red-50"
                      : isDragActive
                        ? "border-cyan-500 text-cyan-600 bg-cyan-50"
                        : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  <label className="block cursor-pointer">
                    <svg
                      className="mx-auto h-8 w-8 text-cyan-800 mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <input
                      type="file"
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      onChange={handleFolderUpload}
                      className="hidden"
                      ref={folderInput}
                    />
                    <p className="font-semibold text-cyan-600 text-sm">
                      Drag & Drop Files Here or Click to Browse{" "}
                      <button
                        type="button"
                        onClick={openFilePicker}
                        className="underline underline-offset-2 hover:text-cyan-700 focus:outline-none"
                      >
                        Files
                      </button>{" "}
                      or{" "}
                      <button
                        type="button"
                        onClick={() => folderInput.current?.click()}
                        className="underline underline-offset-2 hover:text-cyan-700 focus:outline-none"
                      >
                        Folders
                      </button>
                    </p>
                    <p className="text-gray-400 text-xs">
                      Targeting:{" "}
                      <span className="font-semibold text-cyan-800">
                        {targetSubsection || "Default Subsection"}
                      </span>
                    </p>
                  </label>
                </div>
              </div>
            )}

            {/* SINGLE MODE standard upload */}
            {formData.multi === false && (
              <div className="flex flex-row justify-between gap-6 pt-4 w-full h-[48dvh]">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed border-gray-300 h-full w-1/2 rounded-lg p-8 text-center bg-gray-50 transition flex place-content-center place-items-center ${
                    isDragReject
                      ? "border-red-500 text-red-600 bg-red-50"
                      : isDragActive
                        ? "border-gray-300 text-gray-600 bg-gray-100"
                        : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  <label className="block">
                    <svg
                      className="mx-auto h-12 w-12 text-cyan-800"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <input
                      type="file"
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      onChange={handleFolderUpload}
                      className="hidden"
                      ref={folderInput}
                    />
                    <p className="font-semibold text-center text-cyan-600 text-xl">
                      Drag and Drop Here <br />
                      or Click to Browse{" "}
                      <button
                        type="button"
                        onClick={openFilePicker}
                        className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none"
                      >
                        Files
                      </button>{" "}
                      or{" "}
                      <button
                        type="button"
                        onClick={() => folderInput.current?.click()}
                        className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none"
                      >
                        Folders
                      </button>
                    </p>
                    <p className="text-gray-500 text-center text-md">
                      Only upload files you want aligned.
                    </p>
                  </label>
                </div>

                <div className="border-2 border-dashed border-gray-300 flex-col overflow-auto h-full p-4 text-gray-500 w-1/2 rounded-lg bg-gray-50 flex">
                  {formData.files.length > 0 && (
                    <ul>
                      <div className="flex flex-row items-center justify-between w-full pb-2">
                        <p className="text-lg font-bold text-cyan-800">
                          Base Text:{" "}
                          {formData.baseText != null
                            ? formData.baseText.name
                            : "None"}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              files: [],
                              baseText: null,
                            }))
                          }
                          className="text-red-600 font-bold flex items-center gap-1 hover:bg-gray-200/70 p-1 rounded"
                        >
                          <span>Clear All</span>
                          <Eraser className="w-5 h-5" />
                        </button>
                      </div>
                      {formData.files.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className={`flex items-center justify-between p-2 mb-1 rounded border ${
                            file === formData.baseText
                              ? "bg-cyan-100/60 border-cyan-300"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    baseText: file,
                                  }))
                                }
                                className="bg-transparent text-cyan-600 w-[43dvh] rounded-lg flex-row flex gap-2 content-center items-center shrink-0 cursor-pointer"
                              >
                                {file == formData.baseText ? (
                                  <FileCheck className="w-8 h-8" />
                                ) : (
                                  <FileText className="w-8 h-8" />
                                )}
                                <p className="text-md font-medium text-cyan-800 ">
                                  {file.name}
                                </p>
                              </button>
                          <button
                            type="button"
                            onClick={() => removeFile(file)}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Step Controls */}
            <div className="flex flex-row justify-between items-center pt-2 border-t">
              <button
                onClick={() =>
                  setFormData((prev) => ({ ...prev, multi: null }))
                }
                className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                disabled={totalFilesCount === 0}
                onClick={() => handleStepChange(2)}
                className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        {/* select algorithm */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-gray-700 pt-10 ">
              Select Algorithm
            </h2>

            <div className="space-y-1 h-[55dvh] flex  w-10/10 pt-5">
              <div className="flex flex-row content-between">
                <div className="flex flex-col content-center items-center gap-2 w-[25dvw]">
                  {/* <label className="block text-2xl font-medium text-gray-700 mb-1">Select Algorithm</label> */}
                  <div className="flex flex-col gap-2 pt-2 w-full">
                    {/* Label */}
                    <label
                      htmlFor="algorithm"
                      className="block text-md font-medium text-gray-700 place-content-start"
                    >
                      Choose an Algorithm
                    </label>

                    {/* Select Container with Custom Arrow */}
                    <div className="relative ">
                      <select
                        id="algorithm"
                        className="block w-full pl-3 pr-10 py-2 text-base outline-none border-none  bg-white  rounded-md shadow-md appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70
                     rounded-md   cursor-pointer transition-colors"
                        defaultValue={formData.algorithm}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            algorithm: e.target.value,
                          }))
                        }
                      >
                        <option disabled value="" className="text-gray-400/20">
                          Select an Algorithm
                        </option>
                        <option value="ndw" className="text-gray-800">
                          Needleman-Wunsch Algorithm
                        </option>
                        <option value="sw" className="text-gray-800">
                          Smith-Waterman Algorithm
                        </option>
                      </select>

                      {/* Custom Dropdown Chevron Icon */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Needleman-Wunsch Settings */}
                    {(formData.algorithm === "ndw" ||
                      formData.algorithm === "sw") && (
                      <div className="flex flex-row gap-3 content-center">
                        <div className="w-4/10">
                          {/* Match Bonus*/}
                          <div className="flex justify-between items-center text-md font-medium text-gray-700">
                            <label htmlFor="matchBonus">Match Bonus</label>
                          </div>

                          <input
                            id="matchBonus"
                            type="number"
                            value={formData.settings.matchBonus}
                            onChange={(e) =>
                              handleSettingChange(
                                "matchBonus",
                                Number(e.target.value),
                              )
                            }
                            className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
                          />

                          {/* Gap Penalty */}
                          <div className="flex justify-between items-center text-md font-medium text-gray-700">
                            <label htmlFor="gapPenalty">Gap Penalty</label>
                          </div>

                          <input
                            id="gapPenalty"
                            type="number"
                            value={-formData.settings.gapPenalty}
                            onChange={(e) =>
                              handleSettingChange(
                                "gapPenalty",
                                Number(-e.target.value),
                              )
                            }
                            className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
                          />

                          {/* Mismatch Penalty */}
                          <div className="flex justify-between items-center text-md font-medium text-gray-700">
                            <label htmlFor="mismatchPenalty">
                              Mismatch Penalty
                            </label>
                          </div>

                          <input
                            id="mismatchPenalty"
                            type="number"
                            value={-formData.settings.mismatchPenalty}
                            onChange={(e) =>
                              handleSettingChange(
                                "mismatchPenalty",
                                Number(-e.target.value),
                              )
                            }
                            className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
                          />
                          {formData.algorithm === "ndw" && (
                            <div>
                              {/* Affine Gap Penalty */}
                              <div className="flex justify-between items-center text-md font-medium text-gray-700">
                                <label htmlFor="affinePenalty">
                                  Affine Penalty
                                </label>
                              </div>

                              <input
                                id="affinePenalty"
                                type="number"
                                value={-formData.settings.affinePenalty}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "affinePenalty",
                                    Number(-e.target.value),
                                  )
                                }
                                className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
                              />
                            </div>
                          )}
                        </div>
                        <div className="w-6/10">
                          {/* Optional Special Character Bonus */}
                          {/* Label */}
                          <label
                            htmlFor="special"
                            className="block text-md font-medium text-gray-700 place-content-start"
                          >
                            Optional Special Character Bonus
                          </label>

                          {/* Select Container with Custom Arrow */}
                          <div className="relative">
                            <select
                              id="special"
                              className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm cursor-pointer transition-colors"
                              value={formData.settings.special.join(",")}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                  handleSettingChange("special", []);
                                  handleSettingChange("specialOther", false);
                                } else if (val === "Other") {
                                  handleSettingChange("special", ["Other"]);
                                  handleSettingChange("specialOther", true);
                                } else {
                                  // Split the comma-separated value string into a clean array
                                  handleSettingChange(
                                    "special",
                                    val.split(","),
                                  );
                                  handleSettingChange("specialOther", false);
                                }
                              }}
                            >
                              <option value="" className="text-gray-400/20">
                                None
                              </option>
                              {/* Pass standard comma-separated strings as values */}
                              <option
                                value="ך,ם,ן,ף,ץ"
                                className="text-gray-800"
                              >
                                Sofit Letters
                              </option>
                              <option
                                value="A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z"
                                className="text-gray-800"
                              >
                                Capital Letters (Latin Alphabet)
                              </option>
                              <option value="Other" className="text-gray-800">
                                Custom
                              </option>
                            </select>
                            {/* Custom Dropdown Chevron Icon */}
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>

                          {formData.settings.specialOther === true && (
                            <div>
                              <label
                                htmlFor="otherSpecial"
                                className="block pt-2 text-md font-medium text-gray-700 place-content-start"
                              >
                                Enter a space-separated list of characters.
                              </label>
                              <input
                                type="text"
                                id="otherSpecial"
                                onChange={(e) =>
                                  handleSettingChange(
                                    "special",
                                    e.target.value.split(" "),
                                  )
                                }
                                value={
                                  formData.settings.special.includes("Other") 
                                  ? ""
                                  : formData.settings.special.join(" ")

                                }
                                placeholder="1 2 3"
                                className="shadow-md pt-2 w-full text-gray-700 focus:shadow-gray-700/70 outline-none border-none appearance-none p-1"
                              />
                            </div>
                          )}
                          <div className="pt-2">
                            {formData.settings.special.includes("Other") ===
                              false && (
                              <label
                                className="pt-2 text-cyan-700"
                              >
                                {formData.settings.special.join(" ")}
                              </label>
                            )}
                          </div>

                          {formData.settings.special?.length > 0 && (
                            <div>
                              <div className="flex justify-between items-center text-md  font-medium text-gray-700">
                                <label htmlFor="specialBonus" className="pt-2">
                                  Special Character Bonus
                                </label>
                              </div>

                              <input
                                id="specialBonus"
                                type="number"
                                value={formData.settings.specialBonus}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "specialBonus",
                                    Number(e.target.value),
                                  )
                                }
                                className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
                              />

                              <div className="flex justify-between items-center text-md  font-medium text-gray-700">
                                <label htmlFor="specialGap" className="pt-2">
                                  Special Character Gap Penalty
                                </label>
                              </div>

                              <input
                                id="specialGap"
                                type="number"
                                value={-formData.settings.specialGap}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "specialGap",
                                    Number(-e.target.value),
                                  )
                                }
                                className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
                              />

                              <div className="flex justify-between items-center text-md  font-medium text-gray-700">
                                <label
                                  htmlFor="specialMismatch"
                                  className="pt-2"
                                >
                                  Special Character Mismatch Penalty
                                </label>
                              </div>

                              <input
                                id="specialMismatch"
                                type="number"
                                value={-formData.settings.specialMismatch}
                                onChange={(e) =>
                                  handleSettingChange(
                                    "specialMismatch",
                                    Number(-e.target.value),
                                  )
                                }
                                className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* {formData.algorithm!="" && (
                    <div className="w-[50dvh] h-[50dvh] border-2"></div>
                  )} */}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => handleStepChange(1)}
                className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition"
              >
                {isProcessing ? "Processing..." : "Run Algorithm"}
              </button>
            </div>
          </div>
        )}
        {currentStep === 3 && (
          <div className="flex h-95/100 self-start place-content-start w-full">
          <div className="flex flex-col justify-between place-content-start pt-4  w-full">
            <h1 className="text-4xl w-5/10 font-bold text-gray-700 pt-10 pb-2">
              {formData.algorithm == "ndw"
                ? "Needleman-Wunsch"
                : "Smith-Waterman"}{" "}
              Alignment
            </h1>
          <div className="flex-row overflow-auto place-content-start place-items-start h-full place-self-start w-max flex pt-5 ">
            
            <div className="w-max ">
            <p className="text-gray-800 whitespace-pre-wrap text-justify font-mono">{results.output_logs}</p>
            </div>
            </div>
            <div className="flex flex-row justify-between content-start">
            <button
              onClick={() => handleStepChange(2)}
              className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={handlePlot}
              disabled={isProcessing||formData.settings.isPlot==false}
              className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition"
            >
              {isProcessing ? "Processing..." : "Run Algorithm"}
            </button>
            </div>
          </div>
          </div>
        )}
        {currentStep === 4 && (
          <div className="flex content-start h-full pt-10 flex-col pt-4">
            <h1 className="text-4xl w-5/10 font-bold text-gray-700 pt-10 pb-2">
              {formData.algorithm == "ndw"
                ? "Needleman-Wunsch"
                : "Smith-Waterman"}{" "}
              Plot
            </h1>
            <iframe
              src={plotUrl}
              className="w-full h-full border-none"
              title="t-SNE Plot"
            />
            <div className="w-full flex justify-between content-start flex-row">
            <button
              onClick={() => handleStepChange(3)}
              className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg w-max hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
            >
              Download Matrix as Spreadsheet
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// "use client";

// import { useState, useRef } from "react";
// import { v4 } from "uuid";
// import {
//   FileText,
//   Trash2,
//   Shredder,
//   Eraser,
//   FileCheck,
//   CirclePlus,
// } from "lucide-react";
// import { Range } from "react-range";
// import { useDropzone } from "react-dropzone";

// export default function Pages() {
//   const [currentStep, setCurrentStep] = useState(1);

//   const [furthestStep, setFurthestStep] = useState(1);

//   // Global Form State
//   const [formData, setFormData] = useState({
//     multi: null as Boolean | null,
//     files: [],
//     algorithm: "",
//     baseText: null as File | null,
//     settings: {
//       gapPenalty: -1,
//       matchBonus: 5,
//       mismatchPenalty: -1,
//       special: [],
//       specialOther: false,
//       specialBonus: 10,
//       specialGap: -1,
//       specialMismatch: -1,
//       affinePenalty: -0.5,
//     },
//   });

//   const [count, setCount] = useState(1);

//   const [isProcessing, setIsProcessing] = useState(false);
//   const [results, setResults] = useState(null);

//   const handleSubmit = async () => {
//     setIsProcessing(true);

//     try {
//       const payload = new FormData();

//       // 1. Append scalar string
//       payload.append("algorithm", formData.algorithm);

//       // 2. Append single file (baseText)
//       if (formData.baseText) {
//         payload.append("base_text", formData.baseText);
//       }

//       // 3. Append multiple files (files array)
//       formData.files.forEach((file) => {
//         payload.append("files", file); // Use the same key 'files' for each item
//       });

//       // 4. Append nested object by serializing to JSON string
//       payload.append("settings", JSON.stringify(formData.settings));

//       const response = await fetch("http://localhost:8000/api/process", {
//         method: "POST",
//         body: payload, // Browser automatically sets dynamic multipart boundary
//       });

//       const data = await response.json();
//       setResults(data);
//     } catch (error) {
//       console.error("Error submitting form:", error);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const folderInput = useRef<HTMLInputElement | null>(null);

//   // React Dropzone File Uload Handler

//   const {
//     acceptedFiles,
//     getRootProps,
//     getInputProps,
//     open: openFilePicker,
//     isDragActive,
//     isDragReject,
//   } = useDropzone({
//     onDrop: (acceptedFiles, ) => {
//       if (formData.multi == false) {
//         setFormData((prev) => {
//           const existingKeys = new Set(
//             prev.files.map((f) => `${f.name}-${f.size}`),
//           );

//           const newFiles = acceptedFiles.filter(
//             (file) => !existingKeys.has(`${file.name}-${file.size}`),
//           );

//           return {
//             ...prev,
//             files: [...prev.files, ...newFiles],
//           };
//         });
//       } else if (formData.multi == true) {
//         setFormData((prev) => {
//           const subsectionObj =
//             currentTarget.getAttribute("subsection-obj");
//           const [subsection, filesList] = Object.entries(subsectionObj)[0];
//           const existingKeys = new Set(
//             filesList.map((f) => `${f.name}-${f.size}`),
//           );
//           const newFiles = uploadedFiles.filter(
//             (file) => !existingKeys.has(`${file.name}-${file.size}`),
//           );
//           const theseFiles = prev.files.filter()
//           return {
//             ...prev,
//             files: [...prev.files, { [subsection]: [newFiles, filesList] }],
//           };
//         });
//       }
//     },
//     accept: { "*txt": [] },
//     multiple: true,
//     noClick: true,
//   });

//   const removeFile = (file: File) => {
//     setFormData((prev) => ({
//       ...prev,
//       files: prev.files.filter((f) => f !== file),
//     }));
//   };

//   const handleMultiFolder = (subsectionObject, folder) => {
//     const uploadedFiles = Array.from(folder.target.files).filter((file) =>
//       file.name.endsWith(".txt"),
//     );

//     const [subsection, filesList] = Object.entries(subsectionObject)[0];

//     setFormData((prev) => {
//       const existingKeys = new Set(filesList.map((f) => `${f.name}-${f.size}`));
//       const newFiles = uploadedFiles.filter(
//         (file) => !existingKeys.has(`${file.name}-${file.size}`),
//       );
//       return {
//         ...prev,
//         files: [...prev.files, { [subsection]: [newFiles, filesList] }],
//       };
//     });
//   };
//   // Handle Folder Upload (OLD)
//   const handleFolderUpload = (e) => {
//     const uploadedFiles = Array.from(e.target.files).filter((file) =>
//       file.name.endsWith(".txt"),
//     );
//     // setFormData((prev) => ({ ...prev, files: uploadedFiles }));
//     setFormData((prev) => {
//       const existingKeys = new Set(
//         prev.files.map((f) => `${f.name}-${f.size}`),
//       );

//       const newFiles = uploadedFiles.filter(
//         (file) => !existingKeys.has(`${file.name}-${file.size}`),
//       );

//       return {
//         ...prev,
//         files: [...prev.files, newFiles],
//       };
//     });
//   };

//   const handleSettingChange = (field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       settings: { ...prev.settings, [field]: value },
//     }));
//     console.log(field, value);
//   };

//   // Run Algorithm (Simulated)
//   const handleRunAlgorithm = () => {
//     setIsProcessing(true);
//     // Simulate processing time / API call
//     setTimeout(() => {
//       setResults({
//         summary: `Successfully processed ${formData.files.length} file(s) using ${formData.algorithm.toUpperCase()}.`,
//         data: [],
//       });
//       setIsProcessing(false);
//       handleStepChange(3);
//     }, 1500);
//   };

//   const handleStepSkip = (step: number) => {
//     if (step <= furthestStep) {
//       setCurrentStep(step);
//     }
//   };

//   const handleStepChange = (step: number) => {
//     if (step > furthestStep) {
//       setFurthestStep(step);
//     }
//     if (step != currentStep) {
//       setCurrentStep(step);
//     }
//   };

//   const [inputValue, setInputValue] = useState<string>("");

//   const handleSubsection = () => {
//     const textToAdd =
//       inputValue.trim() !== "" ? inputValue.trim() : `Subsection ${count}`;
//     if (textToAdd.includes("Subsection")){
//       setCount((prev) => prev + 1);
//     }

//     setFormData((prev) => ({
//       ...prev,
//       files: [...prev.files, { [textToAdd]: [] }],
//     }));
//   };

//   return (
//     <div className="bg-white w-screen h-screen flex flex-col items-center place-content-center content-center justify-items-center justify-content-center">
//       <div className="w-[82dvw] h-[82dvh] p-6 bg-white rounded-xl shadow-md border border-gray-100">
//         {/* Progress Bar */}
//         <div className="mb-8">
//           <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
//             <button
//               type="button"
//               onClick={() => handleStepSkip(1)}
//               className={`${furthestStep >= 1 ? "cursor-pointer" : ""} ${currentStep >= 1 ? "text-cyan-600 font-bold" : ""}`}
//             >
//               Upload Files
//             </button>
//             <button
//               type="button"
//               onClick={() => handleStepSkip(2)}
//               className={`${furthestStep >= 2 ? "cursor-pointer" : ""} ${currentStep >= 2 ? "text-cyan-600 font-bold" : ""}`}
//             >
//               Select Algorithm
//             </button>
//             <button
//               type="button"
//               onClick={() => handleStepSkip(3)}
//               className={`${furthestStep >= 3 ? "cursor-pointer" : ""} ${currentStep >= 3 ? "text-cyan-600 font-bold" : ""}`}
//             >
//               View Alignment
//             </button>
//             <button
//               type="button"
//               onClick={() => handleStepSkip(4)}
//               className={`${furthestStep >= 4 ? "cursor-pointer" : ""} ${currentStep >= 4 ? "text-cyan-600 font-bold" : ""}`}
//             >
//               View Plot
//             </button>
//           </div>
//           <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
//             <div
//               className="bg-cyan-600 h-2 transition-all duration-300"
//               style={{ width: `${(currentStep / 4) * 100}%` }}
//             ></div>
//           </div>
//         </div>

//         {/* upload folder */}
//         {currentStep === 1 && (
//           <div className="space-y-6 h-[52dvh]">
//             <h2 className="text-4xl font-bold text-gray-800 pt-10 ">
//               Upload Transcription Files or a Folder of Transcriptions
//             </h2>
//             {/* upload folder */}
//             {formData.multi == null && (
//               <div className="h-full place-content-start">
//                 <h1 className="text-3xl pt-20 font-semibold text-cyan-600 overflow-wrap">
//                   Welcome to the TEXTEVOLVE Data Analysis tool. <br />
//                   <br />
//                   Please begin by selecting whether you want to compare{" "}
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setFormData((prev) => ({ ...prev, multi: false }))
//                     }
//                     className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                   >
//                     entire texts
//                   </button>{" "}
//                   or{" "}
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setFormData((prev) => ({ ...prev, multi: true }))
//                     }
//                     className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                   >
//                     subsections of texts
//                   </button>
//                   .
//                 </h1>
//               </div>
//             )}

//             <div className="h-full place-content-start flex pt-[4dvh] flex-col ">
//               {/* <div className="border-2 border-dashed border-gray-300 h-[50dvh]  w-[50dvh] rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition flex place-content-center place-items-center"> */}

//               {/* <p className="mt-2 text-xl text-gray-600">
//                   <span className="font-semibold text-cyan-600">Click to select folder</span>
//                 </p>
//                 <p className="text-md text-gray-500 mt-1">Only .txt files will be processed</p> */}

//               {formData.multi == true && (

//                 <div className="flex text-center place-content-center place-items-center pl-20 pr-20 pt-[2dvh] w-10/10 pb-[2dvh]">
//                   <div className="border-2 border-dashed border-gray-300 flex-col h-[50dvh] items-center content-center w-[70dvw] rounded-lg p-8 text-center bg-gray-50  transition flex">
//                     <div className="flex flex-col  overflow-auto text-center">
//                       <p className="justify-start items-start content-start text-start text-lg font-bold text-cyan-800 pb-2 pl-1">
//                         Enter the name of a subsection
//                       </p>
//                       <div className="w-full cursor-text rounded-md shadow-md pt-2 flex flex-row content-center justify-between p-2 text-cyan-700 text-semibold focus:shadow-gray-700/70 bg-white">
//                         <input
//                           type="text"
//                           placeholder={`Default: Subsection ${count}`}
//                           onChange={(e) => setInputValue(e.target.value)}
//                           className=" outline-none border-none appearance-none p-1"
//                         />

//                         <button
//                           onClick={handleSubsection}
//                           className="hover:bg-cyan-50 rounded-full"
//                         >
//                           <CirclePlus className="w-8 h-8" />
//                         </button>
//                       </div>

//                       {formData.files.length > 0 && (
//                         <ul>
//                           <div className="flex flex-row items-center justify-between content-between ">
//                             <div className="justify-start items-start content-start text-start text-lg font-bold text-cyan-800">
//                               <p>
//                                 Base Text:{" "}
//                                 {formData.baseText != null
//                                   ? formData.baseText.name
//                                   : "None"}
//                               </p>
//                             </div>
//                             <div className="flex items-end justify-end content-end text-end  justify-content-end px-1 py-1 relative hover:bg-gray-200/70 rounded-sm text-red-600 text-lg">
//                               <button
//                                 type="button"
//                                 onClick={() =>
//                                   setFormData((prev) => ({
//                                     ...prev,
//                                     files: [],
//                                   }))
//                                 }
//                                 className="bg-transparent text-red-600 rounded-lg shrink-0 flex flex-row items-center font-bold cursor-pointer items-right"
//                               >
//                                 <p className="pr-3">Clear All</p>
//                                 <Eraser className="w-8 h-8" />
//                               </button>
//                             </div>
//                           </div>
//                           {formData.files.map((subsectionObj, i) => {
//                             const [subsection, filesList] =
//                               Object.entries(subsectionObj)[0];
//                             return (

//                               <div
//                               key={subsection||i}
//                                 {...getRootProps()}
//                                 className={`border-2 border-dashed border-gray-300 flex-col  items-center content-center  rounded-lg p-8 text-center bg-gray-50  transition flex
//                         ${
//                           isDragReject
//                             ? "border-red-500 text-red-600 bg-red-50"
//                             : isDragActive
//                               ? "border-gray-300 text-gray-600 bg-gray-100 border-gray-400"
//                               : ""
//                         }`}

//                               >
//                                 <input {...getInputProps()}
//                                 />
//                                 <div className="w-full place-content-start  text-left shadow-md p-2">
//                                 <h1 className="text-start text-md text-cyan-700">
//                                   {subsection}
//                                 </h1>
//                                 </div>
//                                 <label className="flex flex-col pt-2 items-center place-content-center content-center justify-center w-full">

//                                 <svg
//                                   className="mx-auto h-12 w-12 text-cyan-800"
//                                   fill="none"
//                                   stroke="currentColor"
//                                   viewBox="0 0 24 24"
//                                 >
//                                   <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth="2"
//                                     d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                                   />
//                                 </svg>
//                                 <input
//                                           type="file"
//                                           webkitdirectory="true"
//                                           directory="true"
//                                           multiple
//                                           onChange={(e) =>
//                                             handleMultiFolder(subsectionObj, e)
//                                           }
//                                           className="hidden"
//                                           ref={folderInput}
//                                         />
//                                         <div className="flex flex-col items-center justify-center text-center w-full my-1">
//                                         <p className="font-semibold text-cyan-600 text-xl flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center font-semibold text-cyan-600 text-xl leading-snug">
//                                           Drag and Drop Here or Click to Browse{" "}
//                                           <button
//                                             type="button"
//                                             onClick={openFilePicker}
//                                             className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                                           >
//                                             Files
//                                           </button>{" "}
//                                           or{" "}
//                                           <button
//                                             type="button"
//                                             onClick={() =>
//                                               folderInput.current?.click()
//                                             }
//                                             className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                                           >
//                                             Folders
//                                           </button>

//                                           <input />
//                                         </p>
//                                         </div>
//                                         <p className="text-gray-500 text-center text-md">
//                                           Only upload files you want aligned.
//                                         </p>
//                                         </label>

//                                 <ul>
//                                   {filesList.map((file, index) => (
//                                     <li
//                                       key={`${file.name}-${index}`}
//                                       className={`flex items-left justify-between px-1 py-1 relative w-[47dvh] hover:bg-gray-200/70 rounded-sm ${
//                                         file == formData.baseText
//                                           ? "bg-gray-300/55"
//                                           : "bg-gray-50"
//                                       }`}
//                                     >
//                                       {/* File Icon & Name */}
//                                       <div className="flex flex-col">
//                                         <div className="flex flex-row items-center gap-3 pt-1">
//                                           <button
//                                             type="button"
//                                             onClick={() =>
//                                               setFormData((prev) => ({
//                                                 ...prev,
//                                                 baseText: file,
//                                               }))
//                                             }
//                                             className="bg-transparent text-cyan-600 w-[43dvh] rounded-lg flex-row flex gap-2 content-center items-center shrink-0 cursor-pointer"
//                                           >
//                                             {file == formData.baseText ? (
//                                               <FileCheck className="w-8 h-8" />
//                                             ) : (
//                                               <FileText className="w-8 h-8" />
//                                             )}
//                                             <p className="text-md font-medium text-cyan-800 ">
//                                               {file.name}
//                                             </p>
//                                           </button>

//                                           <div className="absolute flex items-center inset-y-0 right-1">
//                                             <button
//                                               type="button"
//                                               onClick={() => removeFile(file)}
//                                               className="bg-transparent text-red-600 rounded-lg shrink-0 cursor-pointer items-right hover:bg-red-50"
//                                             >
//                                               <Trash2 className="w-8 h-8" />
//                                             </button>
//                                           </div>
//                                         </div>

//                                       </div>
//                                     </li>
//                                   ))}
//                                 </ul>
//                               </div>

//                             );
//                           })}
//                         </ul>
//                       )}

//                     </div>

//                     {/* </div> */}

//                     {/* View File Names and document icon */}
//                   </div>
//                   </div>

//               )}
//               {formData.multi == false && (
//                 <div className="flex flex-row justify-between pl-20 pr-20 pt-[4dvh] w-10/10">
//                   <div
//                     {...getRootProps()}
//                     className={`border-2 border-dashed border-gray-300 h-[50dvh]  w-[50dvh] rounded-lg p-8 text-center bg-gray-50  transition flex place-content-center place-items-center
//                   ${
//                     isDragReject
//                       ? "border-red-500 text-red-600 bg-red-50"
//                       : isDragActive
//                         ? "border-gray-300 text-gray-600 bg-gray-100 border-gray-400"
//                         : ""
//                   }`}
//                   >
//                     <input {...getInputProps()} />
//                     <label htmlFor="folder-upload" className="block">
//                       <svg
//                         className="mx-auto h-12 w-12 text-cyan-800"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth="2"
//                           d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                         />
//                       </svg>
//                       <input
//                         type="file"
//                         webkitdirectory="true"
//                         directory="true"
//                         multiple
//                         onChange={handleFolderUpload}
//                         className="hidden"
//                         ref={folderInput}
//                       />
//                       <p className="font-semibold text-center text-cyan-600 text-xl">
//                         Drag and Drop Here <br />
//                         or Click to Browse{" "}
//                         <button
//                           type="button"
//                           onClick={openFilePicker}
//                           className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                         >
//                           Files
//                         </button>{" "}
//                         or{" "}
//                         <button
//                           type="button"
//                           onClick={() => folderInput.current?.click()}
//                           className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                         >
//                           Folders
//                         </button>
//                         <input />
//                       </p>
//                       <p className="text-gray-500 ptext-center text-md">
//                         Only upload files you want aligned.
//                       </p>
//                     </label>
//                   </div>

//                   {/* </div> */}

//                   {/* View File Names and document icon */}

//                   <div className="border-2 border-dashed border-gray-300 flex-col overflow-auto  h-[50dvh] p-2 text-gray-500 w-[50dvh]  rounded-lg text-center bg-gray-50 flex place-content-top place-items-top ">
//                     {formData.files.length > 0 && (
//                       <ul>
//                         <div className="flex flex-row items-center justify-between content-between w-[47dvh]">
//                           <div className="justify-start items-start content-start text-start text-lg font-bold text-cyan-800">
//                             <p>
//                               Base Text:{" "}
//                               {formData.baseText != null
//                                 ? formData.baseText.name
//                                 : "None"}
//                             </p>
//                           </div>
//                           <div className="flex items-end justify-end content-end text-end  justify-content-end px-1 py-1 relative hover:bg-gray-200/70 rounded-sm text-red-600 text-lg">
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 setFormData((prev) => ({ ...prev, files: [] }))
//                               }
//                               className="bg-transparent text-red-600 rounded-lg shrink-0 flex flex-row items-center font-bold cursor-pointer items-right"
//                             >
//                               <p className="pr-3">Clear All</p>
//                               <Eraser className="w-8 h-8" />
//                             </button>
//                           </div>
//                         </div>
//                         {formData.files.map((file, index) => (
//                           <li
//                             key={`${file.name}-${index}`}
//                             className={`flex items-left justify-between px-1 py-1 relative w-[47dvh] hover:bg-gray-200/70 rounded-sm ${
//                               file == formData.baseText
//                                 ? "bg-gray-300/55"
//                                 : "bg-gray-50"
//                             }`}
//                           >
//                             {/* File Icon & Name */}
//                             <div className="flex flex-row items-center gap-3 pt-1">
//                               <button
//                                 type="button"
//                                 onClick={() =>
//                                   setFormData((prev) => ({
//                                     ...prev,
//                                     baseText: file,
//                                   }))
//                                 }
//                                 className="bg-transparent text-cyan-600 w-[43dvh] rounded-lg flex-row flex gap-2 content-center items-center shrink-0 cursor-pointer"
//                               >
//                                 {file == formData.baseText ? (
//                                   <FileCheck className="w-8 h-8" />
//                                 ) : (
//                                   <FileText className="w-8 h-8" />
//                                 )}
//                                 <p className="text-md font-medium text-cyan-800 ">
//                                   {file.name}
//                                 </p>
//                               </button>

//                               <div className="absolute flex items-center inset-y-0 right-1">
//                                 <button
//                                   type="button"
//                                   onClick={() => removeFile(file)}
//                                   className="bg-transparent text-red-600 rounded-lg shrink-0 cursor-pointer items-right hover:bg-red-50"
//                                 >
//                                   <Trash2 className="w-8 h-8" />
//                                 </button>
//                               </div>
//                             </div>
//                           </li>
//                         ))}
//                       </ul>
//                     )}
//                   </div>

//                 </div>

//               )}
//               {formData.multi==true && (
//                 <div className="flex flex-row justify-between items-center content-center">
//                     <button
//                       onClick={() =>
//                         setFormData((prev) => ({ ...prev, multi: null }))
//                       }
//                       className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
//                     >
//                       Back
//                     </button>
//                     <button
//                       disabled={(formData.files.length === 1 ) && (formData.files[0][Object.keys(formData.files[0])[0]].length ===0)}
//                       onClick={() => handleStepChange(2)}
//                       className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed relative transition"
//                     >
//                       Continue
//                     </button>
//                   </div>
//               )}
//               {formData.multi==false && (
//                 <div className="flex flex-row justify-between items-center content-center">
//               <button
//                 onClick={() =>
//                   setFormData((prev) => ({ ...prev, multi: null }))
//                 }
//                 className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
//               >
//                 Back
//               </button>
//               <button
//                 disabled={formData.files.length === 0}
//                 onClick={() => handleStepChange(2)}
//                 className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed relative transition"
//               >
//                 Continue
//               </button>
//             </div>
//               )}
//             </div>

//           </div>
//         )}

//         {/* select algorithm */}
//         {currentStep === 2 && (
//           <div className="space-y-6">
//             <h2 className="text-4xl font-bold text-gray-700 pt-10 ">
//               Select Algorithm
//             </h2>

//             <div className="space-y-1 place-content-start h-[55dvh] flex  w-10/10 pt-5">
//               <div className="flex flex-row content-between">
//                 <div className="flex flex-col content-center items-center gap-2 w-[20dvw]">
//                   {/* <label className="block text-2xl font-medium text-gray-700 mb-1">Select Algorithm</label> */}
//                   <div className="flex flex-col gap-2 pt-2 w-full">
//                     {/* Label */}
//                     <label
//                       htmlFor="algorithm"
//                       className="block text-md font-medium text-gray-700 place-content-start"
//                     >
//                       Choose an Algorithm
//                     </label>

//                     {/* Select Container with Custom Arrow */}
//                     <div className="relative ">
//                       <select
//                         id="algorithm"
//                         className="block w-full pl-3 pr-10 py-2 text-base outline-none border-none  bg-white  rounded-md shadow-md appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70
//                      rounded-md   cursor-pointer transition-colors"
//                         defaultValue={formData.algorithm}
//                         onChange={(e) =>
//                           setFormData((p) => ({
//                             ...p,
//                             algorithm: e.target.value,
//                           }))
//                         }
//                       >
//                         <option disabled value="" className="text-gray-400/20">
//                           Select an Algorithm
//                         </option>
//                         <option value="ndw" className="text-gray-800">
//                           Needleman-Wunsch Algorithm
//                         </option>
//                         <option value="sw" className="text-gray-800">
//                           Smith-Waterman Algorithm
//                         </option>
//                       </select>

//                       {/* Custom Dropdown Chevron Icon */}
//                       <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
//                         <svg
//                           className="w-4 h-4"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M19 9l-7 7-7-7"
//                           />
//                         </svg>
//                       </div>
//                     </div>

//                     {/* Needleman-Wunsch Settings */}
//                     {(formData.algorithm === "ndw" ||
//                       formData.algorithm === "sw") && (
//                       <div className="">
//                         {/* Match Bonus*/}
//                         <div className="flex justify-between items-center text-md font-medium text-gray-700">
//                           <label htmlFor="matchBonus">Match Bonus</label>
//                         </div>

//                         <input
//                           id="matchBonus"
//                           type="number"
//                           value={formData.settings.matchBonus}
//                           onChange={(e) =>
//                             handleSettingChange(
//                               "matchBonus",
//                               Number(e.target.value),
//                             )
//                           }
//                           className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
//                         />

//                         {/* Gap Penalty */}
//                         <div className="flex justify-between items-center text-md font-medium text-gray-700">
//                           <label htmlFor="gapPenalty">Gap Penalty</label>
//                         </div>

//                         <input
//                           id="gapPenalty"
//                           type="number"
//                           value={-formData.settings.gapPenalty}
//                           onChange={(e) =>
//                             handleSettingChange(
//                               "gapPenalty",
//                               Number(-e.target.value),
//                             )
//                           }
//                           className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
//                         />

//                         {/* Mismatch Penalty */}
//                         <div className="flex justify-between items-center text-md font-medium text-gray-700">
//                           <label htmlFor="mismatchPenalty">
//                             Mismatch Penalty
//                           </label>
//                         </div>

//                         <input
//                           id="mismatchPenalty"
//                           type="number"
//                           value={-formData.settings.mismatchPenalty}
//                           onChange={(e) =>
//                             handleSettingChange(
//                               "mismatchPenalty",
//                               Number(-e.target.value),
//                             )
//                           }
//                           className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
//                         />

//                         {/* Optional Special Character Bonus */}
//                         {/* Label */}
//                         <label
//                           htmlFor="special"
//                           className="block text-md font-medium text-gray-700 place-content-start"
//                         >
//                           Optional Special Character Bonus
//                         </label>

//                         {/* Select Container with Custom Arrow */}
//                         <div className="relative">
//                           <select
//                             id="special"
//                             className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm cursor-pointer transition-colors"
//                             defaultValue=""
//                             onChange={(e) => {
//                               const val = e.target.value;
//                               if (!val) {
//                                 handleSettingChange("special", []);
//                                 handleSettingChange("specialOther", false);
//                               } else if (val === "Other") {
//                                 handleSettingChange("special", ["Other"]);
//                                 handleSettingChange("specialOther", true);
//                               } else {
//                                 // Split the comma-separated value string into a clean array
//                                 handleSettingChange("special", val.split(","));
//                                 handleSettingChange("specialOther", false);
//                               }
//                             }}
//                           >
//                             <option value="" className="text-gray-400/20">
//                               None
//                             </option>
//                             {/* Pass standard comma-separated strings as values */}
//                             <option value="ך,ם,ן,ף,ץ" className="text-gray-800">
//                               Sofit Letters
//                             </option>
//                             <option
//                               value="A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z"
//                               className="text-gray-800"
//                             >
//                               Capital Letters (Latin Alphabet)
//                             </option>
//                             <option value="Other" className="text-gray-800">
//                               Custom
//                             </option>
//                           </select>
//                           {/* Custom Dropdown Chevron Icon */}
//                           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
//                             <svg
//                               className="w-4 h-4"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M19 9l-7 7-7-7"
//                               />
//                             </svg>
//                           </div>
//                         </div>

//                         {formData.settings.specialOther === true && (
//                           <div>
//                             <label
//                               htmlFor="otherSpecial"
//                               className="block pt-2 text-md font-medium text-gray-700 place-content-start"
//                             >
//                               Enter a space-separated list of characters.
//                             </label>
//                             <input
//                               type="text"
//                               id="otherSpecial"
//                               onChange={(e) =>
//                                 handleSettingChange(
//                                   "special",
//                                   e.target.value.split(" "),
//                                 )
//                               }
//                               placeholder="1 2 3"
//                               className="shadow-md pt-2 w-full text-gray-700 focus:shadow-gray-700/70 outline-none border-none appearance-none p-1"
//                             />
//                           </div>
//                         )}
//                         <div className="pt-2">
//                           {formData.settings.special.includes("Other") ===
//                             false && (
//                             <label
//                               htmlFor="specialList"
//                               className="pt-2 text-cyan-700"
//                             >
//                               {formData.settings.special.join(" ")}
//                             </label>
//                           )}
//                         </div>

//                         {formData.settings.special?.length > 0 && (
//                           <div>
//                             <div className="flex justify-between items-center text-md  font-medium text-gray-700">
//                               <label htmlFor="specialBonus" className="pt-2">
//                                 Special Character Bonus
//                               </label>
//                             </div>

//                             <input
//                               id="specialBonus"
//                               type="number"
//                               value={formData.settings.specialBonus}
//                               onChange={(e) =>
//                                 handleSettingChange(
//                                   "specialBonus",
//                                   Number(e.target.value),
//                                 )
//                               }
//                               className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
//                             />

//                             <div className="flex justify-between items-center text-md  font-medium text-gray-700">
//                               <label htmlFor="specialGap" className="pt-2">
//                                 Special Character Gap Penalty
//                               </label>
//                             </div>

//                             <input
//                               id="specialGap"
//                               type="number"
//                               value={-formData.settings.specialGap}
//                               onChange={(e) =>
//                                 handleSettingChange(
//                                   "specialGap",
//                                   Number(-e.target.value),
//                                 )
//                               }
//                               className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
//                             />

//                             <div className="flex justify-between items-center text-md  font-medium text-gray-700">
//                               <label htmlFor="specialMismatch" className="pt-2">
//                                 Special Character Mismatch Penalty
//                               </label>
//                             </div>

//                             <input
//                               id="specialMismatch"
//                               type="number"
//                               value={-formData.settings.specialMismatch}
//                               onChange={(e) =>
//                                 handleSettingChange(
//                                   "specialMismatch",
//                                   Number(-e.target.value),
//                                 )
//                               }
//                               className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
//                             />
//                           </div>
//                         )}
//                       </div>
//                     )}
//                     {formData.algorithm === "ndw" && (
//                       <div>
//                         {/* Affine Gap Penalty */}
//                         <div className="flex justify-between items-center text-md font-medium text-gray-700">
//                           <label htmlFor="affinePenalty">Affine Penalty</label>
//                         </div>

//                         <input
//                           id="affinePenalty"
//                           type="number"
//                           value={-formData.settings.affinePenalty}
//                           onChange={(e) =>
//                             handleSettingChange(
//                               "affinePenalty",
//                               Number(-e.target.value),
//                             )
//                           }
//                           className="block w-full pl-3 pr-10 py-2 text-base bg-white rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md text-gray-700/60 focus:text-gray-700 focus:shadow-gray-700/70 sm:text-sm transition-colors"
//                         />
//                       </div>
//                     )}
//                     {/* {formData.algorithm!="" && (
//                     <div className="w-[50dvh] h-[50dvh] border-2"></div>
//                   )} */}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex justify-between pt-4">
//               <button
//                 onClick={() => handleStepChange(1)}
//                 className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
//               >
//                 Back
//               </button>
//               <button
//                 onClick={handleRunAlgorithm}
//                 disabled={isProcessing}
//                 className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition"
//               >
//                 {isProcessing ? "Processing..." : "Run Algorithm"}
//               </button>
//             </div>
//           </div>
//         )}
//         {currentStep === 3 && (
//           <div className="flex justify-between pt-4">
//             <button
//               onClick={() => handleStepChange(2)}
//               className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
//             >
//               Back
//             </button>
//             <button
//               onClick={() => handleStepChange(4)}
//               disabled={isProcessing}
//               className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition"
//             >
//               {isProcessing ? "Processing..." : "Run Algorithm"}
//             </button>
//           </div>
//         )}
//         {currentStep === 4 && (
//           <div className="flex justify-between pt-4">
//             <button
//               onClick={() => handleStepChange(3)}
//               className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
//             >
//               Back
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// {
//   /* // import Image from "next/image";
// // import FileUpload from './form/fileUpload/page';
// // import Settings from './form/settings/page'
// // import Results from './form/results/page'
// // import Link from 'next/link';
// // import { useState } from "react";

// // export default function Pages()  */
// }

// {
//   /* //   return (
// //     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
// //       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
// //         {/* <Image
// //           className="dark:invert"
// //           src="/next.svg"
// //           alt="Next.js logo"
// //           width={100}
// //           height={20}
// //           priority
// //         /> */
// }
// {
//   /* //         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
// //           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
// //             Welcome to TEXTEVOLVE.
// //           </h1>
// //           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
// //             To compare texts, start by creating a folder of transcriptions of the texts in the .txt file format.  Then, click {" "}
// //             <a */
// }
// {
//   /* //               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
// //               className="font-medium text-zinc-950 dark:text-zinc-50"
// //             >
// //               here
// //             </a>{" "}
// //             to begin.
// //           </p> */
// }
// {
//   /* //         </div>
// //       </main> */
// }
// {
//   /* //     </div>
// //   );
// // } */
// }
