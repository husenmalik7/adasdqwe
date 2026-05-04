import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, RotateCcw } from 'lucide-react';

const GRID_COLS = 1920;
const GRID_ROWS = 1080;
const MIN_SCALE = 0.1;
const MAX_SCALE = 60;
const DRAG_THRESHOLD = 4;
const GRID_OPACITY = 0; // 0 = hilang, 1 = full

type Transform = { scale: number; offsetX: number; offsetY: number };

const GridCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<Transform>({ scale: 1, offsetX: 0, offsetY: 0 });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    moved: number;
    pinchDist: number | null;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    moved: 0,
    pinchDist: null,
  });

  const [hover, setHover] = useState<{
    x: number;
    y: number;
    sx: number;
    sy: number;
  } | null>(null);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      draw();
    });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { w, h } = sizeRef.current;
    const { scale, offsetX, offsetY } = transformRef.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Background
    const bg = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim();
    ctx.fillStyle = bg ? `hsl(${bg})` : '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Grid bounds in screen space
    const gridLeft = offsetX;
    const gridTop = offsetY;
    const gridRight = offsetX + GRID_COLS * scale;
    const gridBottom = offsetY + GRID_ROWS * scale;

    // Draw grid background (subtle)
    const gridBgX = Math.max(0, gridLeft);
    const gridBgY = Math.max(0, gridTop);
    const gridBgW = Math.min(w, gridRight) - gridBgX;
    const gridBgH = Math.min(h, gridBottom) - gridBgY;
    if (gridBgW > 0 && gridBgH > 0) {
      ctx.fillStyle = 'hsl(0 0% 99%)';
      ctx.fillRect(gridBgX, gridBgY, gridBgW, gridBgH);
    }

    // Visible cell range
    const startCol = Math.max(0, Math.floor(-offsetX / scale));
    const endCol = Math.min(GRID_COLS, Math.ceil((w - offsetX) / scale));
    const startRow = Math.max(0, Math.floor(-offsetY / scale));
    const endRow = Math.min(GRID_ROWS, Math.ceil((h - offsetY) / scale));

    // Level of detail: choose step so lines aren't packed too tight
    let step = 1;
    if (scale < 0.5) step = 100;
    else if (scale < 2) step = 10;
    else if (scale < 4) step = 2;

    ctx.lineWidth = 1;
    ctx.save();
    ctx.globalAlpha = GRID_OPACITY; //ini

    // Minor lines
    if (scale >= 4) {
      ctx.strokeStyle = 'hsl(220 13% 91%)';
      ctx.beginPath();
      for (let c = Math.ceil(startCol / 1) * 1; c <= endCol; c += 1) {
        if (c % 10 === 0) continue;
        const x = Math.round(offsetX + c * scale) + 0.5;
        ctx.moveTo(x, Math.max(0, gridTop));
        ctx.lineTo(x, Math.min(h, gridBottom));
      }
      for (let r = Math.ceil(startRow / 1) * 1; r <= endRow; r += 1) {
        if (r % 10 === 0) continue;
        const y = Math.round(offsetY + r * scale) + 0.5;
        ctx.moveTo(Math.max(0, gridLeft), y);
        ctx.lineTo(Math.min(w, gridRight), y);
      }
      ctx.stroke();
    }

    // Step lines (medium)
    if (step <= 10) {
      ctx.strokeStyle = 'hsl(220 13% 85%)';
      ctx.beginPath();
      const s = Math.max(step, 10);
      for (let c = Math.ceil(startCol / s) * s; c <= endCol; c += s) {
        if (c % 100 === 0) continue;
        const x = Math.round(offsetX + c * scale) + 0.5;
        ctx.moveTo(x, Math.max(0, gridTop));
        ctx.lineTo(x, Math.min(h, gridBottom));
      }
      for (let r = Math.ceil(startRow / s) * s; r <= endRow; r += s) {
        if (r % 100 === 0) continue;
        const y = Math.round(offsetY + r * scale) + 0.5;
        ctx.moveTo(Math.max(0, gridLeft), y);
        ctx.lineTo(Math.min(w, gridRight), y);
      }
      ctx.stroke();
    }

    // Major lines (every 100)
    ctx.strokeStyle = 'hsl(220 13% 75%)';
    ctx.beginPath();
    for (let c = Math.ceil(startCol / 100) * 100; c <= endCol; c += 100) {
      const x = Math.round(offsetX + c * scale) + 0.5;
      ctx.moveTo(x, Math.max(0, gridTop));
      ctx.lineTo(x, Math.min(h, gridBottom));
    }
    for (let r = Math.ceil(startRow / 100) * 100; r <= endRow; r += 100) {
      const y = Math.round(offsetY + r * scale) + 0.5;
      ctx.moveTo(Math.max(0, gridLeft), y);
      ctx.lineTo(Math.min(w, gridRight), y);
    }
    ctx.stroke();

    ctx.restore(); //ini

    // Outer border
    ctx.strokeStyle = 'hsl(220 13% 60%)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      Math.round(gridLeft) + 0.5,
      Math.round(gridTop) + 0.5,
      Math.round(GRID_COLS * scale),
      Math.round(GRID_ROWS * scale)
    );
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    sizeRef.current = { w, h };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    scheduleDraw();
  }, [scheduleDraw]);

  const fitToScreen = useCallback(() => {
    const { w, h } = sizeRef.current;
    if (!w || !h) return;
    const scale = Math.min(w / GRID_COLS, h / GRID_ROWS) * 0.95;
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

  // Init
  useEffect(() => {
    resize();
    fitToScreen();
    const onResize = () => {
      const oldW = sizeRef.current.w;
      const oldH = sizeRef.current.h;
      const t = transformRef.current;
      const cxWorld = (oldW / 2 - t.offsetX) / t.scale;
      const cyWorld = (oldH / 2 - t.offsetY) / t.scale;
      resize();
      const { w, h } = sizeRef.current;
      transformRef.current = {
        scale: t.scale,
        offsetX: w / 2 - cxWorld * t.scale,
        offsetY: h / 2 - cyWorld * t.scale,
      };
      scheduleDraw();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wheel zoom
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

  const screenToCell = (sx: number, sy: number) => {
    const t = transformRef.current;
    const wx = (sx - t.offsetX) / t.scale;
    const wy = (sy - t.offsetY) / t.scale;
    return { x: Math.floor(wx), y: Math.floor(wy) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const el = containerRef.current!;
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointersRef.current.set(e.pointerId, { x, y });

    if (pointersRef.current.size === 1) {
      dragStateRef.current = {
        active: true,
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        moved: 0,
        pinchDist: null,
      };
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      dragStateRef.current.pinchDist = Math.hypot(dx, dy);
      dragStateRef.current.active = false;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = containerRef.current!;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x, y });
    }

    // Hover coord
    const cell = screenToCell(x, y);
    if (
      cell.x >= 0 &&
      cell.x < GRID_COLS &&
      cell.y >= 0 &&
      cell.y < GRID_ROWS
    ) {
      setHover({ x: cell.x, y: cell.y, sx: x, sy: y });
    } else {
      setHover(null);
    }

    if (
      pointersRef.current.size === 2 &&
      dragStateRef.current.pinchDist != null
    ) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      const mx = (pts[0].x + pts[1].x) / 2;
      const my = (pts[0].y + pts[1].y) / 2;
      const factor = dist / dragStateRef.current.pinchDist;
      zoomAt(factor, mx, my);
      dragStateRef.current.pinchDist = dist;
      return;
    }

    const ds = dragStateRef.current;
    if (ds.active) {
      const dx = x - ds.lastX;
      const dy = y - ds.lastY;
      ds.lastX = x;
      ds.lastY = y;
      ds.moved += Math.abs(dx) + Math.abs(dy);
      const t = transformRef.current;
      transformRef.current = {
        ...t,
        offsetX: t.offsetX + dx,
        offsetY: t.offsetY + dy,
      };
      scheduleDraw();
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const el = containerRef.current!;
    if (el.hasPointerCapture(e.pointerId))
      el.releasePointerCapture(e.pointerId);
    const wasPointers = pointersRef.current.size;
    pointersRef.current.delete(e.pointerId);

    if (wasPointers === 1) {
      const ds = dragStateRef.current;
      if (ds.active && ds.moved < DRAG_THRESHOLD) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cell = screenToCell(x, y);
        if (
          cell.x >= 0 &&
          cell.x < GRID_COLS &&
          cell.y >= 0 &&
          cell.y < GRID_ROWS
        ) {
          alert(`X: ${cell.x}, Y: ${cell.y}`);
        }
      }
      dragStateRef.current.active = false;
    }
    if (pointersRef.current.size < 2) {
      dragStateRef.current.pinchDist = null;
    }
  };

  const zoomCenter = (factor: number) => {
    const { w, h } = sizeRef.current;
    zoomAt(factor, w / 2, h / 2);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-background touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => setHover(null)}
      style={{ cursor: dragStateRef.current.active ? 'grabbing' : 'grab' }}
    >
      <canvas ref={canvasRef} className="block" />

      {hover && (
        <div
          className="pointer-events-none absolute rounded-md border border-border bg-card px-2 py-1 text-xs font-mono text-card-foreground shadow-md"
          style={{
            left: Math.min(hover.sx + 14, sizeRef.current.w - 120),
            top: Math.min(hover.sy + 14, sizeRef.current.h - 32),
          }}
        >
          X: {hover.x}, Y: {hover.y}
        </div>
      )}

      <div className="absolute right-4 top-4 rounded-md border border-border bg-card/90 px-3 py-1.5 text-xs font-mono text-muted-foreground shadow-sm backdrop-blur">
        1920 × 1080 grid
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => zoomCenter(1.25)}
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => zoomCenter(1 / 1.25)}
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={fitToScreen}
          aria-label="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default GridCanvas;
