import React, { useRef } from 'react';
import {
  Layers,
  Database,
  Code,
  Download,
  Upload,
  Printer,
  Check,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useElementHistory } from '../../hooks/useElementHistory';
import { useTemplates } from '../../hooks/useTemplates';
import { exportDesignAsJson, readJsonDesignFile, readCsvFile } from '../../utils/fileUtils';
import { LabelVariable } from '../../types';

export default function Header() {
  const [state, dispatch] = useEditor();
  const { undo, redo, canUndo, canRedo, updateElements } = useElementHistory();
  const { saveTemplate } = useTemplates();

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const handleBringToFront = () => {
    if (!state.selectedElementId) return;
    const updated = [...state.elements];
    const idx = updated.findIndex(e => e.id === state.selectedElementId);
    if (idx === -1 || idx === updated.length - 1) return;
    const [item] = updated.splice(idx, 1);
    updated.push(item);
    updateElements(updated);
  };

  const handleSendToBack = () => {
    if (!state.selectedElementId) return;
    const updated = [...state.elements];
    const idx = updated.findIndex(e => e.id === state.selectedElementId);
    if (idx <= 0) return;
    const [item] = updated.splice(idx, 1);
    updated.unshift(item);
    updateElements(updated);
  };

  const handleCenterHorizontally = () => {
    if (!state.selectedElementId) return;
    const el = state.elements.find(e => e.id === state.selectedElementId);
    if (!el) return;
    updateElements(state.elements.map(e =>
      e.id === state.selectedElementId
        ? { ...e, x: Math.max(0, (state.widthMm - e.width) / 2) }
        : e
    ));
  };

  const handleCenterVertically = () => {
    if (!state.selectedElementId) return;
    const el = state.elements.find(e => e.id === state.selectedElementId);
    if (!el) return;
    updateElements(state.elements.map(e =>
      e.id === state.selectedElementId
        ? { ...e, y: Math.max(0, (state.heightMm - e.height) / 2) }
        : e
    ));
  };

  const handleNewTemplate = () => {
    dispatch({ type: 'SET_FIELD', field: 'presetSize', value: '80x40' });
    dispatch({ type: 'SET_FIELD', field: 'newWidthTemp', value: 80 });
    dispatch({ type: 'SET_FIELD', field: 'newHeightTemp', value: 40 });
    dispatch({ type: 'SET_FIELD', field: 'showNewModal', value: true });
  };

  const handleSaveTemplateClick = async () => {
    const templateName = prompt("라벨 템플릿의 이름을 지어주세요:", "디자인 라벨 택");
    if (!templateName) return;
    try {
      await saveTemplate(templateName);
      alert(`소중한 라벨 템플릿 '${templateName}'이(가) 정상 저장되었습니다!`);
    } catch (err) {
      console.error(err);
      alert('서버 저장 실패: 테두리 및 원소를 확인해주세요.');
    }
  };

  const handleExportDesign = () => {
    exportDesignAsJson(state.widthMm, state.heightMm, state.elements, state.variables, state.dataset);
  };

  const handleJsonImportClick = () => {
    jsonInputRef.current?.click();
  };

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await readJsonDesignFile(file);
      dispatch({ type: 'SET_FIELD', field: 'widthMm', value: parsed.widthMm });
      dispatch({ type: 'SET_FIELD', field: 'heightMm', value: parsed.heightMm });
      dispatch({ type: 'SET_FIELD', field: 'customW', value: String(parsed.widthMm) });
      dispatch({ type: 'SET_FIELD', field: 'customH', value: String(parsed.heightMm) });
      updateElements(parsed.elements);
      if (parsed.variables.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'variables', value: parsed.variables });
      }
      if (parsed.dataset.length > 0) {
        dispatch({ type: 'SET_FIELD', field: 'dataset', value: parsed.dataset });
      }
      dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: parsed.elements[0]?.id || null });
      dispatch({ type: 'SET_FIELD', field: 'selectedRecordIndex', value: 0 });
      alert('보관해 둔 라벨 디자인 템플릿이 무사히 복원 완료되었습니다!');
    } catch (err) {
      console.error('Error importing JSON template', err);
      alert(err instanceof Error ? err.message : '디자인 복원 실패: JSON 형식이 올바르지 않습니다.');
    }
    e.target.value = '';
  };

  const handleCsvUploadClick = () => {
    csvInputRef.current?.click();
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsedDataset = await readCsvFile(file);
      const csvKeys = Object.keys(parsedDataset[0]);
      const updatedVars = [...state.variables];
      let hasNewVariable = false;

      csvKeys.forEach(key => {
        if (!updatedVars.some(v => v.id === key)) {
          updatedVars.push({
            id: key,
            name: key,
            type: 'text',
            defaultValue: 'CSV 임포트 값'
          } as LabelVariable);
          hasNewVariable = true;
        }
      });

      if (hasNewVariable) {
        dispatch({ type: 'SET_FIELD', field: 'variables', value: updatedVars });
      }
      dispatch({ type: 'SET_FIELD', field: 'dataset', value: parsedDataset });
      dispatch({ type: 'SET_FIELD', field: 'selectedRecordIndex', value: 0 });
      alert(`CSV 데이터 업로드 완료! 총 ${parsedDataset.length}행의 데이터셋이 바인딩되었습니다.${hasNewVariable ? '\n(새로 감지된 열 필드가 변수 사전에 연동 생성되었습니다.)' : ''}`);
    } catch (err) {
      console.error('Error uploading CSV dataset', err);
      alert('CSV 업로드 실패: 파일 내부 형식을 검토해 주세요.');
    }
    e.target.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const randomId = `image-${Date.now().toString().slice(-4)}`;
      const defaultX = Math.round((state.widthMm - 20) / 2);
      const defaultY = Math.round((state.heightMm - 20) / 2);

      const newEl = {
        id: randomId,
        type: 'image' as const,
        x: defaultX >= 0 ? defaultX : 2,
        y: defaultY >= 0 ? defaultY : 2,
        width: 20,
        height: 20,
        strokeWidth: 0,
        strokeColor: '',
        fillColor: '',
        opacity: 1,
        rotation: 0,
        name: file.name.split('.')[0] || '업로드 이미지',
        url: dataUrl
      };

      updateElements([...state.elements, newEl]);
      dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: randomId });
      dispatch({ type: 'SET_FIELD', field: 'activeSidePanel', value: 'properties' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Expose imageInputRef click for use from PropertiesPanel image replace
  // We store it on window as a side-channel for cross-component access
  (window as Window & { __labelImageInputClick?: () => void }).__labelImageInputClick = () => {
    imageInputRef.current?.click();
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-black tracking-tighter text-sm">A</div>
            <span className="font-bold text-sm tracking-tight flex items-center gap-1.5 text-zinc-900 pr-2">
              LABEL ARCHITECT
              <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">v2.5</span>
            </span>
          </div>

          {/* APPLICATION MENUBAR */}
          <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-700">
            {/* EDIT MENU */}
            <div className="relative group/menu">
              <button className="px-3 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer transition-colors">
                편집
              </button>
              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 pointer-events-none opacity-0 translate-y-1 group-hover/menu:pointer-events-auto group-hover/menu:opacity-100 group-hover/menu:translate-y-0 transition-all z-50 flex flex-col gap-0.5">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">실행 취소 (Undo)</span>
                  <span className="text-[10px] text-slate-400 border border-slate-200 px-1 rounded">Ctrl+Z</span>
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">다시 실행 (Redo)</span>
                  <span className="text-[10px] text-slate-400 border border-slate-200 px-1 rounded">Ctrl+Y</span>
                </button>

                <div className="h-px bg-slate-100 my-1 mx-1"></div>

                <button
                  onClick={handleBringToFront}
                  disabled={!state.selectedElementId}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">맨 앞으로 가져오기</span>
                </button>
                <button
                  onClick={handleSendToBack}
                  disabled={!state.selectedElementId}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">맨 뒤로 보내기</span>
                </button>

                <div className="h-px bg-slate-100 my-1 mx-1"></div>

                <button
                  onClick={handleCenterHorizontally}
                  disabled={!state.selectedElementId}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">수평 가운데 정렬</span>
                </button>
                <button
                  onClick={handleCenterVertically}
                  disabled={!state.selectedElementId}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">수직 가운데 정렬</span>
                </button>
              </div>
            </div>

            {/* VIEW MENU */}
            <div className="relative group/menu">
              <button className="px-3 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer transition-colors">
                보기
              </button>
              <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 pointer-events-none opacity-0 translate-y-1 group-hover/menu:pointer-events-auto group-hover/menu:opacity-100 group-hover/menu:translate-y-0 transition-all z-50">
                <button
                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'showGrid', value: !state.showGrid })}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between text-slate-700 cursor-pointer transition-colors"
                >
                  <span>격자 표시</span>
                  {state.showGrid && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'snapToGrid', value: !state.snapToGrid })}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between text-slate-700 cursor-pointer transition-colors mt-0.5"
                >
                  <span>스티키 (격자 스냅)</span>
                  {state.snapToGrid && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200"></div>
          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>크기: <strong className="text-zinc-900 font-semibold">{state.widthMm}x{state.heightMm}mm</strong></span>
            <span>요소 수: <strong className="text-zinc-900 font-semibold">{state.elements.length}개</strong></span>
            {state.lastSaved && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">최근 저장: {state.lastSaved}</span>}
          </div>
        </div>

        {/* Global Control Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => { dispatch({ type: 'SET_FIELD', field: 'activeTab', value: 'design' }); dispatch({ type: 'SET_FIELD', field: 'printPreviewMode', value: false }); }}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                state.activeTab === 'design' && !state.printPreviewMode
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-slate-500 hover:text-zinc-800'
              }`}
            >
              <Layers className="w-3 h-3" /> 드로잉 모드
            </button>
            <button
              onClick={() => { dispatch({ type: 'SET_FIELD', field: 'activeTab', value: 'dataset' }); dispatch({ type: 'SET_FIELD', field: 'printPreviewMode', value: false }); }}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                state.activeTab === 'dataset' && !state.printPreviewMode
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-slate-500 hover:text-zinc-800'
              }`}
            >
              <Database className="w-3 h-3" /> 데이터 바인딩
            </button>
            <button
              onClick={() => { dispatch({ type: 'SET_FIELD', field: 'activeTab', value: 'api' }); dispatch({ type: 'SET_FIELD', field: 'printPreviewMode', value: false }); }}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                state.activeTab === 'api' && !state.printPreviewMode
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-slate-500 hover:text-zinc-800'
              }`}
            >
              <Code className="w-3 h-3" /> 연동 API
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200"></div>

          {/* Core Action Buttons */}
          <button
            onClick={handleNewTemplate}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            새 디자인
          </button>
          <button
            onClick={handleSaveTemplateClick}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            템플릿 저장
          </button>
          <button
            onClick={handleExportDesign}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            디자인 내보내기
          </button>
          <button
            onClick={handleJsonImportClick}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            디자인 가져오기
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'printPreviewMode', value: !state.printPreviewMode })}
            className={`px-3.5 py-1.5 border text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              state.printPreviewMode
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            {state.printPreviewMode ? '미리보기 닫기' : '프린트 출력'}
          </button>
        </div>
      </header>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={jsonInputRef}
        onChange={handleJsonImport}
        accept=".json"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={csvInputRef}
        onChange={handleCsvUpload}
        accept=".csv"
        style={{ display: 'none' }}
      />
      {/* CSV upload trigger exposed globally for DatasetTab */}
      {(() => {
        (window as Window & { __labelCsvInputClick?: () => void }).__labelCsvInputClick = () => {
          csvInputRef.current?.click();
        };
        return null;
      })()}
    </>
  );
}
