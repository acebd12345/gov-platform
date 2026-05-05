'use client';

import { useRef, useState, type ReactNode } from 'react';

/**
 * 簡單的 HTML5 拖曳排序容器。
 * 不引入 dnd-kit / react-dnd（重）— 直接用 native draggable + dragstart/dragover/drop。
 *
 * 用法：
 *   <SortableList
 *     items={list}
 *     onReorder={(next) => setList(next)}
 *     renderItem={(item, idx, dragProps) => (
 *       <div>
 *         <span {...dragProps.handle}>≡</span>
 *         {item.name}
 *       </div>
 *     )}
 *   />
 */
export function SortableList<T>({
  items,
  onReorder,
  renderItem,
  getKey,
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  renderItem: (
    item: T,
    index: number,
    helpers: { handleProps: Record<string, unknown>; isDragging: boolean }
  ) => ReactNode;
  getKey?: (item: T, index: number) => string | number;
}) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  function move(from: number, to: number) {
    if (from === to) return;
    const next = items.slice();
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onReorder(next);
  }

  return (
    <div>
      {items.map((item, idx) => {
        const isDragging = draggingIdx === idx;
        const isOver = overIdx === idx && draggingIdx !== null && draggingIdx !== idx;
        const key = getKey ? getKey(item, idx) : idx;

        const handleProps: Record<string, unknown> = {
          draggable: true,
          onDragStart: (e: React.DragEvent) => {
            setDraggingIdx(idx);
            // Firefox 需要 setData
            try { e.dataTransfer.setData('text/plain', String(idx)); } catch {}
            e.dataTransfer.effectAllowed = 'move';
          },
          onDragEnd: () => {
            setDraggingIdx(null);
            setOverIdx(null);
          },
          style: { cursor: 'grab' as const, userSelect: 'none' as const },
        };

        return (
          <div
            key={key}
            onDragOver={(e) => {
              if (draggingIdx === null) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setOverIdx(idx);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingIdx === null) return;
              move(draggingIdx, idx);
              setDraggingIdx(null);
              setOverIdx(null);
            }}
            style={{
              opacity: isDragging ? 0.4 : 1,
              borderTop: isOver && (draggingIdx ?? -1) > idx ? '2px solid var(--color-brand)' : undefined,
              borderBottom: isOver && (draggingIdx ?? -1) < idx ? '2px solid var(--color-brand)' : undefined,
              transition: 'opacity 0.15s',
            }}
          >
            {renderItem(item, idx, { handleProps, isDragging })}
          </div>
        );
      })}
      <div ref={dragImageRef} style={{ position: 'absolute', left: -9999 }} />
    </div>
  );
}

/** 拖曳 handle icon — 灰色 ⋮⋮，hover 變深 */
export function DragHandle(props: Record<string, unknown>) {
  return (
    <span
      {...props}
      title="拖曳排序"
      style={{
        ...(props.style as object),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        color: 'var(--color-text-muted)',
        flexShrink: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="15" cy="12" r="1.6" />
        <circle cx="15" cy="18" r="1.6" />
      </svg>
    </span>
  );
}
