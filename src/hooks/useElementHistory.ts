import { LabelElement } from '../types';
import { useEditor } from '../context/EditorContext';

export function useElementHistory() {
  const [state, dispatch] = useEditor();

  const updateElements = (newEls: LabelElement[] | ((p: LabelElement[]) => LabelElement[])) => {
    const resolved = typeof newEls === 'function' ? newEls(state.elements) : newEls;
    dispatch({ type: 'SET_ELEMENTS', payload: resolved });
  };

  const undo = () => dispatch({ type: 'UNDO' });
  const redo = () => dispatch({ type: 'REDO' });
  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return { updateElements, undo, redo, canUndo, canRedo };
}
