import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { LabelElement } from '../types';

/**
 * Replaces Mustache style {{variable}} blocks with their data values
 */
export function substituteVariables(text: string, data: Record<string, string>): string {
  if (!text) return '';
  // match Velocity style: $var, ${var}, $!var, $!{var}
  return text.replace(/\$!?\{([a-zA-Z0-9_]+)\}|\$!?([a-zA-Z0-9_]+)/g, (match, g1, g2) => {
    const key = g1 || g2;
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

/**
 * Generates an SVG barcode path mock matching characters
 */
export function getBarcodeSVGPath(value: string, width: number, height: number): { path: string; strokeWidth: string } {
  const cleaned = (value || '12345678').replace(/[\{\}]/g, '');
  let pattern = '';
  // Repeatable hash
  let hash = 0;
  for (let i = 0; i < cleaned.length; i++) {
    hash = cleaned.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  for (let i = 0; i < 40; i++) {
    const bit = ((hash >> (i % 30)) & 1) ^ (i % 2 === 0 ? 1 : 0);
    pattern += bit === 1 ? '1' : '0';
  }
  pattern = '101' + pattern + '101';

  const numBars = pattern.length;
  const barWidth = width / numBars;
  let pathStr = '';
  for (let i = 0; i < numBars; i++) {
    if (pattern[i] === '1') {
      const xStart = i * barWidth;
      pathStr += `M ${xStart.toFixed(2)},0 L ${xStart.toFixed(2)},${height.toFixed(2)} `;
    }
  }
  return { path: pathStr, strokeWidth: barWidth.toFixed(2) };
}

/**
 * Generates a mock QR code SVG rect matrix
 */
export function getQRCodeBlocks(value: string, width: number, height: number): { x: number; y: number; w: number; h: number }[] {
  const cleaned = (value || 'QR_VALUE').replace(/[\{\}]/g, '');
  let hash = 5381;
  for (let i = 0; i < cleaned.length; i++) {
    hash = ((hash << 5) + hash) + cleaned.charCodeAt(i);
  }

  const size = 15;
  const blockW = width / size;
  const blockH = height / size;
  const blocks: { x: number; y: number; w: number; h: number }[] = [];

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

    if (r < 4 && c < 4) return rBorder || (r === 1 && c === 1 && false) || (r !== 1 && c !== 1);
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
        blocks.push({
          x: c * blockW,
          y: r * blockH,
          w: blockW,
          h: blockH,
        });
      }
    }
  }
  return blocks;
}

interface RenderElementProps {
  key?: string | number;
  element: LabelElement;
  activeData: Record<string, string>;
  selectedId?: string;
  onSelect?: (id: string, e: React.MouseEvent) => void;
  scale: number; // pixels per mm
}

class BarcodeErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function RenderElement({ element, activeData, selectedId, onSelect, scale }: RenderElementProps) {
  const isSelected = selectedId === element.id;

  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    opacity: element.opacity,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    transformOrigin: 'center center',
    filter: isSelected ? 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))' : undefined,
    cursor: 'move',
  };

  const handleSelect = (e: React.MouseEvent) => {
    if (onSelect) {
      onSelect(element.id, e);
    }
  };

  switch (element.type) {
    case 'rect':
      return (
        <div
          id={`render-el-${element.id}`}
          style={style}
          onClick={handleSelect}
          className="transition-shadow duration-150"
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              border: `${element.strokeWidth * (scale / 4)}px solid ${element.strokeColor || '#000'}`,
              backgroundColor: element.fillColor || 'transparent',
              borderRadius: `${(element.borderRadius || 0) * scale}px`,
            }}
          />
        </div>
      );

    case 'circle':
      return (
        <div
          id={`render-el-${element.id}`}
          style={style}
          onClick={handleSelect}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              border: `${element.strokeWidth * (scale / 4)}px solid ${element.strokeColor || '#000'}`,
              backgroundColor: element.fillColor || 'transparent',
              borderRadius: '50%',
            }}
          />
        </div>
      );

    case 'line':
      const lineThick = (element.lineThickness || element.strokeWidth || 1) * (scale / 4);
      return (
        <div
          id={`render-el-${element.id}`}
          style={style}
          onClick={handleSelect}
          className="flex items-center"
        >
          <div
            style={{
              width: '100%',
              height: `${Math.max(2, lineThick)}px`,
              backgroundColor: element.strokeColor || '#000',
            }}
          />
        </div>
      );

    case 'text':
      const textVal = substituteVariables(element.text, activeData);
      // pt font size to standard responsive scale sizing
      // Standard: 1pt ~ 1.33px, scaled up/down with mm scale
      const fsPx = element.fontSize * (scale / 3);
      
      return (
        <div
          id={`render-el-${element.id}`}
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              element.textAlign === 'center'
                ? 'center'
                : element.textAlign === 'right'
                ? 'flex-end'
                : 'flex-start',
            overflow: 'hidden',
            wordBreak: 'break-all',
          }}
          onClick={handleSelect}
        >
          <span
            style={{
              fontSize: `${fsPx}px`,
              fontFamily: element.fontFamily || 'Inter',
              color: element.fontColor || '#000000',
              fontWeight: element.fontWeight || 'normal',
              fontStyle: element.fontStyle || 'normal',
              textAlign: element.textAlign || 'left',
              width: '100%',
              pointerEvents: 'none',
              userSelect: 'none',
              lineHeight: 1.1,
            }}
          >
            {textVal || <span className="opacity-30 italic">(텍스트 입력)</span>}
          </span>
        </div>
      );

    case 'barcode':
      let barValue = substituteVariables(element.value, activeData);
      if (!barValue) barValue = '...';
      
      let validFormat: any = (element as any).barcodeType || 'CODE128';
      if (validFormat === 'CODE93') validFormat = 'CODE128';

      return (
        <div
          id={`render-el-${element.id}`}
          style={{
            ...style,
            backgroundColor: '#ffffff',
            padding: '2px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
          onClick={handleSelect}
          className={`select-none overflow-hidden border ${isSelected ? 'animate-highlight-pulse relative z-10 border-blue-500' : 'border-gray-100'}`}
        >
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarcodeErrorBoundary fallback={<div className="text-red-500 font-bold text-xs p-1 text-center bg-red-50 rounded">유효하지 않은 바코드<br/>({validFormat})</div>}>
              <Barcode
                value={barValue}
                format={validFormat}
                width={Math.max(1, (element.width * scale) / 100)} // dynamic width scaling estimate
                height={Math.max(10, element.height * scale * (element.showText ? 0.6 : 0.9))}
                displayValue={element.showText}
                fontSize={Math.max(8, scale * 2)}
                margin={0}
                background="transparent"
              />
            </BarcodeErrorBoundary>
          </div>
        </div>
      );

    case 'qrcode':
      const qrValue = substituteVariables(element.value, activeData);
      
      return (
        <div
          id={`render-el-${element.id}`}
          style={{
            ...style,
            backgroundColor: '#ffffff',
            padding: '2px',
            boxSizing: 'border-box',
          }}
          onClick={handleSelect}
          className={`select-none border ${isSelected ? 'animate-highlight-pulse relative z-10 border-blue-500' : 'border-gray-100'}`}
        >
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QRCodeSVG value={qrValue} size={100} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      );

    case 'image':
      const imageUrl = (element as any).url || '';
      return (
        <div
          id={`render-el-${element.id}`}
          style={style}
          onClick={handleSelect}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={element.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#e2e8f0',
                border: '1px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${Math.max(8, scale * 1.5)}px`,
                color: '#64748b',
                fontWeight: 'bold',
              }}
            >
              이미지 없음
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}
