import React from 'react';
import { Printer, Info } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { LabelElement } from '../../types';

// PureSVGLabel: high-fidelity SVG rendering for print
function PureSVGLabel({
  elements,
  widthMm,
  heightMm,
  activeData
}: {
  elements: LabelElement[];
  widthMm: number;
  heightMm: number;
  activeData: Record<string, string>;
}) {
  const replacePlaceholders = (text: string) => {
    if (!text) return "";
    return text.replace(/\$!?\{([a-zA-Z0-9_]+)\}|\$!?([a-zA-Z0-9_]+)/g, (match, g1, g2) => {
      const key = g1 || g2;
      return activeData[key] !== undefined ? String(activeData[key]) : match;
    });
  };

  const boundElements = elements.map(el => {
    const cloned = { ...el };
    if (cloned.type === "text") {
      (cloned as typeof cloned & { text: string }).text = replacePlaceholders((cloned as typeof cloned & { text: string }).text);
    } else if (cloned.type === "barcode" || cloned.type === "qrcode") {
      (cloned as typeof cloned & { value: string }).value = replacePlaceholders((cloned as typeof cloned & { value: string }).value);
    }
    return cloned;
  });

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${widthMm} ${heightMm}`}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif'
      }}
      className="print-svg-node"
    >
      {boundElements.map(el => {
        const opacityAttr = el.opacity !== undefined ? el.opacity : 1;
        const transformAttr = el.rotation ? `rotate(${el.rotation} ${el.x + el.width / 2} ${el.y + el.height / 2})` : undefined;

        if (el.type === "rect") {
          const rx = (el as typeof el & { borderRadius?: number }).borderRadius || 0;
          return (
            <rect
              key={el.id}
              id={el.id}
              x={el.x} y={el.y}
              width={el.width} height={el.height}
              rx={rx} ry={rx}
              fill={el.fillColor}
              stroke={el.strokeColor}
              strokeWidth={el.strokeWidth}
              opacity={opacityAttr}
              transform={transformAttr}
            />
          );
        } else if (el.type === "circle") {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          const r = Math.min(el.width, el.height) / 2;
          return (
            <circle
              key={el.id}
              id={el.id}
              cx={cx} cy={cy} r={r}
              fill={el.fillColor}
              stroke={el.strokeColor}
              strokeWidth={el.strokeWidth}
              opacity={opacityAttr}
              transform={transformAttr}
            />
          );
        } else if (el.type === "line") {
          const x2 = el.x + el.width;
          const y2 = el.y + el.height;
          const lineEl = el as typeof el & { lineThickness?: number };
          return (
            <line
              key={el.id}
              id={el.id}
              x1={el.x} y1={el.y} x2={x2} y2={y2}
              stroke={el.strokeColor}
              strokeWidth={lineEl.lineThickness || el.strokeWidth || 1}
              opacity={opacityAttr}
              transform={transformAttr}
            />
          );
        } else if (el.type === "text") {
          const textEl = el as typeof el & { fontSize?: number; textAlign?: string; fontFamily?: string; fontWeight?: string; fontStyle?: string; fontColor?: string; text: string };
          const fs = textEl.fontSize ? (textEl.fontSize * 0.3527) : 4;
          const textAnchor = textEl.textAlign === "center" ? "middle" : textEl.textAlign === "right" ? "end" : "start";
          const textX = textEl.textAlign === "center" ? el.x + el.width / 2 : textEl.textAlign === "right" ? el.x + el.width : el.x;
          const textY = el.y + (el.height / 2) + (fs / 3);
          const styleObj = {
            fontFamily: textEl.fontFamily || 'Inter',
            fontWeight: textEl.fontWeight || 'normal',
            fontStyle: textEl.fontStyle || 'normal',
          };
          return (
            <text
              key={el.id}
              id={el.id}
              x={textX} y={textY}
              fill={textEl.fontColor || '#000000'}
              fontSize={`${fs}px`}
              textAnchor={textAnchor}
              style={styleObj}
              opacity={opacityAttr}
              transform={transformAttr}
            >
              {textEl.text}
            </text>
          );
        } else if (el.type === "barcode") {
          const barcodeEl = el as typeof el & { value: string; showText?: boolean };
          const codeWidth = el.width;
          const codeHeight = el.height * 0.8;
          const cleaned = (barcodeEl.value || "12345678").replace(/[\{\}]/g, "");
          let hash = 0;
          for (let i = 0; i < cleaned.length; i++) {
            hash = cleaned.charCodeAt(i) + ((hash << 5) - hash);
          }
          hash = Math.abs(hash);
          let pattern = "";
          for (let i = 0; i < 40; i++) {
            const bit = ((hash >> (i % 30)) & 1) ^ (i % 2 === 0 ? 1 : 0);
            pattern += bit === 1 ? "1" : "0";
          }
          pattern = "101" + pattern + "101";
          const numBars = pattern.length;
          const barWidth = codeWidth / numBars;
          let pathStr = "";
          for (let i = 0; i < numBars; i++) {
            if (pattern[i] === "1") {
              const xStart = i * barWidth;
              pathStr += `M ${xStart.toFixed(2)},0 L ${xStart.toFixed(2)},${codeHeight.toFixed(2)} `;
            }
          }
          return (
            <g key={el.id} id={el.id} opacity={opacityAttr} transform={transformAttr}>
              <g transform={`translate(${el.x}, ${el.y})`}>
                <rect x="0" y="0" width={codeWidth} height={el.height} fill="#ffffff" />
                <path d={pathStr} stroke="#000000" strokeWidth={barWidth.toFixed(2)} />
                {barcodeEl.showText && (
                  <text x={codeWidth / 2} y={el.height - 1} fill="#000000" fontSize="3px" textAnchor="middle" fontFamily="monospace">
                    {barcodeEl.value}
                  </text>
                )}
              </g>
            </g>
          );
        } else if (el.type === "qrcode") {
          const qrEl = el as typeof el & { value: string };
          const cleaned = (qrEl.value || "HELLO").replace(/[\{\}]/g, "");
          let hash = 5381;
          for (let i = 0; i < cleaned.length; i++) {
            hash = ((hash << 5) + hash) + cleaned.charCodeAt(i);
          }
          const size = 15;
          const blockW = el.width / size;
          const blockH = el.height / size;
          const rects: React.ReactNode[] = [];
          const isFinder = (r: number, c: number) => {
            if (r < 4 && c < 4) return true;
            if (r < 4 && c >= size - 4) return true;
            if (r >= size - 4 && c < 4) return true;
            return false;
          };
          const isFinderFill = (r: number, c: number) => {
            const rBorder = r === 0 || r === 3 || c === 0 || c === 3;
            const r_trBorder = r === 0 || r === 3 || c === size - 1 || c === size - 4;
            const r_blBorder = r === size - 1 || r === size - 4 || c === 0 || c === 3;
            if (r < 4 && c < 4) return rBorder || (r !== 1 && c !== 1);
            if (r < 4 && c >= size - 4) return r_trBorder || (r !== 1 && c !== size - 2);
            if (r >= size - 4 && c < 4) return r_blBorder || (r !== size - 2 && c !== 1);
            return false;
          };
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              let isFilled = false;
              if (isFinder(r, c)) {
                isFilled = isFinderFill(r, c);
              } else {
                const pseudorandom = Math.abs(Math.sin(hash + r * 13 + c * 37));
                isFilled = pseudorandom > 0.45;
              }
              if (isFilled) {
                const x = c * blockW;
                const y = r * blockH;
                rects.push(
                  <rect
                    key={`${r}-${c}`}
                    x={x.toFixed(2)} y={y.toFixed(2)}
                    width={blockW.toFixed(2)} height={blockH.toFixed(2)}
                    fill="#000000"
                  />
                );
              }
            }
          }
          return (
            <g key={el.id} id={el.id} opacity={opacityAttr} transform={transformAttr}>
              <g transform={`translate(${el.x}, ${el.y})`}>
                <rect x="0" y="0" width={el.width} height={el.height} fill="#ffffff" />
                {rects}
              </g>
            </g>
          );
        } else if (el.type === "image") {
          const imgEl = el as typeof el & { url: string };
          return (
            <image
              key={el.id}
              id={el.id}
              href={imgEl.url}
              x={el.x} y={el.y}
              width={el.width} height={el.height}
              opacity={opacityAttr}
              transform={transformAttr}
            />
          );
        }
        return null;
      })}
    </svg>
  );
}

export default function PrintPreviewModal() {
  const [state, dispatch] = useEditor();

  const printRows = state.printRange === 'current'
    ? [state.dataset[state.selectedRecordIndex]].filter(Boolean)
    : state.dataset;

  return (
    <div className="flex-1 bg-zinc-800 p-8 overflow-y-auto flex flex-col items-center relative">
      <style>
        {state.printFormat === 'roll' ? `
          @media print {
            @page { size: ${state.widthMm}mm ${state.heightMm}mm; margin: 0; }
            body { margin: 0; background: #fff !important; }
            .print-label-item { margin: 0 !important; border: none !important; padding: 0 !important; width: ${state.widthMm}mm !important; height: ${state.heightMm}mm !important; max-width: none !important; page-break-after: always; box-shadow: none !important; }
            .print-container { display: block !important; padding: 0 !important; border: none !important; background: transparent !important; }
            .print-canvas { border: none !important; box-shadow: none !important; }
          }
        ` : `
          @media print {
            @page { size: A4; margin: 10mm; }
            body { background: #fff !important; }
            .print-label-item { page-break-inside: avoid; border: 1px dashed #ccc !important; padding: 2px !important; margin: 0 !important; }
            .print-container { display: flex !important; flex-wrap: wrap !important; gap: 4px !important; }
            .print-canvas { border: none !important; box-shadow: none !important; }
          }
        `}
        {`
          @media print {
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            .print-container {
              position: absolute; left: 0; top: 0; width: 100%; background: white !important;
            }
          }
        `}
      </style>

      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6 print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-5 print:hidden">
          <div>
            <h2 className="text-lg font-extrabold text-zinc-950">프린트 출력 설정</h2>

            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-zinc-700">프린터 선택:</label>
                <select className="border border-slate-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-zinc-900">
                  <option value="system">기본 시스템 프린터 (OS 대화상자)</option>
                  <option value="bixolon">Bixolon SLP-DX420</option>
                  <option value="zebra">Zebra ZD410</option>
                  <option value="xprinter">Xprinter XP-490B</option>
                  <option value="niimbot">Niimbot B21 / D11</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-zinc-700">출력 용지:</span>
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="printFormat"
                    value="roll"
                    checked={state.printFormat === 'roll'}
                    onChange={() => dispatch({ type: 'SET_FIELD', field: 'printFormat', value: 'roll' })}
                    className="accent-zinc-900"
                  />
                  <span>롤 프린터 (1장씩 연속 출력)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="printFormat"
                    value="a4"
                    checked={state.printFormat === 'a4'}
                    onChange={() => dispatch({ type: 'SET_FIELD', field: 'printFormat', value: 'a4' })}
                    className="accent-zinc-900"
                  />
                  <span>A4 라벨지 (그리드 출력)</span>
                </label>
              </div>

              <div className="flex items-center gap-4 border-t border-slate-100 pt-3">
                <span className="text-sm font-semibold text-zinc-700">인쇄 범위:</span>
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="printRange"
                    value="current"
                    checked={state.printRange === 'current'}
                    onChange={() => dispatch({ type: 'SET_FIELD', field: 'printRange', value: 'current' })}
                    className="accent-zinc-900"
                  />
                  <span className="font-bold text-blue-600">현재 미리보기 라벨만 인쇄 (1장)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="printRange"
                    value="all"
                    checked={state.printRange === 'all'}
                    onChange={() => dispatch({ type: 'SET_FIELD', field: 'printRange', value: 'all' })}
                    className="accent-zinc-900"
                  />
                  <span>전체 데이터셋 연속 인쇄 ({state.dataset.length}장 일괄)</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-200 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> 지금 인쇄하기
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_FIELD', field: 'printPreviewMode', value: false })}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              돌아가기
            </button>
          </div>
        </div>

        {/* Print Grid Render Area */}
        <div className="print-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center p-2 bg-zinc-50 rounded-xl border border-zinc-100 print:bg-white print:border-none">
          {printRows.map((row, idx) => {
            const recordLabelNum = state.printRange === 'current' ? state.selectedRecordIndex + 1 : idx + 1;
            return (
              <div
                key={idx}
                className="print-label-item relative bg-white border border-zinc-200 p-3 rounded-lg overflow-hidden flex flex-col items-center justify-center shadow-sm select-none"
                style={{
                  width: '100%',
                  maxWidth: `${state.widthMm * 4.5}px`,
                  margin: '0 auto',
                }}
              >
                <div className="text-[9px] font-mono font-medium text-zinc-400 border-b border-dashed border-zinc-100 pb-1 w-full text-left mb-2 flex justify-between print:hidden">
                  <span>레코드 #{recordLabelNum}</span>
                  <span>{state.widthMm}x{state.heightMm}mm</span>
                </div>

                {/* High-Resolution 1:1 mm Vector SVG Label */}
                <div
                  className="bg-white relative overflow-hidden print-canvas border border-slate-200 shadow-sm print:border-none print:shadow-none flex items-center justify-center"
                  style={{
                    width: `${state.widthMm * 4.5}px`,
                    height: `${state.heightMm * 4.5}px`,
                  }}
                >
                  <style>
                    {`
                      .print-canvas svg { width: 100% !important; height: 100% !important; }
                      @media print {
                        .print-canvas { width: ${state.widthMm}mm !important; height: ${state.heightMm}mm !important; }
                      }
                    `}
                  </style>
                  <PureSVGLabel
                    elements={state.elements}
                    widthMm={state.widthMm}
                    heightMm={state.heightMm}
                    activeData={row}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-800 space-y-1.5 print:hidden">
          <p className="font-bold flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> 대형 인쇄 제어 팁
          </p>
          <p className="leading-relaxed">
            인쇄 대화 상자의 설정에서 <strong>&apos;여백 없음&apos;</strong> 및 <strong>&apos;배경 그래픽 포함&apos;</strong>을 설정하시면, 지정한 정확한 규격(mm) 대비 벡터 형태 그대로의 최적 여백 결과로 깔끔하게 물리 스티커 라벨지에 인쇄됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
