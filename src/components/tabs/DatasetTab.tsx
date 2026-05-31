import React from 'react';
import { Plus, Upload, ArrowRight } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export default function DatasetTab() {
  const [state, dispatch] = useEditor();

  const handleCsvUploadClick = () => {
    (window as Window & { __labelCsvInputClick?: () => void }).__labelCsvInputClick?.();
  };

  const handleAddDatasetRow = () => {
    dispatch({ type: 'ADD_DATASET_ROW' });
  };

  const handleDeleteDatasetRow = (index: number) => {
    dispatch({ type: 'DELETE_DATASET_ROW', payload: index });
  };

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-950">다중 데이터 바인딩 시트 (Batch Database)</h2>
          <p className="text-xs text-slate-500 mt-1">
            다량의 실제 데이터를 등록하여 벡터 라벨과 매핑할 수 있습니다. 템플릿의 <code className="bg-zinc-100 text-zinc-800 px-1 py-0.5 rounded font-mono text-[11px]">${'{변수}'}</code> 토큰에 행 값들이 차례로 바인딩됩니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCsvUploadClick}
            className="p-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow"
          >
            <Upload className="w-4 h-4" /> CSV 데이터 업로드
          </button>
          <button
            onClick={handleAddDatasetRow}
            className="p-2.5 px-4 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" /> 레코드 데이터 행 임포트(추가)
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-zinc-950 text-white font-bold text-xs select-none">
              <th className="p-3.5 px-5 text-center w-20">순번</th>
              {state.variables.map(v => (
                <th key={v.id} className="p-3.5">
                  <div className="flex flex-col">
                    <span>{v.name}</span>
                    <span className="text-[9px] text-[#94a3b8] font-mono leading-tight font-medium">{`\${${v.id}}`}</span>
                  </div>
                </th>
              ))}
              <th className="p-3.5 text-center bg-zinc-900 w-28">제거</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {state.dataset.map((row, idx) => {
              const isSelected = state.selectedRecordIndex === idx;
              return (
                <tr
                  key={idx}
                  className={`text-xs hover:bg-zinc-50 transition-colors ${
                    isSelected ? 'bg-amber-50/50 font-medium border-l-4 border-l-amber-500' : ''
                  }`}
                >
                  <td className="p-3 px-5 text-center">
                    <button
                      onClick={() => dispatch({ type: 'SET_FIELD', field: 'selectedRecordIndex', value: idx })}
                      className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-white'
                          : 'bg-zinc-150 hover:bg-zinc-200 text-zinc-800'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  </td>

                  {state.variables.map(v => (
                    <td key={v.id} className="p-3">
                      <input
                        type="text"
                        value={row[v.id] ?? ''}
                        onChange={(e) => {
                          dispatch({
                            type: 'UPDATE_DATASET_CELL',
                            payload: { rowIndex: idx, key: v.id, value: e.target.value }
                          });
                        }}
                        className="w-full p-1.5 border border-transparent rounded hover:border-slate-300 focus:border-zinc-900 outline-none transition text-zinc-900 bg-transparent focus:bg-white font-medium"
                      />
                    </td>
                  ))}

                  <td className="p-3 text-center">
                    {state.dataset.length <= 1 ? (
                      <span className="text-[10px] text-zinc-300">최소 한행</span>
                    ) : (
                      <button
                        onClick={() => handleDeleteDatasetRow(idx)}
                        className="p-1 px-2.5 text-rose-500 hover:bg-rose-50 rounded transition-all font-bold"
                      >
                        삭제
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pr-2 gap-3">
        <button
          onClick={() => {
            dispatch({ type: 'SET_FIELD', field: 'selectedRecordIndex', value: 0 });
            dispatch({ type: 'SET_FIELD', field: 'activeTab', value: 'design' });
          }}
          className="p-2 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg transition"
        >
          지정한 행 데이터로 드로잉 계속하기
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_FIELD', field: 'printPreviewMode', value: true })}
          className="p-2 px-5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
        >
          전체 데이터 레코드 일괄 프린트 레이아웃 <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
