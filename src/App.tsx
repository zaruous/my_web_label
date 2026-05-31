import React, { useState, useEffect, useRef } from 'react';
import {
  LabelElement,
  LabelVariable,
  LabelTemplate,
  ElementType,
  TextElement,
  RectElement,
  CircleElement,
  LineElement,
  BarcodeElement,
  QRCodeElement,
  ImageElement
} from './types';
import {
  substituteVariables,
  RenderElement
} from './utils/labelRenderer';
import {
  Layers,
  Database,
  FileText,
  Plus,
  Trash2,
  Settings,
  ArrowRight,
  Printer,
  Download,
  Code,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Copy,
  Tag,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  Eye,
  Info,
  Image
} from 'lucide-react';

const INITIAL_VARIABLES: LabelVariable[] = [
  { id: "prod_name", name: "상품명", type: "text", defaultValue: "프리미엄 무선 헤드폰" },
  { id: "price", name: "단가", type: "price", defaultValue: "189,000" },
  { id: "sku", name: "상품 코드", type: "text", defaultValue: "HP-2026-X7" },
  { id: "origin", name: "원산지", type: "text", defaultValue: "대한민국" }
];

const INITIAL_ELEMENTS: LabelElement[] = [
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

const PRESET_SIZES = [
  { name: '상품 리테일 택 (80 x 40 mm)', widthMm: 80, heightMm: 40 },
  { name: '물류 우편 배송라벨 (100 x 60 mm)', widthMm: 100, heightMm: 60 },
  { name: '소형 마트 바코드 라벨 (50 x 30 mm)', widthMm: 50, heightMm: 30 },
  { name: '수납 정리 인덱스 라벨 (70 x 20 mm)', widthMm: 70, heightMm: 20 },
];

export default function App() {
  // Label and Element State
  const [widthMm, setWidthMm] = useState<number>(80);
  const [heightMm, setHeightMm] = useState<number>(40);
  const [elements, setElements] = useState<LabelElement[]>(INITIAL_ELEMENTS);
  const [variables, setVariables] = useState<LabelVariable[]>(INITIAL_VARIABLES);
  const [history, setHistory] = useState<LabelElement[][]>([INITIAL_ELEMENTS]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // draggedIndex and imageInputRef for new enhancements
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Wrappers to update elements and history
  const updateElements = (newElementsOrUpdater: LabelElement[] | ((prev: LabelElement[]) => LabelElement[])) => {
    setElements(prevElements => {
      const updated = typeof newElementsOrUpdater === 'function' 
        ? newElementsOrUpdater(prevElements) 
        : newElementsOrUpdater;
      
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push(updated);
        // Keep max 50 states
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex(prevIndex => Math.min(prevIndex + 1, 49)); // 50 cap -> max index 49

      return updated;
    });
  };

  const executeUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  };

  const executeRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
    }
  };

  const [selectedElementId, setSelectedElementId] = useState<string | null>("title");

  // Custom Dimensions input
  const [customW, setCustomW] = useState<string>("80");
  const [customH, setCustomH] = useState<string>("40");

  // Interactive UI configurations
  const [zoom, setZoom] = useState<number>(100); // percentage
  const [activeTab, setActiveTab] = useState<'design' | 'variables' | 'dataset' | 'api'>('design');
  const [activeSidePanel, setActiveSidePanel] = useState<'properties' | 'toolbox'>('properties');
  const [lastSaved, setLastSaved] = useState<string>('');

  // Active Binding Preview Dataset
  const [dataset, setDataset] = useState<Record<string, string>[]>([
    { prod_name: "프리미엄 무선 헤드폰", price: "189,000", sku: "HP-2026-X7", origin: "대한민국", receiver: "정우성", contact: "010-1234-5678", address: "서울특별시 강남구 테헤란로 501", tracking_no: "4019-9832-1102" },
    { prod_name: "소형 저소음 키보드", price: "45,000", sku: "KB-MINI-02", origin: "중국", receiver: "김태희", contact: "010-9876-5432", address: "부산광역시 해운대구 우동 102", tracking_no: "4019-1102-5593" },
    { prod_name: "인체공학 버티컬 마우스", price: "69,900", sku: "MS-VERT-Y9", origin: "베트남", receiver: "송중기", contact: "010-4455-8899", address: "인천광역시 연수구 송도동 44", tracking_no: "4019-7721-0012" }
  ]);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number>(0);

  // New variable form
  const [newVarId, setNewVarId] = useState('');
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<'text' | 'number' | 'price' | 'date'>('text');
  const [newVarDefault, setNewVarDefault] = useState('');

  // Loaded server templates state
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);

  // Dragging and Resizing Ref states
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartRect = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Canvas View Settings
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);

  // Print Dialog Mode state
  const [printPreviewMode, setPrintPreviewMode] = useState<boolean>(false);
  const [printFormat, setPrintFormat] = useState<'roll' | 'a4'>('roll');
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  
  const PAGE_PRESETS = [
    { id: '80x40', name: '기본 감열라벨 (80x40mm)', w: 80, h: 40 },
    { id: '40x40', name: '정사각형 라벨 (40x40mm)', w: 40, h: 40 },
    { id: '100x150', name: '택배 송장 (100x150mm)', w: 100, h: 150 },
    { id: '60x40', name: '중형 바코드용 (60x40mm)', w: 60, h: 40 },
    { id: '50x30', name: '소형 화장품/약물 (50x30mm)', w: 50, h: 30 },
    { id: 'custom', name: '직접 입력', w: 80, h: 40 }
  ];
  const [presetSize, setPresetSize] = useState<string>('80x40');
  const [newWidthTemp, setNewWidthTemp] = useState<number>(80);
  const [newHeightTemp, setNewHeightTemp] = useState<number>(40);

  // API response preview state
  const [apiLogs, setApiLogs] = useState<string>('');
  const [apiRenderedSVGs, setApiRenderedSVGs] = useState<{ recordIndex: number; svg: string }[]>([]);
  const [isCallingAPI, setIsCallingAPI] = useState<boolean>(false);
  const [printRange, setPrintRange] = useState<'current' | 'all'>('current');

  // Calculate pixel scale: 1mm = some pixels. We can base it on 6 pixels per mm at 100% zoom
  const scale = 5.5 * (zoom / 100);

  // Handle New Template
  const handleNewTemplate = () => {
    setPresetSize('80x40');
    setNewWidthTemp(80);
    setNewHeightTemp(40);
    setShowNewModal(true);
  };

  const confirmNewTemplate = () => {
    updateElements([]);
    setSelectedElementId(null);
    setWidthMm(newWidthTemp);
    setHeightMm(newHeightTemp);
    setShowNewModal(false);
  };

  // Fetch templates from API on load
  useEffect(() => {
    fetchServerTemplates();
  }, []);

  const fetchServerTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) {
      console.error("Error fetching preset templates", e);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Convert active variables to current active test values
  const currentRecordData = dataset[selectedRecordIndex] || {};

  // Update specific field inside active preview record
  const handleUpdateRecordField = (key: string, value: string) => {
    const updated = [...dataset];
    if (updated[selectedRecordIndex]) {
      updated[selectedRecordIndex] = {
        ...updated[selectedRecordIndex],
        [key]: value
      };
      setDataset(updated);
    }
  };

  // Set standard sizes
  const handleSetSizePreset = (w: number, h: number) => {
    setWidthMm(w);
    setHeightMm(h);
    setCustomW(String(w));
    setCustomH(String(h));
  };

  // Apply custom resolution
  const handleApplyCustomSize = () => {
    const w = parseFloat(customW);
    const h = parseFloat(customH);
    if (!isNaN(w) && !isNaN(h) && w >= 15 && h >= 15) {
      setWidthMm(w);
      setHeightMm(h);
    }
  };

  // Add Label Design Elements
  const handleAddElement = (type: ElementType) => {
    const randomId = `${type}-${Date.now().toString().slice(-4)}`;
    let newEl: LabelElement;

    // Center standard size
    const defaultX = Math.round((widthMm - 20) / 2);
    const defaultY = Math.round((heightMm - 10) / 2);

    switch (type) {
      case 'rect':
        newEl = {
          id: randomId,
          type: 'rect',
          x: defaultX >= 0 ? defaultX : 2,
          y: defaultY >= 0 ? defaultY : 2,
          width: 30,
          height: 15,
          strokeWidth: 1,
          strokeColor: '#000000',
          fillColor: 'transparent',
          opacity: 1,
          rotation: 0,
          name: '사각형 도형',
          borderRadius: 0
        } as RectElement;
        break;

      case 'circle':
        newEl = {
          id: randomId,
          type: 'circle',
          x: defaultX >= 0 ? defaultX : 2,
          y: defaultY >= 0 ? defaultY : 2,
          width: 15,
          height: 15,
          strokeWidth: 1,
          strokeColor: '#000000',
          fillColor: 'transparent',
          opacity: 1,
          rotation: 0,
          name: '타원형 도형'
        } as CircleElement;
        break;

      case 'line':
        newEl = {
          id: randomId,
          type: 'line',
          x: defaultX >= 0 ? defaultX : 2,
          y: defaultY >= 0 ? defaultY : 2,
          width: 40,
          height: 1,
          strokeWidth: 1,
          strokeColor: '#000000',
          fillColor: '',
          opacity: 1,
          rotation: 0,
          name: '실선 구분선',
          lineThickness: 1
        } as LineElement;
        break;

      case 'barcode':
        newEl = {
          id: randomId,
          type: 'barcode',
          x: defaultX >= 0 ? defaultX : 2,
          y: defaultY >= 0 ? defaultY : 2,
          width: 50,
          height: 14,
          strokeWidth: 0,
          strokeColor: '',
          fillColor: '',
          opacity: 1,
          rotation: 0,
          name: '동적 바코드',
          barcodeType: 'CODE128',
          value: '${sku}',
          showText: true
        } as BarcodeElement;
        break;

      case 'qrcode':
        newEl = {
          id: randomId,
          type: 'qrcode',
          x: defaultX >= 0 ? defaultX : 2,
          y: defaultY >= 0 ? defaultY : 2,
          width: 15,
          height: 15,
          strokeWidth: 0,
          strokeColor: '',
          fillColor: '',
          opacity: 1,
          rotation: 0,
          name: '신속 QR코드',
          value: 'https://ai.studio/build/${sku}'
        } as QRCodeElement;
        break;

      case 'image':
        handleImageAddClick();
        return; // handleImageUpload will asynchronously add the element

      case 'text':
      default:
        newEl = {
          id: randomId,
          type: 'text',
          x: defaultX >= 0 ? defaultX : 2,
          y: defaultY >= 0 ? defaultY : 2,
          width: 40,
          height: 8,
          strokeWidth: 0,
          strokeColor: '',
          fillColor: '',
          opacity: 1,
          rotation: 0,
          name: '신규 텍스트',
          text: '새로운 텍스트 ${prod_name}',
          fontSize: 10,
          fontFamily: 'Plus Jakarta Sans',
          fontColor: '#000000',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left'
        } as TextElement;
        break;
    }

    updateElements([...elements, newEl]);
    setSelectedElementId(randomId);
    setActiveSidePanel('properties');
  };

  // Duplicate an entity
  const handleDuplicateElement = (el: LabelElement) => {
    const doubleId = `${el.type}-${Date.now().toString().slice(-4)}`;
    const cloned = {
      ...el,
      id: doubleId,
      name: `${el.name} (복사본)`,
      x: Math.min(widthMm - 10, el.x + 4),
      y: Math.min(heightMm - 5, el.y + 4)
    };
    updateElements([...elements, cloned]);
    setSelectedElementId(doubleId);
  };

  // Delete specific element
  const handleDeleteElement = (id: string) => {
    updateElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  // Update properties
  const handleUpdateElementProps = (id: string, updatedProps: Partial<LabelElement>) => {
    updateElements(elements.map(el => {
      if (el.id === id) {
        return {
          ...el,
          ...updatedProps
        } as LabelElement;
      }
      return el;
    }));
  };

  // Layering
  const handleBringToFront = () => {
    if (!selectedElementId) return;
    updateElements(prev => {
      const idx = prev.findIndex(e => e.id === selectedElementId);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.push(item);
      return copy;
    });
  };

  const handleSendToBack = () => {
    if (!selectedElementId) return;
    updateElements(prev => {
      const idx = prev.findIndex(e => e.id === selectedElementId);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      return copy;
    });
  };

  // Alignment
  const handleCenterHorizontally = () => {
    if (!selectedElementId) return;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el) return;
    handleUpdateElementProps(selectedElementId, { x: Math.max(0, (widthMm - el.width) / 2) });
  };

  const handleCenterVertically = () => {
    if (!selectedElementId) return;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el) return;
    handleUpdateElementProps(selectedElementId, { y: Math.max(0, (heightMm - el.height) / 2) });
  };

  // Dragging event handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // If we click the empty canvas space, deselect
    if (e.target === canvasRef.current || (e.target as HTMLElement).id === 'grid-backplane') {
      setSelectedElementId(null);
    }
  };

  const handleElementMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    
    const targetElement = elements.find(el => el.id === elementId);
    if (!targetElement) return;

    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartRect.current = {
      x: targetElement.x,
      y: targetElement.y,
      w: targetElement.width,
      h: targetElement.height
    };
  };

  // Resizing trigger event handler
  const handleResizeHandleMouseDown = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedElementId(elementId);
    
    const targetElement = elements.find(el => el.id === elementId);
    if (!targetElement) return;

    setIsResizing(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartRect.current = {
      x: targetElement.x,
      y: targetElement.y,
      w: targetElement.width,
      h: targetElement.height
    };
  };

  // Process mouse move globally to prevent slipping
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!selectedElementId) return;

      const targetElement = elements.find(el => el.id === selectedElementId);
      if (!targetElement) return;

      const deltaXpx = e.clientX - dragStartPos.current.x;
      const deltaYpx = e.clientY - dragStartPos.current.y;
      
      // Convert pixels back to mm scale
      const deltaXmm = deltaXpx / scale;
      const deltaYmm = deltaYpx / scale;

      const snapSize = snapToGrid ? 5 : 0.1; // 5mm grid when snap enabled
      
      if (isDragging) {
        // Simple smoothness
        let rawX = elementStartRect.current.x + deltaXmm;
        let rawY = elementStartRect.current.y + deltaYmm;
        
        if (snapToGrid) {
          rawX = Math.round(rawX / snapSize) * snapSize;
          rawY = Math.round(rawY / snapSize) * snapSize;
        }

        // Boundaries restriction
        const newX = Math.max(0, Math.min(widthMm - targetElement.width, Math.round(rawX * 10) / 10));
        const newY = Math.max(0, Math.min(heightMm - targetElement.height, Math.round(rawY * 10) / 10));

        handleUpdateElementProps(selectedElementId, { x: newX, y: newY });
      } 
      else if (isResizing) {
        let rawW = elementStartRect.current.w + deltaXmm;
        let rawH = elementStartRect.current.h + deltaYmm;

        if (snapToGrid) {
          rawW = Math.round(rawW / snapSize) * snapSize;
          rawH = Math.round(rawH / snapSize) * snapSize;
        }

        // Bounded sizing
        const minDimension = 2; // min 2mm
        const newW = Math.max(minDimension, Math.min(widthMm - targetElement.x, Math.round(rawW * 10) / 10));
        const newH = Math.max(minDimension, Math.min(heightMm - targetElement.y, Math.round(rawH * 10) / 10));

        handleUpdateElementProps(selectedElementId, { width: newW, height: newH });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, selectedElementId, elements, scale, widthMm, heightMm]);

  // Clipboard state for copy/paste
  const [clipboardElement, setClipboardElement] = useState<LabelElement | null>(null);

  // Process keyboard events for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Handle Undo (Ctrl+Z) and Redo (Ctrl+Y or Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          executeRedo();
        } else {
          executeUndo();
        }
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        executeRedo();
        e.preventDefault();
        return;
      }

      // Handle Paste (Ctrl+V or Cmd+V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboardElement) {
          const newEl = {
            ...clipboardElement,
            id: `el_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            x: Math.min(widthMm - clipboardElement.width, clipboardElement.x + 5), // offset slightly
            y: Math.min(heightMm - clipboardElement.height, clipboardElement.y + 5),
          };
          updateElements(prev => [...prev, newEl]);
          setSelectedElementId(newEl.id);
          e.preventDefault();
        }
        return;
      }

      if (!selectedElementId) return;

      const targetElement = elements.find(el => el.id === selectedElementId);
      if (!targetElement) return;

      // Handle Copy (Ctrl+C or Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        setClipboardElement(targetElement);
        e.preventDefault();
        return;
      }

      const moveStep = snapToGrid ? 5 : 1; // 5mm or 1mm nudging

      switch (e.key) {
        case 'Escape':
          setSelectedElementId(null);
          e.preventDefault();
          break;
        case 'Delete':
        case 'Backspace':
          handleDeleteElement(selectedElementId);
          e.preventDefault();
          break;
        case 'ArrowUp':
          handleUpdateElementProps(selectedElementId, { y: Math.max(0, targetElement.y - moveStep) });
          e.preventDefault();
          break;
        case 'ArrowDown':
          handleUpdateElementProps(selectedElementId, { y: Math.min(heightMm - targetElement.height, targetElement.y + moveStep) });
          e.preventDefault();
          break;
        case 'ArrowLeft':
          handleUpdateElementProps(selectedElementId, { x: Math.max(0, targetElement.x - moveStep) });
          e.preventDefault();
          break;
        case 'ArrowRight':
          handleUpdateElementProps(selectedElementId, { x: Math.min(widthMm - targetElement.width, targetElement.x + moveStep) });
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, elements, snapToGrid, widthMm, heightMm, clipboardElement, history, historyIndex]);

  // Variables controls
  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarId.trim()) return;

    const cleanId = newVarId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanId) return;

    if (variables.some(v => v.id === cleanId)) {
      alert('이미 존재하는 변수 식별자(ID) 입니다.');
      return;
    }

    const brandNew: LabelVariable = {
      id: cleanId,
      name: newVarName.trim() || cleanId,
      type: newVarType,
      defaultValue: newVarDefault.trim() || '테스트'
    };

    setVariables([...variables, brandNew]);
    
    // Auto insert defaultValue to all dataset records
    const newDataset = dataset.map(item => ({
      ...item,
      [cleanId]: newVarDefault.trim() || '테스트'
    }));
    setDataset(newDataset);

    setNewVarId('');
    setNewVarName('');
    setNewVarDefault('');
  };

  const handleDeleteVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  // Add a new empty row to the dataset table
  const handleAddDatasetRow = () => {
    const sample: Record<string, string> = {};
    variables.forEach(v => {
      sample[v.id] = v.defaultValue || '새 항목';
    });
    setDataset([...dataset, sample]);
    setSelectedRecordIndex(dataset.length);
  };

  // Remove active record row from dataset table
  const handleDeleteDatasetRow = (index: number) => {
    if (dataset.length <= 1) return;
    const nextIdx = Math.max(0, index - 1);
    setDataset(dataset.filter((_, i) => i !== index));
    setSelectedRecordIndex(nextIdx);
  };

  // JSON Export Handler
  const handleExportDesign = () => {
    const designData = {
      version: "2.5",
      widthMm,
      heightMm,
      elements,
      variables,
      dataset
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(designData, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10).replace(/-/g, "");
    const formattedTime = now.toTimeString().slice(0, 8).replace(/:/g, "");
    downloadAnchor.setAttribute("download", `label_design_${formattedDate}_${formattedTime}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Image Upload Handlers
  const handleImageAddClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const randomId = `image-${Date.now().toString().slice(-4)}`;
      const defaultX = Math.round((widthMm - 20) / 2);
      const defaultY = Math.round((heightMm - 20) / 2);

      const newEl = {
        id: randomId,
        type: 'image',
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
      } as ImageElement;

      updateElements([...elements, newEl]);
      setSelectedElementId(randomId);
      setActiveSidePanel('properties');
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  // zOrder Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...elements];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);
    
    updateElements(updated);
    setDraggedIndex(null);
  };

  // Save the entire design Template locally on the server via API
  const handleSaveTemplate = async () => {
    const templateName = prompt("라벨 템플릿의 이름을 지어주세요:", "디자인 라벨 택");
    if (!templateName) return;

    const payload = {
      name: templateName,
      widthMm,
      heightMm,
      elements,
      variables
    };

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const ret = await res.json();
        setLastSaved(new Date().toLocaleTimeString());
        alert(`소중한 라벨 템플릿 '${templateName}'이(가) 정상 저장되었습니다!`);
        fetchServerTemplates();
      }
    } catch (err) {
      console.error(err);
      alert('서버 저장 실패: 테두리 및 원소를 확인해주세요.');
    }
  };

  // Load selected preset template
  const handleLoadTemplatePreset = (tmpl: LabelTemplate) => {
    setWidthMm(tmpl.widthMm);
    setHeightMm(tmpl.heightMm);
    setCustomW(String(tmpl.widthMm));
    setCustomH(String(tmpl.heightMm));
    updateElements(tmpl.elements);
    setVariables(tmpl.variables);
    setSelectedElementId(tmpl.elements[0]?.id || null);

    // Synchronize keys with existing mapping table records
    const updatedDataset = dataset.map(item => {
      const synced = { ...item };
      tmpl.variables.forEach(v => {
        if (synced[v.id] === undefined) {
          synced[v.id] = v.defaultValue;
        }
      });
      return synced;
    });
    setDataset(updatedDataset);
  };

  // Call the external dynamic layout rendering output API
  const handleTriggerAPIResponse = async () => {
    setIsCallingAPI(true);
    const payload = {
      widthMm,
      heightMm,
      elements,
      dataset
    };

    try {
      const res = await fetch('/api/render-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const payloadString = JSON.stringify(payload, null, 2);
      if (res.ok) {
        const result = await res.json();
        setApiRenderedSVGs(result.renders || []);
        
        const resString = JSON.stringify(result, null, 2);
        setApiLogs(`// REQUEST PAYLOAD (POST /api/render-labels)\n${payloadString}\n\n// RESPONSE HEADERS (200 OK)\nContent-Type: application/json\n\n// RESPONSE BODY\n${resString}`);
      } else {
        const failJson = await res.json();
        setApiLogs(`// ERROR\n${JSON.stringify(failJson, null, 2)}`);
      }
    } catch (e) {
      setApiLogs(`// CONNECTION FAILED: Check local development server status\n${String(e)}`);
    } finally {
      setIsCallingAPI(false);
    }
  };

  // Trigger download of specific label SVG file directly
  const handleDownloadSVG = (svgContent: string, index: number) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `templated_label_${index + 1}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Active selected Element Object helper
  const selectedElement = elements.find(el => el.id === selectedElementId);

  // Auto scroll down in developer logs on response
  useEffect(() => {
    if (apiRenderedSVGs.length > 0 && activeTab === 'api') {
      // API tab has visual updates
    }
  }, [apiRenderedSVGs, activeTab]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#F4F4F5] text-slate-800 font-sans overflow-hidden" id="label-architect-root">
      {/* HEADER BAR (Clean Minimalism Style) */}
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
              <button
                className="px-3 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
              >
                편집
              </button>
              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 pointer-events-none opacity-0 translate-y-1 group-hover/menu:pointer-events-auto group-hover/menu:opacity-100 group-hover/menu:translate-y-0 transition-all z-50 flex flex-col gap-0.5">
                <button
                  onClick={executeUndo}
                  disabled={historyIndex <= 0}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">실행 취소 (Undo)</span>
                  <span className="text-[10px] text-slate-400 border border-slate-200 px-1 rounded">Ctrl+Z</span>
                </button>
                <button
                  onClick={executeRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">다시 실행 (Redo)</span>
                  <span className="text-[10px] text-slate-400 border border-slate-200 px-1 rounded">Ctrl+Y</span>
                </button>
                
                <div className="h-px bg-slate-100 my-1 mx-1"></div>

                <button
                  onClick={handleBringToFront}
                  disabled={!selectedElementId}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">맨 앞으로 가져오기</span>
                </button>
                <button
                  onClick={handleSendToBack}
                  disabled={!selectedElementId}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">맨 뒤로 보내기</span>
                </button>

                <div className="h-px bg-slate-100 my-1 mx-1"></div>

                <button
                  onClick={handleCenterHorizontally}
                  disabled={!selectedElementId}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">수평 가운데 정렬</span>
                </button>
                <button
                  onClick={handleCenterVertically}
                  disabled={!selectedElementId}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">수직 가운데 정렬</span>
                </button>
              </div>
            </div>

            {/* VIEW MENU */}
            <div className="relative group/menu">
              <button
                className="px-3 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
              >
                보기
              </button>
              <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 pointer-events-none opacity-0 translate-y-1 group-hover/menu:pointer-events-auto group-hover/menu:opacity-100 group-hover/menu:translate-y-0 transition-all z-50">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between text-slate-700 cursor-pointer transition-colors"
                >
                  <span>격자 표시</span>
                  {showGrid && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 hover:text-blue-600 flex items-center justify-between text-slate-700 cursor-pointer transition-colors mt-0.5"
                >
                  <span>스티키 (격자 스냅)</span>
                  {snapToGrid && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="h-4 w-px bg-slate-200"></div>
          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>크기: <strong className="text-zinc-900 font-semibold">{widthMm}x{heightMm}mm</strong></span>
            <span>요소 수: <strong className="text-zinc-900 font-semibold">{elements.length}개</strong></span>
            {lastSaved && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">최근 저장: {lastSaved}</span>}
          </div>
        </div>

        {/* Global Control Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('design'); setPrintPreviewMode(false); }}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'design' && !printPreviewMode
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-slate-500 hover:text-zinc-800'
              }`}
            >
              <Layers className="w-3 h-3" /> 드로잉 모드
            </button>
            <button
              onClick={() => { setActiveTab('dataset'); setPrintPreviewMode(false); }}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'dataset' && !printPreviewMode
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-slate-500 hover:text-zinc-800'
              }`}
            >
              <Database className="w-3 h-3" /> 데이터 바인딩
            </button>
            <button
              onClick={() => { setActiveTab('api'); setPrintPreviewMode(false); }}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'api' && !printPreviewMode
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
            onClick={handleSaveTemplate}
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
            onClick={() => setPrintPreviewMode(!printPreviewMode)}
            className={`px-3.5 py-1.5 border text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              printPreviewMode
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            {printPreviewMode ? '미리보기 닫기' : '프린트 출력'}
          </button>
        </div>
      </header>

      {/* FULL PRINT PREVIEW OVERLAY */}
      {printPreviewMode ? (
        <div className="flex-1 bg-zinc-800 p-8 overflow-y-auto flex flex-col items-center relative">
          <style>
            {printFormat === 'roll' ? `
              @media print {
                @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
                body { margin: 0; background: #fff !important; }
                .print-label-item { margin: 0 !important; border: none !important; padding: 0 !important; width: ${widthMm}mm !important; height: ${heightMm}mm !important; max-width: none !important; page-break-after: always; box-shadow: none !important; }
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
                body * {
                  visibility: hidden;
                }
                .print-container, .print-container * {
                  visibility: visible;
                }
                .print-container {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  background: white !important;
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
                        checked={printFormat === 'roll'} 
                        onChange={() => setPrintFormat('roll')}
                        className="accent-zinc-900" 
                      />
                      <span>롤 프린터 (1장씩 연속 출력)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="printFormat" 
                        value="a4" 
                        checked={printFormat === 'a4'} 
                        onChange={() => setPrintFormat('a4')}
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
                        checked={printRange === 'current'} 
                        onChange={() => setPrintRange('current')}
                        className="accent-zinc-900" 
                      />
                      <span className="font-bold text-blue-600">현재 미리보기 라벨만 인쇄 (1장)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                      <input 
                        type="radio" 
                        name="printRange" 
                        value="all" 
                        checked={printRange === 'all'} 
                        onChange={() => setPrintRange('all')}
                        className="accent-zinc-900" 
                      />
                      <span>전체 데이터셋 연속 인쇄 ({dataset.length}장 일괄)</span>
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
                  onClick={() => setPrintPreviewMode(false)}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  돌아가기
                </button>
              </div>
            </div>

            {/* Print Grid Render Area */}
            <div className="print-container grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center p-2 bg-zinc-50 rounded-xl border border-zinc-100 print:bg-white print:border-none">
              {(printRange === 'current' ? [dataset[selectedRecordIndex]].filter(Boolean) : dataset).map((row, idx) => {
                const recordLabelNum = printRange === 'current' ? selectedRecordIndex + 1 : idx + 1;
                return (
                  <div
                    key={idx}
                    className="print-label-item relative bg-white border border-zinc-200 p-3 rounded-lg overflow-hidden flex flex-col items-center justify-center shadow-sm select-none"
                    style={{
                      width: '100%',
                      maxWidth: `${widthMm * 4.5}px`,
                      margin: '0 auto',
                    }}
                  >
                    <div className="text-[9px] font-mono font-medium text-zinc-400 border-b border-dashed border-zinc-100 pb-1 w-full text-left mb-2 flex justify-between print:hidden">
                      <span>레코드 #{recordLabelNum}</span>
                      <span>{widthMm}x{heightMm}mm</span>
                    </div>

                    {/* High-Resolution 1:1 mm Vector SVG Label */}
                    <div 
                      className="bg-white relative overflow-hidden print-canvas border border-slate-200 shadow-sm print:border-none print:shadow-none flex items-center justify-center"
                      style={{
                        width: `${widthMm * 4.5}px`,
                        height: `${heightMm * 4.5}px`,
                      }}
                    >
                      <style>
                        {`
                          .print-canvas svg {
                            width: 100% !important;
                            height: 100% !important;
                          }
                          @media print {
                            .print-canvas {
                              width: ${widthMm}mm !important;
                              height: ${heightMm}mm !important;
                            }
                          }
                        `}
                      </style>
                      <PureSVGLabel
                        elements={elements}
                        widthMm={widthMm}
                        heightMm={heightMm}
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
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANELS CHANGER AND ACTION SIDEBAR TOOLBOX */}
          <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-5 shrink-0">
            <button
              onClick={() => setActiveSidePanel('toolbox')}
              className={`p-2.5 rounded-xl transition-all cursor-pointer relative group ${
                activeSidePanel === 'toolbox'
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
                if (elements.length > 0 && !selectedElementId) {
                  setSelectedElementId(elements[0].id);
                }
                setActiveSidePanel('properties');
              }}
              className={`p-2.5 rounded-xl transition-all cursor-pointer relative group ${
                activeSidePanel === 'properties'
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
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  className="p-1 hover:bg-zinc-200 rounded text-zinc-700 transition"
                  title="확대"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] font-mono font-bold text-zinc-900 my-1">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.max(40, zoom - 10))}
                  className="p-1 hover:bg-zinc-200 rounded text-zinc-700 transition"
                  title="축소"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>

          {/* SECOND CONTAINER PANE: PRESET TEMPLATE, TOOLBOX OR ACTIVE SELECTION CONTROL */}
          <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
            {activeSidePanel === 'toolbox' ? (
              <div className="p-5 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">라벨 규격 Preset</h3>
                  <div className="space-y-2">
                    {PRESET_SIZES.map(p => {
                      const isActive = widthMm === p.widthMm && heightMm === p.heightMm;
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
                          value={customW}
                          onChange={e => setCustomW(e.target.value)}
                          className="w-full text-xs p-1 px-2 border border-slate-200 rounded bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-400 block mb-0.5">높이(H)</label>
                        <input
                          type="number"
                          value={customH}
                          onChange={e => setCustomH(e.target.value)}
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
                  {isLoadingTemplates ? (
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
                            onClick={() => handleLoadTemplatePreset(tmpl)}
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
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">디자인 원소 리스트</h3>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono italic">
                      Count: {elements.length}
                    </span>
                  </div>

                  {elements.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      그려진 요소가 없습니다.<br />왼쪽 도구상자에서 추가해 보세요!
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {elements.map((el, index) => {
                        const isSelected = selectedElementId === el.id;
                        return (
                          <div
                            key={el.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onClick={() => setSelectedElementId(el.id)}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-zinc-900 border-zinc-950 text-white shadow-sm font-semibold'
                                : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
                            } ${draggedIndex === index ? 'opacity-40' : ''} active:cursor-grabbing cursor-grab`}
                          >
                            <span className="truncate">{el.name} <span className="text-[9px] opacity-65 font-mono">({el.type})</span></span>
                            <div className="flex items-center gap-1 shrink-0" onMouseDown={e => e.stopPropagation()}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDuplicateElement(el); }}
                                className="p-0.5 hover:bg-slate-100 hover:text-black rounded text-[9px] text-slate-400"
                                title="복제"
                              >
                                복제
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteElement(el.id); }}
                                className="p-0.5 hover:bg-slate-100 hover:text-rose-600 rounded text-[9px] text-slate-400"
                                title="삭제"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

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
                                    handleUpdateElementProps(selectedElement.id, { lineThickness: val, strokeWidth: val });
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
                                  onChange={(e) => handleUpdateElementProps(selectedElement.id, { borderRadius: parseFloat(e.target.value) || 0 })}
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
                              onChange={(e) => handleUpdateElementProps(selectedElement.id, { value: e.target.value })}
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
                                onChange={(e) => handleUpdateElementProps(selectedElement.id, { barcodeType: e.target.value as any })}
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
                                  onChange={(e) => handleUpdateElementProps(selectedElement.id, { showText: e.target.checked })}
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
                              onChange={(e) => handleUpdateElementProps(selectedElement.id, { value: e.target.value })}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                            />
                            {(() => {
                              const resolvedVal = substituteVariables((selectedElement as QRCodeElement).value, currentRecordData);
                              let warn = '';
                              let isError = false;
                              if (!resolvedVal) { warn = '데이터가 비어있습니다.'; isError = true; }
                              else if (resolvedVal.length > 150) { warn = `데이터가 깁니다 (${resolvedVal.length}자). 밀도가 높아 인식률이 떨어질 수 있습니다.`; }

                              return warn ? <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${isError ? 'text-red-500 animate-pulse' : 'text-amber-600'}`}>⚠️ {warn}</p> : <p className="text-[9px] text-zinc-400 mt-1.5">예: `https://test.com/check?id=&#123;&#123;sku&#125;&#125;`</p>;
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
                              onClick={handleImageAddClick}
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

          {/* MAIN PANELS WRAPPER */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* DESIGN WORKSPACE VIEW */}
            {activeTab === 'design' && (
              <div className="flex-1 bg-[#F1F1F1] relative overflow-hidden flex items-center justify-center p-8 select-none" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} id="design-backplane">
                
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
                    {dataset.map((row, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedRecordIndex(idx)}
                        className={`px-2.5 py-1 text-[11px] rounded font-bold transition-all ${
                          selectedRecordIndex === idx
                            ? 'bg-zinc-950 text-white shadow-sm'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                        }`}
                      >
                        {row.prod_name ? `${row.prod_name.slice(0,6)}..` : `지정 #${idx+1}`}
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
                    width: `${widthMm * scale}px`,
                    height: `${heightMm * scale}px`,
                  }}
                >
                  {/* Grid overlay */}
                  {showGrid && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-[0.15]"
                      style={{
                        backgroundImage: `linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
                        backgroundSize: `${5 * scale}px ${5 * scale}px`
                      }}
                    />
                  )}

                  {/* Outer Millimeters Dimensions HUD labels */}
                  <span className="absolute -top-5 right-0 text-[10px] font-mono text-zinc-500 font-bold bg-white px-1.5 py-0.2 rounded shadow-sm border border-zinc-200">W: {widthMm} mm</span>
                  <span className="absolute -right-16 top-0 text-[10px] font-mono text-zinc-500 font-bold [writing-mode:vertical-lr] bg-white px-1.5 py-0.2 rounded shadow-sm border border-zinc-200">H: {heightMm} mm</span>

                  {/* Draw Elements */}
                  {elements.map(el => {
                    const isSelected = el.id === selectedElementId;
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
                          selectedId={selectedElementId || undefined}
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
                    onClick={() => {
                      setZoom(100);
                    }}
                    className="px-2 py-1 text-[10px] font-bold text-zinc-900 border border-slate-250 rounded bg-slate-50 hover:bg-slate-100 uppercase"
                  >
                    100% 리셋
                  </button>
                </div>
              </div>
            )}

            {/* REGISTERED VARIABLES AND TESTDATA CONFIGURATION VIEW */}
            {activeTab === 'variables' && (
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
                          value={newVarId}
                          onChange={e => setNewVarId(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-semibold block mb-1">한글 사용자명</label>
                        <input
                          type="text"
                          required
                          placeholder="예: 운송장 번호"
                          value={newVarName}
                          onChange={e => setNewVarName(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-semibold block mb-1">기본형식</label>
                        <select
                          value={newVarType}
                          onChange={e => setNewVarType(e.target.value as any)}
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
                          value={newVarDefault}
                          onChange={e => setNewVarDefault(e.target.value)}
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
                      <span>등록된 바인딩 사전 목록 ({variables.length})</span>
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
                          {variables.map(v => (
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
            )}

            {/* DATA MAPPING SHEET VIEW */}
            {activeTab === 'dataset' && (
              <div className="flex-1 bg-white p-8 overflow-y-auto space-y-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-black text-zinc-950">다중 데이터 바인딩 시트 (Batch Database)</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      다량의 실제 데이터를 등록하여 벡터 라벨과 매핑할 수 있습니다. 템플릿의 <code className="bg-zinc-100 text-zinc-800 px-1 py-0.5 rounded font-mono text-[11px]">${'{변수}'}</code> 토큰에 행 값들이 차례로 바인딩됩니다.
                    </p>
                  </div>
                  <button
                    onClick={handleAddDatasetRow}
                    className="p-2.5 px-4 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow"
                  >
                    <Plus className="w-4 h-4" /> 레코드 데이터 행 임포트(추가)
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-zinc-950 text-white font-bold text-xs select-none">
                        <th className="p-3.5 px-5 text-center w-20">순번</th>
                        {variables.map(v => (
                          <th key={v.id} className="p-3.5">
                            <div className="flex flex-col">
                              <span>{v.name}</span>
                              <span className="text-[9px] text-[#94a3b8] font-mono leading-tight font-medium">{`\${${v.id}}`}</span>
                            </div>
                          </th>
                        ))}
                        <th className="p-3.5 text-center bg-zinc-900 w-28">제거</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {dataset.map((row, idx) => {
                        const isSelected = selectedRecordIndex === idx;
                        return (
                          <tr
                            key={idx}
                            className={`text-xs hover:bg-zinc-50 transition-colors ${
                              isSelected ? 'bg-amber-50/50 font-medium border-l-4 border-l-amber-500' : ''
                            }`}
                          >
                            <td className="p-3 px-5 text-center">
                              <button
                                onClick={() => setSelectedRecordIndex(idx)}
                                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-zinc-150 hover:bg-zinc-200 text-zinc-800'
                                }`}
                              >
                                {idx + 1}
                              </button>
                            </td>

                            {variables.map(v => (
                              <td key={v.id} className="p-3">
                                <input
                                  type="text"
                                  value={row[v.id] ?? ''}
                                  onChange={(e) => {
                                    const updated = [...dataset];
                                    updated[idx] = {
                                      ...updated[idx],
                                      [v.id]: e.target.value
                                    };
                                    setDataset(updated);
                                  }}
                                  className="w-full p-1.5 border border-transparent rounded hover:border-slate-300 focus:border-zinc-900 outline-none transition text-zinc-900 bg-transparent focus:bg-white font-medium"
                                />
                              </td>
                            ))}

                            <td className="p-3 text-center">
                              {dataset.length <= 1 ? (
                                <span className="text-[10px] text-zinc-300">최소 한행</span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteDatasetRow(idx)}
                                  className="p-1 px-2.5 text-rose-500 hover:bg-rose-50 rounded transition-all font-bold"
                                >
                                  삭제
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pr-2 gap-3">
                  <button
                    onClick={() => {
                      setSelectedRecordIndex(0);
                      setActiveTab('design');
                    }}
                    className="p-2 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg transition"
                  >
                    지정한 행 데이터로 드로잉 계속하기
                  </button>
                  <button
                    onClick={() => {
                      setPrintPreviewMode(true);
                    }}
                    className="p-2 px-5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                  >
                    전체 데이터 레코드 일괄 프린트 레이아웃 <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* DEVELOPER API INTEGRATION VIEW */}
            {activeTab === 'api' && (
              <div className="flex-1 bg-white p-8 overflow-y-auto space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-zinc-950 flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-600" /> 외부 출력용 바인딩 및 렌더링 API (Server API Sandbox)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    외부 서비스(ERP, 쇼핑몰, 물류 관리망, DB 등)나 백엔드에서 지정된 라벨디자인에 데이터를 실시간으로 바인딩하여 SVG 백터 리포트를 출력할 수 있는 RESTful API 명세서 및 렌더 샌드박스입니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* API details side */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 bg-blue-600 text-white rounded text-[11px] font-black font-mono">POST</span>
                        <code className="text-xs font-mono font-bold text-slate-800">/api/render-labels</code>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <p className="font-semibold text-slate-600">구현된 주요 페이로드 명세 (JSON Body):</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
                          <li><code className="font-mono bg-zinc-200 px-1 text-[11px] text-zinc-900">widthMm</code>: 전체 캔버스 가로 폭 (mm)</li>
                          <li><code className="font-mono bg-zinc-200 px-1 text-[11px] text-zinc-900">heightMm</code>: 전체 캔버스 세로 높이 (mm)</li>
                          <li><code className="font-mono bg-zinc-200 px-1 text-[11px] text-zinc-900">elements</code>: 캔버스 위에 정의된 벡터 그래픽 배열</li>
                          <li><code className="font-mono bg-zinc-200 px-1 text-[11px] text-zinc-900">dataset</code>: 바인딩될 dynamic 치환 키/값 Object 어레이</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">실시간 Sandbox API 호출 테스트</span>
                        <button
                          onClick={handleTriggerAPIResponse}
                          disabled={isCallingAPI}
                          className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isCallingAPI && <RefreshCw className="w-4 h-4 animate-spin" />}
                          API render-labels 호출하기 (POST)
                        </button>
                      </div>
                    </div>

                    {/* Curl or JS call mock snippet widget */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">cURL 터미널 실행 스니펫</h4>
                      <div className="bg-slate-900 text-slate-350 rounded-2xl p-4 font-mono text-[10px] leading-relaxed relative overflow-hidden select-all border border-slate-950">
                        {`curl -X POST "${window.location.origin}/api/render-labels" \\
  -H "Content-Type: application/json" \\
  -d '{
    "widthMm": ${widthMm},
    "heightMm": ${heightMm},
    "dataset": [
      { "prod_name": "연동 헤드셋", "price": "200,000" }
    ],
    "elements": [...]
  }'`}
                      </div>
                    </div>
                  </div>

                  {/* API response side with returned SVG displays */}
                  <div className="flex flex-col h-[520px] bg-slate-950 rounded-2xl border border-slate-900 overflow-hidden text-slate-300">
                    <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-950 flex justify-between items-center z-15 select-none text-xs">
                      <span className="font-bold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        실시간 API RESPONSE PREVIEW (JSON + 벡터 SVG)
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 font-mono text-[10px] space-y-4">
                      {apiLogs ? (
                        <div className="space-y-4">
                          {apiRenderedSVGs.length > 0 && (
                            <div className="space-y-2.5">
                              <span className="text-[10px] font-bold text-blue-400 uppercase block">바인딩 완료 출력 SVG 다운로드:</span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {apiRenderedSVGs.map((r, i) => (
                                  <div key={i} className="bg-white rounded-lg p-2.5 border border-slate-800 flex flex-col items-center">
                                    <div
                                      dangerouslySetInnerHTML={{ __html: r.svg }}
                                      className="w-full max-w-[150px] aspect-video border border-slate-100 bg-zinc-50 flex items-center justify-center p-1 overflow-hidden"
                                    />
                                    <button
                                      onClick={() => handleDownloadSVG(r.svg, i)}
                                      className="mt-2 w-full py-1 bg-zinc-900 hover:bg-black text-white text-[9px] font-bold rounded flex items-center justify-center gap-1 transition"
                                    >
                                      <Download className="w-2.5 h-2.5" /> SVG 다운로드
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <pre className="text-zinc-400 select-text leading-relaxed bg-[#0b0f19] p-4 rounded-xl overflow-x-auto border border-zinc-900">
                            {apiLogs}
                          </pre>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12 px-5">
                          <RocketIcon />
                          <h4 className="font-semibold text-slate-400 text-xs mt-3">API 호출 전 대기 상태</h4>
                          <p className="text-[10px] text-slate-600 mt-1 max-w-xs leading-relaxed">
                            좌측의 &quot;API render-labels 호출하기&quot; 버튼을 클릭해 실시간 데이터 바인딩 어레이 출력 요청을 전송해 분석할 수 있습니다.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* NEW FORMAT MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-zinc-900">새 디자인 만들기</h3>
            <p className="text-sm text-slate-500">
              현재 컨버스의 모든 그래픽 엘리먼트 디자인이 삭제됩니다. 정말 새로 시작하시겠습니까?
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                진행 안 함
              </button>
              <button
                onClick={confirmNewTemplate}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shadow-rose-200 cursor-pointer"
              >
                지우기
              </button>
            </div>
          </div>
        </div>
      )}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
}

function RocketIcon() {
  return (
    <svg className="w-10 h-10 text-slate-700 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" />
    </svg>
  );
}

function PureSVGLabel({ elements, widthMm, heightMm, activeData }: { elements: LabelElement[], widthMm: number, heightMm: number, activeData: Record<string, string> }) {
  // Elements binding substitutions
  const boundElements = elements.map(el => {
    let cloned = { ...el };
    const replacePlaceholders = (text: string) => {
      if (!text) return "";
      return text.replace(/\$!?\{([a-zA-Z0-9_]+)\}|\$!?([a-zA-Z0-9_]+)/g, (match, g1, g2) => {
        const key = g1 || g2;
        return activeData[key] !== undefined ? String(activeData[key]) : match;
      });
    };

    if (cloned.type === "text") {
      cloned.text = replacePlaceholders(cloned.text);
    } else if (cloned.type === "barcode" || cloned.type === "qrcode") {
      cloned.value = replacePlaceholders(cloned.value);
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
        const transformAttr = el.rotation ? `rotate(${el.rotation} ${el.x + el.width/2} ${el.y + el.height/2})` : undefined;

        if (el.type === "rect") {
          const rx = el.borderRadius || 0;
          return (
            <rect
              key={el.id}
              id={el.id}
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              rx={rx}
              ry={rx}
              fill={el.fillColor}
              stroke={el.strokeColor}
              strokeWidth={el.strokeWidth}
              opacity={opacityAttr}
              transform={transformAttr}
            />
          );
        }
        else if (el.type === "circle") {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          const r = Math.min(el.width, el.height) / 2;
          return (
            <circle
              key={el.id}
              id={el.id}
              cx={cx}
              cy={cy}
              r={r}
              fill={el.fillColor}
              stroke={el.strokeColor}
              strokeWidth={el.strokeWidth}
              opacity={opacityAttr}
              transform={transformAttr}
            />
          );
        }
        else if (el.type === "line") {
          const x2 = el.x + el.width;
          const y2 = el.y + el.height;
          return (
            <line
              key={el.id}
              id={el.id}
              x1={el.x}
              y1={el.y}
              x2={x2}
              y2={y2}
              stroke={el.strokeColor}
              strokeWidth={el.lineThickness || el.strokeWidth || 1}
              opacity={opacityAttr}
              transform={transformAttr}
            />
          );
        }
        else if (el.type === "text") {
          const fs = el.fontSize ? (el.fontSize * 0.3527) : 4;
          const textAnchor = el.textAlign === "center" ? "middle" : el.textAlign === "right" ? "end" : "start";
          const textX = el.textAlign === "center" ? el.x + el.width / 2 : el.textAlign === "right" ? el.x + el.width : el.x;
          const textY = el.y + (el.height / 2) + (fs / 3);
          const styleObj = {
            fontFamily: el.fontFamily || 'Inter',
            fontWeight: el.fontWeight || 'normal',
            fontStyle: el.fontStyle || 'normal',
          };

          return (
            <text
              key={el.id}
              id={el.id}
              x={textX}
              y={textY}
              fill={el.fontColor || '#000000'}
              fontSize={`${fs}px`}
              textAnchor={textAnchor}
              style={styleObj}
              opacity={opacityAttr}
              transform={transformAttr}
            >
              {el.text}
            </text>
          );
        }
        else if (el.type === "barcode") {
          const codeWidth = el.width;
          const codeHeight = el.height * 0.8;
          
          const cleaned = (el.value || "12345678").replace(/[\{\}]/g, "");
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
                {el.showText && (
                  <text
                    x={codeWidth / 2}
                    y={el.height - 1}
                    fill="#000000"
                    fontSize="3px"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {el.value}
                  </text>
                )}
              </g>
            </g>
          );
        }
        else if (el.type === "qrcode") {
          const cleaned = (el.value || "HELLO").replace(/[\{\}]/g, "");
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
                    x={x.toFixed(2)}
                    y={y.toFixed(2)}
                    width={blockW.toFixed(2)}
                    height={blockH.toFixed(2)}
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
        }
        else if (el.type === "image") {
          return (
            <image
              key={el.id}
              id={el.id}
              href={el.url}
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
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
