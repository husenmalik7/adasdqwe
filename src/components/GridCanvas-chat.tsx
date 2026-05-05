import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, RotateCcw } from 'lucide-react';

const GRID_COLS = 1920;
const GRID_ROWS = 1080;
const MIN_SCALE = 0.1;
const MAX_SCALE = 60;

type Transform = { scale: number; offsetX: number; offsetY: number };

const GridCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<Transform>({ scale: 1, offsetX: 0, offsetY: 0 });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);

  const [hover, setHover] = useState<any>(null);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      draw();
    });
  }, []);

  // 🔥 LOAD IMAGE
  useEffect(() => {
    const img = new Image();
    img.src = '/denah.jpg'; // WAJIB di folder public
    img.onload = () => {
      console.log('image loaded');
      imageRef.current = img;
      scheduleDraw();
    };
  }, [scheduleDraw]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { w, h } = sizeRef.current;
    const { scale, offsetX, offsetY } = transformRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 🔹 background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // 🔥 IMAGE (DENAH)
    const img = imageRef.current;
    if (img) {
      ctx.drawImage(
        img,
        offsetX,
        offsetY,
        GRID_COLS * scale,
        GRID_ROWS * scale
      );
    }

    // 🔹 BORDER LUAR (tetap ada)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, GRID_COLS * scale, GRID_ROWS * scale);
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    sizeRef.current = { w, h };
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    scheduleDraw();
  }, [scheduleDraw]);

  const fitToScreen = useCallback(() => {
    const { w, h } = sizeRef.current;
    const scale = Math.min(w / GRID_COLS, h / GRID_ROWS);

    transformRef.current = {
      scale,
      offsetX: (w - GRID_COLS * scale) / 2,
      offsetY: (h - GRID_ROWS * scale) / 2,
    };

    scheduleDraw();
  }, [scheduleDraw]);

  const zoomAt = useCallback(
    (factor: number, sx: number, sy: number) => {
      const t = transformRef.current;

      let newScale = t.scale * factor;
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

      const actual = newScale / t.scale;

      transformRef.current = {
        scale: newScale,
        offsetX: sx - (sx - t.offsetX) * actual,
        offsetY: sy - (sy - t.offsetY) * actual,
      };

      scheduleDraw();
    },
    [scheduleDraw]
  );

  useEffect(() => {
    resize();
    fitToScreen();

    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize, fitToScreen]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const factor = Math.pow(1.0015, -e.deltaY);
      zoomAt(factor, sx, sy);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-background"
    >
      <canvas ref={canvasRef} />

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button
          onClick={() =>
            zoomAt(1.25, sizeRef.current.w / 2, sizeRef.current.h / 2)
          }
        >
          <Plus />
        </Button>
        <Button
          onClick={() =>
            zoomAt(0.8, sizeRef.current.w / 2, sizeRef.current.h / 2)
          }
        >
          <Minus />
        </Button>
        <Button onClick={fitToScreen}>
          <RotateCcw />
        </Button>
      </div>
    </div>
  );
};

export default GridCanvas;
