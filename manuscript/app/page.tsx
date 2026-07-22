"use client";

import { useState } from "react";
import { v4 } from "uuid";
import { FileText, Trash2 } from 'lucide-react';

export default function Pages() {
  const [currentStep, setCurrentStep] = useState(1);

  // Global Form State
  const [formData, setFormData] = useState({
    files: [],
    algorithm: "ndw",
    settings: {
      gap: 0
    },
  });

 
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  // Step 1: Handle Folder Upload
  const handleFolderUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files).filter((file) =>
      file.name.endsWith(".txt")
    );
    setFormData((prev) => ({ ...prev, files: uploadedFiles }));
  };

   
  // Step 2: Handle Settings Update
  const handleSettingChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
  };

  // Step 3: Run Algorithm (Simulated)
  const handleRunAlgorithm = () => {
    setIsProcessing(true);
    // Simulate processing time / API call
    setTimeout(() => {
      setResults({
        summary: `Successfully processed ${formData.files.length} file(s) using ${formData.algorithm.toUpperCase()}.`,
        data: [
    
        ],
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
            <span className={currentStep >= 1 ? "text-cyan-600 font-bold" : ""}>Upload Files</span>
            <span className={currentStep >= 2 ? "text-cyan-600 font-bold" : ""}>Select Algorithm</span>
            <span className={currentStep >= 3 ? "text-cyan-600 font-bold" : ""}>View Alignment</span>
            <span className={currentStep >= 4 ? "text-cyan-600 font-bold": ""}>View Plot</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-600 h-2 transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* STEP 1: UPLOAD FOLDER */}
        {currentStep === 1 && (
          <div className="space-y-6">
            
            <h2 className="text-4xl font-bold text-gray-800 pt-10 ">Upload a Folder of Transcriptions</h2>
            <div className="flex flex-row justify-between pl-20 pr-20 pt-[4dvh]">
            <div className="border-2 border-dashed border-gray-300 h-[50dvh]  w-[50dvh] rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition flex place-content-center place-items-center">
              <input
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleFolderUpload}
                className="hidden"
                id="folder-upload"
              />
              <label htmlFor="folder-upload" className="cursor-pointer block">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-xl text-gray-600">
                  <span className="font-semibold text-cyan-600">Click to select folder</span>
                </p>
                <p className="text-md text-gray-500 mt-1">Only .txt files will be processed</p>
              </label>
            </div>

            {/* {formData.files.length > 0 && (
              <div className="bg-cyan-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-cyan-800">
                  Selected {formData.files.length} .txt file(s)
                </p>
              </div>
            )} */}
           
              <div className="border-2 border-dashed border-gray-300 h-[50dvh] p-2 text-gray-500 w-[50dvh] rounded-lg text-center bg-gray-50 flex place-content-top place-items-top overflow-auto">
                 {(formData.files.length > 0) &&  (
                  <ul>
                    {formData.files.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-left justify-between px-1 py-1"
                      >
                        {/* File Icon & Name */}
                        <div className="flex items-center gap-3  min-w-0 pt-1">
                          <div className="bg-cyan-50 text-cyan-600 rounded-lg shrink-0">
                            <FileText className="w-10 h-10" />
                          </div>
                          
                            <p className="text-sm font-medium text-gray-800">{file.name}</p>
                          
                        </div>
                      </li>
              
                      ))}
                      </ul>
                      )}
              
                  
                  
              </div>
              </div>

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

        {/* STEP 2: SELECT ALGORITHM & SETTINGS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-gray-800 pt-10 ">Select Algorithm</h2>

            <div className="space-y-4 h-[55dvh] flex  w-10/10 pt-10">
              <div className="flex flex-col content-center items-center gap-5">
                {/* <label className="block text-2xl font-medium text-gray-700 mb-1">Select Algorithm</label> */}
                <label className="block text-md font-medium text-gray-700 mb-1 flex flex-col gap-5">
                  Choose an Algorithm</label>

                <select className="block w-full pl-3 pr-8 py-2 
                    text-base border-gray-300 bg-white text-gray-700/20 
                    focus:outline-none focus:shadow-md focus:shadow-gray-700/70
                     sm:text-sm rounded-md shadow-sm 
                    appearance-none"
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, algorithm: e.target.value }))
                    }>
                  
                  <option value="" className="text-gray-200/20">Select an Algorithm</option>
                  <option id="ndw" className="appearance-none hover:bg-cyan-700 text-gray-700">Needleman-Wunsch Algorithm</option>
                  <option id="sw"className="text-gray-700 appearance-none hover:bg-cyan-700">Smith-Waterman Algorithm</option>
                </select>
             <div className="space-y-2">
              {/* Label */}
              <label htmlFor="algorithm" className="block text-md font-medium text-gray-700">
                Choose an Algorithm
              </label>

              {/* Select Container with Custom Arrow */}
              <div className="relative">
                <select
                  id="algorithm"
                  className="block w-full pl-3 pr-10 py-2 text-base text-gray-800 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:shadow-md focus:shadow-gray-700/70
                     sm:text-sm rounded-md shadow-sm sm:text-sm cursor-pointer transition-colors"
                  defaultValue=""
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, algorithm: e.target.value }))
                  }
                >
                  <option value="" disabled className="text-gray-400">
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
                {[
                  {id: "ndw", name: "Needleman-Wunsch Algorithm"},
                  {id: "sw", name: "Smith-Waterman Algorithm"}
                ].map((alg)=> (
                  <label
                  key={alg.id}
                  htmlFor={alg.id}
                  className={`text-xl h-fit p-2 text-center rounded-lg w-full   text-white
                  ${formData.algorithm===alg.id
                    ? 'bg-cyan-700 shadow-lg shadow-cyan-600/50 '
                    : 'bg-gray-600 hover:shadow-lg hover:shadow-gray-900/50'
                  }`}
                  >
                  <input 
                    type="radio"
                    id={alg.id}
                    name="algorithm"
                    value={alg.id}
                    checked={formData.algorithm===alg.id}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, algorithm: e.target.value }))
                    }
                    className="appearance-none"
                  />
                  <span>{alg.name}</span>


                  </label>
                ))}
                </div>
                </div>
              
                {formData.algorithm==="ndw" &&(
                  <div>
                    <select></select>
                  </div>
                )}
              {/* <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Features / Keywords</label>
                  <input
                    type="number"
                    value={formData.settings.maxFeatures}
                    onChange={(e) => handleSettingChange("maxFeatures", Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={formData.settings.threshold}
                    onChange={(e) => handleSettingChange("threshold", Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div> */}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                ← Back
              </button>
              <button
                onClick={handleRunAlgorithm}
                disabled={isProcessing}
                className="px-5 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition"
              >
                {isProcessing ? "Processing..." : "Run Algorithm →"}
              </button>
            </div>
          </div>
        )}

     
      </div>
      </div>
      
    
    )}



{/* // import Image from "next/image";
// import FileUpload from './form/fileUpload/page';
// import Settings from './form/settings/page'
// import Results from './form/results/page'
// import Link from 'next/link';
// import { useState } from "react";


// export default function Pages()  */}



{/* //   return (
//     <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         {/* <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         /> */}
{/* //         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             Welcome to TEXTEVOLVE.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             To compare texts, start by creating a folder of transcriptions of the texts in the .txt file format.  Then, click {" "}
//             <a */}
{/* //               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               here
//             </a>{" "}
//             to begin.
//           </p> */}
{/* //         </div>
//       </main> */}
{/* //     </div>
//   );
// } */} 
