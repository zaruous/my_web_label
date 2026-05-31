import { LabelVariable, LabelElement, TextElement, BarcodeElement, QRCodeElement, RectElement } from '../types';

export const INITIAL_VARIABLES: LabelVariable[] = [
  { id: "prod_name", name: "상품명", type: "text", defaultValue: "프리미엄 무선 헤드폰" },
  { id: "price", name: "단가", type: "price", defaultValue: "189,000" },
  { id: "sku", name: "상품 코드", type: "text", defaultValue: "HP-2026-X7" },
  { id: "origin", name: "원산지", type: "text", defaultValue: "대한민국" }
];

export const INITIAL_ELEMENTS: LabelElement[] = [
  {
    id: "qr-element-init",
    type: "qrcode",
    x: 60,
    y: 6,
    width: 14,
    height: 14,
    strokeWidth: 0,
    strokeColor: "",
    fillColor: "",
    opacity: 1,
    rotation: 0,
    name: "정품확인 QR",
    value: "https://test.com/v?id=${sku}"
  } as QRCodeElement,
  {
    id: "rect-border",
    type: "rect",
    x: 2,
    y: 2,
    width: 76,
    height: 36,
    strokeWidth: 1,
    strokeColor: "#1e293b",
    fillColor: "transparent",
    opacity: 1,
    rotation: 0,
    name: "테두리",
    borderRadius: 2
  } as RectElement,
  {
    id: "title",
    type: "text",
    x: 6,
    y: 6,
    width: 68,
    height: 8,
    strokeWidth: 0,
    strokeColor: "",
    fillColor: "",
    opacity: 1,
    rotation: 0,
    name: "상품명 텍스트",
    text: "품명: ${prod_name}",
    fontSize: 14,
    fontFamily: "Plus Jakarta Sans",
    fontColor: "#0f172a",
    fontWeight: "bold",
    fontStyle: "normal",
    textAlign: "left"
  } as TextElement,
  {
    id: "price-text",
    type: "text",
    x: 6,
    y: 15,
    width: 35,
    height: 6,
    strokeWidth: 0,
    strokeColor: "",
    fillColor: "",
    opacity: 1,
    rotation: 0,
    name: "가격 텍스트",
    text: "판매가: ₩${price}",
    fontSize: 11,
    fontFamily: "Plus Jakarta Sans",
    fontColor: "#e11d48",
    fontWeight: "bold",
    fontStyle: "normal",
    textAlign: "left"
  } as TextElement,
  {
    id: "origin-text",
    type: "text",
    x: 43,
    y: 15,
    width: 30,
    height: 6,
    strokeWidth: 0,
    strokeColor: "",
    fillColor: "",
    opacity: 1,
    rotation: 0,
    name: "원산지 텍스트",
    text: "지역: ${origin}",
    fontSize: 9,
    fontFamily: "Plus Jakarta Sans",
    fontColor: "#475569",
    fontWeight: "normal",
    fontStyle: "normal",
    textAlign: "right"
  } as TextElement,
  {
    id: "bar-element",
    type: "barcode",
    x: 10,
    y: 22,
    width: 60,
    height: 12,
    strokeWidth: 0,
    strokeColor: "",
    fillColor: "",
    opacity: 1,
    rotation: 0,
    name: "바코드",
    barcodeType: "CODE128",
    value: "${sku}",
    showText: true
  } as BarcodeElement
];

export const PRESET_SIZES = [
  { name: '상품 리테일 택 (80 x 40 mm)', widthMm: 80, heightMm: 40 },
  { name: '물류 우편 배송라벨 (100 x 60 mm)', widthMm: 100, heightMm: 60 },
  { name: '소형 마트 바코드 라벨 (50 x 30 mm)', widthMm: 50, heightMm: 30 },
  { name: '수납 정리 인덱스 라벨 (70 x 20 mm)', widthMm: 70, heightMm: 20 },
];

export const PAGE_PRESETS = [
  { id: '80x40', name: '기본 감열라벨 (80x40mm)', w: 80, h: 40 },
  { id: '40x40', name: '정사각형 라벨 (40x40mm)', w: 40, h: 40 },
  { id: '100x150', name: '택배 송장 (100x150mm)', w: 100, h: 150 },
  { id: '60x40', name: '중형 바코드용 (60x40mm)', w: 60, h: 40 },
  { id: '50x30', name: '소형 화장품/약물 (50x30mm)', w: 50, h: 30 },
  { id: 'custom', name: '직접 입력', w: 80, h: 40 }
];

export const INITIAL_DATASET: Record<string, string>[] = [
  { prod_name: "프리미엄 무선 헤드폰", price: "189,000", sku: "HP-2026-X7", origin: "대한민국", receiver: "정우성", contact: "010-1234-5678", address: "서울특별시 강남구 테헤란로 501", tracking_no: "4019-9832-1102" },
  { prod_name: "소형 저소음 키보드", price: "45,000", sku: "KB-MINI-02", origin: "중국", receiver: "김태희", contact: "010-9876-5432", address: "부산광역시 해운대구 우동 102", tracking_no: "4019-1102-5593" },
  { prod_name: "인체공학 버티컬 마우스", price: "69,900", sku: "MS-VERT-Y9", origin: "베트남", receiver: "송중기", contact: "010-4455-8899", address: "인천광역시 연수구 송도동 44", tracking_no: "4019-7721-0012" }
];
