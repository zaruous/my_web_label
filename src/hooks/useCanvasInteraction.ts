import React, { useRef, useState, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import { useElementHistory } from './useElementHistory';

export function useCanvasInteraction() {
  const [state, dispatch] = useEditor();
  const { updateElements, undo, redo } = useElementHistory();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartRect = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const scale = 5.5 * (state.zoom / 100);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).id === 'grid-backplane') {
      dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: null });
    }
  };

  const handleElementMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: elementId });

    const targetElement = state.elements.find(el => el.id === elementId);
    if (!targetElement) return;

    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartRect.current = {
      x: targetElement.x,
      y: targetElement.y,
      w: targetElement.width,
      h: targetElement.height
    };
  };

  const handleResizeHandleMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: elementId });

    const targetElement = state.elements.find(el => el.id === elementId);
    if (!targetElement) return;

    setIsResizing(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartRect.current = {
      x: targetElement.x,
      y: targetElement.y,
      w: targetElement.width,
      h: targetElement.height
    };
  };

  // Global mouse move/up for drag and resize
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!state.selectedElementId) return;

      const targetElement = state.elements.find(el => el.id === state.selectedElementId);
      if (!targetElement) return;

      const deltaXpx = e.clientX - dragStartPos.current.x;
      const deltaYpx = e.clientY - dragStartPos.current.y;

      const deltaXmm = deltaXpx / scale;
      const deltaYmm = deltaYpx / scale;

      const snapSize = state.snapToGrid ? 5 : 0.1;

      if (isDragging) {
        let rawX = elementStartRect.current.x + deltaXmm;
        let rawY = elementStartRect.current.y + deltaYmm;

        if (state.snapToGrid) {
          rawX = Math.round(rawX / snapSize) * snapSize;
          rawY = Math.round(rawY / snapSize) * snapSize;
        }

        const newX = Math.max(0, Math.min(state.widthMm - targetElement.width, Math.round(rawX * 10) / 10));
        const newY = Math.max(0, Math.min(state.heightMm - targetElement.height, Math.round(rawY * 10) / 10));

        const updated = state.elements.map(el => {
          if (el.id === state.selectedElementId) {
            return { ...el, x: newX, y: newY };
          }
          return el;
        });
        // Direct dispatch without history push during drag (history only on mouseup)
        dispatch({ type: 'SET_FIELD', field: 'elements', value: updated });
      } else if (isResizing) {
        let rawW = elementStartRect.current.w + deltaXmm;
        let rawH = elementStartRect.current.h + deltaYmm;

        if (state.snapToGrid) {
          rawW = Math.round(rawW / snapSize) * snapSize;
          rawH = Math.round(rawH / snapSize) * snapSize;
        }

        const minDimension = 2;
        const newW = Math.max(minDimension, Math.min(state.widthMm - targetElement.x, Math.round(rawW * 10) / 10));
        const newH = Math.max(minDimension, Math.min(state.heightMm - targetElement.y, Math.round(rawH * 10) / 10));

        const updated = state.elements.map(el => {
          if (el.id === state.selectedElementId) {
            return { ...el, width: newW, height: newH };
          }
          return el;
        });
        dispatch({ type: 'SET_FIELD', field: 'elements', value: updated });
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing) {
        // Commit to history on mouse up
        updateElements(state.elements);
      }
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, state.selectedElementId, state.elements, scale, state.widthMm, state.heightMm, state.snapToGrid]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
        e.preventDefault();
        return;
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (state.clipboardElement) {
          const newEl = {
            ...state.clipboardElement,
            id: `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            x: Math.min(state.widthMm - state.clipboardElement.width, state.clipboardElement.x + 5),
            y: Math.min(state.heightMm - state.clipboardElement.height, state.clipboardElement.y + 5),
          };
          updateElements([...state.elements, newEl]);
          dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: newEl.id });
          e.preventDefault();
        }
        return;
      }

      if (!state.selectedElementId) return;

      const targetElement = state.elements.find(el => el.id === state.selectedElementId);
      if (!targetElement) return;

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        dispatch({ type: 'SET_FIELD', field: 'clipboardElement', value: targetElement });
        e.preventDefault();
        return;
      }

      const moveStep = state.snapToGrid ? 5 : 1;

      switch (e.key) {
        case 'Escape':
          dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: null });
          e.preventDefault();
          break;
        case 'Delete':
        case 'Backspace':
          updateElements(state.elements.filter(el => el.id !== state.selectedElementId));
          dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: null });
          e.preventDefault();
          break;
        case 'ArrowUp':
          updateElements(state.elements.map(el =>
            el.id === state.selectedElementId
              ? { ...el, y: Math.max(0, el.y - moveStep) }
              : el
          ));
          e.preventDefault();
          break;
        case 'ArrowDown':
          updateElements(state.elements.map(el =>
            el.id === state.selectedElementId
              ? { ...el, y: Math.min(state.heightMm - el.height, el.y + moveStep) }
              : el
          ));
          e.preventDefault();
          break;
        case 'ArrowLeft':
          updateElements(state.elements.map(el =>
            el.id === state.selectedElementId
              ? { ...el, x: Math.max(0, el.x - moveStep) }
              : el
          ));
          e.preventDefault();
          break;
        case 'ArrowRight':
          updateElements(state.elements.map(el =>
            el.id === state.selectedElementId
              ? { ...el, x: Math.min(state.widthMm - el.width, el.x + moveStep) }
              : el
          ));
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.selectedElementId, state.elements, state.snapToGrid, state.widthMm, state.heightMm, state.clipboardElement, state.history, state.historyIndex]);

  return {
    canvasRef,
    isDragging,
    isResizing,
    handleElementMouseDown,
    handleResizeHandleMouseDown,
    handleCanvasMouseDown,
    scale,
  };
}
