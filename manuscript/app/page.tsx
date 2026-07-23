"use client";

import { useState, useRef } from "react";
import { v4 } from "uuid";
import { FileText, Trash2, Shredder, Eraser } from "lucide-react";
import { Range } from "react-range";
import { useDropzone } from "react-dropzone";

export default function Pages() {
  const [currentStep, setCurrentStep] = useState(1);

  // Global Form State
  const [formData, setFormData] = useState({
    files: [],
    algorithm: "",
    settings: {
      gapPenalty: -1,
      matchBonus: 5,
      mismatchPenalty: -1,
      special: [],
      specialOther: false,
      specialBonus: 10,
      affinePenalty: -1,
    },
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const folderInput = useRef<HTMLInputElement | null>(null);

  // React Dropzone File Upload Handler
  const { getRootProps, getInputProps, open: openFilePicker, isDragActive, isDragReject } =
    useDropzone({
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
      accept: { "*txt": [] },
      multiple: true,
      noClick: true,
    });

  const removeFile = (file: File) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f !== file),
    }));
  };

  // Handle Folder Upload (OLD)
  const handleFolderUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files).filter((file) =>
      file.name.endsWith(".txt"),
    );
    // setFormData((prev) => ({ ...prev, files: uploadedFiles }));
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
  };

  // Sandle Settings Update
  const handleSettingChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
    console.log(field, value);
  };

  // Run Algorithm (Simulated)
  const handleRunAlgorithm = () => {
    setIsProcessing(true);
    // Simulate processing time / API call
    setTimeout(() => {
      setResults({
        summary: `Successfully processed ${formData.files.length} file(s) using ${formData.algorithm.toUpperCase()}.`,
        data: [],
      });
      setIsProcessing(false);
      setCurrentStep(3);
    }, 1500);
  };

  return (
    <div className="bg-white w-screen h-screen flex flex-col items-center place-content-center content-center justify-items-center justify-content-center">
      <div className="w-[82dvw] h-[82dvh] p-6 bg-white rounded-xl shadow-md border border-gray-100">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
            <span className={currentStep >= 1 ? "text-cyan-600 font-bold" : ""}>
              Upload Files
            </span>
            <span className={currentStep >= 2 ? "text-cyan-600 font-bold" : ""}>
              Select Algorithm
            </span>
            <span className={currentStep >= 3 ? "text-cyan-600 font-bold" : ""}>
              View Alignment
            </span>
            <span className={currentStep >= 4 ? "text-cyan-600 font-bold" : ""}>
              View Plot
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-600 h-2 transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* upload folder */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-gray-800 pt-10 ">
              Upload Transcription Files or a Folder of Transcriptions
            </h2>
            {/* upload folder */}
            <div className="flex flex-row justify-between pl-20 pr-20 pt-[4dvh]">
              {/* <div className="border-2 border-dashed border-gray-300 h-[50dvh]  w-[50dvh] rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition flex place-content-center place-items-center"> */}
              

              {/* <p className="mt-2 text-xl text-gray-600">
                  <span className="font-semibold text-cyan-600">Click to select folder</span>
                </p>
                <p className="text-md text-gray-500 mt-1">Only .txt files will be processed</p> */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed border-gray-300 h-[50dvh]  w-[50dvh] rounded-lg p-8 text-center bg-gray-50  transition flex place-content-center place-items-center 
                  ${
                    isDragReject
                      ? "border-red-500 text-red-600 bg-red-50"
                      : isDragActive
                        ? "border-gray-300 text-gray-600 bg-gray-100 border-gray-400"
                        : ""
                  }`}
              >
                <input {...getInputProps()} />
                <label htmlFor="folder-upload" className="block">
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
                    Drag and Drop Here <br/>or Click to Browse{" "}
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
                    >
                    Files
                    </button>{' '}
                    or {' '}
                    <button
                      type="button"
                      onClick={() => folderInput.current?.click()}
                      className="font-semibold text-cyan-600 underline underline-offset-2 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-0.5 transition-colors cursor-pointer"
                    >
                    Folders
                    </button>
                    <input/>
                  </p>
                  <p className="text-gray-500 ptext-center text-md">
                    Only upload files you want aligned.
                  </p>
                </label>
              </div>

              {/* </div> */}

              {/* View File Names and document icon */}
                   
              <div className="border-2 border-dashed border-gray-300 flex-col overflow-auto  h-[50dvh] p-2 text-gray-500 w-[50dvh]  rounded-lg text-center bg-gray-50 flex place-content-top place-items-top ">
                
                {formData.files.length > 0 && (
                  
                  <ul>
                      <div className="flex items-end justify-end content-end text-end px-1 py-1 relative w-[47dvh] hover:bg-gray-200/70 rounded-sm text-red-600 text-lg">
                    
                    <button
                      type="button"
                      onClick={() => setFormData((prev)=>({...prev,files:[]}))}
                      className="bg-transparent text-red-600 rounded-lg shrink-0 flex flex-row items-center font-bold cursor-pointer items-right"
                    >
                      <p className="pr-3">Clear All</p>
                      <Eraser className="w-8 h-8" />
                    </button>
                  </div>
                    {formData.files.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-left justify-between px-1 py-1 relative w-[47dvh] hover:bg-gray-200/70 rounded-sm"
                      >
                        {/* File Icon & Name */}
                        <div className="flex flex-row items-center gap-3 pt-1">
                          <div className="bg-transparent text-cyan-600 rounded-lg shrink-0">
                            <FileText className="w-8 h-8" />
                          </div>

                          <p className="text-md font-medium text-cyan-800 ">
                            {file.name}
                          </p>
                          <div className="absolute flex items-center inset-y-0 right-1">
                          <button
                            type="button"
                            onClick={() => removeFile(file)}
                            className="bg-transparent text-red-600 rounded-lg shrink-0 cursor-pointer items-right"
                          >
                            <Trash2 className="w-8 h-8" />
                          </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {/* Continue button*/}
            <div className="flex justify-end  ">
              <button
                disabled={formData.files.length === 0}
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed relative transition"
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

            <div className="space-y-4 h-[55dvh] flex  w-10/10 pt-10">
              <div className="flex flex-col content-center items-center gap-2 w-[20dvw]">
                {/* <label className="block text-2xl font-medium text-gray-700 mb-1">Select Algorithm</label> */}
                <div className="flex flex-col gap-2 pt-5 w-full">
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
                      defaultValue=""
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
                    <div className="">
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
                          defaultValue=""
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
                              handleSettingChange("special", val.split(","));
                              handleSettingChange("specialOther", false);
                            }
                          }}
                        >
                          <option value="" className="text-gray-400/20">
                            None
                          </option>
                          {/* Pass standard comma-separated strings as values */}
                          <option value="ך,ם,ן,ף,ץ" className="text-gray-800">
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
                            placeholder="1 2 3"
                            className="shadow-md pt-2 w-full text-gray-700 focus:shadow-gray-700/70 outline-none border-none appearance-none p-1"
                          />
                        </div>
                      )}
                      <div className="pt-2">
                        {formData.settings.special.includes("Other") ===
                          false && (
                          <label
                            htmlFor="specialList"
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

                          
                        </div>
                      )}
                    </div>
                  )}
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
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleRunAlgorithm}
                disabled={isProcessing}
                className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition"
              >
                {isProcessing ? "Processing..." : "Run Algorithm"}
              </button>
            </div>
          </div>
        )}
        {currentStep === 3 && (
          <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={()=>setCurrentStep(4)}
                disabled={isProcessing}
                className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition"
              >
                {isProcessing ? "Processing..." : "Run Algorithm"}
              </button>
            </div>
        )}
        {currentStep === 4 && (
          <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              
            </div>
        )}
      </div>
    </div>
  );
}



{
  /* // import Image from "next/image";
// import FileUpload from './form/fileUpload/page';
// import Settings from './form/settings/page'
// import Results from './form/results/page'
// import Link from 'next/link';
// import { useState } from "react";


// export default function Pages()  */
}

{
  /* //   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         {/* <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         /> */
}
{
  /* //         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             Welcome to TEXTEVOLVE.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             To compare texts, start by creating a folder of transcriptions of the texts in the .txt file format.  Then, click {" "}
//             <a */
}
{
  /* //               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               here
//             </a>{" "}
//             to begin.
//           </p> */
}
{
  /* //         </div>
//       </main> */
}
{
  /* //     </div>
//   );
// } */
}
