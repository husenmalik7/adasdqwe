import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, RotateCcw } from 'lucide-react';
// import denah from '@/assets/denah.svg';
import denah from '@/assets/comifuro.jpg';
// import { generateCells } from '@/lib/utils';
import { BOOTHS } from '@/data/booths';
import { SidePanel } from './SidePanel';

const GRID_COLS = 1920;
const GRID_ROWS = 1080;

const MIN_SCALE = 0.1;
const MAX_SCALE = 60;
const DRAG_THRESHOLD = 4;
const GRID_OPACITY = 1;

type Transform = { scale: number; offsetX: number; offsetY: number };
type Booth = {
  cells: { x: number; y: number }[];

  id: number;
  circle_code: string;
  name: string;
  circle_cut: string;
  circle_facebook: string;
  circle_instagram: string;
  circle_twitter: string;
  circle_other_socials: string;
  sampleworks_images: string[];
  day: string;
  circle_type: string;
};

// const BOOTHS: Booth[] = [
//   {
//     cells: generateCells(438, 323, 446, 327),
//     name: 'Livium',
//     description: 'Merupakan VTuber agency dari Indo',
//     instagram: 'https://www.instagram.com/livium',
//     image: '[link gambar]',
//     detailUrl: '[link detail booth]',
//   },
//   {
//     cells: [
//       { x: 10, y: 10 },
//       { x: 9, y: 9 },
//       { x: 9, y: 10 },
//       { x: 10, y: 9 },
//     ],
//     name: 'Tanomiya',
//     description: 'Merupakan gerai merch jejepangan',
//     instagram: 'https://www.instagram.com/tanomiya',
//     image: '[link gambar]',
//     detailUrl: '[link detail booth]',
//   },
// ];

const CELL_MAP = new Map<string, Booth>();
for (const booth of BOOTHS) {
  for (const cell of booth.cells) {
    CELL_MAP.set(`${cell.x},${cell.y}`, booth);
  }
}

const GridCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<Transform>({ scale: 1, offsetX: 0, offsetY: 0 });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Highlight: pakai ref supaya draw() bisa baca tanpa deps
  const highlightedBoothRef = useRef<Booth | null>(null);
  const [selectedBoothName, setSelectedBoothName] = useState<string | null>(
    null
  );

  const animRef = useRef<number | null>(null);

  const [isInsideGrid, setIsInsideGrid] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    const img = new Image();
    img.src = denah;
    img.onload = () => {
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

    const bg = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim();
    ctx.fillStyle = bg ? `hsl(${bg})` : '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const img = imageRef.current;
    if (img) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, GRID_COLS, GRID_ROWS);
      ctx.restore();
    }

    const gridLeft = offsetX;
    const gridTop = offsetY;
    const gridRight = offsetX + GRID_COLS * scale;
    const gridBottom = offsetY + GRID_ROWS * scale;

    const startCol = Math.max(0, Math.floor(-offsetX / scale));
    const endCol = Math.min(GRID_COLS, Math.ceil((w - offsetX) / scale));
    const startRow = Math.max(0, Math.floor(-offsetY / scale));
    const endRow = Math.min(GRID_ROWS, Math.ceil((h - offsetY) / scale));

    let step = 1;
    if (scale < 0.5) step = 100;
    else if (scale < 2) step = 10;
    else if (scale < 4) step = 2;

    ctx.lineWidth = 1;
    ctx.save();
    ctx.globalAlpha = GRID_OPACITY;

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

    ctx.restore();

    // ── Highlight booth cells ──────────────────────────────────────────────
    const activeBooth = highlightedBoothRef.current;
    if (activeBooth) {
      const xs = activeBooth.cells.map((c) => c.x);
      const ys = activeBooth.cells.map((c) => c.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs) + 1;
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys) + 1;

      const rx = offsetX + minX * scale;
      const ry = offsetY + minY * scale;
      const rw = (maxX - minX) * scale;
      const rh = (maxY - minY) * scale;

      ctx.save();

      // Fill
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = 'hsl(45 100% 55%)';
      ctx.fillRect(rx, ry, rw, rh);

      // Single border
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = 'hsl(38 100% 45%)';
      ctx.lineWidth = Math.max(1.5, scale * 0.08);
      ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);

      ctx.restore();
    }
    // ── End highlight ──────────────────────────────────────────────────────

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

  // ── flyTo: animasi pan + zoom ke center booth ────────────────────────────
  const flyTo = useCallback(
    (booth: Booth) => {
      const xs = booth.cells.map((c) => c.x);
      const ys = booth.cells.map((c) => c.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs) + 1;
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys) + 1;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const { w, h } = sizeRef.current;

      // Hitung skala supaya booth mengisi ~30% layar, min 10 max 40
      const boothW = maxX - minX;
      const boothH = maxY - minY;
      const fitScale = Math.min(
        (w * 0.3) / Math.max(boothW, 1),
        (h * 0.3) / Math.max(boothH, 1)
      );
      // const TARGET_SCALE = Math.max(10, Math.min(40, fitScale));
      const TARGET_SCALE = Math.max(4, Math.min(8, fitScale));

      const targetOffsetX = w / 2 - centerX * TARGET_SCALE;
      const targetOffsetY = h / 2 - centerY * TARGET_SCALE;

      const startT = { ...transformRef.current };
      const DURATION = 650;
      const startTime = performance.now();

      const easeInOut = (t: number) =>
        t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      if (animRef.current) cancelAnimationFrame(animRef.current);

      const step = (now: number) => {
        const elapsed = now - startTime;
        const p = Math.min(elapsed / DURATION, 1);
        const e = easeInOut(p);

        transformRef.current = {
          scale: startT.scale + (TARGET_SCALE - startT.scale) * e,
          offsetX: startT.offsetX + (targetOffsetX - startT.offsetX) * e,
          offsetY: startT.offsetY + (targetOffsetY - startT.offsetY) * e,
        };
        scheduleDraw();

        if (p < 1) {
          animRef.current = requestAnimationFrame(step);
        }
      };

      animRef.current = requestAnimationFrame(step);
    },
    [scheduleDraw]
  );
  // ── End flyTo ────────────────────────────────────────────────────────────

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
      setIsDragging(true);
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

    const cell = screenToCell(x, y);
    if (
      cell.x >= 0 &&
      cell.x < GRID_COLS &&
      cell.y >= 0 &&
      cell.y < GRID_ROWS
    ) {
      setHover({ x: cell.x, y: cell.y, sx: x, sy: y });
      setIsInsideGrid(true);
    } else {
      setHover(null);
      setIsInsideGrid(false);
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
          const key = `${cell.x},${cell.y}`;
          const booth = CELL_MAP.get(key);
          if (booth) {
            // alert(`${booth.name}\n${booth.description}\n${booth.instagram}`);
            alert(`${booth.name}\n`);
          }
        }
      }
      dragStateRef.current.active = false;
      setIsDragging(false);
    }
    if (pointersRef.current.size < 2) {
      dragStateRef.current.pinchDist = null;
    }
  };

  const zoomCenter = (factor: number) => {
    const { w, h } = sizeRef.current;
    zoomAt(factor, w / 2, h / 2);
  };

  const handleShowBooth = (booth: Booth) => {
    highlightedBoothRef.current = booth;
    setSelectedBoothName(booth.name);
    flyTo(booth);
  };

  const handleClearHighlight = () => {
    highlightedBoothRef.current = null;
    setSelectedBoothName(null);
    scheduleDraw();
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-background touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => {
        setHover(null);
        setIsInsideGrid(false);
      }}
      style={{
        cursor: isDragging
          ? isInsideGrid
            ? 'default'
            : 'grabbing'
          : isInsideGrid
            ? 'default'
            : 'grab',
      }}
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
      // Hapus panel Show Booth lama, tambahkan ini di dalam return
      <SidePanel
        selectedBoothName={selectedBoothName}
        onLocate={handleShowBooth}
        onClear={handleClearHighlight}
      />
      {/* ── Show Booth panel ── */}
      <div
        className="absolute bottom-4 left-4 flex flex-col gap-1.5"
        style={{ maxWidth: 180 }}
      >
        <p className="rounded-md border border-border bg-card/90 px-2 py-1 text-xs font-mono text-muted-foreground shadow-sm backdrop-blur">
          Show Booth
        </p>
        {BOOTHS.map((booth) => (
          <Button
            key={booth.name}
            size="sm"
            variant={selectedBoothName === booth.name ? 'default' : 'secondary'}
            className="justify-start text-xs"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => handleShowBooth(booth)}
          >
            {booth.name}
          </Button>
        ))}
        {selectedBoothName && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleClearHighlight}
          >
            ✕ Clear
          </Button>
        )}
      </div>
      {/* ── End Show Booth panel ── */}
      {/* ── Navigation panel  */}
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
      {/* ── End Navigation panel  */}
    </div>
  );
};

export default GridCanvas;
