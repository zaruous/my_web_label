export interface CanvasSize {
  name: string;
  widthMm: number;
  heightMm: number;
}

export type ElementType = 'text' | 'rect' | 'circle' | 'line' | 'barcode' | 'qrcode' | 'image';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number; // in mm
  y: number; // in mm
  width: number; // in mm
  height: number; // in mm
  strokeWidth: number; // in pt/mm (e.g., 0.5, 1, 2)
  strokeColor: string;
  fillColor: string;
  opacity: number; // 0 to 1
  rotation: number; // degrees 0-360
  name: string; // descriptive name
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string; // can contain mustache variables like {{prod_name}}
  fontSize: number; // pt
  fontFamily: string;
  fontColor: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface RectElement extends BaseElement {
  type: 'rect';
  borderRadius: number; // mm
}

export interface CircleElement extends BaseElement {
  type: 'circle';
}

export interface LineElement extends BaseElement {
  type: 'line';
  lineThickness: number;
}

export interface BarcodeElement extends BaseElement {
  type: 'barcode';
  barcodeType: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39' | 'EAN8' | 'CODE93' | 'ITF14' | 'CODABAR';
  value: string; // can contain mustache variables
  showText: boolean;
}

export interface QRCodeElement extends BaseElement {
  type: 'qrcode';
  value: string; // can contain mustache variables
}

export interface ImageElement extends BaseElement {
  type: 'image';
  url: string; // base64 Data URL or path
}

export type LabelElement =
  | TextElement
  | RectElement
  | CircleElement
  | LineElement
  | BarcodeElement
  | QRCodeElement
  | ImageElement;

export interface LabelVariable {
  id: string; // e.g. "prod_name"
  name: string; // e.g. "상품명"
  type: 'text' | 'number' | 'price' | 'date';
  defaultValue: string; // default value for editing preview
}

export interface LabelTemplate {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  elements: LabelElement[];
  variables: LabelVariable[];
}

export interface BatchItem {
  id: string;
  values: Record<string, string>; // e.g., { prod_name: "사과", price: "3,000" }
}
