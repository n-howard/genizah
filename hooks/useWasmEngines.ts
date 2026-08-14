import { useEffect, useRef, useState } from 'react';

let globalPyodide: any = null;
let globalWebR: any = null;
let initPromise: Promise<boolean> | null = null;

export function useWasmEngines() {
  const [isReady, setIsReady] = useState(!!(globalPyodide && globalWebR));
  const [loadingStatus, setLoadingStatus] = useState(
    globalPyodide && globalWebR ? 'WebAssembly engines ready' : 'Initializing engines...'
  );

  const pyodideRef = useRef<any>(globalPyodide);
  const webRRef = useRef<any>(globalWebR);

  useEffect(() => {
    if (globalPyodide && globalWebR) {
      pyodideRef.current = globalPyodide;
      webRRef.current = globalWebR;
      setIsReady(true);
      setLoadingStatus('WebAssembly engines ready');
      return;
    }

    let isMounted = true;

    async function initialize() {
      if (!initPromise) {
        initPromise = (async () => {
          const isLocalhost = 
            typeof window !== "undefined" && 
            (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

          const getBasePath = () => {
            if (typeof window === "undefined" || isLocalhost) return "";
            const pathSegments = window.location.pathname.split("/").filter(Boolean);
            return pathSegments.length > 0 ? `/${pathSegments[0]}` : "";
          };

          const basePath = getBasePath();

          // ==========================================
          // 1. Pyodide Setup
          // ==========================================
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
          await py.loadPackage(['pandas', 'numpy', 'micropip']);

          const micropip = py.pyimport('micropip');
          await micropip.install('openpyxl');

          const pyFiles = ['base.py', 'needleman_wunsch.py', 'smith_waterman.py', 'main.py'];
          for (const file of pyFiles) {
            const res = await fetch(`${basePath}/python/${file}`);
            if (!res.ok) throw new Error(`Failed to fetch ${file}`);
            const code = await res.text();
            py.FS.writeFile(file, code);
          }

          // ==========================================
          // 2. WebR Setup with IndexedDB Persistence
          // ==========================================
          const { WebR, ChannelType } = await import('webr');
          
          // IDBFS requires PostMessage communication channel
          const webrInstance = new WebR({
            channelType: ChannelType.PostMessage,
            baseUrl: 'https://webr.r-wasm.org/latest/'
          });
          
          await webrInstance.init();

          const userLibPath = '/home/web_user/library';

          // Set up persistent library path in WebR
          await webrInstance.evalR(`
            dir.create('${userLibPath}', recursive = TRUE, showWarnings = FALSE)
            .libPaths(c('${userLibPath}', .libPaths()))
          `);

          // Mount IndexedDB filesystem to the library path
          try {
            await webrInstance.FS.mount('IDBFS', {}, userLibPath);
            // Populate WebR virtual filesystem from IndexedDB cache
            await webrInstance.FS.syncfs(true);
          } catch (e) {
            console.warn('IDBFS mount failed, falling back to session-only storage:', e);
          }

          const requiredPackages = [
            'Rtsne', 
            'readxl', 
            'dplyr', 
            'ggplot2', 
            'plotly', 
            'htmlwidgets', 
            'jsonlite',
            'base64enc', 
            'scatterplot3d',
            'ggrepel',
            'htmltools'
          ];

          // Query R to see which packages are missing from IndexedDB
          const checkScript = `
            req_pkgs <- c(${requiredPackages.map(p => `'${p}'`).join(',')})
            inst_pkgs <- installed.packages(lib.loc = '${userLibPath}')[,"Package"]
            req_pkgs[!req_pkgs %in% inst_pkgs]
          `;

          const missingRes = await webrInstance.evalR(checkScript);
            const missingJs = (await missingRes.toJs()) as { values?: string[] };
            const missingPackages: string[] = missingJs.values || [];

          // Only download missing packages
          if (missingPackages.length > 0) {
            console.log(`[WebR] Downloading packages: ${missingPackages.join(', ')}...`);
            
            // 1. Prepend persistent path to R's library paths during setup
            await webrInstance.evalR(`
            dir.create("${userLibPath}", showWarnings = FALSE, recursive = TRUE)
            .libPaths(c("${userLibPath}", .libPaths()))
            `);

            // 2. Call installPackages cleanly 
            await webrInstance.installPackages(missingPackages);
            
            // Sync new downloads into IndexedDB
            await webrInstance.FS.syncfs(false);
            console.log('[WebR] Packages saved to local browser cache!');
          } else {
            console.log('[WebR] All R packages loaded directly from local browser cache!');
          }

          // Fetch & write t-SNE script
          const rRes = await fetch(`${basePath}/r/${encodeURIComponent('t-SNE.R')}`);
          if (!rRes.ok) throw new Error(`Failed to fetch t-SNE.R`);

          let rCode = await rRes.text();

          const encoder = new TextEncoder();
          await webrInstance.FS.writeFile('/tmp/t-SNE.R', encoder.encode(rCode));
          await webrInstance.evalR(`source('/tmp/t-SNE.R')`);

          globalPyodide = py;
          globalWebR = webrInstance;

          return true;
        })();
      }

      try {
        setLoadingStatus('Loading WebAssembly engines...');
        await initPromise;

        if (isMounted) {
          pyodideRef.current = globalPyodide;
          webRRef.current = globalWebR;
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

  return {
    pyodide: pyodideRef.current,
    webR: webRRef.current,
    isReady,
    loadingStatus
  };
}