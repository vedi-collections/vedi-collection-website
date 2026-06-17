"use client";

import { useEffect, useRef, useState } from "react";

import { buttonClasses } from "@/components/ui/Button";
import {
  type CropTransform,
  clampTransform,
  drawSquare,
  exportSquare,
  loadImageFromFile,
} from "@/lib/admin/crop";

const PREVIEW = 360; // preview canvas buffer size (px)

type ImageCropDialogProps = {
  file: File;
  /** How many images (including this one) are still queued, for the header. */
  remaining: number;
  /** Receives the cropped/padded square as a JPEG blob. May be async (upload). */
  onDone: (blob: Blob) => void | Promise<void>;
  onSkip: () => void;
};

/** Square-crop one image before upload. Drag + zoom to crop; at minimum zoom the
 *  whole image is kept with black bars (no cropping). */
export function ImageCropDialog({ file, remaining, onDone, onSkip }: ImageCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let revoked: string | null = null;
    let active = true;
    loadImageFromFile(file)
      .then(({ img, url }) => {
        revoked = url;
        if (!active) return;
        imgRef.current = img;
        setReady(true);
      })
      .catch(() => active && onSkip());
    return () => {
      active = false;
      if (revoked) URL.revokeObjectURL(revoked);
    };
    // Load once per file; onSkip is intentionally excluded (a fresh closure each
    // parent render would otherwise reload the image and reset the crop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Redraw the preview whenever the transform changes.
  useEffect(() => {
    const img = imgRef.current;
    const ctx = canvasRef.current?.getContext("2d");
    if (ready && img && ctx) drawSquare(ctx, img, { zoom, offsetX: offset.x, offsetY: offset.y }, PREVIEW);
  }, [ready, zoom, offset]);

  function applyTransform(next: CropTransform) {
    const img = imgRef.current;
    if (!img) return;
    const clamped = clampTransform(img, next, PREVIEW);
    setZoom(clamped.zoom);
    setOffset({ x: clamped.offsetX, y: clamped.offsetY });
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    dragRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const start = dragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!start || !rect) return;
    const dx = (e.clientX - start.x) / rect.width;
    const dy = (e.clientY - start.y) / rect.height;
    dragRef.current = { x: e.clientX, y: e.clientY };
    applyTransform({ zoom, offsetX: offset.x + dx, offsetY: offset.y + dy });
  }
  function endDrag() {
    dragRef.current = null;
  }

  async function apply() {
    const img = imgRef.current;
    if (!img) return;
    setBusy(true);
    try {
      const blob = await exportSquare(img, { zoom, offsetX: offset.x, offsetY: offset.y });
      await onDone(blob); // parent uploads + advances the queue (this dialog unmounts)
    } catch {
      setBusy(false); // only reached if export failed and we're still mounted
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-primary-dark/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-xl">
        <h3 className="font-serif text-lg font-semibold text-heading">
          Crop image{remaining > 1 ? ` (${remaining} left)` : ""}
        </h3>
        <p className="mt-1 text-xs text-muted">
          Drag and zoom to crop to a square — or just add it as-is to keep the whole image with black bars.
        </p>

        <div className="mt-3 grid place-items-center">
          <canvas
            ref={canvasRef}
            width={PREVIEW}
            height={PREVIEW}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            className="aspect-square w-full max-w-[360px] cursor-grab touch-none rounded-lg border border-line bg-black active:cursor-grabbing"
          />
        </div>

        <label className="mt-3 flex items-center gap-3 text-xs font-medium text-muted">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            disabled={!ready}
            onChange={(e) => applyTransform({ zoom: Number(e.target.value), offsetX: offset.x, offsetY: offset.y })}
            className="flex-1 accent-primary"
          />
        </label>

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onSkip} disabled={busy} className={buttonClasses("ghost", "sm")}>
            Skip this file
          </button>
          <button type="button" onClick={apply} disabled={!ready || busy} className={buttonClasses("primary", "sm")}>
            {busy ? "Adding…" : "Add image"}
          </button>
        </div>
      </div>
    </div>
  );
}
