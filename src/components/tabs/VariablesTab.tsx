import React from 'react';
import { Plus } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { LabelVariable } from '../../types';

export default function VariablesTab() {
  const [state, dispatch] = useEditor();

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.newVarId.trim()) return;

    const cleanId = state.newVarId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanId) return;

    if (state.variables.some(v => v.id === cleanId)) {
      alert('이미 존재하는 변수 식별자(ID) 입니다.');
      return;
    }

    const brandNew: LabelVariable = {
      id: cleanId,
      name: state.newVarName.trim() || cleanId,
      type: state.newVarType,
      defaultValue: state.newVarDefault.trim() || '테스트'
    };

    dispatch({ type: 'ADD_VARIABLE', payload: brandNew });
  };

  const handleDeleteVariable = (id: string) => {
    dispatch({ type: 'DELETE_VARIABLE', payload: id });
  };

  return (
    <div className="flex-1 bg-white p-8 overflow-y-auto space-y-6">
      <div>
        <h2 className="text-xl font-black text-zinc-950">동적 변수 관리 (Dynamic Variable Definition)</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          라벨 내부 텍스트나 바코드의 템플릿 코드에 대응될 변수 값의 사전을 조직합니다.<br />
          텍스트 편집 시 <code className="bg-slate-150 px-1 py-0.5 rounded font-mono text-zinc-800">${'{변수코드}'}</code> 형태로 치환을 진행할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dynamic define variable form container */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-widest">변수 생성 폼</h3>
          <form onSubmit={handleAddVariable} className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1">변수 코드명 (영어로만 가능)</label>
              <input
                type="text"
                required
                placeholder="예: tracking_number"
                value={state.newVarId}
                onChange={e => dispatch({ type: 'SET_FIELD', field: 'newVarId', value: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1">한글 사용자명</label>
              <input
                type="text"
                required
                placeholder="예: 운송장 번호"
                value={state.newVarName}
                onChange={e => dispatch({ type: 'SET_FIELD', field: 'newVarName', value: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1">기본형식</label>
              <select
                value={state.newVarType}
                onChange={e => dispatch({ type: 'SET_FIELD', field: 'newVarType', value: e.target.value as LabelVariable['type'] })}
                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg outline-none"
              >
                <option value="text">일반 문자열 (text)</option>
                <option value="number">정수 및 숫자 (number)</option>
                <option value="price">상품 판매단가 (price)</option>
                <option value="date">특정 제조기한 (date)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-1">디폴트 대체값</label>
              <input
                type="text"
                placeholder="예: 4019-9238"
                value={state.newVarDefault}
                onChange={e => dispatch({ type: 'SET_FIELD', field: 'newVarDefault', value: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-zinc-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> 새로운 변수 등록하기
            </button>
          </form>
        </div>

        {/* Registered dictionaries table list */}
        <div className="md:col-span-2 space-y-3">
          <h3 className="font-bold text-xs text-slate-700 uppercase tracking-widest flex justify-between items-center">
            <span>등록된 바인딩 사전 목록 ({state.variables.length})</span>
            <small className="text-[10px] text-zinc-400 capitalize">시스템 제한 없음</small>
          </h3>

          <div className="border border-slate-250 rounded-2xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-250 text-slate-600 font-bold text-xs">
                  <th className="p-3.5 px-5">사용자 표시명</th>
                  <th className="p-3.5">치환 템플릿 토큰 명</th>
                  <th className="p-3.5">데이터 타입</th>
                  <th className="p-3.5">디폴트 기본값</th>
                  <th className="p-3.5 text-center">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {state.variables.map(v => (
                  <tr key={v.id} className="text-xs hover:bg-slate-50/55 transition-colors">
                    <td className="p-4 px-5 font-semibold text-slate-800">{v.name}</td>
                    <td className="p-4 font-mono text-blue-600">
                      {`\${${v.id}}`}
                    </td>
                    <td className="p-4 capitalize text-slate-500">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                        {v.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 italic">{v.defaultValue}</td>
                    <td className="p-4 text-center">
                      {v.id === 'prod_name' || v.id === 'price' || v.id === 'sku' ? (
                        <span className="text-[10px] text-slate-300 italic">기본제외</span>
                      ) : (
                        <button
                          onClick={() => handleDeleteVariable(v.id)}
                          className="p-1 px-2.2 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
