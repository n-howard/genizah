// hooks/useWasmEngines.ts
import { useEffect, useState, useRef } from 'react';
import { WebR } from '@r-wasm/webr';

export function useWasmEngines() {
  const [pyodide, setPyodide] = useState<any>(null);
  const [webR, setWebR] = useState<WebR | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Initializing engines...');
  
  // Guard to prevent double execution in React Strict Mode
  const isInitializing = useRef(false);

  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    async function loadEngines() {
      try {
        const getBasePath = () => {
          if (typeof window === "undefined") return "";
          const pathSegments = window.location.pathname.split("/").filter(Boolean);
          return window.location.hostname.endsWith("github.io") && pathSegments.length > 0
            ? `/${pathSegments[0]}`
            : "";
        };
        const basePath = getBasePath();

        // 1. Load Pyodide Script Safely
        setLoadingStatus('Loading Python WebAssembly runtime...');
        if (!(window as any).loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide CDN script'));
            document.body.appendChild(script);
          });
        }

        // Initialize Pyodide
        const py = await (window as any).loadPyodide();
        await py.loadPackage(['pandas', 'numpy']);

        // Fetch & Write Python files safely
        const pyFiles = ['base.py', 'needleman_wunsch.py', 'smith_waterman.py', 'main.py'];
        for (const file of pyFiles) {
          const url = `${basePath}/python/${file}`;
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`Failed to fetch Python script ${url}: ${res.statusText}`);
          }
          const code = await res.text();
          py.FS.writeFile(file, code);
        }
        setPyodide(py);

        // 2. Initialize WebR (Fixing Worker Path Resolution for GitHub Pages)
        setLoadingStatus('Loading R WebAssembly runtime...');
        
        // Ensure exact trailing slash for baseUrl so webr-worker.js resolves correctly
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const cleanBasePath = basePath.replace(/\/+$/, '');
        const webrBaseUrl = `${origin}${cleanBasePath}/`;

        const webr = new WebR({ 
          baseUrl: webrBaseUrl
        });
        
        await webr.init();

        setLoadingStatus('Installing R packages (this may take a moment)...');
        await webr.installPackages([
          'Rtsne', 'ggplot2', 'pandoc', 'webshot2', 
          'htmltools', 'dplyr', 'rgl', 'readxl'
        ]);

        // Fetch & Write R script safely
        const rUrl = `${basePath}/r/t-SNE.R`;
        const rRes = await fetch(rUrl);
        if (!rRes.ok) {
          throw new Error(`Failed to fetch R script ${rUrl}: ${rRes.statusText}`);
        }
        const rCode = await rRes.text();
        await webr.FS.writeFile('/tmp/t-SNE.R', rCode);
        
        setWebR(webr);
        setIsReady(true);
        setLoadingStatus('WebAssembly engines ready');

      } catch (err: any) {
        console.error('Failed to initialize Wasm engines:', err);
        setLoadingStatus(`Initialization failed: ${err.message || err}`);
      }
    }

    loadEngines();
  }, []);

  return { pyodide, webR, isReady, loadingStatus };
}