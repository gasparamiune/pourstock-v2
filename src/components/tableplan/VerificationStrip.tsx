import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface VerificationStripProps {
  pdfBase64: string;
  highlightText: string | null;
}

export function VerificationStrip({ pdfBase64, highlightText }: VerificationStripProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [textItems, setTextItems] = useState<Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    pageIndex: number;
  }>>([]);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Load and render PDF
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const data = atob(pdfBase64);
        const uint8 = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) uint8[i] = data.charCodeAt(i);

        const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
        if (cancelled) return;

        setPageCount(pdf.numPages);
        const allTextItems: typeof textItems = [];
        canvasRefs.current = [];

        const container = containerRef.current;
        if (!container) return;

        // Clear previous canvases
        while (container.firstChild) {
          if (container.firstChild !== highlightRef.current) {
            container.removeChild(container.firstChild);
          } else {
            break;
          }
        }

        for (let i = 0; i < pdf.numPages; i++) {
          const page = await pdf.getPage(i + 1);
          const scale = 1.5;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          canvas.className = 'shrink-0';
          canvasRefs.current.push(canvas);

          // Insert before the highlight overlay
          if (highlightRef.current) {
            container.insertBefore(canvas, highlightRef.current);
          } else {
            container.appendChild(canvas);
          }

          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;

          // Extract text positions
          const textContent = await page.getTextContent();
          for (const item of textContent.items) {
            if ('str' in item && item.str.trim()) {
              const tx = item.transform;
              allTextItems.push({
                text: item.str,
                x: tx[4] * scale,
                y: viewport.height - tx[5] * scale - (item.height || 12) * scale,
                width: (item.width || item.str.length * 6) * scale,
                height: (item.height || 12) * scale,
                pageIndex: i,
              });
            }
          }
        }

        if (!cancelled) {
          setTextItems(allTextItems);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('PDF load error:', err);
          setError('Failed to load PDF');
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [pdfBase64]);

  // Highlight matching text
  useEffect(() => {
    if (!highlightText || textItems.length === 0 || !containerRef.current) return;

    const searchLower = highlightText.toLowerCase();
    
    // Find matching text items by checking if any text item's line contains parts of the search text
    const matches = textItems.filter(item => {
      const itemLower = item.text.toLowerCase();
      // Check for direct match
      if (searchLower.includes(itemLower) && itemLower.length > 2) return true;
      if (itemLower.includes(searchLower)) return true;
      // Check for word overlap (at least 2 words)
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
      const itemWords = itemLower.split(/\s+/).filter(w => w.length > 2);
      const overlap = searchWords.filter(sw => itemWords.some(iw => iw.includes(sw) || sw.includes(iw)));
      return overlap.length >= 2;
    });

    if (matches.length === 0) return;

    // Calculate bounding box across all matches
    const pageIndex = matches[0].pageIndex;
    const pageMatches = matches.filter(m => m.pageIndex === pageIndex);
    
    const minY = Math.min(...pageMatches.map(m => m.y));
    const maxY = Math.max(...pageMatches.map(m => m.y + m.height));
    const minX = Math.min(...pageMatches.map(m => m.x));
    const maxX = Math.max(...pageMatches.map(m => m.x + m.width));

    // Calculate offset for the page
    let pageOffset = 0;
    for (let i = 0; i < pageIndex; i++) {
      const c = canvasRefs.current[i];
      if (c) pageOffset += c.width + 16; // 16px gap
    }

    const highlight = highlightRef.current;
    if (highlight) {
      const padding = 6;
      highlight.style.display = 'block';
      highlight.style.left = `${pageOffset + minX - padding}px`;
      highlight.style.top = `${minY - padding}px`;
      highlight.style.width = `${maxX - minX + padding * 2}px`;
      highlight.style.height = `${maxY - minY + padding * 2}px`;

      // Scroll into view
      highlight.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [highlightText, textItems]);

  // Hide highlight when no text
  useEffect(() => {
    if (!highlightText && highlightRef.current) {
      highlightRef.current.style.display = 'none';
    }
  }, [highlightText]);

  if (error) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-destructive bg-destructive/5 rounded-xl border border-destructive/20">
        {error}
      </div>
    );
  }

  return (
    <div className="relative border border-border rounded-xl bg-muted/20 overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading PDF…</span>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex gap-4 p-3 overflow-x-auto overflow-y-hidden h-[220px] items-start relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Highlight overlay */}
        <div
          ref={highlightRef}
          className="absolute z-10 pointer-events-none rounded-md border-2 border-primary bg-primary/20 transition-all duration-300"
          style={{ display: 'none' }}
        />
      </div>
      {/* Bottom info strip */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <span>{pageCount > 0 ? `${pageCount} ${pageCount === 1 ? 'side' : 'sider'}` : ''}</span>
        <span className={cn(
          "transition-opacity",
          highlightText ? "opacity-100" : "opacity-0"
        )}>
          🔍 {highlightText?.substring(0, 60)}{(highlightText?.length || 0) > 60 ? '…' : ''}
        </span>
      </div>
    </div>
  );
}
