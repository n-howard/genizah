// hooks/useWasmEngines.ts
import { useEffect, useState } from 'react';
import { WebR } from '@r-wasm/webr';

export function useWasmEngines() {
  const [pyodide, setPyodide] = useState<any>(null);
  const [webR, setWebR] = useState<WebR | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Initializing engines...');

  useEffect(() => {
    async function loadEngines() {
      try {
        // 1. Initialize Pyodide
        setLoadingStatus('Loading Python WebAssembly runtime...');
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        
        await new Promise((resolve) => {
          script.onload = resolve;
          document.body.appendChild(script);
        });

        const py = await (window as any).loadPyodide();
        await py.loadPackage(['pandas', 'numpy']);
        const getBasePath = () => {
            if (typeof window === "undefined") return "";
            // Extracts repository subpath if running under sub-directory
            const pathSegments = window.location.pathname.split("/").filter(Boolean);
            // If hosted on username.github.io/repo-name, first segment is repo-name
            return window.location.hostname.endsWith("github.io") && pathSegments.length > 0
            ? `/${pathSegments[0]}`
            : "";
        };
        const basePath = getBasePath();
        
        // Fetch and write Python files to Pyodide virtual filesystem
        const pyFiles = ['base.py', 'needleman_wunsch.py', 'smith_waterman.py', 'main.py'];
        for (const file of pyFiles) {
          const res = await fetch(`${basePath}/python/${file}`);
          const code = await res.text();
          py.FS.writeFile(file, code);
        }
        setPyodide(py);

        // 2. Initialize WebR
        setLoadingStatus('Loading R WebAssembly runtime & packages...');
        const baseUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${basePath}/`.replace(/\/+/g, '/')
        : undefined;
        const webr = new WebR({
            baseUrl: baseUrl
        });
        await webr.init();
        await webr.installPackages(['Rtsne', 'ggplot2', 'pandoc', 'webshot2', 'htmltools', 'dplyr', 'rgl', 'readxl']);

        // Fetch and write R script to WebR virtual filesystem
        const rRes = await fetch(`${basePath}/r/t-SNE.R`);
        const rCode = await rRes.text();
        await webr.FS.writeFile('/tmp/t-SNE.R', rCode);
        setWebR(webr);

        setIsReady(true);
        setLoadingStatus('WebAssembly engines ready');
      } catch (err) {
        console.error('Failed to initialize Wasm engines:', err);
        setLoadingStatus('Engine initialization failed');
      }
    }

    loadEngines();
  }, []);

  return { pyodide, webR, isReady, loadingStatus };
}