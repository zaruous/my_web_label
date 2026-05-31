import React from 'react';
import { ArrowRight, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useElementHistory } from '../../hooks/useElementHistory';
import { useTemplates } from '../../hooks/useTemplates';
import { substituteVariables } from '../../utils/labelRenderer';
import { TextElement, BarcodeElement, QRCodeElement, RectElement, LineElement } from '../../types';
import { PRESET_SIZES } from '../../constants/defaults';
import ElementList from './ElementList';

export default function PropertiesPanel() {
  const [state, dispatch] = useEditor();
  const { updateElements } = useElementHistory();
  const { templates, isLoading, loadTemplate } = useTemplates();

  const selectedElement = state.elements.find(el => el.id === state.selectedElementId);
  const currentRecordData = state.dataset[state.selectedRecordIndex] || {};

  const handleUpdateElementProps = (id: string, updatedProps: Partial<typeof state.elements[0]>) => {
    updateElements(state.elements.map(el => {
      if (el.id === id) {
        return { ...el, ...updatedProps } as typeof el;
      }
      return el;
    }));
  };

  const handleSetSizePreset = (w: number, h: number) => {
    dispatch({ type: 'SET_FIELD', field: 'widthMm', value: w });
    dispatch({ type: 'SET_FIELD', field: 'heightMm', value: h });
    dispatch({ type: 'SET_FIELD', field: 'customW', value: String(w) });
    dispatch({ type: 'SET_FIELD', field: 'customH', value: String(h) });
  };

  const handleApplyCustomSize = () => {
    const w = parseFloat(state.customW);
    const h = parseFloat(state.customH);
    if (!isNaN(w) && !isNaN(h) && w >= 15 && h >= 15) {
      dispatch({ type: 'SET_FIELD', field: 'widthMm', value: w });
      dispatch({ type: 'SET_FIELD', field: 'heightMm', value: h });
    }
  };

  const handleDeleteElement = (id: string) => {
    updateElements(state.elements.filter(el => el.id !== id));
    if (state.selectedElementId === id) {
      dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: null });
    }
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
      {state.activeSidePanel === 'toolbox' ? (
        <div className="p-5 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">라벨 규격 Preset</h3>
            <div className="space-y-2">
              {PRESET_SIZES.map(p => {
                const isActive = state.widthMm === p.widthMm && state.heightMm === p.heightMm;
                return (
                  <button
                    key={p.name}
                    onClick={() => handleSetSizePreset(p.widthMm, p.heightMm)}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all border flex flex-col gap-1 ${
                      isActive
                        ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950 font-semibold'
                        : 'border-slate-200 hover:border-slate-400 bg-white'
                    }`}
                  >
                    <span className="text-zinc-900 font-medium">{p.name}</span>
                    <span className="text-[10px] text-zinc-400">{p.widthMm} x {p.heightMm} mm</span>
                  </button>
                );
              })}
            </div>

            {/* Manual input inside Left Side */}
            <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">수동 mm 규격 수정</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-400 block mb-0.5">폭(W)</label>
                  <input
                    type="number"
                    value={state.customW}
                    onChange={e => dispatch({ type: 'SET_FIELD', field: 'customW', value: e.target.value })}
                    className="w-full text-xs p-1 px-2 border border-slate-200 rounded bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-400 block mb-0.5">높이(H)</label>
                  <input
                    type="number"
                    value={state.customH}
                    onChange={e => dispatch({ type: 'SET_FIELD', field: 'customH', value: e.target.value })}
                    className="w-full text-xs p-1 px-2 border border-slate-200 rounded bg-white outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyCustomSize}
                className="w-full py-1 bg-zinc-900 hover:bg-black text-white text-[10px] font-bold rounded transition-colors"
              >
                크기 커스텀 변경 적용
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">저장된 서버 디자인 템플릿</h3>
            {isLoading ? (
              <div className="text-center py-4 text-xs text-slate-400">템플릿 목 다운로드 중...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 border border-dashed rounded-lg">
                저장된 라벨 디자인이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map(tmpl => (
                  <div
                    key={tmpl.id}
                    className="p-3 bg-zinc-50 border border-slate-200 rounded-xl hover:border-slate-400 transition flex flex-col justify-between items-start"
                  >
                    <div className="space-y-0.5 mb-2">
                      <h4 className="text-xs font-bold text-zinc-900">{tmpl.name}</h4>
                      <p className="text-[9px] font-mono text-zinc-400 uppercase">{tmpl.widthMm}X{tmpl.heightMm}MM • {tmpl.elements.length}개 원소</p>
                    </div>
                    <button
                      onClick={() => loadTemplate(tmpl)}
                      className="w-full py-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 rounded text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      드로잉 캔버스로 가져오기 <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Elements Properties panel
        <div className="p-5 flex flex-col h-full justify-between">
          <div>
            <ElementList />

            {selectedElement ? (
              <div className="pt-5 mt-5 border-t border-slate-100 space-y-4">
                {/* Active properties details */}
                <div>
                  <h4 className="text-[11px] font-bold text-zinc-900 uppercase mb-2">선택 원소 속성 필드</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">이름</label>
                      <input
                        type="text"
                        value={selectedElement.name}
                        onChange={(e) => handleUpdateElementProps(selectedElement.id, { name: e.target.value })}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-mono">투명도 (Opacity)</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedElement.opacity ?? 1}
                        onChange={(e) => handleUpdateElementProps(selectedElement.id, { opacity: parseFloat(e.target.value) })}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Positions & rotation fields */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">좌표 규격 (밀리미터: mm)</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400">가로 좌표 X (mm)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedElement.x}
                        onChange={(e) => handleUpdateElementProps(selectedElement.id, { x: parseFloat(e.target.value) || 0 })}
                        className="border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400">세로 좌표 Y (mm)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedElement.y}
                        onChange={(e) => handleUpdateElementProps(selectedElement.id, { y: parseFloat(e.target.value) || 0 })}
                        className="border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400">가로 폭 Width (mm)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedElement.width}
                        onChange={(e) => handleUpdateElementProps(selectedElement.id, { width: parseFloat(e.target.value) || 0 })}
                        className="border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400">세로 높이 Height (mm)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={selectedElement.height}
                        onChange={(e) => handleUpdateElementProps(selectedElement.id, { height: parseFloat(e.target.value) || 0 })}
                        className="border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400">회전각 Rotation (°)</span>
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={selectedElement.rotation ?? 0}
                        onChange={(e) => handleUpdateElementProps(selectedElement.id, { rotation: parseInt(e.target.value) || 0 })}
                        className="border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* TEXT TYPE Custom Property controls */}
                {selectedElement.type === 'text' && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">텍스트 필드 콘텐츠</h5>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-0.5">문구 입력 (변수 활용 예: `&#123;&#123;prod_name&#125;&#125;`)</label>
                      <textarea
                        value={(selectedElement as TextElement).text}
                        onChange={(e) => handleUpdateElementProps(selectedElement.id, { text: e.target.value })}
                        rows={2}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 block mb-0.5 font-mono">자서 크기 (pt/px)</label>
                        <input
                          type="number"
                          min="4"
                          max="72"
                          value={(selectedElement as TextElement).fontSize}
                          onChange={(e) => handleUpdateElementProps(selectedElement.id, { fontSize: parseInt(e.target.value) || 8 })}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 block mb-0.5">글꼴 색상</label>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="color"
                            value={(selectedElement as TextElement).fontColor || '#000000'}
                            onChange={(e) => handleUpdateElementProps(selectedElement.id, { fontColor: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={(selectedElement as TextElement).fontColor || '#000000'}
                            onChange={(e) => handleUpdateElementProps(selectedElement.id, { fontColor: e.target.value })}
                            className="w-full text-[10px] p-1 border border-slate-200 rounded font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 block">정렬</label>
                        <div className="flex bg-slate-100 rounded p-0.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateElementProps(selectedElement.id, { textAlign: 'left' })}
                            className={`flex-1 py-1 flex justify-center rounded text-xs ${(selectedElement as TextElement).textAlign === 'left' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                          >
                            <AlignLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateElementProps(selectedElement.id, { textAlign: 'center' })}
                            className={`flex-1 py-1 flex justify-center rounded text-xs ${(selectedElement as TextElement).textAlign === 'center' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                          >
                            <AlignCenter className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateElementProps(selectedElement.id, { textAlign: 'right' })}
                            className={`flex-1 py-1 flex justify-center rounded text-xs ${(selectedElement as TextElement).textAlign === 'right' ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                          >
                            <AlignRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 block mb-0.5">두께</label>
                        <select
                          value={(selectedElement as TextElement).fontWeight}
                          onChange={(e) => handleUpdateElementProps(selectedElement.id, { fontWeight: e.target.value })}
                          className="w-full text-xs p-1 border border-slate-200 rounded bg-white"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium</option>
                          <option value="bold">Bold</option>
                          <option value="900">Black/Heavy</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* SHAPE SPECIFIC STYLING CONTROLS */}
                {(selectedElement.type === 'rect' || selectedElement.type === 'circle' || selectedElement.type === 'line') && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">도형 테두리 및 채우기 색</h5>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 block mb-0.5">테두리 색</label>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="color"
                            value={selectedElement.strokeColor || '#000000'}
                            onChange={(e) => handleUpdateElementProps(selectedElement.id, { strokeColor: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={selectedElement.strokeColor}
                            onChange={(e) => handleUpdateElementProps(selectedElement.id, { strokeColor: e.target.value })}
                            className="w-full text-[10px] p-1 border border-slate-200 rounded font-mono"
                          />
                        </div>
                      </div>

                      {selectedElement.type !== 'line' && (
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-0.5">채우기 색</label>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="color"
                              value={selectedElement.fillColor === 'transparent' ? '#ffffff' : selectedElement.fillColor}
                              onChange={(e) => handleUpdateElementProps(selectedElement.id, { fillColor: e.target.value })}
                              disabled={selectedElement.fillColor === 'transparent'}
                              className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 bg-transparent disabled:opacity-40"
                            />
                            <div className="flex flex-col gap-1 w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextFill = selectedElement.fillColor === 'transparent' ? '#3b82f6' : 'transparent';
                                  handleUpdateElementProps(selectedElement.id, { fillColor: nextFill });
                                }}
                                className="py-1 px-1 bg-slate-100 hover:bg-slate-200 text-[9px] rounded font-bold"
                              >
                                {selectedElement.fillColor === 'transparent' ? '색상 채우기' : '투명하게'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">테두리 굵기 (px)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={selectedElement.type === 'line' ? ((selectedElement as LineElement).lineThickness || 1) : selectedElement.strokeWidth}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (selectedElement.type === 'line') {
                              handleUpdateElementProps(selectedElement.id, { lineThickness: val, strokeWidth: val } as Partial<LineElement>);
                            } else {
                              handleUpdateElementProps(selectedElement.id, { strokeWidth: val });
                            }
                          }}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                        />
                      </div>

                      {selectedElement.type === 'rect' && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5 font-mono">둥글기 (Border Radius)</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={(selectedElement as RectElement).borderRadius || 0}
                            onChange={(e) => handleUpdateElementProps(selectedElement.id, { borderRadius: parseFloat(e.target.value) || 0 } as Partial<RectElement>)}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* BARCODE TYPE SPECIFIC STYLING */}
                {selectedElement.type === 'barcode' && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">바코드 데이터 및 규격</h5>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-0.5">바인딩 값 (표현식 예: `&#123;&#123;sku&#125;&#125;`)</label>
                      <input
                        type="text"
                        value={(selectedElement as BarcodeElement).value}
                        onChange={(e) => handleUpdateElementProps(selectedElement.id, { value: e.target.value } as Partial<BarcodeElement>)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                      />
                      {(() => {
                        const resolvedVal = substituteVariables((selectedElement as BarcodeElement).value, currentRecordData);
                        const t = (selectedElement as BarcodeElement).barcodeType;
                        let warn = '';
                        if (!resolvedVal) warn = '데이터가 비어있습니다.';
                        else if (['EAN13', 'EAN8', 'UPC', 'ITF14'].includes(t) && !/^\d+$/.test(resolvedVal)) warn = '숫자만 입력 가능합니다.';
                        else if (t === 'EAN13' && resolvedVal.length !== 12 && resolvedVal.length !== 13) warn = '12~13자리 숫자여야 합니다.';
                        else if (t === 'EAN8' && resolvedVal.length !== 7 && resolvedVal.length !== 8) warn = '7~8자리 숫자여야 합니다.';
                        else if (t === 'UPC' && resolvedVal.length !== 11 && resolvedVal.length !== 12) warn = '11~12자리 숫자여야 합니다.';
                        else if (t === 'ITF14' && resolvedVal.length !== 14) warn = '14자리 숫자여야 합니다.';
                        return warn ? <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1 animate-pulse">⚠️ {warn} (현재값: {resolvedVal})</p> : null;
                      })()}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 block">바코드 포맷</label>
                        <select
                          value={(selectedElement as BarcodeElement).barcodeType}
                          onChange={(e) => handleUpdateElementProps(selectedElement.id, { barcodeType: e.target.value as BarcodeElement['barcodeType'] } as Partial<BarcodeElement>)}
                          className="w-full text-[11px] p-1 border border-slate-200 rounded bg-white mt-1"
                        >
                          <option value="CODE128">CODE 128 (대소문자/숫자)</option>
                          <option value="CODE39">CODE 39 (알파벳/숫자)</option>
                          <option value="CODE93">CODE 93 (정밀한 선형)</option>
                          <option value="EAN13">EAN-13 (숫자 13자리)</option>
                          <option value="EAN8">EAN-8 (숫자 8자리)</option>
                          <option value="UPC">UPC-A (숫자 12자리)</option>
                          <option value="ITF14">ITF-14 (물류용 14자리)</option>
                          <option value="CODABAR">Codabar (NW-7)</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-1.5 text-[10px] text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(selectedElement as BarcodeElement).showText}
                            onChange={(e) => handleUpdateElementProps(selectedElement.id, { showText: e.target.checked } as Partial<BarcodeElement>)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          하단 자석번호 노출
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR SPECIFIC PROPERTIES */}
                {selectedElement.type === 'qrcode' && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase font-mono">QR Code Bindings</h5>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-0.5">QR코드 데이터값</label>
                      <input
                        type="text"
                        value={(selectedElement as QRCodeElement).value}
                        onChange={(e) => handleUpdateElementProps(selectedElement.id, { value: e.target.value } as Partial<QRCodeElement>)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                      />
                      {(() => {
                        const resolvedVal = substituteVariables((selectedElement as QRCodeElement).value, currentRecordData);
                        let warn = '';
                        let isError = false;
                        if (!resolvedVal) { warn = '데이터가 비어있습니다.'; isError = true; }
                        else if (resolvedVal.length > 150) { warn = `데이터가 깁니다 (${resolvedVal.length}자). 밀도가 높아 인식률이 떨어질 수 있습니다.`; }
                        return warn
                          ? <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${isError ? 'text-red-500 animate-pulse' : 'text-amber-600'}`}>⚠️ {warn}</p>
                          : <p className="text-[9px] text-zinc-400 mt-1.5">예: `https://test.com/check?id=&#123;&#123;sku&#125;&#125;`</p>;
                      })()}
                    </div>
                  </div>
                )}

                {/* IMAGE SPECIFIC PROPERTIES */}
                {selectedElement.type === 'image' && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase">이미지 속성</h5>
                    <div>
                      <button
                        type="button"
                        onClick={() => (window as Window & { __labelImageInputClick?: () => void }).__labelImageInputClick?.()}
                        className="w-full py-2.5 bg-zinc-50 border border-slate-200 hover:bg-slate-100 text-zinc-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        다른 이미지로 교체...
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-[11px] text-slate-400 select-none">
                캔버스 내부의 특정 도형이나 텍스트를 클릭하시면 속성을 조절하실 수 있습니다.
              </div>
            )}
          </div>

          {selectedElement && (
            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex items-center justify-between text-[11px]">
              <span className="text-slate-500 truncate">선택됨: {selectedElement.id}</span>
              <button
                onClick={() => handleDeleteElement(selectedElement.id)}
                className="text-rose-500 hover:text-white hover:bg-rose-600 p-1 rounded hover:scale-105 transition"
                title="원소 완전히 제거"
              >
                제거
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
