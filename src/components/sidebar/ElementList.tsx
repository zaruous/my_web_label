import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { useElementHistory } from '../../hooks/useElementHistory';

export default function ElementList() {
  const [state, dispatch] = useEditor();
  const { updateElements } = useElementHistory();

  const handleDragStart = (index: number) => {
    dispatch({ type: 'SET_FIELD', field: 'draggedIndex', value: index });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (state.draggedIndex === null || state.draggedIndex === targetIndex) return;

    const updated = [...state.elements];
    const [draggedItem] = updated.splice(state.draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);

    updateElements(updated);
    dispatch({ type: 'SET_FIELD', field: 'draggedIndex', value: null });
  };

  const handleDuplicateElement = (el: typeof state.elements[0]) => {
    const doubleId = `${el.type}-${Date.now().toString().slice(-4)}`;
    const cloned = {
      ...el,
      id: doubleId,
      name: `${el.name} (복사본)`,
      x: Math.min(state.widthMm - 10, el.x + 4),
      y: Math.min(state.heightMm - 5, el.y + 4)
    };
    updateElements([...state.elements, cloned]);
    dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: doubleId });
  };

  const handleDeleteElement = (id: string) => {
    updateElements(state.elements.filter(el => el.id !== id));
    if (state.selectedElementId === id) {
      dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: null });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">디자인 원소 리스트</h3>
        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono italic">
          Count: {state.elements.length}
        </span>
      </div>

      {state.elements.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
          그려진 요소가 없습니다.<br />왼쪽 도구상자에서 추가해 보세요!
        </div>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {state.elements.map((el, index) => {
            const isSelected = state.selectedElementId === el.id;
            return (
              <div
                key={el.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e)}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: el.id })}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-zinc-900 border-zinc-950 text-white shadow-sm font-semibold'
                    : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
                } ${state.draggedIndex === index ? 'opacity-40' : ''} active:cursor-grabbing cursor-grab`}
              >
                <span className="truncate">{el.name} <span className="text-[9px] opacity-65 font-mono">({el.type})</span></span>
                <div className="flex items-center gap-1 shrink-0" onMouseDown={e => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDuplicateElement(el); }}
                    className="p-0.5 hover:bg-slate-100 hover:text-black rounded text-[9px] text-slate-400"
                    title="복제"
                  >
                    복제
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteElement(el.id); }}
                    className="p-0.5 hover:bg-slate-100 hover:text-rose-600 rounded text-[9px] text-slate-400"
                    title="삭제"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
