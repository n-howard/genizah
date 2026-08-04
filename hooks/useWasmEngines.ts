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
        // --- Path Resolution Helper ---
        const getBasePath = () => {
          if (typeof window === 'undefined') return '';
          
          // Next.js static exports provide base path via environment or window location
          const pathSegments = window.location.pathname.split('/').filter(Boolean);
          
          // If hosted on username.github.io/repo-name
          if (window.location.hostname.endsWith('github.io') && pathSegments.length > 0) {
            return `/${pathSegments[0]}`;
          }
          
          return process.env.NEXT_PUBLIC_BASE_PATH || '';
        };

        const basePath = getBasePath();

        // Safe fetch helper to prevent writing HTML 404s into VFS
        const fetchStaticText = async (relativePath: string) => {
          // Normalize leading slashes
          const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
          const fullUrl = `${basePath}${cleanPath}`.replace(/\/+/g, '/');

          const response = await fetch(fullUrl);
          const contentType = response.headers.get('content-type') || '';

          if (!response.ok || contentType.includes('text/html')) {
            throw new Error(
              `[Wasm Fetch Error] Failed to fetch static asset from "${fullUrl}". ` +
              `Status: ${response.status} (${contentType}). ` +
              `Verify the file exists in your project's 'public${cleanPath}' directory.`
            );
          }

          return await response.text();
        };

        // 1. Initialize Pyodide
        setLoadingStatus('Loading Python WebAssembly runtime...');
        if (!document.querySelector('script[src*="pyodide.js"]')) {
          const script = document.createElement('script');
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Pyodide script from CDN'));
            document.body.appendChild(script);
          });
        }

        const py = await (window as any).loadPyodide();
        await py.loadPackage(['pandas', 'numpy']);

        // Fetch and write Python files into Pyodide's standard execution directory (/home/pyodide)
        const pyFiles = ['base.py', 'needleman_wunsch.py', 'smith_waterman.py', 'main.py'];
        for (const file of pyFiles) {
          setLoadingStatus(`Loading Python module: ${file}...`);
          const code = await fetchStaticText(`/python/${file}`);
          py.FS.writeFile(`/home/pyodide/${file}`, code);
        }
        setPyodide(py);

        // 2. Initialize WebR
        setLoadingStatus('Loading R WebAssembly runtime & packages...');

        // Format service worker URL WITH basePath included for GitHub Pages
        const swUrl = typeof window !== 'undefined'
          ? `${window.location.origin}${basePath}/webr-serviceworker.js`.replace(/\/+/g, '/')
          : undefined;

        const webr = new WebR({
          serviceWorkerUrl: swUrl,
        });
        
        await webr.init();
        
        setLoadingStatus('Installing R packages (this may take a moment)...');
        await webr.installPackages(['Rtsne', 'ggplot2', 'pandoc', 'webshot2', 'htmltools', 'dplyr', 'rgl', 'readxl']);

        // Fetch and write R script to WebR virtual filesystem
        setLoadingStatus('Loading R scripts...');
        const rCode = await fetchStaticText('/r/t-SNE.R');
        await webr.FS.writeFile('/tmp/t-SNE.R', rCode);
        setWebR(webr);

        setIsReady(true);
        setLoadingStatus('WebAssembly engines ready');
      } catch (err) {
        console.error('Failed to initialize Wasm engines:', err);
        setLoadingStatus(`Engine initialization failed: ${(err as Error).message}`);
      }
    }

    loadEngines();
  }, []);

  return { pyodide, webR, isReady, loadingStatus };
}