'use client';

import {motion} from 'framer-motion';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {CSSProperties, PointerEvent as ReactPointerEvent, ReactNode} from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel: string;
  /** bottom = mobile bottom sheet; left/right = tablet side drawer */
  side?: 'bottom' | 'left' | 'right';
  /** bottom sheet only: snap heights in dvh percent */
  peek?: number;
  expanded?: number;
  /** render a scrim that closes on tap; when false the map stays interactive */
  backdrop?: boolean;
  /** accent for the drag pill + top hairline, rgb like "45 212 191" */
  accent?: string;
}

/**
 * Responsive info surface. On phones it is a draggable bottom sheet with two
 * snap points (peek / expanded); on tablets it is a side drawer. Desktop
 * consumers should render their content in a flex column instead of a Sheet.
 *
 * Wrap usages in <AnimatePresence> for exit animations.
 */
export default function Sheet({
  open,
  onClose,
  children,
  ariaLabel,
  side = 'bottom',
  peek = 58,
  expanded = 90,
  backdrop = true,
  accent = '148 163 184'
}: SheetProps) {
  const isBottom = side === 'bottom';
  const [snapped, setSnapped] = useState<'peek' | 'expanded'>(isBottom ? 'peek' : 'expanded');
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [vpH, setVpH] = useState(0);
  const dragStart = useRef<{y: number; t: number} | null>(null);
  const velocity = useRef(0);

  // Reset snap + drag state whenever a sheet opens (component is remounted by AnimatePresence).
  useEffect(() => {
    setSnapped('peek');
    setDy(0);
    setDragging(false);
  }, []);

  useEffect(() => {
    const onResize = () => setVpH(window.innerHeight);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const peekPx = (peek / 100) * (vpH || 800);
  const expPx = (expanded / 100) * (vpH || 800);
  const snapPx = snapped === 'peek' ? peekPx : expPx;

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isBottom) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStart.current = {y: e.clientY, t: performance.now()};
    velocity.current = 0;
    setDragging(true);
  }, [isBottom]);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragging || !dragStart.current) return;
      const d = e.clientY - dragStart.current.y;
      const now = performance.now();
      velocity.current = d / Math.max(1, now - dragStart.current.t); // px/ms
      dragStart.current = {y: e.clientY, t: now};
      setDy(d);
    },
    [dragging]
  );

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const d = dy;
    const v = velocity.current;
    if (snapped === 'peek') {
      if (d > 130 || v > 0.55) {
        setDy(0);
        onClose();
      } else if (d < -90 || v < -0.5) {
        setDy(0);
        setSnapped('expanded');
      } else {
        setDy(0);
      }
    } else {
      if (d > 90 || v > 0.5) {
        setDy(0);
        setSnapped('peek');
      } else {
        setDy(0);
      }
    }
  }, [dragging, dy, snapped, onClose]);

  if (!open) return null;

  const bodyStyle: CSSProperties = isBottom
    ? {
        height: snapPx,
        transform: `translateY(${dragging ? dy : 0}px)`,
        transition: dragging ? 'none' : 'height 0.32s cubic-bezier(0.22,1,0.36,1), transform 0.32s cubic-bezier(0.22,1,0.36,1)'
      }
    : {width: 'min(24rem, 86vw)'};

  return (
    <motion.div
      initial={
        isBottom
          ? {opacity: 0.4, y: 80}
          : side === 'left'
            ? {x: '-105%', opacity: 0.5}
            : {x: '105%', opacity: 0.5}
      }
      animate={isBottom ? {opacity: 1, y: 0} : {x: 0, opacity: 1}}
      exit={
        isBottom
          ? {opacity: 0, y: 90}
          : side === 'left'
            ? {x: '-105%', opacity: 0}
            : {x: '105%', opacity: 0}
      }
      transition={{type: 'spring', stiffness: 380, damping: 34}}
      className={
        isBottom
          ? 'pointer-events-auto fixed inset-x-0 bottom-0 z-40'
          : `pointer-events-auto fixed bottom-0 top-0 z-40 ${side === 'left' ? 'left-0' : 'right-0'}`
      }
    >
      {backdrop && (
        <motion.button
          aria-label="close"
          tabIndex={-1}
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          onClick={onClose}
          className="fixed inset-0 z-40 cursor-default bg-[rgba(4,7,12,0.5)] backdrop-blur-[2px]"
        />
      )}
      <motion.div
        initial={isBottom ? {y: 40} : {x: side === 'left' ? -30 : 30}}
        animate={isBottom ? {y: 0} : {x: 0}}
        exit={{}}
        transition={{type: 'spring', stiffness: 380, damping: 34}}
        role="dialog"
        aria-modal={backdrop}
        aria-label={ariaLabel}
        tabIndex={-1}
        className={`glass-strong pointer-events-auto relative z-50 flex flex-col overflow-hidden shadow-panel-lg ${
          isBottom ? 'rounded-t-2xl' : side === 'left' ? 'rounded-r-2xl' : 'rounded-l-2xl'
        }`}
        style={{...bodyStyle, height: !isBottom ? '100%' : bodyStyle.height}}
      >
        {/* accent hairline */}
        <div
          className="h-px w-full shrink-0"
          style={{background: `linear-gradient(90deg, transparent, rgb(${accent} / 0.7), transparent)`}}
        />
        {/* drag bar (bottom sheets) — double tap toggles peek/expanded */}
        {isBottom && (
          <div
            className="flex h-8 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={() => setSnapped((s) => (s === 'peek' ? 'expanded' : 'peek'))}
          >
            <span
              className="h-1 w-9 rounded-full transition-colors"
              style={{background: `rgb(${accent} / 0.55)`}}
            />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </motion.div>
    </motion.div>
  );
}
