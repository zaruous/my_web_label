import { useEffect } from 'react';
import { LabelTemplate } from '../types';
import { useEditor } from '../context/EditorContext';

export function useTemplates() {
  const [state, dispatch] = useEditor();

  const fetchTemplates = async () => {
    dispatch({ type: 'SET_TEMPLATES', payload: { templates: state.templates, isLoading: true } });
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data: LabelTemplate[] = await res.json();
        dispatch({ type: 'SET_TEMPLATES', payload: { templates: data, isLoading: false } });
      } else {
        dispatch({ type: 'SET_TEMPLATES', payload: { templates: state.templates, isLoading: false } });
      }
    } catch (e) {
      console.error("Error fetching preset templates", e);
      dispatch({ type: 'SET_TEMPLATES', payload: { templates: state.templates, isLoading: false } });
    }
  };

  const saveTemplate = async (name: string) => {
    const payload = {
      name,
      widthMm: state.widthMm,
      heightMm: state.heightMm,
      elements: state.elements,
      variables: state.variables,
    };

    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      dispatch({ type: 'SET_FIELD', field: 'lastSaved', value: new Date().toLocaleTimeString() });
      await fetchTemplates();
    } else {
      throw new Error('서버 저장 실패');
    }
  };

  const loadTemplate = (tmpl: LabelTemplate) => {
    dispatch({ type: 'LOAD_TEMPLATE', payload: tmpl });
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    templates: state.templates,
    isLoading: state.isLoadingTemplates,
    saveTemplate,
    loadTemplate,
    fetchTemplates,
  };
}
