"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Trash2,
  Eraser,
  FileCheck,
  CirclePlus,
  FolderOpen,
  Pencil,
} from "lucide-react";
import ReactDOM from "react-dom";
import { useDropzone } from "react-dropzone";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  PDFDownloadLink,
  usePDF,
  PDFViewer,
} from "@react-pdf/renderer";
import ReactPDF from "@react-pdf/renderer";
import { createTw } from "react-pdf-tailwind";
import NProgress from 'nprogress';

import { useWasmEngines } from "../hooks/useWasmEngines";



const download = require("downloadjs");

function SubsectionItem({
  sectionName,
  files,
  baseText,
  onDropFiles,
  onSetBaseText,
  onRemoveFile,
  onSelectFolderTrigger,
  onSelectFilesTrigger,
  onDragStartFile,
  onRemoveSubsection,
}) {
  // Each child gets its OWN useDropzone instance bound to its sectionName
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop: (acceptedFiles) => {
        onDropFiles(acceptedFiles, sectionName);
      },
      noClick: true,
    });

  return (
    <div
      {...getRootProps()}
      className={`p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-800 shadow-gray-600/40 shadow-xs transition-all hover:border-cyan-400 ${isDragReject
          ? "border-red-500 text-red-400 bg-red-50"
          : isDragActive
            ? "border-cyan-800 text-gray-600 bg-gray-600"
            : ""
        }`}
    >
      {/* Hidden dropzone input for file picker clicks */}
      <input {...getInputProps()} />

      {/* Header info */}
      <div className="flex items-center justify-between border-b pb-2 mb-2">
        <div className="flex items-center gap-2 font-bold text-cyan-50 text-[0.8rem]">
          <FolderOpen className="w-5 h-5 text-cyan-400" />
          <span>{sectionName}</span>

          <span className="text-[0.8rem] text-gray-300 font-normal">
            ({files.length} {files.length === 1 ? "file" : "files"})
          </span>
        </div>

        {/* Inline Upload Controls per subsection */}
        <div className="flex items-center gap-2 text-[0.8rem]">
          {/* File Upload Trigger */}
          <label
            className="cursor-pointer bg-cyan-700 hover:bg-cyan-800 text-cyan-100 font-semibold px-2 py-1 rounded border border-cyan-200 transition"
            onClick={(e) => e.stopPropagation()} // Stop dropzone trigger
          >
            + Files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onSelectFilesTrigger(e, sectionName)}
            />
          </label>

          {/* Folder Upload Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // Stop dropzone trigger
              onSelectFolderTrigger(sectionName);
            }}
            className="bg-cyan-700 hover:bg-cyan-800 text-cyan-100 font-semibold px-2 py-1 rounded border border-cyan-200 transition"
          >
            + Folder
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveSubsection(sectionName);
            }}
            className="text-red-400 hover:bg-gray-300 p-0.5 rounded flex flex-row gap-1 place-content-center"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* File Listing */}
      {files.length > 0 ? (
        <ul className="space-y-1 mt-2">
          {files.map((file, fileIndex) => (
            <li
              key={`${file.name}-${fileIndex}`}
              draggable
              onDragStart={(e) => onDragStartFile(e, sectionName, fileIndex)}
              className={`flex items-center justify-between px-2 py-1 rounded border text-[0.8rem] ${file.name === baseText
                  ? "bg-cyan-800/60 border-cyan-300"
                  : "bg-gray-700 border-gray-100 hover:bg-gray-600"
                }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetBaseText(file);
                }}
                className={`bg-transparent text-cyan-400 rounded-lg flex-row w-98/100 flex gap-2 content-center items-center shrink-0 cursor-pointer `}
              >
                {file.name === baseText ? (
                  <FileCheck className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                <p className="text-[0.8rem] font-medium text-cyan-100">
                  {file.name}
                </p>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(sectionName, file);
                }}
                className="text-red-400 hover:bg-gray-300 p-0.5 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-4 text-center border-1 border-dashed border-gray-200 rounded-md bg-gray-700/50 text-[0.8rem] text-gray-300">
          Drag and drop files or folders directly here
        </div>
      )}
    </div>
  );
}

export default function Pages() {



  const [currentStep, setCurrentStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);

  // Global Form State
  const [formData, setFormData] = useState({
    multi: null,
    files: [],
    subsections: {},
    algorithm: "",
    baseText: "",
    spreadsheet: null,
    settings: {
      gapPenalty: -1,
      matchBonus: 1,
      mismatchPenalty: -1,
      special: [],
      specialOther: false,
      specialBonus: 0,
      affinePenalty: 0,
      isPlot: false,
      spaceStrip: true,
    },
    plotSettings: {
      perplexity: 1,
      plotType: "",
      theta: 0.5,
      colors: "black",
      colorText: false,
    },
  });

  const [count, setCount] = useState(1);
  const [inputValue, setInputValue] = useState<string>("");
  const [targetSubsection, setTargetSubsection] = useState<string>("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [allResults, setAllResults] = useState([])
  
  const [prevBaseTexts, setPrevBaseTexts] = useState(new Set<string>())

  const [allBaseTexts, setAllBaseTexts] = useState([])

  const [showPrevious, setShowPrevious] = useState(false);

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
    if (!inputValue.trim()) {
      setCount((prev) => prev + 1);
    }
    // Check if section name already exists
    const exists = formData.subsections.hasOwnProperty(`${name}`);
    if (!exists) {
      setFormData((prev) => ({
        ...prev,
        subsections: { ...prev.subsections, [name]: [] },
      }));
      setTargetSubsection(name);
    }

    setInputValue("");
  };

  // React Dropzone Handler
  const {
    getRootProps: getTextRootProps,
    getInputProps: getTextInputProps,
    open: openFilePicker,
    isDragActive: isTextDragActive,
    isDragReject: isTextDragReject,
  } = useDropzone({
    onDrop: (acceptedFiles) => {
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
    },
    accept: { "text/plain": [".txt"] },
    multiple: true,
    noClick: true,
  });

  const {
    getRootProps: getSpreadsheetRootProps,
    getInputProps: getSpreadsheetInputProps,
    isDragActive: isSpreadsheetDragActive, 
    isDragReject: isSpreadsheetDragReject,
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        setFormData((prev)=>({
          ...prev, 
          spreadsheet: acceptedFiles[0]
        }))
      }
    },
    accept: {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
  },
  multiple: false,
  noClick: false,
  })

  
  
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
    const acceptedFiles = Array.from(e.target.files).filter((file) =>
      file.name.endsWith(".txt"),
    );

    if (formData.multi) {
      const activeSection = targetSubsection || `Subsection ${count}`;
      if (!targetSubsection) {
        setCount((prev) => prev + 1);
      }

      setFormData((prev) => {
        let updatedSubsections = { ...prev.subsections };
        if (formData.subsections.hasOwnProperty(`${activeSection}`)) {
          const existingFiles = updatedSubsections[activeSection];
          const existingKeys = new Set(
            existingFiles.map((f) => `${f.name}-${f.size}`),
          );
          const newFiles = acceptedFiles.filter(
            (f) => !existingKeys.has(`${f.name}-${f.size}`),
          );
          updatedSubsections[activeSection] = [...existingFiles, ...newFiles];
        } else {
          updatedSubsections[activeSection] = acceptedFiles;
        }

        // if (sectionIndex > -1) {
        //   const existingFiles = updatedSubsections[sectionIndex][activeSection];
        //   const existingKeys = new Set(
        //     existingFiles.map((f) => `${f.name}-${f.size}`),
        //   );
        //   const newFiles = uploadedFiles.filter(
        //     (f) => !existingKeys.has(`${f.name}-${f.size}`),
        //   );

        //   updatedSubsections[sectionIndex] = {
        //     [activeSection]: [...existingFiles, ...newFiles],
        //   };
        // } else {
        //   updatedSubsections.push({ [activeSection]: uploadedFiles });
        // }

        return { ...prev, subsections: updatedSubsections };
      });
    } else {
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
  };

  const removeFile = (file: File) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f !== file),
      baseText: prev.baseText === file.name ? null : prev.baseText,
    }));
  };

  const removeFileFromSection = (sectionName: string, fileToRemove: File) => {
    setFormData((prev) => ({
      ...prev,
      baseText: fileToRemove.name.includes(prev.baseText) ? "" : prev.baseText,
      subsections: {
        ...prev.subsections,
        [sectionName]: (prev.subsections[sectionName] || []).filter(
          (f) => f !== fileToRemove,
        ),
      },
    }));
  };

  const removeSubsection = (sectionName: string) => {
    let newSections = formData.subsections;
    delete newSections[sectionName];
    setFormData((prev) => ({
      ...prev,
      subsections: newSections,
    }));
  };
  const [rename, setRename] = useState(false);
  const renameSubsection = (newName, oldName) => {
    const sectionContents = formData.subsections[oldName];
    let newSections = formData.subsections;
    delete newSections[oldName];
    newSections[newName] = sectionContents;
    setFormData((prev) => ({
      ...prev,
      subsections: newSections,
    }));
    setRename(false);
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
      const sourceList = prev.subsections[draggedSourceSection] || [];
      const targetList = prev.subsections[targetSectionName] || [];
      const movedFile = sourceList[draggedFileIndex];

      if (!movedFile) return prev; // Guard against out-of-bounds index

      return {
        ...prev,
        subsections: {
          ...prev.subsections,
          // Remove file from source section
          [draggedSourceSection]: sourceList.filter(
            (_, idx) => idx !== draggedFileIndex,
          ),
          // Append file to target section
          [targetSectionName]: [...targetList, movedFile],
        },
      };
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
  const [plotUrl, setPlotUrl] = useState(null);

  const [fileLength, setFileLength] = useState(0)

  const { pyodide, webR, isReady, loadingStatus } = useWasmEngines();

  const [progress, setProgress] = useState(0)

  const handleSubmit = async () => {
    if (!pyodide || !isReady) {
      alert("Python engine is still loading in browser. Please wait a moment.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    

    const targetDir = "/tmp/input_files/Alignment Data0";

    let totalFileCount;

    try {
      if (allResults.length==0){
        // 1. Clear & create virtual input directory in Pyodide
        
        try {
          pyodide.FS.mkdirTree(targetDir);
        } catch (e) { }

        // 2. Collect user files and filenames
        const allFilesToProcess: { file: File; section?: string }[] = [];
        let baseTextFiles: File[] = [];

        if (formData.multi) {
          const subKeys = Object.keys(formData.subsections);
          subKeys.forEach((subName) => {
            formData.subsections[subName].forEach((f: File) => {
              allFilesToProcess.push({ file: f, section: subName });
            });
          });
          if (subKeys.length > 0) {
            baseTextFiles = formData.subsections[subKeys[0]];
            
          }
        } else {
          formData.files.forEach((f: File) =>
            allFilesToProcess.push({ file: f }),
          );
          baseTextFiles = formData.files;
        }

        baseTextFiles.filter((file)=>(!file.name.toLowerCase().includes("description")))

        if (allFilesToProcess.length === 0) {
          alert("No files selected for alignment.");
          return;
        }

        totalFileCount = allFilesToProcess.length;
        setFileLength(totalFileCount);

        setAllBaseTexts((prev) => [...prev, ...baseTextFiles]);

        // Write physical files into Pyodide's Virtual FS
        for (const item of allFilesToProcess) {
          const arrayBuffer = await item.file.arrayBuffer();
          const path = item.section
            ? `${targetDir}/${item.section}/${item.file.name}`
            : `${targetDir}/transcriptions/${item.file.name}`;

          const dirPath = path.substring(0, path.lastIndexOf("/"));
          try {
            pyodide.FS.mkdirTree(dirPath);
          } catch (e) { }
          pyodide.FS.writeFile(path, new Uint8Array(arrayBuffer));
        }
    } else{
      totalFileCount=fileLength;
    }
      
    
      let effectiveBaseText = formData.baseText
      let i = 0
      if (formData.multi) {
        const subKeys = Object.keys(formData.subsections);
        const usedPrefixes = new Set(
          Array.from(prevBaseTexts).map((item) => item.split("_")[0])
        );
        effectiveBaseText = (formData.baseText.length>0 && !usedPrefixes.has(formData.baseText.split("_")[0]))? formData.baseText : (formData.subsections[subKeys[0]].find(
          (f) => !f.name.toLowerCase().includes("description") && !usedPrefixes.has(f.name.split("_")[0])
        )).name
      } else {
        effectiveBaseText = (formData.baseText.length>0 && !prevBaseTexts.has(formData.baseText)) ? formData.baseText : (formData.files.find(
        (f) => !f.name.toLowerCase().includes("description") && !prevBaseTexts.has(f.name)
      )).name
      }
      
      // while (effectiveBaseText.toLowerCase().includes("description") || prevBaseTexts.includes(effectiveBaseText)) {
      //   effectiveBaseText = formData.files[i+1].name || formData.subsections[subKeys[0]][i+1].name;
      //   i++
      // }
      
      setFormData((prev) => ({ ...prev, baseText: effectiveBaseText }));
      
      // setPrevBaseTexts((prev) => new Set(prev).add(effectiveBaseText));
      

      // // Extract file names (strings) instead of passing raw File objects
      // const baseTextListNames = baseTextFiles.map((f) => f.name);

      // 4. Bind JS variables directly to Pyodide globals
      pyodide.globals.set("js_settings", pyodide.toPy(formData.settings || {}));
      pyodide.globals.set("js_algorithm", formData.algorithm || "");
      pyodide.globals.set("js_base_text", effectiveBaseText);
      pyodide.globals.set("js_multi", Boolean(formData.multi));
      pyodide.globals.set("file_length", Math.max(1, totalFileCount));
      // pyodide.globals.set("js_base_text_list", pyodide.toPy(baseTextListNames));
      pyodide.globals.set("update_progress", (percent: number) => {
      setProgress(Math.min(100, Math.max(0, percent)));
    });
      
      const runScript = `
import main
import pandas as pd
import asyncio

settings = main.AlgorithmSettings.from_dict(js_settings)

# Execute alignment inside browser RAM
results = await main.run_in_browser_process(
    algorithm=js_algorithm,
    settings=settings,
    file_dir="/tmp/input_files",
    base_text=js_base_text,
    multi=js_multi,
    file_length=file_length,
    progress_callback=update_progress
    
)

if results is None:
    raise ValueError("main.run_in_browser_process returned None. Check input parameters or files in /tmp/input_files.")

if "records" not in results or results["records"] is None:
    raise KeyError("Missing or empty 'records' in execution results.")

results
`;

      const pyResult = await pyodide.runPythonAsync(runScript);
      const resultObj = pyResult.toJs({ dict_converter: Object.fromEntries });


      
      setResults({
        status: "success",
        algorithm: formData.algorithm,
        output_logs: resultObj.output_logs,
        records: resultObj.records || [],
      });

      setFormData((prev) => ({
        ...prev,
        settings: { ...prev.settings, isPlot: resultObj.is_plot },
      }));

      
      setAllResults((prev) => ([
        ...prev,
        {
          baseText: effectiveBaseText,
          records: resultObj.records,
          alignments: resultObj.output_logs
        }
      ]))

      setPrevBaseTexts((prev) => new Set(prev).add(effectiveBaseText));

      

      handleStepChange(3);
    } catch (error) {
      console.error("Browser alignment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Browser-Native handlePlot (Replaces FastAPI /api/plot)

  // const handlePlot = async () => {
  //   if (!webR || !pyodide) return;
  //   setIsProcessing(true);

  //   try {
  //     // 1. Copy matrix from Pyodide to WebR FS
  //     const excelBinary: Uint8Array = pyodide.FS.readFile("/tmp/alignment_matrix.xlsx");
  //     try { webR.FS.mkdir('/tmp'); } catch (e) {}
  //     await webR.FS.writeFile('/tmp/alignment_matrix.xlsx', excelBinary);

  //     // 2. Execute R Script
  //     const rCommand = `
  //       source('/tmp/t-SNE.R')
  //       run_tsne_browser(
  //         df = '/tmp/alignment_matrix.xlsx',
  //         perplexity = ${formData.plotSettings.perplexity},
  //         theta = ${formData.plotSettings.theta},
  //         plot_type = '${formData.plotSettings.plotType}',
  //         colors = '${formData.plotSettings.colors}',
  //         color_text = '${formData.plotSettings.colorText}'
  //       )
  //     `;

  //     const rOutput = await webR.evalR(rCommand);
  //     const resultValue = await rOutput.toJs();
  //     const resultString = resultValue.values?.[0] || resultValue;

  //     // 3. Handle Output Type
  //     if (typeof resultString === 'string' && resultString.startsWith('data:image')) {
  //       // 2D ("2d") or 3D Static ("3ds")
  //       setPlotUrl({ type: 'image', src: resultString });
  //     } else {
  //       // 3D Interactive ("3da")
  //       const htmlBytes = await webR.FS.readFile('/tmp/plot.html');
  //       const blob = new Blob([htmlBytes], { type: 'text/html' });
  //       const blobUrl = URL.createObjectURL(blob);

  //       if (plotUrl?.type === 'iframe') URL.revokeObjectURL(plotUrl.src);
  //       setPlotUrl({ type: 'iframe', src: blobUrl });
  //     }

  //     handleStepChange(currentStep + 1);

  //   } catch (error) {
  //     console.error("Plot generation error:", error);
  //     alert(`Plot generation failed: ${error instanceof Error ? error.message : String(error)}`);
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  const handleUploadSpreadsheet = async () => {
    const arrayBuffer = await formData.spreadsheet.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    pyodide.FS.writeFile("/tmp/alignment_matrix.xlsx", uint8Array);
  }

  const generateSpreadsheet = async () => {
    

    
    if (!pyodide || !webR) {
      alert("WebAssembly engines are still loading. Please wait a moment.");
      return;
    }



    try {
      // ------------------------------------------------------------------
      // 1. SAFELY ENSURE /tmp DIRECTORY EXISTS IN PYODIDE
      // ------------------------------------------------------------------
      const pyTmpAnalysis = pyodide.FS.analyzePath("/tmp");
      if (!pyTmpAnalysis.exists) {
        pyodide.FS.mkdir("/tmp");
      }

      let allRecords = []
      allResults.map((dict)=> {
        allRecords.push(dict.records)
      })

      allRecords = allRecords.flat()

      // ------------------------------------------------------------------
      // 2. RUN PYTHON ALIGNMENT SCRIPT (IF NOT ALREADY EXECUTED)
      // ------------------------------------------------------------------
      // Ensure python outputs directly to /tmp/alignment_matrix.xlsx
      // pyodide.globals.set("js_records", pyodide.toPy(results.records || {}));
      pyodide.globals.set("js_records", pyodide.toPy(allRecords || {}));
      const plotResultPy = await pyodide.runPythonAsync(`
      import os
      import pandas as pd
      import main

      # plot_results = main.generate_spreadsheet(
      # algorithm=js_algorithm,
      #     settings=settings,
      #     root_dir="/tmp/input_files",
      #     base_text=js_base_text,
      #     base_text_list=js_base_text_list,
      # records=js_records)


      # records = plot_results["records"]
      records = js_records
      filtered_records = [
          {key: value for key, value in d.items() if key not in ("OrigScore", "TextNamePair")} 
          for d in records
      ]

      orig_df = pd.DataFrame(filtered_records)
      if orig_df.empty:
          raise ValueError("Alignment returned 0 valid records.")

      df = orig_df.pivot_table(
          index="BaseText",
          columns="TargetFile",
          values="Score"
      )
      df = df.fillna(1)

      def get_suffix_sort_key(col_name):
          parts = str(col_name).rsplit('_', 1)
          if len(parts) == 2:
              return (parts[1], parts[0]) 
          return ('', str(col_name))

      if js_multi:
          sorted_columns = sorted(df.columns, key=get_suffix_sort_key)
          df = df[sorted_columns]

      df.to_excel("/tmp/alignment_matrix.xlsx")
      records

      `);

      const plotResultObj = plotResultPy.toJs({ dict_converter: Object.fromEntries });

      setPlotResults({
        status: "success",
        algorithm: formData.algorithm,
        records: plotResultObj || [],
      });

    } catch (error: any) {
      console.error("Plot generation error:", error);
      alert(`Plot generation failed: ${error.message || String(error)}`);
    }
  }

  const [tsneRun, setTsneRun] = useState(false)
  const [plotResults, setPlotResults] = useState<any>(null);

  const handlePlot = async () => {
    setIsProcessing(true);
    if (!pyodide || !webR) {
      alert("WebAssembly engines are still loading. Please wait a moment.");
      setIsProcessing(false)
      return;
    }
    // ------------------------------------------------------------------
    // 3. VERIFY FILE EXISTS IN PYODIDE FS BEFORE READING
    // ------------------------------------------------------------------
    let targetFile = "";
    if (pyodide.FS.analyzePath("/tmp/alignment_matrix.xlsx").exists) {
      targetFile = "/tmp/alignment_matrix.xlsx";
    } else if (pyodide.FS.analyzePath("alignment_matrix.xlsx").exists) {
      targetFile = "alignment_matrix.xlsx";
    } else {
      await generateSpreadsheet()
      if (pyodide.FS.analyzePath("/tmp/alignment_matrix.xlsx").exists) {
        targetFile = "/tmp/alignment_matrix.xlsx";
      } else if (pyodide.FS.analyzePath("alignment_matrix.xlsx").exists) {
        targetFile = "alignment_matrix.xlsx";
      } else {
        setIsProcessing(false)
        throw new Error(
          
          "alignment_matrix.xlsx was not found in Pyodide filesystem. "
        );
        
      }


    }

    // Read binary data from Pyodide
    const excelBinary: Uint8Array = pyodide.FS.readFile(targetFile);

    // ------------------------------------------------------------------
    // 4. SAFELY ENSURE /tmp DIRECTORY EXISTS IN WEBR
    // ------------------------------------------------------------------
    try {
      await webR.FS.mkdir("/tmp");
    } catch (e) {
      // Ignore error if /tmp already exists in WebR
    }

    // Copy matrix over to WebR
    await webR.FS.writeFile("/tmp/alignment_matrix.xlsx", excelBinary);

    // ------------------------------------------------------------------
    // 5. EXECUTE t-SNE IN WEBR
    // ------------------------------------------------------------------

    // if (!tsneRun) {
    //   const rCom = `
    //     source('/tmp/t-SNE.R')
    //     tsne_cached_res <<- run_tsne(
    //       df = '/tmp/alignment_matrix.xlsx',
    //       perplexity = ${formData.plotSettings.perplexity},
    //       theta = ${formData.plotSettings.theta},
    //       colors = '${formData.plotSettings.colors}'
    //     )
    //   `;
    //   await webR.evalR(rCom);
    //   setTsneRun(true);
    // }


    const rCommand = `
        source('/tmp/t-SNE.R')
        run_tsne_browser(
          df = '/tmp/alignment_matrix.xlsx',
          perplexity = ${formData.plotSettings.perplexity},
          theta = ${formData.plotSettings.theta},
          plot_type = '${formData.plotSettings.plotType}',
          colors = '${formData.plotSettings.colors}',
          color_text = '${formData.plotSettings.colorText}'
        )
      `;

    const rOutput = await webR.evalR(rCommand);
    const resultValue = await rOutput.toJs();
    const resultString = (resultValue.values?.[0] || resultValue) as string;


    setPlotUrl(resultString);
    // if (resultString.startsWith("data:image")) {
    //   // Static 3D/2D base64 image
    //   setPlotUrl(resultString);
    // } else {
    //   // Interactive HTML string via iframe
    //   const htmlBytes = await webR.FS.readFile("/tmp/plot.html");
    //   const htmlText = new TextDecoder().decode(htmlBytes);
    //   setPlotUrl(htmlText);
    // }
    
    setIsProcessing(false)
    // Advance to plot step
    handleStepChange(5);

  };
  const [downloadedFiles, setDownloadedFiles] = useState([]);
  const handleDownload = async () => {
    if (!pyodide) return;

    try {
      // Read binary from Pyodide
      const rawBinary = pyodide.FS.readFile("/tmp/alignment_matrix.xlsx");

      // Convert/copy to standard Uint8Array backed by a standard ArrayBuffer
      const excelBinary = new Uint8Array(rawBinary);

      await webR.FS.writeFile("/tmp/alignment_matrix.xlsx", excelBinary);

      // Trigger browser download
      const blob = new Blob([excelBinary], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = "alignment_matrix.xlsx";
      download(blob, fileName);

      // Track for PDF Report
      setDownloadedFiles((prev) => [...prev, fileName]);
    } catch (error) {
      console.error("Failed to download Excel file:", error);
    }
  };
  // const handleSubmit = async () => {
  //   setIsProcessing(true);
  //   setFormData((prev) => ({ ...prev, settings: { ...prev.settings, isPlot: true } }))
  //   console.log(formData.settings.isPlot)
  //   if (Object.keys(formData.subsections).length > 0){
  //     const firstSectionCount = formData.subsections[Object.keys(formData.subsections)[0]].length;
  //     if (firstSectionCount<4){
  //       setFormData((prev) => ({ ...prev, settings: { ...prev.settings, isPlot: false } }))
  //     } else {
  //     const hasUnequalSubsections = Object.keys(formData.subsections).some((sub) => {
  //       const filesInSub = formData.subsections[sub]
  //       console.log(formData.subsections)
  //       return filesInSub.length !== firstSectionCount;
  //     });

  //     if (hasUnequalSubsections) {
  //       console.log("has")
  //       setFormData((prev) => ({ ...prev, settings: { ...prev.settings, isPlot: false } }))
  //     }
  //   }
  //   } else if (formData.files.length < 4){
  //     console.log(formData.settings.isPlot)
  //     setFormData((prev) => ({ ...prev, settings: { ...prev.settings, isPlot: false } }))
  //   }

  //   try {

  //     const payload = new FormData();

  //     payload.append("algorithm", formData.algorithm);
  //     payload.append("settings", JSON.stringify(formData.settings));
  //     payload.append("multi", String(formData.multi));

  //     if (formData.baseText!=="" && formData.baseText) {
  //       payload.append("base_text", formData.baseText);
  //     }

  //     if (formData.multi) {
  //       // 1. Serialize the subsection folder mapping structure (names & file lists)
  //       const metadata = Object.keys(formData.subsections).map((key) => {
  //         return { [key]: formData.subsections[key].map((f) => f.name) };
  //       });
  //       payload.append("subsections_metadata", JSON.stringify(metadata));

  //       // 2. Append all actual files from all subsections
  //       Object.keys(formData.subsections).forEach((sub) => {
  //         formData.subsections[sub].forEach((file) => {
  //           payload.append("files", file);
  //         });
  //       });
  //     } else {
  //       // Append files directly in single mode
  //       formData.files.forEach((file) => {
  //         payload.append("files", file);
  //       });
  //     }

  //     const response = await fetch("api/process", {
  //       method: "POST",
  //       body: payload,
  //     });

  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       throw new Error(`Processing failed (${response.status}): ${errorText}`);
  //     }

  //     const data = await response.json();
  //     if (data.job_id) {
  //       setJobId(data.job_id);
  //     }
  //     setResults(data);

  //     handleStepChange(currentStep + 1); // Advance step after successful run
  //   } catch (error) {
  //     console.error("Error submitting form:", error);
  //   } finally {
  //     setIsProcessing(false);

  //   }
  // };

  // const handlePlot = async () => {
  //   if (formData.files.length > 3 || formData.settings.isPlot == true) {
  //     setIsProcessing(true);

  //     if (!jobId) {
  //       console.error("No processed job available to plot");
  //       return;
  //     }

  //     try {
  //       const payload2 = new FormData();
  //       payload2.append("plot_settings", JSON.stringify(formData.plotSettings))
  //       const response2 = await fetch(`api/plot/${jobId}`, {
  //         method: "POST",
  //         body: payload2,
  //       });
  //       if (!response2.ok) {
  //       const errorData = await response2.json().catch(() => null);
  //       throw new Error(errorData?.detail || `Plotting failed with status ${response2.status}`);
  //     }
  //       const htmlBlob = await response2.blob();
  //       const tempUrl = URL.createObjectURL(htmlBlob);
  //       setPlotUrl(tempUrl);
  //       handleStepChange(currentStep + 1);
  //   } catch (error) {
  //     console.error("Failed to generate plot:", error);
  //     } finally {
  //       setIsProcessing(false);

  //     }
  //   }
  // };

  // const handleDownload = async () => {
  //   window.location.href = `api/sheet/${jobId}`;
  //   setDownloadedFiles((prev)=>([...prev, "alignment_matrix.xlsx"]))
  // }

  Font.register({
    family: "Cousine",
    src: "https://raw.githubusercontent.com/google/fonts/main/ofl/cousine/Cousine-Regular.ttf",
  });

  const tw = createTw({
    fontFamily: {
      mono: ["Cousine"],
    },
  });

  const containerRef = useRef(null);
  const scrollToSection = (id) => {
    const element = containerRef.current?.querySelector(`[id="${id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const rtlLangs = /[\p{sc=Hebrew}\p{sc=Arabic}\p{sc=Syriac}\p{sc=Thaana}\p{sc=Nko}]/u;


  const AlignmentsDoc = () => {
    const rtlTested = rtlLangs.test(results.output_logs) ? "rtl" : "ltr"
    return (
      <Document>
        <Page size="A4">
          <View wrap style={tw("p-10")}>
            <Text style={tw("text-lg text-center font-mono")}>Alignment Results</Text>
            {results.output_logs.split("\n").map((line, index) => (
              <Text key={index} style={[tw("font-mono text-justify text-sm"), { direction: rtlTested }]}>
                {line || " "}
              </Text>
            ))}
          </View>
        </Page>
      </Document>
    );
  }


  const AllAlignmentsDoc = () => {
    const rtlTested = rtlLangs.test(results.output_logs) ? "rtl" : "ltr"
    
    return (
      <Document>
        <Page size="A4">
          <View wrap style={tw("p-10")}>
            <Text style={tw("text-lg text-center font-mono")}>Alignment Results</Text>
            {allResults.map((dict)=>(
              <View key={dict.baseText}>
                <Text key={dict.baseText}>{dict.baseText}</Text>
            {dict.alignments.split("\n").map((line, index) => (
              <Text key={index} style={[tw("font-mono text-justify text-sm"), { direction: rtlTested }]}>
                {line || " "}
              </Text>
            
            ))}
            </View>
            ))}
          </View>
        </Page>
      </Document>
    );
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const Report = () => {
    const seenPairs = new Set();
    const d = new Date();
    const date = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} at ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
    const recsFilter = (record) => {
      const pairKey = [record.TextNamePair[0], record.TextNamePair[1]]
        .sort()
        .join(":::");
      if (seenPairs.has(pairKey)) {
        return false;
      } else {
        seenPairs.add(pairKey);
        return true;
      }
    };

    let allRecords = []
      allResults.map((dict)=> {
        allRecords.push(dict.records)
      })

      allRecords = allRecords.flat()
    const recs = plotResults ? plotResults.records.filter(recsFilter) : allRecords.filter(recsFilter) ;

    return (
      <Document>
        <Page size="A4">
          <View wrap style={tw("p-10 text-sm font-mono")}>
            <Text style={tw("text-sm text-right")}>Generated on {date}</Text>
            <Text style={tw("text-xl font-bold text-center")}>
              Summary Report
            </Text>
            <Text style={tw("text-lg")}>Files You Uploaded:</Text>
            {formData.multi == true &&
              Object.keys(formData.subsections).map((key) => (
                <View key={key} style={tw("text-sm")}>
                  <Text>Subsection: {key}</Text>
                  <Text style={tw("pl-4")}> Files: </Text>

                  {formData.subsections[key].map((f) => (
                    <Text key={f.name} style={tw("text-sm pl-8")}>
                      {f.name}
                    </Text>
                  ))}
                </View>
              ))}
            {formData.multi == false &&
              formData.files.map((f) => (
                <Text key={f.name} style={tw("text-sm pl-4")}>
                  {f.name}
                </Text>
              ))}
            <Text style={tw("text-lg pb-0 pt-2")}>Files You Downloaded:</Text>
            {downloadedFiles.length == 0 ? (
              <Text style={tw("text-sm pl-4 pt-0")}>None</Text>
            ) : (
              downloadedFiles.map((fi) => <Text style={tw("pl-4")}>{fi}</Text>)
            )}

            <Text style={tw("text-lg pt-2")}>Algorithm Settings</Text>
            <Text style={tw("text-sm font-bold")}>
              Algorithm:{" "}
              {formData.algorithm == "ndw"
                ? "Needleman-Wunsch"
                : "Smith-Waterman"}
            </Text>

            <Text>Match Bonus: {formData.settings.matchBonus}</Text>
            <Text>Gap Penalty: {formData.settings.gapPenalty}</Text>
            <Text>Mismatch Penalty: {formData.settings.mismatchPenalty}</Text>
            <Text>
              {formData.algorithm == "ndw"
                ? `Affine Penalty: ${formData.settings.affinePenalty}`
                : ""}
            </Text>
            <Text>
              Special Characters:{" "}
              {formData.settings.special.length == 0
                ? "None"
                : formData.settings.specialOther == false
                  ? formData.settings.special.join(",") === "ך,ם,ן,ף,ץ"
                    ? `Sofit Letters: ${formData.settings.special}`
                    : `Capital Letters (Latin Alphabet): ${formData.settings.special}`
                  : `Other: ${formData.settings.special}`}{" "}
            </Text>
            <Text>
              {formData.settings.special.length != 0
                ? `Special Character Match Bonus: ${formData.settings.specialBonus}`
                : ""}
            </Text>

            <Text style={tw("text-lg pt-2")}>Plot Settings</Text>
            <Text>
              Plot Type:{" "}
              {formData.plotSettings.plotType.includes("3d")
                ? formData.plotSettings.plotType == "3da"
                  ? "3D Interactive"
                  : "3D Static"
                : "2D"}
            </Text>
            <Text>Perplexity: {formData.plotSettings.perplexity}</Text>
            <Text>Theta: {formData.plotSettings.theta}</Text>
            <Text>
              Data Point Color:{" "}
              {formData.plotSettings.colors == "black"
                ? "Black"
                : formData.plotSettings.colors == "grouping"
                  ? "By Group"
                  : "By Base Text"}
            </Text>
            <Text>
              Text Color:{" "}
              {formData.plotSettings.colorText
                ? formData.plotSettings.colors == "black"
                  ? "Black"
                  : formData.plotSettings.colors == "grouping"
                    ? "By Group"
                    : "By Base Text"
                : "Black"}
            </Text>
            {recs.length > 0 && (
            <View>
            <Text style={tw("text-lg pt-2")}>Resulting Scores</Text>
            {recs.map((item, index) => (
              <View key={`${index}-view`}>
                <Text key={`${index}-title`} style={tw("text-sm font-bold")}>
                  {item.TextNamePair[0]} & {item.TextNamePair[1]}:
                </Text>
                <Text key={`${index}-scores`} style={tw("text-sm pl-4")}>
                  Score: {item.OrigScore} | Average Score: {item.Score}
                </Text>
              </View>
              
            ))}</View>
            )}
          </View>
        </Page>
      </Document>
    );
  };

  const getDate = () => {
    const d = new Date();
    const date = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} at ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
    return date;
  };

  const plotRef = useRef(null);



  // const download3dPlot = () => {
  //   // 1. Target the iframe's document
  //   const iframeDoc = plotRef.current?.contentDocument || plotRef.current?.contentWindow?.document;
  //   if (!iframeDoc) return;

  //   // 2. Find the WebGL canvas inside the iframe
  //   const canvas = iframeDoc.querySelector('canvas') as HTMLCanvasElement;

  //   if (canvas) {
  //     // 3. Extract the image directly from WebGL
  //     const dataUrl = canvas.toDataURL('image/png');
  //     download(dataUrl, 'positioned_3D_plot.png');
  //     setDownloadedFiles((prev)=>([...prev, "positioned_3D_plot.png"]))
  //   } else {
  //     console.warn('Canvas element not found inside iframe');
  //   }
  // }
  const download3dPlot = async () => {
    const iframeWin = plotRef.current?.contentWindow as any;
    const iframeDoc = plotRef.current?.contentDocument;

    if (!iframeWin || !iframeDoc) {
      console.warn("Iframe reference not found");
      return;
    }

    const plotDiv = iframeDoc.getElementById("plot") as any;

    if (plotDiv && iframeWin.Plotly) {
      try {
        // 1. Copy live interactive camera state into the layout object
        const liveCamera = plotDiv._fullLayout?.scene?.camera;

        if (liveCamera) {
          plotDiv.layout = plotDiv.layout || {};
          plotDiv.layout.scene = plotDiv.layout.scene || {};
          plotDiv.layout.scene.camera = {
            eye: { ...liveCamera.eye },
            center: { ...liveCamera.center },
            up: { ...liveCamera.up },
            projection: liveCamera.projection
              ? { ...liveCamera.projection }
              : undefined,
          };
        }

        // 2. Export image using current position & high resolution
        const dataUrl = await iframeWin.Plotly.toImage(plotDiv, {
          format: "png",
          width: 1200,
          height: 900,
        });

        // 3. Trigger download
        download(dataUrl, "positioned_3D_plot.png");
        setDownloadedFiles((prev) => [...prev, "positioned_3D_plot.png"]);
      } catch (err) {
        console.error("Failed to generate image from Plotly:", err);
      }
    } else {
      console.warn(
        "Plotly instance or #plot container not found inside iframe",
      );
    }
  };

  const handleColorText = () => {
    if (formData.plotSettings.colorText == true) {
      setFormData((prev) => ({
        ...prev,
        plotSettings: { ...prev.plotSettings, colorText: false },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        plotSettings: { ...prev.plotSettings, colorText: true },
      }));
    }
  };

  const handleSpaceStrip = () => {
    if (formData.settings.spaceStrip == true) {
      setFormData((prev) => ({
        ...prev,
        settings: { ...prev.settings, spaceStrip: false },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        settings: { ...prev.settings, spaceStrip: true },
      }));
    }
  };

  const totalFilesCount = formData.multi
    ? Object.keys(formData.subsections).reduce(
      (acc, key) => acc + formData.subsections[key].length,
      0,
    )
    : formData.files.length;

  const clearAll = async () => {
    // 1. Clear /tmp in Pyodide (Python)
    if (pyodide) {
      try {
        await pyodide.runPythonAsync(`
        import os, shutil
        if os.path.exists('/tmp'):
            for item in os.listdir('/tmp'):
                item_path = os.path.join('/tmp', item)
                try:
                    if os.path.isfile(item_path) or os.path.islink(item_path):
                        os.unlink(item_path)
                    elif os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                except Exception as e:
                    print(f"[Pyodide] Failed to delete {item_path}: {e}")
        `);
        console.log("[Pyodide] /tmp directory cleared successfully.");
      } catch (e) {
        console.warn("Failed to clear Pyodide /tmp:", e);
      }
    }

    // 2. Clear /tmp in WebR (R)
    if (webR) {
      try {
        await webR.evalR(`
        if (dir.exists('/tmp')) {
          # Delete all files and subdirectories inside /tmp without deleting /tmp itself
          unlink('/tmp/*', recursive = TRUE)
        }
        `);
        console.log("[WebR] /tmp directory cleared successfully.");
      } catch (e) {
        console.warn("Failed to clear WebR /tmp:", e);
      }
    }
    setFormData((prev) => ({
      ...prev,
      subsections: {},
      files: [],
      spreadsheet: null,
      baseText: ""
    }))
    setAllResults([])
    setPrevBaseTexts(new Set())
    setPlotUrl(null)

  };

  return (
    <div className="bg-gray-800 w-screen h-screen flex flex-col items-center place-content-center content-center justify-items-center justify-content-center">
      <div className="w-full h-full p-10 bg-gray-900 text-gray-100">
        {/* Progress Bar */}
        {currentStep == 0 && (
          <div className="text-lg text-cyan-200  font-medium flex flex-col pt-5 h-100/100 justify-between">
            <div className="gap-5 h-full">
              <h1 className="text-3xl font-bold text-gray-100 pt-10 pb-10">
                {/* Change the title here */}
                Welcome to the TEXTEVOLVE Data Analysis Tool
              </h1>
              <div className="text-base pt-2 gap-2  text-cyan-200 shadow-gray-600/40 shadow-lg/40 w-full h-8/10  rounded-lg p-5  overflow-auto">
                <p className="text-lg font-medium">Description</p>

              </div>
            </div>
            <div className="flex flex-row justify-end">
              <button
                onClick={() => handleStepChange(1)}
                className="px-5 py-2 bg-cyan-600 text-gray-900 text-center font-medium rounded-lg hover:bg-cyan-700 cursor-pointer w-max"
              >
                Continue
              </button>
            </div>
          </div>
        )}{" "}
        {currentStep !== 0 && (
          <div className="h-9/10">
            <div>
              <div className="flex justify-between text-[0.8rem] font-medium text-gray-300 mb-2">
                <button
                  type="button"
                  onClick={() => handleStepSkip(1)}
                  className={`${furthestStep >= 1 ? "cursor-pointer" : ""} ${currentStep >= 1 ? "text-cyan-400 font-bold" : ""
                    }`}
                >
                  Upload Files
                </button>
                <button
                  type="button"
                  onClick={() => handleStepSkip(2)}
                  className={`${furthestStep >= 2 ? "cursor-pointer" : ""} ${currentStep >= 2 ? "text-cyan-400 font-bold" : ""
                    }`}
                >
                  Select Algorithm
                </button>
                <button
                  type="button"
                  onClick={() => handleStepSkip(3)}
                  className={`${furthestStep >= 3 ? "cursor-pointer" : ""} ${currentStep >= 3 ? "text-cyan-400 font-bold" : ""
                    }`}
                >
                  View Alignment
                </button>

                <button
                  type="button"
                  onClick={() => handleStepSkip(4)}
                  className={`${furthestStep >= 4 ? "cursor-pointer" : ""} ${currentStep >= 4 ? "text-cyan-400 font-bold" : ""
                    }`}
                >
                  Adjust Plot Settings
                </button>
                <button
                  type="button"
                  onClick={() => handleStepSkip(5)}
                  className={`${furthestStep >= 5 ? "cursor-pointer" : ""} ${currentStep >= 5 ? "text-cyan-400 font-bold" : ""
                    }`}
                >
                  View Plot
                </button>

                <button
                  type="button"
                  onClick={() => handleStepSkip(6)}
                  className={`${furthestStep >= 6 ? "cursor-pointer" : ""} ${currentStep >= 6 ? "text-cyan-400 font-bold" : ""
                    }`}
                >
                  View Report
                </button>
              </div>
              <div className="w-full bg-gray-600 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-600 h-2 transition-all duration-300"
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                ></div>
              </div>
            </div>
            {/* STEP 1: UPLOAD FILES */}
            {currentStep === 1 && (
              <div className="flex flex-col justify-between pt-10 h-9/10">

                <div className="h-10/10">
                  {formData.multi === null && (

                    <div className=" h-10/10 ">
                      <h2 className="text-3xl font-bold text-gray-100">
                        Choose Comparison Type
                      </h2>
                      <div className="h-full flex flex-col place-content-start">
                        <h1 className="text-2xl leading-[2] pt-12 font-semibold text-cyan-400 overflow-wrap">

                          Please begin by selecting whether you want to compare:

                        </h1>
                        <div className="flex flex-row h-full gap-5 justify-between w-full">
                          <div className="flex flex-col w-5/10 gap-5">
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, multi: false }))
                              }
                              className="px-5 py-2 bg-cyan-600 text-gray-900 text-lg  font-semibold rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
                            >
                              Entire Texts
                            </button>

                            <div className="text-base pt-2 gap-2 text-cyan-200  shadow-gray-600/40 shadow-lg/40  rounded-lg p-5 h-9/10  overflow-auto">
                              <p className="text-lg font-medium">Description</p>

                            </div>
                          </div>

                          <div className="flex flex-col w-5/10 h-full gap-5">
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, multi: true }))
                              }
                              className="px-5 py-2 bg-cyan-600 text-gray-900 text-lg font-semibold rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
                            >
                              Subsections of Texts
                            </button>
                            <div className="text-base pt-2 gap-2 text-cyan-200 shadow-gray-600/40  shadow-lg/40 rounded-lg p-5 h-9/10 overflow-auto">
                              <p className="text-lg h-full font-medium">Description</p>

                            </div>
                          </div>
                        </div>

                      </div>
                      <div className="flex flex-row place-content-start pt-2">
                        <button
                          onClick={() => handleStepChange(0)}
                          className="px-5 py-2 border border-gray-300 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUBSECTION MULTI-FILE MODE */}
                  {formData.multi === true && (
                    <div className="flex flex-col gap-4 w-full h-full pt-10">
                      <h2 className="text-3xl font-bold text-gray-100">
                        Upload Transcriptions
                      </h2>
                      {/* TOP PANEL: CONTROL BAR & SUBSECTION LIST */}
                      <div className="border-2 border-dashed border-gray-300 flex-col overflow-auto h-full p-4 text-gray-300 w-full rounded-lg bg-gray-700 flex items-start justify-start">
                        {/* Subsection Creator Header */}
                        <div className="flex flex-row justify-between items-center w-full pb-2 border-b mb-3">
                          <div className="flex items-center gap-2">
                            <p className="text-md font-bold text-cyan-100">
                              Uploaded Texts
                            </p>
                          </div>

                          {/* Subsection Creator & Clear All */}
                          <div className="w-5/10 justify-end flex flex-row content-end gap-4">
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleSubsection();
                              }}
                              className="flex flex-row gap-2 items-center"
                            >
                              <div className="cursor-text rounded-md shadow-gray-600/40 shadow-sm flex flex-row items-center px-2 py-0.5 text-cyan-200 bg-gray-800 border border-gray-200">
                                <input
                                  type="text"
                                  placeholder={`Default: Subsection ${count}`}
                                  value={inputValue}
                                  onChange={(e) =>
                                    setInputValue(e.target.value)
                                  }
                                  className="outline-none border-none appearance-none p-1 text-[0.8rem]"
                                />
                                <button
                                  type="submit"
                                  className="hover:bg-cyan-700 rounded-full text-cyan-100"
                                >
                                  <CirclePlus className="w-5 h-5" />
                                </button>
                              </div>
                            </form>

                            <button
                              type="button"
                              onClick={() => {
                                clearAll()
                                setCount(1);

                              }}
                              className="hover:bg-gray-600/70 p-1 rounded-sm text-red-400 font-bold cursor-pointer flex flex-row items-center gap-1 text-[0.8rem]"
                            >
                              <p>Clear All</p>
                              <Eraser className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Base Text Global Indicator */}
                        {/* <div className="text-[0.8rem] font-bold text-cyan-100 mb-3 overflow-wrap">
                    Base Text Prefix:{" "}
                    <input className="font-normal text-gray-100 rounded-md appearance-none bg-gray-800 outline-none p-1 shadow-gray-600/40 shadow-md hover:shadow-gray-600/40 shadow-lg focus:shadow-gray-600/40 shadow-lg "
                      type="text"
                      value={formData.baseText != "" ? formData.baseText : "None"}
                      onChange={(e)=>{setFormData((prev)=>({...prev, baseText:e.target.value}))}}
                    />
                  </div> */}
                        <div className="text-[0.8rem] font-bold text-cyan-100 mb-3 overflow-wrap">
                          Base Text:{" "}
                          {formData.baseText != "" ? formData.baseText : "None"}
                        </div>

                        {/* Hidden File / Folder Inputs for Programmatic Triggering */}
                        <input
                          type="file"
                          ref={folderInput}
                          className="hidden"
                          {...({ webkitdirectory: "", directory: "" } as any)}
                          directory="true"
                          multiple
                          onChange={(e) => handleFolderUpload(e)}
                        />

                        {/* SUBSECTION BOXES */}
                        <div className="w-full space-y-4 overflow-y-auto pr-1">
                          {Object.keys(formData.subsections).length > 0 ? (
                            Object.keys(formData.subsections).map(
                              (sectionName) => (
                                <SubsectionItem
                                  key={sectionName}
                                  sectionName={sectionName}
                                  files={
                                    formData.subsections[sectionName] || []
                                  }
                                  baseText={formData.baseText}
                                  onDropFiles={(
                                    droppedFiles,
                                    targetSection,
                                  ) => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      subsections: {
                                        ...prev.subsections,
                                        [targetSection]: [
                                          ...(prev.subsections[targetSection] ||
                                            []),
                                          ...droppedFiles,
                                        ],
                                      },
                                    }));
                                  }}
                                  onSetBaseText={(file) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      baseText: file.name,
                                    }))
                                  }
                                  onRemoveFile={removeFileFromSection}
                                  onSelectFolderTrigger={(targetSection) => {
                                    setTargetSubsection(targetSection);
                                    folderInput.current?.click();
                                  }}
                                  onSelectFilesTrigger={(e, targetSection) => {
                                    setTargetSubsection(targetSection);
                                    handleFolderUpload(e);
                                  }}
                                  onDragStartFile={handleDragStart}
                                  onRemoveSubsection={removeSubsection}
                                />
                              ),
                            )
                          ) : (
                            <p className="text-[0.8rem] text-gray-300 italic py-4 text-center">
                              No subsections created. Add a subsection above to
                              begin organizing.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SINGLE MODE standard upload */}
                  {formData.multi === false && (
                    <div className="flex flex-col gap-4 pt-10 w-full h-full">
                      {/* MAIN UNIFIED CONTAINER */}
                      <div
                        {...getTextRootProps()}
                        className={`border-2 border-dashed border-gray-300 flex-col overflow-auto h-full p-4 text-gray-300 w-full rounded-lg bg-gray-700 flex items-start justify-start transition ${isTextDragReject
                            ? "border-red-500 text-red-400 bg-red-50"
                            : isTextDragActive
                              ? "border-cyan-500 text-cyan-400 bg-cyan-700"
                              : ""
                          }`}
                      >
                        <input {...getTextInputProps()} />

                        {/* HEADER CONTROL BAR */}
                        <div className="flex flex-row justify-between items-center w-full pb-2 border-b mb-3">
                          <div className="flex items-center gap-2">
                            <p className="text-md font-bold text-cyan-100">
                              Uploaded Texts
                            </p>
                            <span className="text-[0.8rem] text-gray-300 font-normal">
                              ({formData.files.length}{" "}
                              {formData.files.length === 1 ? "file" : "files"})
                            </span>
                          </div>

                          {/* Clear All Action */}
                          <div className="justify-end flex flex-row items-center gap-4">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearAll();
                              }}
                              className="hover:bg-gray-600/70 p-1 rounded-sm text-red-400  font-bold cursor-pointer flex flex-row items-center gap-1 text-[0.8rem]"
                            >
                              <p>Clear All</p>
                              <Eraser className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* BASE TEXT INDICATOR */}
                        {/* <div className="text-[0.8rem] font-bold text-cyan-100 mb-3 overflow-wrap">
                    Base Text Prefix:{" "}
                    <input className="font-normal text-gray-100 rounded-md appearance-none bg-gray-800 outline-none p-1 shadow-gray-600/40 shadow-md hover:shadow-gray-600/40 shadow-lg focus:shadow-gray-600/40 shadow-lg "
                      type="text"
                      value={formData.baseText != "" ? formData.baseText : "None"}
                      onChange={(e)=>{setFormData((prev)=>({...prev, baseText:e.target.value}))}}
                    />
                  </div> */}
                        <div className="text-[0.8rem] font-bold text-cyan-100 mb-3 overflow-wrap">
                          Base Text:{" "}
                          {formData.baseText != "" ? formData.baseText : "None"}
                        </div>

                        {/* HIDDEN FOLDER INPUT */}
                        <input
                          type="file"
                          ref={folderInput}
                          className="hidden"
                          {...({ webkitdirectory: "", directory: "" } as any)}
                          directory="true"
                          multiple
                          onChange={handleFolderUpload}
                        />

                        {/* SINGLE MAIN CONTENT BOX */}
                        <div className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-800 shadow-gray-600/40 shadow-xs transition-all hover:border-cyan-400">
                          {/* INNER HEADER WITH UPLOAD BUTTONS */}
                          <div className="flex items-center justify-between border-b pb-2 mb-2">
                            <div className="flex items-center gap-2 font-bold text-cyan-50 text-sm">
                              <FolderOpen className="w-5 h-5 text-cyan-400" />
                              <span>Uploaded Files</span>
                            </div>

                            {/* Inline Upload Triggers */}
                            <div className="flex items-center gap-2 text-[0.8rem]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openFilePicker();
                                }}
                                className="bg-cyan-700 hover:bg-cyan-800 text-cyan-100 font-semibold px-2 py-1 rounded border border-cyan-200 transition cursor-pointer"
                              >
                                + Files
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  folderInput.current?.click();
                                }}
                                className="bg-cyan-700 hover:bg-cyan-800 text-cyan-100 font-semibold px-2 py-1 rounded border border-cyan-200 transition cursor-pointer"
                              >
                                + Folder
                              </button>
                            </div>
                          </div>

                          {/* FILE LIST OR DROP HINT */}
                          {formData.files.length > 0 ? (
                            <ul className="space-y-1 mt-2 max-h-full overflow-auto pr-1">
                              {formData.files.map((file, fileIndex) => {
                                let isBase = file.name === formData.baseText;
                                return (
                                  <li
                                    key={`${file.name}-${fileIndex}`}
                                    className={`flex items-center justify-between px-2 py-1 rounded border text-[0.8rem] ${isBase
                                        ? "bg-cyan-800/60 border-cyan-300"
                                        : "bg-gray-700 border-gray-100 hover:bg-gray-600"
                                      }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFormData((prev) => ({
                                          ...prev,
                                          baseText: file.name,
                                        }));
                                      }}
                                      className="bg-transparent w-98/100 text-cyan-400 rounded-lg flex-row flex gap-2 items-center shrink-0 cursor-pointer text-left"
                                    >
                                      {isBase ? (
                                        <FileCheck className="w-5 h-5" />
                                      ) : (
                                        <FileText className="w-5 h-5" />
                                      )}
                                      <p className="text-[0.8rem] font-medium text-cyan-100 truncate max-w-[300px]">
                                        {file.name}
                                      </p>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(file);
                                      }}
                                      className="text-red-400 hover:bg-gray-300 p-0.5 rounded transition cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <div className="py-8 text-center border-1 border-dashed border-gray-200 rounded-md bg-gray-700/50 text-[0.8rem] text-gray-300">
                              Drag and drop files or folders directly anywhere
                              in this box
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {formData.multi !== null && (
                    <div className="flex flex-row justify-between content-end items-end pt-2">
                      <button
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, multi: null }))
                        }
                        className="px-5 py-2 border border-gray-300 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition"
                      >
                        Back
                      </button>
                      <div className="flex flex-col w-max gap-2">
                      
                      <button
                        disabled={totalFilesCount < 2}
                        onClick={() => handleStepChange(2)}
                        className="px-5 py-2 bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
                      >
                        Continue
                      </button>
                      <button 
                      disabled={totalFilesCount < 2}
                      onClick={()=>handleStepChange(1.2)}
                      className="px-5 py-2 bg-green-600 text-gray-900 font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition">
                        Optional: Upload Spreadsheet</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {(currentStep===1.2)&& (
              <div className="h-full w-full justify-between flex flex-col">
                <h2 className="text-4xl font-bold h-max text-gray-200 pt-10 ">
                  Optional: Upload Spreadsheet
                </h2>
                <div className="flex h-full w-full pt-10 gap-5 flex-row">
               <div
                        {...getSpreadsheetRootProps()}
                        className={`border-2 border-dashed border-gray-300 flex-col place-content-center place-items-center h-full p-4 text-gray-300 w-full rounded-lg bg-gray-700 flex  transition ${isTextDragReject
                            ? "border-red-500 text-red-400 bg-red-50"
                            : isTextDragActive
                              ? "border-cyan-500 text-cyan-400 bg-cyan-700"
                              : ""
                          }`}
                      >
                        <input {...getSpreadsheetInputProps()} />

                        {/* HEADER CONTROL BAR */}
                        <div className="w-full p-3 border-2 place-content-center border-dashed border-gray-300 rounded-lg h-full bg-gray-800 shadow-gray-600/40 shadow-xs transition-all hover:border-cyan-400">
                        <div className="flex flex-row h-max justify-between items-center w-full pb-2  border-b mb-3">
                          <div className="flex items-center gap-2">
                            <p className="text-md font-bold text-cyan-100">
                              Uploaded Alignment Matrix
                            </p>
                           
                          </div>

                          
                        </div>
                        {formData.spreadsheet != null ? (
                            <ul className="space-y-1 mt-2 h-full w-full overflow-auto pr-1">
                              <div className={`flex items-center justify-between flex-row w-full gap-2 px-2 py-1 text-cyan-100 rounded border text-[0.8rem] bg-gray-700 border-gray-100 hover:bg-gray-600
                                      `}>
                                        <div className="flex flex-row gap-2">
                                        <FileText className="w-5 h-5" />
                                        {formData.spreadsheet.name}
                              </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFormData((prev)=>({
                                          ...prev,
                                          spreadsheet: null
                                        }))
                                      }}
                                      className="text-red-400 hover:bg-gray-300 p-0.5 rounded transition cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                               </div>   
                              
                            </ul>
                          ) : (
                            <div className="py-8 text-center w-full h-9/10 rounded-md bg-gray-700/50 text-[0.8rem] text-gray-300">
                              Drag and drop or click to upload an .xlsx spreadsheet file.
                            </div>
                          )}
              </div></div>
              <div className="text-base pt-2 gap-2 text-cyan-200  shadow-gray-600/40 shadow-lg/40 w-full h-full rounded-lg p-5  overflow-auto">
                          <p className="text-lg font-bold">Description</p>
                          <p>Explain what type of spreadsheet to upload (or maybe include a template to download)</p>
                        </div>
              </div>
               <div className="flex flex-row justify-between content-center h-max items-center pt-2">
                      <button
                        onClick={() =>
                          handleStepChange(1)
                        }
                        className="px-5 py-2 border border-gray-300 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition"
                      >
                        Back
                      </button>
                      <div className="flex flex-col gap-2 w-max"><button
                      disabled = {formData.spreadsheet==null}
                        onClick={() => {
                          handleUploadSpreadsheet();
                          handleStepChange(2.2);
                        }}
                        className="px-5 py-2 cursor-pointer bg-green-600 text-gray-900 font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
                      >
                        Confirm Upload
                      </button>
                        <button
                        onClick={() => handleStepChange(2)}
                        className="px-5 py-2 cursor-pointer bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
                      >
                        Skip
                      </button>
                      
                      </div>
                    </div>
              </div>
            )}
            {/* SELECT ALGORITHM */}
            {((currentStep === 2) || (currentStep===2.5) || (currentStep===2.2)) && (
              <div className=" h-full w-full place-content-center flex flex-col">
                <h2 className="text-4xl font-bold text-gray-200  ">
                  Select Algorithm
                </h2>
                <div className="h-8/10">
                  <div className="space-y-1 h-full flex  w-full pt-10 pb-10">
                    <div className="flex flex-row h-full w-full content-center items-start">
                      <div className="flex flex-row h-full gap-10 content-center w-full">
                        <div className="flex flex-col h-full content-center items-center gap-2 w-1/3">
                          {/* <label className="block text-2xl font-medium text-gray-200 mb-1">Select Algorithm</label> */}
                          <div className="flex flex-col gap-2 pt-2 w-full">
                            {/* Label */}
                            <label
                              htmlFor="algorithm"
                              className="block text-md font-medium text-gray-200 place-content-start"
                            >
                              Choose an Algorithm
                            </label>

                            {/* Select Container with Custom Arrow */}
                            <div className="relative ">
                              <select
                                id="algorithm"
                                className="block w-full pl-3 pr-10 py-2 text-[0.8rem] outline-none border-none  bg-gray-800  rounded-md shadow-gray-600/40 shadow-md appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70
                     rounded-md   cursor-pointer transition-colors"
                                defaultValue={formData.algorithm}
                                onChange={(e) =>
                                  setFormData((p) => ({
                                    ...p,
                                    algorithm: e.target.value,
                                  }))
                                }
                              >
                                <option
                                  disabled
                                  value=""
                                  className="text-gray-300/20"
                                >
                                  Select an Algorithm
                                </option>
                                <option value="ndw" className="text-gray-100">
                                  Needleman-Wunsch Algorithm
                                </option>
                                <option value="sw" className="text-gray-100">
                                  Smith-Waterman Algorithm
                                </option>
                              </select>

                              {/* Custom Dropdown Chevron Icon */}
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
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
                                  <div className="w-5/10">
                                    {/* Match Bonus*/}
                                    <div className="flex justify-between items-center text-md font-medium text-gray-200">
                                      <label htmlFor="matchBonus">
                                        Match Bonus
                                      </label>
                                    </div>

                                    <input
                                      id="matchBonus"
                                      type="number"
                                      value={
                                        Number.isNaN(formData.settings.matchBonus)
                                          ? ""
                                          : formData.settings.matchBonus
                                      }
                                      onChange={(e) =>
                                        handleSettingChange(
                                          "matchBonus",
                                          isNaN(e.target.valueAsNumber)
                                            ? null
                                            : e.target.valueAsNumber < 0
                                              ? -e.target.valueAsNumber
                                              : e.target.valueAsNumber,
                                        )
                                      }
                                      className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
                                    />

                                    {/* Gap Penalty */}
                                    <div className="flex justify-between items-center text-md font-medium text-gray-200">
                                      <label htmlFor="gapPenalty">
                                        Gap Penalty
                                      </label>
                                    </div>
                                    <div className="flex flex-row text-gray-300 text-lg place-items-center gap-1">
                                      <input
                                        id="gapPenalty"
                                        type="number"
                                        value={
                                          isNaN(formData.settings.gapPenalty)
                                            ? ""
                                            : formData.settings.gapPenalty
                                        }
                                        onChange={(e) =>
                                          handleSettingChange(
                                            "gapPenalty",
                                            isNaN(e.target.valueAsNumber)
                                              ? null
                                              : e.target.valueAsNumber < 0
                                                ? e.target.valueAsNumber
                                                : -e.target.valueAsNumber,
                                          )
                                        }
                                        className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
                                      />
                                    </div>
                                    {/* Mismatch Penalty */}
                                    <div className="flex justify-between items-center text-md font-medium text-gray-200">
                                      <label htmlFor="mismatchPenalty">
                                        Mismatch Penalty
                                      </label>
                                    </div>

                                    <input
                                      id="mismatchPenalty"
                                      type="number"
                                      value={
                                        isNaN(formData.settings.mismatchPenalty)
                                          ? ""
                                          : formData.settings.mismatchPenalty
                                      }
                                      onChange={(e) =>
                                        handleSettingChange(
                                          "mismatchPenalty",
                                          isNaN(e.target.valueAsNumber)
                                            ? null
                                            : e.target.valueAsNumber < 0
                                              ? e.target.valueAsNumber
                                              : -e.target.valueAsNumber,
                                        )
                                      }
                                      className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
                                    />
                                    <div className="flex flex-row gap-3 content-center items-center text-md pt-2 font-medium text-gray-200">
                                      <input
                                        type="checkbox"
                                        checked={formData.settings.spaceStrip}
                                        onChange={(handleSpaceStrip)}
                                        className={`rounded-full  accent-cyan-500 text-gray-300 border-1 border-none shadow-gray-600/40 shadow-sm shadow-gray-600/40 shadow-gray-700/70 hover:shadow-gray-600/40 shadow-md outline-none w-4 h-4 appearance-none 
                  ${formData.settings.spaceStrip ? "bg-cyan-700 shadow-gray-600/40 shadow-xs shadow-gray-600/40 shadow-cyan-200" : "bg-gray-800"}`}
                                      />
                                      <label className="">
                                        <div className="">
                                          Remove Whitespace From Text
                                        </div>
                                      </label>
                                    </div>
                                  </div>
                                  <div className="w-6/10">
                                    {/* Optional Special Character Bonus */}
                                    <p className="font-medium text-[1.1rem] text-cyan-100 pb-1">
                                      Optional Settings
                                    </p>
                                    {formData.algorithm === "ndw" && (
                                      <div>
                                        {/* Affine Gap Penalty */}
                                        <div className="flex justify-between items-center text-md font-medium text-gray-200">
                                          <label htmlFor="affinePenalty">
                                            Affine Penalty
                                          </label>
                                        </div>

                                        <input
                                          id="affinePenalty"
                                          type="number"
                                          value={
                                            isNaN(formData.settings.affinePenalty)
                                              ? ""
                                              : formData.settings.affinePenalty
                                          }
                                          onChange={(e) =>
                                            handleSettingChange(
                                              "affinePenalty",
                                              isNaN(e.target.valueAsNumber)
                                                ? null
                                                : e.target.valueAsNumber < 0
                                                  ? e.target.valueAsNumber
                                                  : -e.target.valueAsNumber,
                                            )
                                          }
                                          className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
                                        />
                                      </div>
                                    )}
                                    {/* Label */}
                                    <label
                                      htmlFor="special"
                                      className="block text-md font-medium text-gray-200 place-content-start"
                                    >
                                      Optional Special Character Bonus
                                    </label>

                                    {/* Select Container with Custom Arrow */}
                                    <div className="relative">
                                      <select
                                        id="special"
                                        className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] cursor-pointer transition-colors"
                                        value={formData.settings.special.join(
                                          ",",
                                        )}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (!val) {
                                            handleSettingChange("special", []);
                                            handleSettingChange(
                                              "specialOther",
                                              false,
                                            );
                                          } else if (val === "Other") {
                                            handleSettingChange("special", [
                                              "Other",
                                            ]);
                                            handleSettingChange(
                                              "specialOther",
                                              true,
                                            );
                                          } else {
                                            // Split the comma-separated value string into a clean array
                                            handleSettingChange(
                                              "special",
                                              val.split(","),
                                            );
                                            handleSettingChange(
                                              "specialOther",
                                              false,
                                            );
                                          }
                                        }}
                                      >
                                        <option
                                          value=""
                                          className="text-gray-300/20"
                                        >
                                          None
                                        </option>
                                        {/* Pass standard comma-separated strings as values */}
                                        <option
                                          value="ך,ם,ן,ף,ץ"
                                          className="text-gray-100"
                                        >
                                          Sofit Letters
                                        </option>
                                        <option
                                          value="A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z"
                                          className="text-gray-100"
                                        >
                                          Capital Letters (Latin Alphabet)
                                        </option>
                                        <option
                                          value="Other"
                                          className="text-gray-100"
                                        >
                                          Custom
                                        </option>
                                      </select>
                                      {/* Custom Dropdown Chevron Icon */}
                                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
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
                                          className="block pt-2 text-md font-medium text-gray-200 place-content-start"
                                        >
                                          Enter a space-separated list of
                                          characters.
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
                                            formData.settings.special.includes(
                                              "Other",
                                            )
                                              ? ""
                                              : formData.settings.special.join(
                                                " ",
                                              )
                                          }
                                          placeholder="1 2 3"
                                          className="shadow-gray-600/40 shadow-md pt-2 w-full text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 outline-none border-none appearance-none p-1"
                                        />
                                      </div>
                                    )}
                                    <div className="pt-2">
                                      {formData.settings.special.includes(
                                        "Other",
                                      ) === false && (
                                          <label className="pt-2 text-cyan-200">
                                            {formData.settings.special.join(" ")}
                                          </label>
                                        )}
                                    </div>

                                    {formData.settings.special?.length > 0 && (
                                      <div>
                                        <div className="flex justify-between items-center text-md  font-medium text-gray-200">
                                          <label
                                            htmlFor="specialBonus"
                                            className="pt-2"
                                          >
                                            Special Character Bonus
                                          </label>
                                        </div>

                                        <input
                                          id="specialBonus"
                                          type="number"
                                          value={
                                            Number.isNaN(
                                              formData.settings.specialBonus,
                                            )
                                              ? ""
                                              : formData.settings.specialBonus
                                          }
                                          onChange={(e) =>
                                            handleSettingChange(
                                              "specialBonus",
                                              isNaN(e.target.valueAsNumber)
                                                ? null
                                                : e.target.valueAsNumber,
                                            )
                                          }
                                          className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* options for layout: 
                <pre>
                Preserves spacing (tabs, new lines, etc.)
                </pre>
                or
                <br/> 
                which is basically a new line character
                text sizing:
                text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, etc.*/}
                          </div>
                        </div>
                        <div className="text-base pt-2 gap-2 text-cyan-200  shadow-gray-600/40 shadow-lg/40 w-7/10 h-full rounded-lg p-5  overflow-auto">
                          <p className="text-lg font-bold">Description</p>
                          <p>Description text</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row  justify-between">
                    <button
                      onClick={() => (currentStep===2 ? handleStepChange(1) : (currentStep===2.5? handleStepChange(3.5) : handleStepChange(1.2)))}
                      className="px-5 py-2 border border-gray-300 text-gray-200 h-max font-medium rounded-lg hover:bg-gray-700 transition"
                    >
                      Back
                    </button>
                    <div className="flex flex-col justify-normal h-max w-max gap-2">
                    <button
                      onClick={handleSubmit}
                      disabled={!isReady || isProcessing}
                      className = {`relative overflow-hidden px-5 py-2  font-medium rounded-lg transition-all duration-200 ${
                      isProcessing
                        ? "bg-gray-400 text-gray-900 cursor-not-allowed"
                        : "bg-cyan-500 text-gray-900 hover:bg-cyan-700 disabled:bg-gray-300"
                    }`}
                      // className="relative overflow-hidden px-5 py-2 w-max h-max bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-600 transition"
                    >
                      {isProcessing && (
                          <div
                            className="absolute inset-y-0 left-0 bg-cyan-500 transition-all duration-150 ease-out"
                            style={{ width: `${progress}%` }}
                          />
                        )}
                        <span className="relative z-10 flex items-center justify-center">
                          {isProcessing ? `Processing: ${progress}% Completed` : "Run Algorithm"}
                        </span>
                      {/* {isProcessing ? "Processing..." : "Run Algorithm"} */}
                    </button>
                     {((formData.spreadsheet!=null)) && (
                      <button
                        onClick={() => handleStepChange(4)}
                        disabled={
                          isProcessing 
                        }
                        className="px-5 py-2 bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
                      >
                        Select Plot Settings
                      </button>)}
                      </div>
                  </div>
                </div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="flex h-full self-start place-content-start w-full">
                <div className="flex flex-col justify-between place-content-start pt-4  w-full">
                  <h1 className="text-4xl w-5/10 font-bold text-gray-200 pt-10 pb-2">
                    {formData.algorithm == "ndw"
                      ? "Needleman-Wunsch"
                      : "Smith-Waterman"}{" "}
                    Alignment
                  </h1>

                  <div className="h-8/10 w-full flex flex-row">
                      
                      
                        {showPrevious && (
                          <nav className="w-max border-1 border-white p-2 h-max">
                          <h3 className="font-bold mb-2">Skip to Base Text</h3>
                          <ul className="gap-2 cursor-pointer">
                            {[...prevBaseTexts].reverse().map((text) => (
                            
                            <li key={text.split("_")[0]} onClick={() => scrollToSection(text.split("_")[0])}>{text.split("_")[0]}</li>
                            
                            ))}
                          </ul>
                        </nav>
                        )}
                      
                    <div className="pl-5 flex flex-row w-full gap-6">
                      <div className="flex-col overflow-auto place-content-start place-items-start h-full place-self-start w-full flex pt-5 " ref={containerRef}>
                        
                        <div className="flex flex-col items-center content-center">
                        <section
                        id={formData.baseText.split("_")[0]}
                        className="flex flex-col items-center w-full"
                      >
                        <div className="w-max h-max">
                        <p className="text-xs font-semibold text-gray-300 mb-1">
                                  Base Text: {formData.baseText.split("_")[0]}
                        </p>
                          <p className="text-gray-100  whitespace-pre-wrap text-justify font-mono" style={{ direction: rtlLangs.test(results.output_logs) ? "rtl" : "ltr", unicodeBidi: 'embed' }}>
                            {results.output_logs}
                          </p>
                          
                        </div>
                        </section>
                        
                      
                      {/* Declaratively Render Previous Alignments */}
                      
                      {showPrevious &&
                        allResults.
                          reverse().filter(
                            (dict) =>
                              dict.baseText?.split("_")[0] !== formData.baseText?.split("_")[0]
                          )
                          .map((dict) => {
                            const logText = dict.alignments || dict.output_logs || "";
                            return (
                              <section id={dict.baseText.split("_")[0]} key={dict.baseText}>
                              <div  className="w-full border-t h-max border-gray-200 pt-4 mt-2">
                                <p className="text-xs font-semibold text-gray-300 mb-1">
                                  Base Text: {dict.baseText.split("_")[0]}
                                </p>
                                <p
                                  className="text-gray-100 whitespace-pre-wrap text-justify font-mono"
                                  style={{
                                    direction: rtlLangs.test(logText) ? "rtl" : "ltr",
                                    unicodeBidi: "embed",
                                  }}
                                >
                                  {logText}
                                </p>
                              </div>
                              </section>
                            );
                          })}
                      </div>
                      
                      </div>
                    
                     
                      <div className="text-base w-full h-9/10 pt-2 gap-2  text-cyan-200 shadow-gray-600/40 shadow-lg/40  rounded-lg p-5  overflow-auto">
                        <p className="text-lg font-bold">Description</p>
                        <p>Description text</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-row w-4/10 pt-2 place-content-center">
                   {prevBaseTexts.size > 1 && (
                        <button
                          className="px-5 py-2 bg-cyan-600  text-gray-900 font-medium h-max w-max rounded-lg hover:bg-cyan-700 cursor-pointer transition"
                          onClick={() => setShowPrevious((prev) => !prev)}
                        >
                          {showPrevious ? "Hide Previous Alignments" : "View Previous Alignments"}
                        </button>
                      )}
                      </div>
                  <div className="flex flex-row pt-2 h-max justify-between items-start content-start">
                     
                    <button
                      onClick={() => handleStepChange(2)}
                      className="px-5 py-2 border border-gray-300 h-max text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition"
                    >
                      Back
                    </button>
                    <div className="flex flex-col items-center w-max gap-2">
                    <PDFDownloadLink
                      document={<AlignmentsDoc />}
                      fileName="alignments.pdf"
                      className="px-5 py-2 bg-sky-600 h-max text-gray-900 font-medium rounded-lg hover:bg-sky-700"
                    >
                      {({ blob, url, loading, error }) =>
                        loading
                          ? "Generating Alignments File..."
                          : "Download New Alignments Only"
                      }
                    </PDFDownloadLink>
                    <PDFDownloadLink
                      document={<AllAlignmentsDoc />}
                      fileName="alignments.pdf"
                      className="px-5 py-2 bg-sky-700 h-max text-gray-900 font-medium rounded-lg hover:bg-sky-800"
                    >
                      {({ blob, url, loading, error }) =>
                        loading
                          ? "Generating Alignments File..."
                          : "Download All Generated Alignments"
                      }
                    </PDFDownloadLink>
                    </div>
                  
                    <div className="flex flex-col items-center w-max gap-2">
                        {(prevBaseTexts.size!=allBaseTexts.length) && (
                          <button
                        onClick={() => handleStepChange(3.5)}
                        disabled={
                          isProcessing 
                        }
                        className="px-5 py-2 bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
                      >
                        Select Another Base Text
                      </button>
                      )}
                      {((prevBaseTexts.size===allBaseTexts.length)||(formData.spreadsheet!=null)) && (
                      <button
                        onClick={() => handleStepChange(4)}
                        disabled={
                          isProcessing 
                        }
                        className="px-5 py-2 bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
                      >
                        Select Plot Settings
                      </button>)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {currentStep === 3.5 && (
              <div className="pt-4 h-full">
                 <h2 className="text-3xl font-bold text-gray-100">
                        Select Next Base Text
                      </h2>
                <div className="h-95/100">
              {
                formData.multi === true && (
                  <div className="flex flex-col gap-4 w-full h-full pt-10">
                    <h2 className="text-3xl font-bold text-gray-100">
                      Transcriptions
                    </h2>
                    {/* TOP PANEL: CONTROL BAR & SUBSECTION LIST */}
                    <div className="border-2 border-dashed border-gray-300 flex-col overflow-auto h-full p-4 text-gray-300 w-full rounded-lg bg-gray-700 flex items-start justify-start">
                      {/* Subsection Creator Header */}
                      <div className="flex flex-row justify-between items-center w-full pb-2 border-b mb-3">
                        <div className="flex items-center gap-2">
                          <p className="text-md font-bold text-cyan-100">
                            Uploaded Texts
                          </p>
                        </div>


                      </div>


                        <div className="text-[0.8rem] font-bold mb-3 overflow-wrap text-cyan-100">
                        <p className={`${[...prevBaseTexts].map((text, index)=>(prevBaseTexts[index]=text.split("_")[0])).includes(formData.baseText.split("_")[0]) ? "text-red-300 " : "text-cyan-100"}`}>Base Text:{" "}
                        {formData.baseText != "" ? formData.baseText.split("_")[0] : "None"}
                        </p>
                        <div className="flex flex-row items-center content-center gap-1">
                        <p>
                        Previous Base Texts: </p>
                        {[...prevBaseTexts].map((text)=>(
                          
                          <p className={`${text.split("_")[0]==formData.baseText.split("_")[0] ? "text-red-300 " : "text-cyan-100"}`} key={text}> {" "} {text.split("_")[0]} |</p> 
                        ))}</div>
                      </div>


                      {/* SUBSECTION BOXES */}
                      <div className="w-full space-y-4 overflow-y-auto pr-1">
                        {(Object.keys(formData.subsections).length > 0) && (
                          Object.keys(formData.subsections).map(
                            (sectionName) => (
                              <div>

                                {/* Header info */}
                                <div className="flex items-center justify-between border-b pb-2 mb-2">
                                  <div className="flex items-center gap-2 font-bold text-cyan-50 text-[0.8rem]">
                                    <FolderOpen className="w-5 h-5 text-cyan-400" />
                                    <span>{sectionName}</span>

                                    <span className="text-[0.8rem] text-gray-300 font-normal">
                                      ({formData.subsections[sectionName].length} {formData.subsections[sectionName].length === 1 ? "file" : "files"})
                                    </span>
                                  </div>


                                </div>



                                <ul className="space-y-1 mt-2">
                                  {formData.subsections[sectionName].map((file, fileIndex) => (
                                    <li
                                      key={`${file.name}-${fileIndex}`}
                                      className={`flex items-center justify-between px-2 py-1 rounded border text-[0.8rem] ${file.name === formData.baseText
                                          ? "bg-cyan-800/60 border-cyan-300"
                                          : "bg-gray-700 border-gray-100 hover:bg-gray-600"
                                        }`}
                                    >
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFormData((prev) => ({
                                            ...prev,
                                            baseText: file.name,
                                          }));
                                        }}
                                        className={`bg-transparent text-cyan-400 rounded-lg flex-row w-98/100 flex gap-2 content-center items-center shrink-0 cursor-pointer `}
                                      >
                                        {file.name === formData.baseText ? (
                                          <FileCheck className="w-5 h-5" />
                                        ) : (
                                          <FileText className="w-5 h-5" />
                                        )}
                                        <p className="text-[0.8rem] font-medium text-cyan-100">
                                          {file.name}
                                        </p>
                                      </button>


                                    </li>
                                  ))}
                                </ul>
                                </div>



                                
                              
                      )))}
                    </div>

                      </div>
                    </div>
                 

              
            )}

            {/* SINGLE MODE standard upload */}
            {formData.multi === false && (
              <div className="flex flex-col gap-4 pt-10 w-full h-full">
               

                  {/* HEADER CONTROL BAR */}
                  <div className="flex flex-row justify-between items-center w-full pb-2 border-b mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-md font-bold text-cyan-100">
                        Transcriptions
                      </p>
                      <span className="text-[0.8rem] text-gray-300 font-normal">
                        ({formData.files.length}{" "}
                        {formData.files.length === 1 ? "file" : "files"})
                      </span>
                    </div>

                  </div>

                
                  <div className="text-[0.8rem] font-bold mb-3 overflow-wrap text-cyan-100">
                        <p className={`${prevBaseTexts.has(formData.baseText) ? "text-red-300 " : "text-cyan-100"}`}>Base Text:{" "}
                        {formData.baseText != "" ? formData.baseText : "None"}
                        </p>
                        <div className="flex flex-row items-center content-center gap-1">
                        <p>
                        Previous Base Texts: </p>
                        {[...prevBaseTexts].map((text)=>(
                          text != "" ?
                          <p className={`${text==formData.baseText ? "text-red-300 " : "text-cyan-100"}`} key={text}>  {" "} {text} | </p> :
                          ""
                        ))}</div>
                      </div>

             

                  {/* SINGLE MAIN CONTENT BOX */}
                  <div className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-800 shadow-gray-600/40 shadow-xs transition-all hover:border-cyan-400">
                    {/* INNER HEADER WITH UPLOAD BUTTONS */}
                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                      <div className="flex items-center gap-2 font-bold text-cyan-50 text-sm">
                        <FolderOpen className="w-5 h-5 text-cyan-400" />
                        <span>Uploaded Files</span>
                      </div>


                    </div>

                    {/* FILE LIST OR DROP HINT */}
                    {formData.files.length > 0 && (
                      <ul className="space-y-1 mt-2 max-h-full overflow-auto pr-1">
                        {formData.files.map((file, fileIndex) => {
                          let isBase = file.name === formData.baseText;
                          return (
                            <li
                              key={`${file.name}-${fileIndex}`}
                              className={`flex items-center justify-between px-2 py-1 rounded border text-[0.8rem] ${isBase
                                  ? "bg-cyan-800/60 border-cyan-300"
                                  : "bg-gray-700 border-gray-100 hover:bg-gray-600"
                                }`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData((prev) => ({
                                    ...prev,
                                    baseText: file.name,
                                  }));
                                }}
                                className="bg-transparent w-98/100 text-cyan-400 rounded-lg flex-row flex gap-2 items-center shrink-0 cursor-pointer text-left"
                              >
                                {isBase ? (
                                  <FileCheck className="w-5 h-5" />
                                ) : (
                                  <FileText className="w-5 h-5" />
                                )}
                                <p className="text-[0.8rem] font-medium text-cyan-100 truncate max-w-[300px]">
                                  {file.name}
                                </p>
                              </button>


                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              
            )}
            </div>
             <div className="flex flex-row pt-2 h-max justify-between items-start content-start">
                    <button
                      onClick={() => handleStepChange(3)}
                      className="px-5 py-2 border border-gray-300 h-max text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition"
                    >
                      Back
                    </button>
                    <div className="flex flex-col items-center w-max gap-2">
                    <button
                      onClick={handleSubmit}
                      disabled={!isReady || isProcessing}
                      className = {`relative overflow-hidden px-5 py-2 font-medium rounded-lg transition-all duration-200 ${
                      isProcessing
                        ? "bg-gray-400 text-gray-900 cursor-not-allowed"
                        : "bg-cyan-500 text-gray-900 hover:bg-cyan-700 disabled:bg-gray-300"
                    }`}
                     
                    >
                      {isProcessing && (
                          <div
                            className="absolute inset-y-0 left-0 bg-cyan-500 transition-all duration-150 ease-out"
                            style={{ width: `${progress}%` }}
                          />
                        )}
                        <span className="relative z-10 flex items-center justify-center">
                          {isProcessing ? `Processing: ${progress}% Completed` : "Run Algorithm"}
                        </span>
                      
                    </button>
                      <button
                        onClick={() => handleStepChange(2.5)}
                        disabled={
                          isProcessing 
                        }
                        className="px-5 py-2 bg-cyan-600 text-gray-800 font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
                      >
                        Modify Algorithm Settings
                      </button>
                     </div>
                    </div>
                  </div>
                  
            
            )}
            {currentStep === 4 && (
              <div className="flex content-start h-[71vh] pt-10 flex-col pt-4">
                <h1 className="text-4xl w-5/10 font-bold text-gray-200 pt-10 pb-2">
                  Plot Settings
                </h1>

                <div className="h-full">
                  <div className="space-y-1 h-full flex  w-10/10 pt-5">
                    <div className="flex flex-row content-between items-start">
                      <div className="flex flex-row gap-5 items-start">
                        <div className="flex flex-col content-center items-center gap-2 w-[25dvw]">
                          <div className="flex flex-col gap-2 pt-2 w-full">
                            {/* Label */}
                            <label
                              htmlFor="plotDimensions"
                              className="block text-md font-medium text-gray-200 place-content-start"
                            >
                              Choose a Plot Format
                            </label>

                            <div className="relative ">
                              <select
                                id="plotDimensions"
                                className="block w-full pl-3 pr-10 py-2 text-[0.8rem] outline-none border-none  bg-gray-800  rounded-md shadow-gray-600/40 shadow-md appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70
              rounded-md   cursor-pointer transition-colors"
                                defaultValue={formData.plotSettings.plotType}
                                onChange={(e) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    plotSettings: {
                                      ...prev.plotSettings,
                                      plotType: e.target.value,
                                    },
                                  }));
                                }}
                              >
                                <option
                                  disabled
                                  value=""
                                  className="text-gray-300/20"
                                >
                                  Select an Plot Type
                                </option>
                                <option value="3da" className="text-gray-100">
                                  3D Interactive
                                </option>
                                <option value="3ds" className="text-gray-100">
                                  3D Static
                                </option>
                                <option value="2d" className="text-gray-100">
                                  2D
                                </option>
                              </select>

                              {/* Custom Dropdown Chevron Icon */}
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
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
                            <div className="flex justify-between items-center text-md  font-medium text-gray-200">
                              <label htmlFor="perplexity" className="pt-2">
                                Perplexity Value
                              </label>
                            </div>

                            <input
                              id="perplexity"
                              type="number"
                              value={
                                Number.isNaN(formData.plotSettings.perplexity)
                                  ? ""
                                  : formData.plotSettings.perplexity
                              }
                              onChange={(e) => {
                                const val = e.target.valueAsNumber;
                                setFormData((prev) => ({
                                  ...prev,
                                  plotSettings: {
                                    ...prev.plotSettings,
                                    perplexity: Number.isNaN(val) ? null : val,
                                  },
                                }));
                              }}
                              className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
                            />

                            <div className="flex justify-between items-center text-md  font-medium text-gray-200">
                              <label htmlFor="theta" className="pt-2">
                                Theta Value
                              </label>
                            </div>

                            <input
                              id="theta"
                              type="number"
                              value={
                                Number.isNaN(formData.plotSettings.theta)
                                  ? ""
                                  : formData.plotSettings.theta
                              }
                              onChange={(e) => {
                                const val = e.target.valueAsNumber;
                                setFormData((prev) => ({
                                  ...prev,
                                  plotSettings: {
                                    ...prev.plotSettings,
                                    theta: Number.isNaN(val) ? null : val,
                                  },
                                }));
                              }}
                              className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
                            />
                            {formData.plotSettings.plotType == "2d" && (
                              <div>
                                <label
                                  htmlFor="plotDimensions"
                                  className="block text-md font-medium text-gray-200 place-content-start"
                                >
                                  Optional Plot Color Settings
                                </label>
                                <div className="relative ">
                                  <select
                                    id="colors"
                                    className="block w-full pl-3 pr-10 py-2 text-[0.8rem] outline-none border-none  bg-gray-800  rounded-md shadow-gray-600/40 shadow-md appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70
              rounded-md   cursor-pointer transition-colors"
                                    defaultValue={formData.plotSettings.colors}
                                    onChange={(e) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        plotSettings: {
                                          ...prev.plotSettings,
                                          colors: e.target.value,
                                        },
                                      }));
                                    }}
                                  >
                                    <option
                                      value="black"
                                      className="text-gray-100"
                                    >
                                      Black (Default)
                                    </option>
                                    <option
                                      value="base"
                                      className="text-gray-100"
                                    >
                                      By Base Text
                                    </option>
                                    <option
                                      value="grouping"
                                      className="text-gray-100"
                                    >
                                      By Group
                                    </option>
                                  </select>

                                  {/* Custom Dropdown Chevron Icon */}
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
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
                              </div>
                            )}
                            {formData.plotSettings.plotType.includes("3d") && (
                              <div>
                                <label
                                  htmlFor="plotDimensions"
                                  className="block text-md font-medium text-gray-200 place-content-start"
                                >
                                  Optional Plot Color Settings
                                </label>
                                <div className="relative ">
                                  <select
                                    id="colors"
                                    className="block w-full pl-3 pr-10 py-2 text-[0.8rem] outline-none border-none  bg-gray-800  rounded-md shadow-gray-600/40 shadow-md appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70
              rounded-md   cursor-pointer transition-colors"
                                    defaultValue={formData.plotSettings.colors}
                                    onChange={(e) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        plotSettings: {
                                          ...prev.plotSettings,
                                          colors: e.target.value,
                                        },
                                      }));
                                    }}
                                  >
                                    <option
                                      value="black"
                                      className="text-gray-100"
                                    >
                                      Black (Default)
                                    </option>
                                    <option
                                      value="base"
                                      className="text-gray-100"
                                    >
                                      By Base Text
                                    </option>
                                  </select>

                                  {/* Custom Dropdown Chevron Icon */}
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
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
                              </div>
                            )}
                            {formData.plotSettings.plotType !== "" && (
                              <div className="flex flex-row gap-3 content-center items-center text-md pt-2 font-medium text-gray-200">
                                <input
                                  type="checkbox"
                                  checked={formData.plotSettings.colorText}
                                  onChange={handleColorText}
                                  className={`rounded-full  accent-cyan-500 text-gray-300 border-1 border-none shadow-gray-600/40 shadow-sm shadow-gray-600/40 shadow-gray-700/70 hover:shadow-gray-600/40 shadow-md outline-none w-4 h-4 appearance-none 
              ${formData.plotSettings.colorText ? "bg-cyan-700 shadow-gray-600/40 shadow-xs shadow-gray-600/40 shadow-cyan-200" : "bg-gray-800"}`}
                                />
                                <label className="">
                                  <div className="">
                                    Match Label Color to Data Point Color
                                  </div>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-base w-45/100 h-5/10 pt-2 gap-2 text-cyan-200 shadow-gray-600/40 shadow-lg/40  rounded-lg p-5  overflow-auto">
                          <p className="text-lg font-bold">Description</p>
                          <p>Description text</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full flex justify-between content-start flex-row">
                    <button
                      onClick={() => handleStepChange(3)}
                      className="px-5 py-2 border border-gray-300 text-gray-200 font-medium rounded-lg w-max hover:bg-gray-700 transition"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlot}
                      disabled={
                        !isReady || isProcessing 
                      }
                      className="px-5 py-2 bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition"
                    >
                      {isProcessing ? "Processing..." : "Run t-SNE Algorithm"}
                    </button>
                  
                  </div>
                </div>
              </div>
            )}
            {currentStep === 5 && (
              <div className="flex content-start  pt-10 flex-col justify-between pt-4">
                <h1 className="text-4xl w-5/10 font-bold text-gray-200 pt-10 pb-2">
                  Plot
                </h1>
                <div className="h-[71dvh] w-full justify-between flex flex-col ">
                  <div className="flex flex-row gap-5 pt-2">
                    {formData.plotSettings.plotType.includes("3da") && (
                      <div className="w-[50dvw] place-content-center">
                        <iframe
                          ref={plotRef}
                          srcDoc={plotUrl}
                          className="  w-[50dvw] h-[50dvh] place-content-center border-none"
                          title="t-SNE Plot"
                        sandbox="allow-scripts allow-same-origin allow-downloads"
                        />
                      </div>
                    )}
                    {(formData.plotSettings.plotType.includes("2d") ||
                      formData.plotSettings.plotType.includes("3ds")) && (
                        <div className=" flex content-start h-[50dvh] justify-center pb-0 ">
                          <img
                            src={plotUrl}
                            className="  border-none"
                            title="t-SNE Plot"
                          />
                        </div>
                      )}
                    <div className="text-base pt-2 gap-2 text-cyan-200 shadow-gray-600/40 shadow-lg/40 w-6/10 rounded-lg p-5  overflow-auto">
                      <p className="text-lg font-bold">Description</p>
                      <p>Description text</p>
                    </div>
                  </div>
                  <div className="w-full flex justify-between  items-end pb-20 flex-row">
                    <button
                      onClick={() => handleStepChange(4)}
                      className="px-5 py-2 border border-gray-300 text-gray-200 font-medium rounded-lg w-max hover:bg-gray-700 transition"
                    >
                      Back
                    </button>
                    <div className="flex flex-col gap-2 w-max">
                      {formData.plotSettings.plotType.includes("2d") && (
                        <a
                          href={plotUrl}
                          download="2D_plot.png"
                          onClick={() =>
                            setDownloadedFiles((prev) => [
                              ...prev,
                              "2D_plot.png",
                            ])
                          }
                          className="px-5 py-2 bg-sky-600 text-gray-900 font-medium text-center rounded-lg hover:bg-sky-700"
                        >
                          Download Plot as Image
                        </a>
                      )}
                      {formData.plotSettings.plotType.includes("3ds") && (
                        <a
                          href={plotUrl}
                          download="static_3D_plot.png"
                          onClick={() =>
                            setDownloadedFiles((prev) => [
                              ...prev,
                              "static_3D_plot.png",
                            ])
                          }
                          className="px-5 py-2 bg-sky-600 text-gray-900 font-medium text-center rounded-lg hover:bg-sky-700"
                        >
                          Download Plot as Image
                        </a>
                      )}
                      {formData.plotSettings.plotType.includes("3da") && (
                        <button
                          onClick={download3dPlot}
                          className="px-5 py-2 bg-sky-600 text-gray-900 font-medium text-center rounded-lg hover:bg-sky-700"
                        >
                          Download Plot as Image
                        </button>
                      )}
                      <button
                        onClick={handleDownload}
                        className="px-5 py-2 bg-green-600 text-gray-900 text-center font-medium rounded-lg hover:bg-green-700"
                      >
                        Download Matrix as Spreadsheet
                      </button>
                    </div>
                    <button
                      onClick={() => handleStepChange(6)}
                      className="px-5 py-2 bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}{" "}
            {currentStep === 6 && (
              <div className="h-[71dvh]">
                <div className="flex flex-col h-full justify-center content-start">
                  <h1 className="text-4xl w-5/10 font-bold text-gray-200 pt-10 pb-2">
                    Summary Report
                  </h1>
                  <div className="h-full">
                    <PDFViewer width="100%" height="100%">
                      <Report />
                    </PDFViewer>
                    <div className="w-full flex justify-between content-start flex-row pt-2">
                      <button
                        onClick={() => handleStepChange(5)}
                        className="px-5 py-2 border border-gray-300 text-gray-200 font-medium rounded-lg w-max hover:bg-gray-700 transition"
                      >
                        Back
                      </button>

                      <PDFDownloadLink
                        document={<Report />}
                        fileName="report.pdf"
                        className="px-5 py-2 bg-cyan-600 text-gray-900 font-medium w-max rounded-lg hover:bg-cyan-700"
                      >
                        {({ blob, url, loading, error }) =>
                          loading ? "Generating Report..." : "Download Report"
                        }
                      </PDFDownloadLink>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
//       file.name.donesWith(".txt"),
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
//       file.name.donesWith(".txt"),
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
//     <div className="bg-gray-800 w-screen h-screen flex flex-col items-center place-content-center content-center justify-items-center justify-content-center">
//       <div className="w-[82dvw] h-[82dvh] p-6 bg-gray-800 rounded-xl shadow-gray-600/40 shadow-md border border-gray-100">
//         {/* Progress Bar */}
//         <div className="mb-8">
//           <div className="flex justify-between text-[0.8rem] font-medium text-gray-300 mb-2">
//             <button
//               type="button"
//               onClick={() => handleStepSkip(1)}
//               className={`${furthestStep >= 1 ? "cursor-pointer" : ""} ${currentStep >= 1 ? "text-cyan-400 font-bold" : ""}`}
//             >
//               Upload Files
//             </button>
//             <button
//               type="button"
//               onClick={() => handleStepSkip(2)}
//               className={`${furthestStep >= 2 ? "cursor-pointer" : ""} ${currentStep >= 2 ? "text-cyan-400 font-bold" : ""}`}
//             >
//               Select Algorithm
//             </button>
//             <button
//               type="button"
//               onClick={() => handleStepSkip(3)}
//               className={`${furthestStep >= 3 ? "cursor-pointer" : ""} ${currentStep >= 3 ? "text-cyan-400 font-bold" : ""}`}
//             >
//               View Alignment
//             </button>
//             <button
//               type="button"
//               onClick={() => handleStepSkip(4)}
//               className={`${furthestStep >= 4 ? "cursor-pointer" : ""} ${currentStep >= 4 ? "text-cyan-400 font-bold" : ""}`}
//             >
//               View Plot
//             </button>
//           </div>
//           <div className="w-full bg-gray-600 h-2 rounded-full overflow-hidden">
//             <div
//               className="bg-cyan-600 h-2 transition-all duration-300"
//               style={{ width: `${(currentStep / 4) * 100}%` }}
//             ></div>
//           </div>
//         </div>

//         {/* upload folder */}
//         {currentStep === 1 && (
//           <div className="space-y-6 h-[52dvh]">
//             <h2 className="text-4xl font-bold text-gray-100 pt-10 ">
//               Upload Transcription Files or a Folder of Transcriptions
//             </h2>
//             {/* upload folder */}
//             {formData.multi == null && (
//               <div className="h-full place-content-start">
//                 <h1 className="text-3xl pt-20 font-semibold text-cyan-400 overflow-wrap">
//                   Welcome to the TEXTEVOLVE Data Analysis tool. <br />
//                   <br />
//                   Please begin by selecting whether you want to compare{" "}
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setFormData((prev) => ({ ...prev, multi: false }))
//                     }
//                     className="font-semibold text-cyan-400 underline underline-offset-2 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                   >
//                     entire texts
//                   </button>{" "}
//                   or{" "}
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setFormData((prev) => ({ ...prev, multi: true }))
//                     }
//                     className="font-semibold text-cyan-400 underline underline-offset-2 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                   >
//                     subsections of texts
//                   </button>
//                   .
//                 </h1>
//               </div>
//             )}

//             <div className="h-full place-content-start flex pt-[4dvh] flex-col ">
//               {/* <div className="border-2 border-dashed border-gray-300 h-[50dvh]  w-[50dvh] rounded-lg p-8 text-center bg-gray-700 hover:bg-gray-600 transition flex place-content-center place-items-center"> */}

//               {/* <p className="mt-2 text-xl text-gray-600">
//                   <span className="font-semibold text-cyan-400">Click to select folder</span>
//                 </p>
//                 <p className="text-md text-gray-300 mt-1">Only .txt files will be processed</p> */}

//               {formData.multi == true && (

//                 <div className="flex text-center place-content-center place-items-center pl-20 pr-20 pt-[2dvh] w-10/10 pb-[2dvh]">
//                   <div className="border-2 border-dashed border-gray-300 flex-col h-[50dvh] items-center content-center w-[70dvw] rounded-lg p-8 text-center bg-gray-700  transition flex">
//                     <div className="flex flex-col  overflow-auto text-center">
//                       <p className="justify-start items-start content-start text-start text-lg font-bold text-cyan-100 pb-2 pl-1">
//                         Enter the name of a subsection
//                       </p>
//                       <div className="w-full cursor-text rounded-md shadow-gray-600/40 shadow-md pt-2 flex flex-row content-center justify-between p-2 text-cyan-200 text-semibold focus:shadow-gray-600/40 shadow-gray-700/70 bg-gray-800">
//                         <input
//                           type="text"
//                           placeholder={`Default: Subsection ${count}`}
//                           onChange={(e) => setInputValue(e.target.value)}
//                           className=" outline-none border-none appearance-none p-1"
//                         />

//                         <button
//                           onClick={handleSubsection}
//                           className="hover:bg-cyan-700 rounded-full"
//                         >
//                           <CirclePlus className="w-8 h-8" />
//                         </button>
//                       </div>

//                       {formData.files.length > 0 && (
//                         <ul>
//                           <div className="flex flex-row items-center justify-between content-between ">
//                             <div className="justify-start items-start content-start text-start text-lg font-bold text-cyan-100">
//                               <p>
//                                 Base Text:{" "}
//                                 {formData.baseText != null
//                                   ? formData.baseText.name
//                                   : "None"}
//                               </p>
//                             </div>
//                             <div className="flex items-end justify-end content-end text-end  justify-content-end px-1 py-1 relative hover:bg-gray-600/70 rounded-sm text-red-400 text-lg">
//                               <button
//                                 type="button"
//                                 onClick={() =>
//                                   setFormData((prev) => ({
//                                     ...prev,
//                                     files: [],
//                                   }))
//                                 }
//                                 className="bg-transparent text-red-400 rounded-lg shrink-0 flex flex-row items-center font-bold cursor-pointer items-right"
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
//                                 className={`border-2 border-dashed border-gray-300 flex-col  items-center content-center  rounded-lg p-8 text-center bg-gray-700  transition flex
//                         ${
//                           isDragReject
//                             ? "border-red-500 text-red-400 bg-red-50"
//                             : isDragActive
//                               ? "border-gray-300 text-gray-600 bg-gray-600 border-gray-400"
//                               : ""
//                         }`}

//                               >
//                                 <input {...getInputProps()}
//                                 />
//                                 <div className="w-full place-content-start  text-left shadow-gray-600/40 shadow-md p-2">
//                                 <h1 className="text-start text-md text-cyan-200">
//                                   {subsection}
//                                 </h1>
//                                 </div>
//                                 <label className="flex flex-col pt-2 items-center place-content-center content-center justify-center w-full">

//                                 <svg
//                                   className="mx-auto h-12 w-12 text-cyan-100"
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
//                                         <p className="font-semibold text-cyan-400 text-xl flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center font-semibold text-cyan-400 text-xl leading-snug">
//                                           Drag and Drop Here or Click to Browse{" "}
//                                           <button
//                                             type="button"
//                                             onClick={openFilePicker}
//                                             className="font-semibold text-cyan-400 underline underline-offset-2 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                                           >
//                                             Files
//                                           </button>{" "}
//                                           or{" "}
//                                           <button
//                                             type="button"
//                                             onClick={() =>
//                                               folderInput.current?.click()
//                                             }
//                                             className="font-semibold text-cyan-400 underline underline-offset-2 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                                           >
//                                             Folders
//                                           </button>

//                                           <input />
//                                         </p>
//                                         </div>
//                                         <p className="text-gray-300 text-center text-md">
//                                           Only upload files you want aligned.
//                                         </p>
//                                         </label>

//                                 <ul>
//                                   {filesList.map((file, index) => (
//                                     <li
//                                       key={`${file.name}-${index}`}
//                                       className={`flex items-left justify-between px-1 py-1 relative w-[47dvh] hover:bg-gray-600/70 rounded-sm ${
//                                         file == formData.baseText
//                                           ? "bg-gray-500/55"
//                                           : "bg-gray-700"
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
//                                             className="bg-transparent text-cyan-400 w-[43dvh] rounded-lg flex-row flex gap-2 content-center items-center shrink-0 cursor-pointer"
//                                           >
//                                             {file == formData.baseText ? (
//                                               <FileCheck className="w-8 h-8" />
//                                             ) : (
//                                               <FileText className="w-8 h-8" />
//                                             )}
//                                             <p className="text-md font-medium text-cyan-100 ">
//                                               {file.name}
//                                             </p>
//                                           </button>

//                                           <div className="absolute flex items-center inset-y-0 right-1">
//                                             <button
//                                               type="button"
//                                               onClick={() => removeFile(file)}
//                                               className="bg-transparent text-red-400 rounded-lg shrink-0 cursor-pointer items-right hover:bg-red-50"
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
//                     className={`border-2 border-dashed border-gray-300 h-[50dvh]  w-[50dvh] rounded-lg p-8 text-center bg-gray-700  transition flex place-content-center place-items-center
//                   ${
//                     isDragReject
//                       ? "border-red-500 text-red-400 bg-red-50"
//                       : isDragActive
//                         ? "border-gray-300 text-gray-600 bg-gray-600 border-gray-400"
//                         : ""
//                   }`}
//                   >
//                     <input {...getInputProps()} />
//                     <label htmlFor="folder-upload" className="block">
//                       <svg
//                         className="mx-auto h-12 w-12 text-cyan-100"
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
//                       <p className="font-semibold text-center text-cyan-400 text-xl">
//                         Drag and Drop Here <br />
//                         or Click to Browse{" "}
//                         <button
//                           type="button"
//                           onClick={openFilePicker}
//                           className="font-semibold text-cyan-400 underline underline-offset-2 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                         >
//                           Files
//                         </button>{" "}
//                         or{" "}
//                         <button
//                           type="button"
//                           onClick={() => folderInput.current?.click()}
//                           className="font-semibold text-cyan-400 underline underline-offset-2 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
//                         >
//                           Folders
//                         </button>
//                         <input />
//                       </p>
//                       <p className="text-gray-300 ptext-center text-md">
//                         Only upload files you want aligned.
//                       </p>
//                     </label>
//                   </div>

//                   {/* </div> */}

//                   {/* View File Names and document icon */}

//                   <div className="border-2 border-dashed border-gray-300 flex-col overflow-auto  h-[50dvh] p-2 text-gray-300 w-[50dvh]  rounded-lg text-center bg-gray-700 flex place-content-top place-items-top ">
//                     {formData.files.length > 0 && (
//                       <ul>
//                         <div className="flex flex-row items-center justify-between content-between w-[47dvh]">
//                           <div className="justify-start items-start content-start text-start text-lg font-bold text-cyan-100">
//                             <p>
//                               Base Text:{" "}
//                               {formData.baseText != null
//                                 ? formData.baseText.name
//                                 : "None"}
//                             </p>
//                           </div>
//                           <div className="flex items-end justify-end content-end text-end  justify-content-end px-1 py-1 relative hover:bg-gray-600/70 rounded-sm text-red-400 text-lg">
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 setFormData((prev) => ({ ...prev, files: [] }))
//                               }
//                               className="bg-transparent text-red-400 rounded-lg shrink-0 flex flex-row items-center font-bold cursor-pointer items-right"
//                             >
//                               <p className="pr-3">Clear All</p>
//                               <Eraser className="w-8 h-8" />
//                             </button>
//                           </div>
//                         </div>
//                         {formData.files.map((file, index) => (
//                           <li
//                             key={`${file.name}-${index}`}
//                             className={`flex items-left justify-between px-1 py-1 relative w-[47dvh] hover:bg-gray-600/70 rounded-sm ${
//                               file == formData.baseText
//                                 ? "bg-gray-500/55"
//                                 : "bg-gray-700"
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
//                                 className="bg-transparent text-cyan-400 w-[43dvh] rounded-lg flex-row flex gap-2 content-center items-center shrink-0 cursor-pointer"
//                               >
//                                 {file == formData.baseText ? (
//                                   <FileCheck className="w-8 h-8" />
//                                 ) : (
//                                   <FileText className="w-8 h-8" />
//                                 )}
//                                 <p className="text-md font-medium text-cyan-100 ">
//                                   {file.name}
//                                 </p>
//                               </button>

//                               <div className="absolute flex items-center inset-y-0 right-1">
//                                 <button
//                                   type="button"
//                                   onClick={() => removeFile(file)}
//                                   className="bg-transparent text-red-400 rounded-lg shrink-0 cursor-pointer items-right hover:bg-red-50"
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
//                       className="px-5 py-2 border border-gray-300 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition"
//                     >
//                       Back
//                     </button>
//                     <button
//                       disabled={(formData.files.length === 1 ) && (formData.files[0][Object.keys(formData.files[0])[0]].length ===0)}
//                       onClick={() => handleStepChange(2)}
//                       className="px-5 py-2 bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-7000 disabled:cursor-not-allowed relative transition"
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
//                 className="px-5 py-2 border border-gray-300 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition"
//               >
//                 Back
//               </button>
//               <button
//                 disabled={formData.files.length === 0}
//                 onClick={() => handleStepChange(2)}
//                 className="px-5 py-2 bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-7000 disabled:cursor-not-allowed relative transition"
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
//             <h2 className="text-4xl font-bold text-gray-200 pt-10 ">
//               Select Algorithm
//             </h2>

//             <div className="space-y-1 place-content-start h-[55dvh] flex  w-10/10 pt-5">
//               <div className="flex flex-row content-between">
//                 <div className="flex flex-col content-center items-center gap-2 w-[20dvw]">
//                   {/* <label className="block text-2xl font-medium text-gray-200 mb-1">Select Algorithm</label> */}
//                   <div className="flex flex-col gap-2 pt-2 w-full">
//                     {/* Label */}
//                     <label
//                       htmlFor="algorithm"
//                       className="block text-md font-medium text-gray-200 place-content-start"
//                     >
//                       Choose an Algorithm
//                     </label>

//                     {/* Select Container with Custom Arrow */}
//                     <div className="relative ">
//                       <select
//                         id="algorithm"
//                         className="block w-full pl-3 pr-10 py-2 text-[0.8rem] outline-none border-none  bg-gray-800  rounded-md shadow-gray-600/40 shadow-md appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70
//                      rounded-md   cursor-pointer transition-colors"
//                         defaultValue={formData.algorithm}
//                         onChange={(e) =>
//                           setFormData((p) => ({
//                             ...p,
//                             algorithm: e.target.value,
//                           }))
//                         }
//                       >
//                         <option disabled value="" className="text-gray-300/20">
//                           Select an Algorithm
//                         </option>
//                         <option value="ndw" className="text-gray-100">
//                           Needleman-Wunsch Algorithm
//                         </option>
//                         <option value="sw" className="text-gray-100">
//                           Smith-Waterman Algorithm
//                         </option>
//                       </select>

//                       {/* Custom Dropdown Chevron Icon */}
//                       <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
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
//                         <div className="flex justify-between items-center text-md font-medium text-gray-200">
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
//                           className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
//                         />

//                         {/* Gap Penalty */}
//                         <div className="flex justify-between items-center text-md font-medium text-gray-200">
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
//                           className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
//                         />

//                         {/* Mismatch Penalty */}
//                         <div className="flex justify-between items-center text-md font-medium text-gray-200">
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
//                           className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
//                         />

//                         {/* Optional Special Character Bonus */}
//                         {/* Label */}
//                         <label
//                           htmlFor="special"
//                           className="block text-md font-medium text-gray-200 place-content-start"
//                         >
//                           Optional Special Character Bonus
//                         </label>

//                         {/* Select Container with Custom Arrow */}
//                         <div className="relative">
//                           <select
//                             id="special"
//                             className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] cursor-pointer transition-colors"
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
//                             <option value="" className="text-gray-300/20">
//                               None
//                             </option>
//                             {/* Pass standard comma-separated strings as values */}
//                             <option value="ך,ם,ן,ף,ץ" className="text-gray-100">
//                               Sofit Letters
//                             </option>
//                             <option
//                               value="A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z"
//                               className="text-gray-100"
//                             >
//                               Capital Letters (Latin Alphabet)
//                             </option>
//                             <option value="Other" className="text-gray-100">
//                               Custom
//                             </option>
//                           </select>
//                           {/* Custom Dropdown Chevron Icon */}
//                           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-300">
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
//                               className="block pt-2 text-md font-medium text-gray-200 place-content-start"
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
//                               className="shadow-gray-600/40 shadow-md pt-2 w-full text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 outline-none border-none appearance-none p-1"
//                             />
//                           </div>
//                         )}
//                         <div className="pt-2">
//                           {formData.settings.special.includes("Other") ===
//                             false && (
//                             <label
//                               htmlFor="specialList"
//                               className="pt-2 text-cyan-200"
//                             >
//                               {formData.settings.special.join(" ")}
//                             </label>
//                           )}
//                         </div>

//                         {formData.settings.special?.length > 0 && (
//                           <div>
//                             <div className="flex justify-between items-center text-md  font-medium text-gray-200">
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
//                               className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
//                             />

//                             <div className="flex justify-between items-center text-md  font-medium text-gray-200">
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
//                               className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
//                             />

//                             <div className="flex justify-between items-center text-md  font-medium text-gray-200">
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
//                               className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
//                             />
//                           </div>
//                         )}
//                       </div>
//                     )}
//                     {formData.algorithm === "ndw" && (
//                       <div>
//                         {/* Affine Gap Penalty */}
//                         <div className="flex justify-between items-center text-md font-medium text-gray-200">
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
//                           className="block w-full pl-3 pr-10 py-2 text-[0.8rem] bg-gray-800 rounded-md shadow-gray-600/40 shadow-sm appearance-none focus:outline-none focus:shadow-gray-600/40 shadow-md text-gray-200/60 focus:text-gray-200 focus:shadow-gray-600/40 shadow-gray-700/70 sm:text-[0.8rem] transition-colors"
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
//                 className="px-5 py-2 border border-gray-300 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition"
//               >
//                 Back
//               </button>
//               <button
//                 onClick={handleRunAlgorithm}
//                 disabled={isProcessing}
//                 className="px-5 py-2 bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition"
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
//               className="px-5 py-2 border border-gray-300 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition"
//             >
//               Back
//             </button>
//             <button
//               onClick={() => handleStepChange(4)}
//               disabled={isProcessing}
//               className="px-5 py-2 bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition"
//             >
//               {isProcessing ? "Processing..." : "Run Algorithm"}
//             </button>
//           </div>
//         )}
//         {currentStep === 4 && (
//           <div className="flex justify-between pt-4">
//             <button
//               onClick={() => handleStepChange(3)}
//               className="px-5 py-2 border border-gray-300 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition"
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
// //       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-gray-800 dark:bg-black sm:items-start">
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
