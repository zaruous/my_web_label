import React, { createContext, useContext, useReducer } from 'react';
import { LabelElement, LabelVariable, LabelTemplate } from '../types';
import { INITIAL_ELEMENTS, INITIAL_VARIABLES, INITIAL_DATASET } from '../constants/defaults';

export interface EditorState {
  // 캔버스
  widthMm: number;
  heightMm: number;
  customW: string;
  customH: string;
  // 요소
  elements: LabelElement[];
  selectedElementId: string | null;
  clipboardElement: LabelElement | null;
  draggedIndex: number | null;
  // 이력
  history: LabelElement[][];
  historyIndex: number;
  // 변수/데이터
  variables: LabelVariable[];
  dataset: Record<string, string>[];
  selectedRecordIndex: number;
  // 새 변수 폼
  newVarId: string;
  newVarName: string;
  newVarType: 'text' | 'number' | 'price' | 'date';
  newVarDefault: string;
  // UI
  zoom: number;
  activeTab: 'design' | 'variables' | 'dataset' | 'api';
  activeSidePanel: 'properties' | 'toolbox';
  showGrid: boolean;
  snapToGrid: boolean;
  showNewModal: boolean;
  lastSaved: string;
  presetSize: string;
  newWidthTemp: number;
  newHeightTemp: number;
  // 프린트
  printPreviewMode: boolean;
  printFormat: 'roll' | 'a4';
  printRange: 'current' | 'all';
  // 템플릿
  templates: LabelTemplate[];
  isLoadingTemplates: boolean;
  // API
  apiLogs: string;
  apiRenderedSVGs: { recordIndex: number; svg: string }[];
  isCallingAPI: boolean;
}

export type EditorAction =
  | { type: 'SET_ELEMENTS'; payload: LabelElement[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_FIELD'; field: keyof EditorState; value: EditorState[keyof EditorState] }
  | { type: 'LOAD_TEMPLATE'; payload: LabelTemplate }
  | { type: 'ADD_VARIABLE'; payload: LabelVariable }
  | { type: 'DELETE_VARIABLE'; payload: string }
  | { type: 'ADD_DATASET_ROW' }
  | { type: 'DELETE_DATASET_ROW'; payload: number }
  | { type: 'UPDATE_DATASET_CELL'; payload: { rowIndex: number; key: string; value: string } }
  | { type: 'SET_TEMPLATES'; payload: { templates: LabelTemplate[]; isLoading: boolean } }
  | { type: 'SET_API_RESULT'; payload: { apiLogs: string; apiRenderedSVGs: { recordIndex: number; svg: string }[] } };

const initialState: EditorState = {
  widthMm: 80,
  heightMm: 40,
  customW: "80",
  customH: "40",
  elements: INITIAL_ELEMENTS,
  selectedElementId: "title",
  clipboardElement: null,
  draggedIndex: null,
  history: [INITIAL_ELEMENTS],
  historyIndex: 0,
  variables: INITIAL_VARIABLES,
  dataset: INITIAL_DATASET,
  selectedRecordIndex: 0,
  newVarId: '',
  newVarName: '',
  newVarType: 'text',
  newVarDefault: '',
  zoom: 100,
  activeTab: 'design',
  activeSidePanel: 'properties',
  showGrid: true,
  snapToGrid: false,
  showNewModal: false,
  lastSaved: '',
  presetSize: '80x40',
  newWidthTemp: 80,
  newHeightTemp: 40,
  printPreviewMode: false,
  printFormat: 'roll',
  printRange: 'current',
  templates: [],
  isLoadingTemplates: false,
  apiLogs: '',
  apiRenderedSVGs: [],
  isCallingAPI: false,
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_ELEMENTS': {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(action.payload);
      if (newHistory.length > 50) newHistory.shift();
      const newIndex = Math.min(state.historyIndex + 1, 49);
      return {
        ...state,
        elements: action.payload,
        history: newHistory,
        historyIndex: newIndex,
      };
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        historyIndex: newIndex,
        elements: state.history[newIndex],
      };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        historyIndex: newIndex,
        elements: state.history[newIndex],
      };
    }
    case 'SET_FIELD': {
      return { ...state, [action.field]: action.value };
    }
    case 'LOAD_TEMPLATE': {
      const tmpl = action.payload;
      const updatedDataset = state.dataset.map(item => {
        const synced = { ...item };
        tmpl.variables.forEach(v => {
          if (synced[v.id] === undefined) {
            synced[v.id] = v.defaultValue;
          }
        });
        return synced;
      });
      const newHistory = [tmpl.elements];
      return {
        ...state,
        widthMm: tmpl.widthMm,
        heightMm: tmpl.heightMm,
        customW: String(tmpl.widthMm),
        customH: String(tmpl.heightMm),
        elements: tmpl.elements,
        variables: tmpl.variables,
        selectedElementId: tmpl.elements[0]?.id || null,
        dataset: updatedDataset,
        history: newHistory,
        historyIndex: 0,
      };
    }
    case 'ADD_VARIABLE': {
      const newVar = action.payload;
      const newDataset = state.dataset.map(item => ({
        ...item,
        [newVar.id]: newVar.defaultValue || '테스트'
      }));
      return {
        ...state,
        variables: [...state.variables, newVar],
        dataset: newDataset,
        newVarId: '',
        newVarName: '',
        newVarDefault: '',
      };
    }
    case 'DELETE_VARIABLE': {
      return {
        ...state,
        variables: state.variables.filter(v => v.id !== action.payload),
      };
    }
    case 'ADD_DATASET_ROW': {
      const sample: Record<string, string> = {};
      state.variables.forEach(v => {
        sample[v.id] = v.defaultValue || '새 항목';
      });
      return {
        ...state,
        dataset: [...state.dataset, sample],
        selectedRecordIndex: state.dataset.length,
      };
    }
    case 'DELETE_DATASET_ROW': {
      if (state.dataset.length <= 1) return state;
      const idx = action.payload;
      const nextIdx = Math.max(0, idx - 1);
      return {
        ...state,
        dataset: state.dataset.filter((_, i) => i !== idx),
        selectedRecordIndex: nextIdx,
      };
    }
    case 'UPDATE_DATASET_CELL': {
      const { rowIndex, key, value } = action.payload;
      const updated = [...state.dataset];
      updated[rowIndex] = { ...updated[rowIndex], [key]: value };
      return { ...state, dataset: updated };
    }
    case 'SET_TEMPLATES': {
      return {
        ...state,
        templates: action.payload.templates,
        isLoadingTemplates: action.payload.isLoading,
      };
    }
    case 'SET_API_RESULT': {
      return {
        ...state,
        apiLogs: action.payload.apiLogs,
        apiRenderedSVGs: action.payload.apiRenderedSVGs,
        isCallingAPI: false,
      };
    }
    default:
      return state;
  }
}

const EditorContext = createContext<[EditorState, React.Dispatch<EditorAction>] | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  return (
    <EditorContext.Provider value={[state, dispatch]}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor(): [EditorState, React.Dispatch<EditorAction>] {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}
