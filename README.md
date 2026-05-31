# Label Architect

라벨 디자이너 & 출력 API 서버. 드래그앤드롭 캔버스로 라벨 템플릿을 설계하고, REST API로 데이터를 바인딩하여 SVG 벡터 라벨을 생성합니다.

## 미리보기
<img width="1904" height="896" alt="image" src="https://github.com/user-attachments/assets/4206a3d5-4676-4aa9-a2d2-0f3cdbf57b56" />

## 스택

| 영역 | 기술 |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite |
| Backend | Node.js, Express 4, tsx |
| 렌더링 | SVG (벡터), qrcode.react, react-barcode |

## 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 환경 변수

`.env.local` 파일에 설정합니다.

```env
# Gemini AI 연동 시 필요 (선택)
GEMINI_API_KEY=your_key_here

# 앱 호스팅 URL (기본값: http://localhost:3000)
APP_URL=http://localhost:3000
```

## 디렉토리 구조

```
src/
├── App.tsx                          # 루트 컴포넌트 (43줄)
├── types.ts                         # TypeScript 타입 정의
├── constants/defaults.ts            # 초기값·프리셋 상수
├── context/EditorContext.tsx        # 전역 상태 (useReducer)
├── hooks/
│   ├── useElementHistory.ts        # Undo/Redo
│   ├── useCanvasInteraction.ts     # 드래그·리사이즈·키보드
│   └── useTemplates.ts            # 서버 템플릿 CRUD
├── utils/
│   ├── labelRenderer.tsx           # SVG 요소 렌더러
│   ├── csvParser.ts                # CSV 파싱
│   └── fileUtils.ts                # JSON/SVG 파일 I/O
└── components/
    ├── layout/Header.tsx           # 헤더 (메뉴·액션 버튼)
    ├── sidebar/
    │   ├── Toolbox.tsx             # 요소 추가·줌
    │   ├── ElementList.tsx         # 레이어 목록
    │   └── PropertiesPanel.tsx     # 속성 편집
    ├── canvas/LabelCanvas.tsx      # 드로잉 캔버스
    ├── tabs/
    │   ├── VariablesTab.tsx        # 변수 사전 관리
    │   ├── DatasetTab.tsx          # 다중 레코드 바인딩
    │   └── ApiTab.tsx              # API 샌드박스
    └── modals/
        ├── NewTemplateModal.tsx    # 새 디자인
        └── PrintPreviewModal.tsx  # 프린트 미리보기
```

## REST API

### 템플릿 관리

#### 템플릿 목록 조회
```
GET /api/templates
```
```json
[
  {
    "id": "default-product",
    "name": "기본 상품 택 (Product Retail Tag)",
    "widthMm": 80,
    "heightMm": 40,
    "elements": [...],
    "variables": [...]
  }
]
```

#### 템플릿 저장
```
POST /api/templates
Content-Type: application/json

{
  "name": "배송 라벨",
  "widthMm": 100,
  "heightMm": 60,
  "elements": [...],
  "variables": [...]
}
```

### 라벨 렌더링

#### 데이터 바인딩 후 SVG 생성
```
POST /api/render-labels
Content-Type: application/json

{
  "widthMm": 80,
  "heightMm": 40,
  "elements": [...],
  "dataset": [
    { "prod_name": "무선 헤드폰", "price": "189,000", "sku": "HP-001" },
    { "prod_name": "키보드", "price": "45,000", "sku": "KB-002" }
  ]
}
```
```json
{
  "success": true,
  "count": 2,
  "renders": [
    {
      "recordIndex": 0,
      "recordData": { "prod_name": "무선 헤드폰", ... },
      "svg": "<svg>...</svg>"
    }
  ]
}
```

**cURL 예시:**
```bash
curl -X POST http://localhost:3000/api/render-labels \
  -H "Content-Type: application/json" \
  -d '{
    "widthMm": 80,
    "heightMm": 40,
    "dataset": [{ "prod_name": "헤드폰", "price": "100,000" }],
    "elements": [...]
  }'
```

## 라벨 데이터 모델

### 요소(Element) 공통 속성

```typescript
{
  id: string          // 고유 ID
  type: ElementType   // 'text' | 'rect' | 'circle' | 'line' | 'barcode' | 'qrcode' | 'image'
  x: number           // 좌상단 X (mm)
  y: number           // 좌상단 Y (mm)
  width: number       // 가로 폭 (mm)
  height: number      // 세로 높이 (mm)
  opacity: number     // 투명도 0~1
  rotation: number    // 회전각 0~360
}
```

### 타입별 추가 속성

| 타입 | 추가 속성 |
|---|---|
| `text` | `text`, `fontSize`, `fontColor`, `fontWeight`, `textAlign` |
| `rect` | `strokeColor`, `fillColor`, `borderRadius` |
| `circle` | `strokeColor`, `fillColor` |
| `line` | `strokeColor`, `lineThickness` |
| `barcode` | `barcodeType` (CODE128 등), `value`, `showText` |
| `qrcode` | `value` |
| `image` | `url` (base64 dataURL) |

### 변수 치환 문법

텍스트·바코드·QR 값에 아래 문법으로 동적 데이터를 바인딩합니다.

```
${변수코드}     →  기본 치환
$!{변수코드}    →  null-safe 치환 (값 없으면 빈 문자열)
```

**예시:**
```
품명: ${prod_name}   →  품명: 프리미엄 무선 헤드폰
판매가: ₩${price}    →  판매가: ₩189,000
```

### 지원 바코드 형식

| 코드 | 용도 |
|---|---|
| `CODE128` | 대소문자·숫자 범용 (기본값) |
| `CODE39` | 알파벳·숫자 |
| `EAN13` | 상품 소매 (13자리 숫자) |
| `EAN8` | 소형 상품 (8자리 숫자) |
| `UPC` | 미국 소매 (12자리 숫자) |
| `ITF14` | 물류 포장 (14자리 숫자) |
| `CODE93` | 고밀도 선형 |
| `CODABAR` | NW-7, 의료·물류 |

## 주요 기능

- **드래그앤드롭 캔버스**: mm 단위 좌표, 그리드 스냅, 레이어 Z순서 조정
- **Undo/Redo**: 최대 50단계 (`Ctrl+Z` / `Ctrl+Y`)
- **키보드 단축키**: 방향키 이동, `Delete` 삭제, `Ctrl+C/V` 복사·붙여넣기
- **다중 레코드 배치 출력**: dataset 배열로 N장 일괄 렌더링
- **CSV 가져오기**: 헤더 행이 자동으로 변수 사전에 등록
- **JSON 내보내기/가져오기**: 디자인 템플릿 파일로 백업·복원
- **프린트 미리보기**: 롤 프린터 / A4 용지 레이아웃 선택

