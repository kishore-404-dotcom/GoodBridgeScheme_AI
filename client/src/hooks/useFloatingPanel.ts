import React, { useCallback, useEffect, useRef, useState } from 'react';
import { readStore, writeStore } from '../utils/storage';

export interface PanelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Which edges a resize handle moves: n/s/e/w and the four corners */
export type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const MIN_W = 320;
const MIN_H = 380;
const MARGIN = 8;
/** Below this width the panel is docked full-width instead of floating */
const FLOAT_BREAKPOINT = 640;

const defaultRect = (): PanelRect => {
  const w = Math.min(440, window.innerWidth - MARGIN * 2);
  const h = Math.min(580, window.innerHeight - MARGIN * 2);
  return { x: window.innerWidth - w - 16, y: window.innerHeight - h - 16, w, h };
};

/** Keeps the panel fully on screen and within min/max size */
const clamp = (r: PanelRect): PanelRect => {
  const maxW = window.innerWidth - MARGIN * 2;
  const maxH = window.innerHeight - MARGIN * 2;
  const w = Math.max(Math.min(r.w, maxW), Math.min(MIN_W, maxW));
  const h = Math.max(Math.min(r.h, maxH), Math.min(MIN_H, maxH));
  const x = Math.min(Math.max(r.x, MARGIN), window.innerWidth - w - MARGIN);
  const y = Math.min(Math.max(r.y, MARGIN), window.innerHeight - h - MARGIN);
  return { x, y, w, h };
};

/**
 * Drag-to-move and drag-to-resize for a fixed-position panel.
 * The rect is remembered per device under `storageKey`.
 */
export const useFloatingPanel = (storageKey: string) => {
  const [rect, setRect] = useState<PanelRect>(() => clamp(readStore<PanelRect | null>(storageKey, null) || defaultRect()));
  const [isFloating, setIsFloating] = useState(() => window.innerWidth >= FLOAT_BREAKPOINT);
  const [isInteracting, setIsInteracting] = useState(false);
  const rectRef = useRef(rect);
  rectRef.current = rect;

  useEffect(() => {
    const onResize = () => {
      setIsFloating(window.innerWidth >= FLOAT_BREAKPOINT);
      setRect((r) => clamp(r));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /** Tracks one pointer gesture; `apply` turns the pointer offset into a new rect */
  const track = useCallback(
    (e: React.PointerEvent, apply: (start: PanelRect, dx: number, dy: number) => PanelRect) => {
      if (!isFloating || e.button !== 0) return;
      e.preventDefault();
      const start = rectRef.current;
      const startX = e.clientX;
      const startY = e.clientY;
      setIsInteracting(true);

      const onMove = (ev: PointerEvent) => setRect(clamp(apply(start, ev.clientX - startX, ev.clientY - startY)));
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        setIsInteracting(false);
        writeStore(storageKey, rectRef.current);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [isFloating, storageKey]
  );

  /** Attach to the panel's header. Clicks on buttons/inputs inside it are not drags. */
  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a, select, textarea')) return;
    track(e, (s, dx, dy) => ({ ...s, x: s.x + dx, y: s.y + dy }));
  };

  const startResize = (edge: ResizeEdge) => (e: React.PointerEvent) =>
    track(e, (s, dx, dy) => {
      let { x, y, w, h } = s;
      if (edge.includes('e')) w = s.w + dx;
      if (edge.includes('s')) h = s.h + dy;
      if (edge.includes('w')) {
        w = Math.max(s.w - dx, MIN_W);
        x = s.x + (s.w - w);
      }
      if (edge.includes('n')) {
        h = Math.max(s.h - dy, MIN_H);
        y = s.y + (s.h - h);
      }
      return { x, y, w, h };
    });

  /** Keyboard alternative: arrow keys move, Shift+arrows resize */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!isFloating) return;
    const step = 24;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step]
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    setRect((r) => {
      const next = clamp(e.shiftKey ? { ...r, w: r.w + d[0], h: r.h + d[1] } : { ...r, x: r.x + d[0], y: r.y + d[1] });
      writeStore(storageKey, next);
      return next;
    });
  };

  const reset = () => {
    const r = clamp(defaultRect());
    setRect(r);
    writeStore(storageKey, null);
  };

  const style: React.CSSProperties = isFloating
    ? { left: rect.x, top: rect.y, width: rect.w, height: rect.h }
    : { left: MARGIN, right: MARGIN, bottom: MARGIN, height: Math.min(560, window.innerHeight - MARGIN * 2) };

  return { style, isFloating, isInteracting, startDrag, startResize, onKeyDown, reset };
};
