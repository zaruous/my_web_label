import React from 'react';
import { Plus, ZoomOut, Sliders, Image } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useElementHistory } from '../../hooks/useElementHistory';
import {
  LabelElement,
  ElementType,
  TextElement,
  RectElement,
  CircleElement,
  LineElement,
  BarcodeElement,
  QRCodeElement,
} from '../../types';

export default function Toolbox() {
  const [state, dispatch] = useEditor();
  const { updateElements } = useElementHistory();

  const handleAddElement = (type: ElementType) => {
    const randomId = `${type}-${Date.now().toString().slice(-4)}`;
    let newEl: LabelElement;

    const defaultX = Math.round((state.widthMm - 20) / 2);
    const defaultY = Math.round((state.heightMm - 10) / 2);

    switch (type) {
      case 'rect':
        newEl = {
          id: randomId, type: 'rect',
          x: defaultX >= 0 ? defaultX : 2, y: defaultY >= 0 ? defaultY : 2,
          width: 30, height: 15, strokeWidth: 1, strokeColor: '#000000',
          fillColor: 'transparent', opacity: 1, rotation: 0, name: '사각형 도형', borderRadius: 0
        } as RectElement;
        break;
      case 'circle':
        newEl = {
          id: randomId, type: 'circle',
          x: defaultX >= 0 ? defaultX : 2, y: defaultY >= 0 ? defaultY : 2,
          width: 15, height: 15, strokeWidth: 1, strokeColor: '#000000',
          fillColor: 'transparent', opacity: 1, rotation: 0, name: '타원형 도형'
        } as CircleElement;
        break;
      case 'line':
        newEl = {
          id: randomId, type: 'line',
          x: defaultX >= 0 ? defaultX : 2, y: defaultY >= 0 ? defaultY : 2,
          width: 40, height: 1, strokeWidth: 1, strokeColor: '#000000',
          fillColor: '', opacity: 1, rotation: 0, name: '실선 구분선', lineThickness: 1
        } as LineElement;
        break;
      case 'barcode':
        newEl = {
          id: randomId, type: 'barcode',
          x: defaultX >= 0 ? defaultX : 2, y: defaultY >= 0 ? defaultY : 2,
          width: 50, height: 14, strokeWidth: 0, strokeColor: '',
          fillColor: '', opacity: 1, rotation: 0, name: '동적 바코드',
          barcodeType: 'CODE128', value: '${sku}', showText: true
        } as BarcodeElement;
        break;
      case 'qrcode':
        newEl = {
          id: randomId, type: 'qrcode',
          x: defaultX >= 0 ? defaultX : 2, y: defaultY >= 0 ? defaultY : 2,
          width: 15, height: 15, strokeWidth: 0, strokeColor: '',
          fillColor: '', opacity: 1, rotation: 0, name: '신속 QR코드',
          value: 'https://ai.studio/build/${sku}'
        } as QRCodeElement;
        break;
      case 'image':
        (window as Window & { __labelImageInputClick?: () => void }).__labelImageInputClick?.();
        return;
      case 'text':
      default:
        newEl = {
          id: randomId, type: 'text',
          x: defaultX >= 0 ? defaultX : 2, y: defaultY >= 0 ? defaultY : 2,
          width: 40, height: 8, strokeWidth: 0, strokeColor: '',
          fillColor: '', opacity: 1, rotation: 0, name: '신규 텍스트',
          text: '새로운 텍스트 ${prod_name}', fontSize: 10,
          fontFamily: 'Plus Jakarta Sans', fontColor: '#000000',
          fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left'
        } as TextElement;
        break;
    }

    updateElements([...state.elements, newEl]);
    dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: randomId });
    dispatch({ type: 'SET_FIELD', field: 'activeSidePanel', value: 'properties' });
  };

  return (
    <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-5 shrink-0">
      <button
        onClick={() => dispatch({ type: 'SET_FIELD', field: 'activeSidePanel', value: 'toolbox' })}
        className={`p-2.5 rounded-xl transition-all cursor-pointer relative group ${
          state.activeSidePanel === 'toolbox'
            ? 'bg-black text-white'
            : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
        }`}
        title="원소 추가상자"
      >
        <Plus className="w-5 h-5" />
        <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 delay-150 pointer-events-none transition-opacity whitespace-nowrap z-30">도구 상자</span>
      </button>

      <button
        onClick={() => {
          if (state.elements.length > 0 && !state.selectedElementId) {
            dispatch({ type: 'SET_FIELD', field: 'selectedElementId', value: state.elements[0].id });
          }
          dispatch({ type: 'SET_FIELD', field: 'activeSidePanel', value: 'properties' });
        }}
        className={`p-2.5 rounded-xl transition-all cursor-pointer relative group ${
          state.activeSidePanel === 'properties'
            ? 'bg-black text-white'
            : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
        }`}
        title="원소 상세 제어"
      >
        <Sliders className="w-5 h-5" />
        <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 delay-150 pointer-events-none transition-opacity whitespace-nowrap z-30">속성 제어판</span>
      </button>

      <div className="w-8 h-px bg-slate-200 my-1"></div>

      {/* Quick Add Actions */}
      <div className="text-[9px] font-bold text-slate-400 tracking-tight select-none mt-2">ADD</div>

      <button
        onClick={() => handleAddElement('text')}
        className="w-10 h-10 border border-dashed border-slate-200 hover:border-slate-500 rounded-lg text-slate-600 font-mono text-sm font-semibold flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
        title="텍스트 추가"
      >
        T
      </button>

      <button
        onClick={() => handleAddElement('rect')}
        className="w-10 h-10 border border-dashed border-slate-200 hover:border-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
        title="사각형 추가"
      >
        <div className="w-4 h-4 border border-slate-600 bg-slate-50 rounded-sm"></div>
      </button>

      <button
        onClick={() => handleAddElement('circle')}
        className="w-10 h-10 border border-dashed border-slate-200 hover:border-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
        title="타원 추가"
      >
        <div className="w-4 h-4 border border-slate-600 rounded-full bg-slate-50"></div>
      </button>

      <button
        onClick={() => handleAddElement('barcode')}
        className="w-10 h-10 border border-dashed border-slate-200 hover:border-slate-500 rounded-lg flex flex-col gap-0.5 items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
        title="바코드 추가"
      >
        <div className="flex gap-[1px]">
          <span className="w-[1.5px] h-3 bg-slate-700"></span>
          <span className="w-[3px] h-3 bg-slate-700"></span>
          <span className="w-[1px] h-3 bg-slate-700"></span>
          <span className="w-[2px] h-3 bg-slate-700"></span>
        </div>
      </button>

      <button
        onClick={() => handleAddElement('qrcode')}
        className="w-10 h-10 border border-dashed border-slate-200 hover:border-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
        title="QR코드 추가"
      >
        <div className="grid grid-cols-2 gap-[2px] p-[2px] border border-slate-500 rounded-[2px]">
          <div className="w-1.5 h-1.5 bg-slate-700"></div>
          <div className="w-1.5 h-1.5 bg-slate-700"></div>
          <div className="w-1.5 h-1.5 bg-slate-700"></div>
          <div className="w-1.5 h-1.5 flex gap-[1px]"><div className="w-[2px] h-full bg-slate-700"></div><div className="w-[1px] h-full bg-slate-700"></div></div>
        </div>
      </button>

      <button
        onClick={() => handleAddElement('image')}
        className="w-10 h-10 border border-dashed border-slate-200 hover:border-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer text-slate-600"
        title="이미지 추가"
      >
        <Image className="w-5 h-5" />
      </button>

      <div className="mt-auto flex flex-col items-center gap-4 text-xs font-bold text-slate-400">
        <span className="text-[10px] font-mono text-zinc-300">ZOOM</span>
        <div className="flex flex-col gap-1 items-center bg-zinc-50 border border-zinc-200 rounded-xl p-1.5 py-3">
          <button
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'zoom', value: Math.min(200, state.zoom + 10) })}
            className="p-1 hover:bg-zinc-200 rounded text-zinc-700 transition"
            title="확대"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] font-mono font-bold text-zinc-900 my-1">{state.zoom}%</span>
          <button
            onClick={() => dispatch({ type: 'SET_FIELD', field: 'zoom', value: Math.max(40, state.zoom - 10) })}
            className="p-1 hover:bg-zinc-200 rounded text-zinc-700 transition"
            title="축소"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
