// hooks/useWasmEngines.ts
import { useEffect, useState } from 'react';
import { WebR } from '@r-wasm/webr';

let globalPyodide: any = null;
let globalWebR: WebR | null = null;
let initPromise: Promise<{ py: any; webr: WebR }> | null = null;

export function useWasmEngines() {
  const [pyodide, setPyodide] = useState<any>(globalPyodide);
  const [webR, setWebR] = useState<WebR | null>(globalWebR);
  const [isReady, setIsReady] = useState(!!(globalPyodide && globalWebR));
  const [loadingStatus, setLoadingStatus] = useState(
    globalPyodide && globalWebR ? 'WebAssembly engines ready' : 'Initializing engines...'
  );

  useEffect(() => {
    if (globalPyodide && globalWebR) {
      setPyodide(globalPyodide);
      setWebR(globalWebR);
      setIsReady(true);
      setLoadingStatus('WebAssembly engines ready');
      return;
    }

    let isMounted = true;

    async function initialize() {
      if (!initPromise) {
        initPromise = (async () => {
          const getBasePath = () => {
            if (typeof window === "undefined") return "";
            if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
              return "";
            }
            const pathSegments = window.location.pathname.split("/").filter(Boolean);
            return pathSegments.length > 0 ? `/${pathSegments[0]}` : "";
          };

          const basePath = getBasePath();

          // 1. Pyodide Setup
          if (!(window as any).loadPyodide) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
              script.onload = () => resolve();
              script.onerror = () => reject(new Error('Failed to load Pyodide script'));
              document.body.appendChild(script);
            });
          }

          const py = await (window as any).loadPyodide();
          await py.loadPackage(['pandas', 'numpy']);

          const pyFiles = ['base.py', 'needleman_wunsch.py', 'smith_waterman.py', 'main.py'];
          for (const file of pyFiles) {
            const res = await fetch(`${basePath}/python/${file}`);
            if (!res.ok) throw new Error(`Failed to fetch ${file}`);
            const code = await res.text();
            py.FS.writeFile(file, code);
          }

          // 2. WebR Setup using CDN binaries & PostMessage
          const cdnUrl = 'https://webr.r-wasm.org/latest/';
          
          const webrInstance = new WebR({
            baseUrl: cdnUrl,
            channelType: 3 // PostMessage channel
          });

          await webrInstance.init();

          await webrInstance.installPackages([
            'Rtsne', 'ggplot2', 'pandoc', 'webshot2', 
            'htmltools', 'dplyr', 'rgl', 'readxl'
          ]);

          const rRes = await fetch(`${basePath}/r/t-SNE.R`);
          if (!rRes.ok) throw new Error(`Failed to fetch t-SNE.R`);
          const rCode = await rRes.text();
          await webrInstance.FS.writeFile('/tmp/t-SNE.R', rCode);

          globalPyodide = py;
          globalWebR = webrInstance;

          return { py, webr: webrInstance };
        })();
      }

      try {
        setLoadingStatus('Loading WebAssembly engines...');
        const { py, webr } = await initPromise;

        if (isMounted) {
          setPyodide(py);
          setWebR(webr);
          setIsReady(true);
          setLoadingStatus('WebAssembly engines ready');
        }
      } catch (err: any) {
        initPromise = null;
        if (isMounted) {
          console.error('Failed to initialize Wasm engines:', err);
          setLoadingStatus(`Initialization failed: ${err.message || err}`);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  return { pyodide, webR, isReady, loadingStatus };
}