import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { useElementHistory } from '../../hooks/useElementHistory';
import { PAGE_PRESETS } from '../../constants/defaults';

export default function NewTemplateModal() {
  const [state, dispatch] = useEditor();
  const { updateElements } = useElementHistory();

  if (!state.showNewModal) return null;

  const confirmNewTemplate = () => {
    updateElements([]);
    dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: null });
    dispatch({ type: 'SET_FIELD', field: 'widthMm', value: state.newWidthTemp });
    dispatch({ type: 'SET_FIELD', field: 'heightMm', value: state.newHeightTemp });
    dispatch({ type: 'SET_FIELD', field: 'showNewModal', value: false });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-black text-zinc-900">새 디자인 만들기</h3>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-600 block">용지 규격 선택</label>
          <select
            value={state.presetSize}
            onChange={e => {
              const selectedId = e.target.value;
              dispatch({ type: 'SET_FIELD', field: 'presetSize', value: selectedId });
              const found = PAGE_PRESETS.find(p => p.id === selectedId);
              if (found && selectedId !== 'custom') {
                dispatch({ type: 'SET_FIELD', field: 'newWidthTemp', value: found.w });
                dispatch({ type: 'SET_FIELD', field: 'newHeightTemp', value: found.h });
              }
            }}
            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white outline-none"
          >
            {PAGE_PRESETS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {state.presetSize === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">가로 (mm)</label>
                <input
                  type="number"
                  value={state.newWidthTemp}
                  onChange={e => dispatch({ type: 'SET_FIELD', field: 'newWidthTemp', value: parseFloat(e.target.value) || 80 })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">세로 (mm)</label>
                <input
                  type="number"
                  value={state.newHeightTemp}
                  onChange={e => dispatch({ type: 'SET_FIELD', field: 'newHeightTemp', value: parseFloat(e.target.value) || 40 })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-500">
          현재 컨버스의 모든 그래픽 엘리먼트 디자인이 삭제됩니다. 정말 새로 시작하시겠습니까?
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'showNewModal', value: false })}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            진행 안 함
          </button>
          <button
            onClick={confirmNewTemplate}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-rose-200 cursor-pointer"
          >
            지우기
          </button>
        </div>
      </div>
    </div>
  );
}
