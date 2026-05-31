import React from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import Header from './components/layout/Header';
import Toolbox from './components/sidebar/Toolbox';
import PropertiesPanel from './components/sidebar/PropertiesPanel';
import LabelCanvas from './components/canvas/LabelCanvas';
import VariablesTab from './components/tabs/VariablesTab';
import DatasetTab from './components/tabs/DatasetTab';
import ApiTab from './components/tabs/ApiTab';
import NewTemplateModal from './components/modals/NewTemplateModal';
import PrintPreviewModal from './components/modals/PrintPreviewModal';

function EditorShell() {
  const [state] = useEditor();
  return (
    <div className="flex flex-col h-screen w-full bg-[#F4F4F5] text-slate-800 font-sans overflow-hidden" id="label-architect-root">
      <Header />
      {state.printPreviewMode ? (
        <PrintPreviewModal />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Toolbox />
          <PropertiesPanel />
          <main className="flex-1 flex flex-col overflow-hidden">
            {state.activeTab === 'design' && <LabelCanvas />}
            {state.activeTab === 'variables' && <VariablesTab />}
            {state.activeTab === 'dataset' && <DatasetTab />}
            {state.activeTab === 'api' && <ApiTab />}
          </main>
        </div>
      )}
      <NewTemplateModal />
    </div>
  );
}

export default function App() {
  return (
    <EditorProvider>
      <EditorShell />
    </EditorProvider>
  );
}
