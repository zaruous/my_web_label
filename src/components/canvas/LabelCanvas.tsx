import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { RenderElement } from '../../utils/labelRenderer';

export default function LabelCanvas() {
  const [state, dispatch] = useEditor();
  const {
    canvasRef,
    handleElementMouseDown,
    handleResizeHandleMouseDown,
    handleCanvasMouseDown,
    scale,
  } = useCanvasInteraction();

  const currentRecordData = state.dataset[state.selectedRecordIndex] || {};

  return (
    <div
      className="flex-1 bg-[#F1F1F1] relative overflow-hidden flex items-center justify-center p-8 select-none"
      style={{ backgroundImage: 'radial-gradient(#e5e7eb 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }}
      id="design-backplane"
    >
      {/* RULER HORIZONTAL (TOP) */}
      <div className="absolute top-0 left-6 right-0 h-6 bg-white border-b border-slate-200 flex items-end px-4 select-none shadow-sm z-10 transition-all">
        <div className="w-full flex justify-between text-[8px] pb-1 text-slate-500 font-mono tracking-tight font-bold">
          <span>0mm</span>
          <span>10mm</span>
          <span>20mm</span>
          <span>30mm</span>
          <span>40mm</span>
          <span>50mm</span>
          <span>60mm</span>
          <span>70mm</span>
          <span>80mm</span>
          <span>90mm</span>
          <span>100mm</span>
        </div>
      </div>

      {/* RULER VERTICAL (LEFT) */}
      <div className="absolute top-0 left-0 bottom-0 w-6 bg-white border-r border-slate-200 flex flex-col pt-8 pb-4 select-none shadow-sm z-20 transition-all items-center">
        <div className="h-full w-full flex flex-col justify-between items-center text-[8px] text-slate-500 font-mono font-bold">
          <span className="-rotate-90 whitespace-nowrap block origin-center">0mm</span>
          <span className="-rotate-90 whitespace-nowrap block origin-center">10mm</span>
          <span className="-rotate-90 whitespace-nowrap block origin-center">20mm</span>
          <span className="-rotate-90 whitespace-nowrap block origin-center">30mm</span>
          <span className="-rotate-90 whitespace-nowrap block origin-center">40mm</span>
          <span className="-rotate-90 whitespace-nowrap block origin-center">50mm</span>
          <span className="-rotate-90 whitespace-nowrap block origin-center">60mm</span>
        </div>
      </div>

      {/* PREVIEW BIND RECORD BANNER (CHOOSE CURRENT DATAROW) */}
      <div className="absolute top-9 left-12 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-md z-10">
        <span className="text-[10px] uppercase font-bold text-slate-500">테스트 데이터셋 연계 미리보기:</span>
        <div className="flex gap-1">
          {state.dataset.map((row, idx) => (
            <button
              key={idx}
              onClick={() => dispatch({ type: 'SET_FIELD', field: 'selectedRecordIndex', value: idx })}
              className={`px-2.5 py-1 text-[11px] rounded font-bold transition-all ${
                state.selectedRecordIndex === idx
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              {row.prod_name ? `${row.prod_name.slice(0, 6)}..` : `지정 #${idx + 1}`}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN LABELLING CANVAS FRAME */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        className="bg-white shadow-2xl relative border border-slate-300 ring-2 ring-black/5 transition-all outline-none"
        id="drawing-canvas-frame"
        style={{
          width: `${state.widthMm * scale}px`,
          height: `${state.heightMm * scale}px`,
        }}
      >
        {/* Grid overlay */}
        {state.showGrid && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.15]"
            style={{
              backgroundImage: `linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
              backgroundSize: `${5 * scale}px ${5 * scale}px`
            }}
          />
        )}

        {/* Outer Millimeters Dimensions HUD labels */}
        <span className="absolute -top-5 right-0 text-[10px] font-mono text-zinc-500 font-bold bg-white px-1.5 py-0.2 rounded shadow-sm border border-zinc-200">W: {state.widthMm} mm</span>
        <span className="absolute -right-16 top-0 text-[10px] font-mono text-zinc-500 font-bold [writing-mode:vertical-lr] bg-white px-1.5 py-0.2 rounded shadow-sm border border-zinc-200">H: {state.heightMm} mm</span>

        {/* Draw Elements */}
        {state.elements.map(el => {
          const isSelected = el.id === state.selectedElementId;
          return (
            <div
              key={el.id}
              onMouseDown={(e) => handleElementMouseDown(el.id, e)}
              className="absolute"
              style={{
                left: `${el.x * scale}px`,
                top: `${el.y * scale}px`,
                width: `${el.width * scale}px`,
                height: `${el.height * scale}px`,
                pointerEvents: 'auto',
              }}
            >
              {/* Core vector element shape drawer */}
              <RenderElement
                element={el}
                activeData={currentRecordData}
                selectedId={state.selectedElementId || undefined}
                scale={scale}
              />

              {/* Interactive Resize Dot and bounding ring helper when Selected */}
              {isSelected && (
                <>
                  {/* Blue Outer high-contrast helper boundary box */}
                  <div className="absolute inset-x-0 inset-y-0 border-2 border-dashed border-blue-500 pointer-events-none z-30" />

                  {/* Simple, intuitive Bottom-Right Resize handle dots */}
                  <div
                    onMouseDown={(e) => handleResizeHandleMouseDown(el.id, e)}
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 border border-white rounded-full cursor-se-resize z-50 hover:scale-125 shadow-lg active:bg-zinc-950 transition-transform"
                    id={`resize-handle-${el.id}`}
                    title="크기 변경 핸들"
                  />

                  {/* Position Coordinate label display bubble */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-mono font-bold py-0.5 px-2 rounded pointer-events-none shadow whitespace-nowrap z-50">
                    X:{el.x} Y:{el.y} mm
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM FLOATING BAR WITH METRICS AND ZOOM HUD */}
      <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm border border-slate-250 rounded-2xl shadow-xl p-3 flex items-center gap-4 z-10 transition-all select-none">
        <span className="text-[10px] text-slate-400 font-mono">가이드: 마우스 드래그로 요소를 이동하고, 우하단 파란 점을 당겨 크기를 조절하세요.</span>
        <div className="h-4 w-px bg-slate-200"></div>
        <button
          onClick={() => dispatch({ type: 'SET_FIELD', field: 'zoom', value: 100 })}
          className="px-2 py-1 text-[10px] font-bold text-zinc-900 border border-slate-250 rounded bg-slate-50 hover:bg-slate-100 uppercase"
        >
          100% 리셋
        </button>
      </div>
    </div>
  );
}
