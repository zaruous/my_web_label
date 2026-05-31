import React from 'react';
import { Code, RefreshCw, Download } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { downloadSVG } from '../../utils/fileUtils';

function RocketIcon() {
  return (
    <svg className="w-10 h-10 text-slate-700 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" />
    </svg>
  );
}

export default function ApiTab() {
  const [state, dispatch] = useEditor();

  const handleTriggerAPIResponse = async () => {
    dispatch({ type: 'SET_FIELD', field: 'isCallingAPI', value: true });
    const payload = {
      widthMm: state.widthMm,
      heightMm: state.heightMm,
      elements: state.elements,
      dataset: state.dataset
    };

    try {
      const res = await fetch('/api/render-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const payloadString = JSON.stringify(payload, null, 2);
      if (res.ok) {
        const result = await res.json();
        const resString = JSON.stringify(result, null, 2);
        dispatch({
          type: 'SET_API_RESULT',
          payload: {
            apiLogs: `// REQUEST PAYLOAD (POST /api/render-labels)\n${payloadString}\n\n// RESPONSE HEADERS (200 OK)\nContent-Type: application/json\n\n// RESPONSE BODY\n${resString}`,
            apiRenderedSVGs: result.renders || []
          }
        });
      } else {
        const failJson = await res.json();
        dispatch({
          type: 'SET_API_RESULT',
          payload: {
            apiLogs: `// ERROR\n${JSON.stringify(failJson, null, 2)}`,
            apiRenderedSVGs: []
          }
        });
      }
    } catch (e) {
      dispatch({
        type: 'SET_API_RESULT',
        payload: {
          apiLogs: `// CONNECTION FAILED: Check local development server status\n${String(e)}`,
          apiRenderedSVGs: []
        }
      });
    }
  };

  return (
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
                disabled={state.isCallingAPI}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {state.isCallingAPI && <RefreshCw className="w-4 h-4 animate-spin" />}
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
    "widthMm": ${state.widthMm},
    "heightMm": ${state.heightMm},
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
            {state.apiLogs ? (
              <div className="space-y-4">
                {state.apiRenderedSVGs.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-blue-400 uppercase block">바인딩 완료 출력 SVG 다운로드:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {state.apiRenderedSVGs.map((r, i) => (
                        <div key={i} className="bg-white rounded-lg p-2.5 border border-slate-800 flex flex-col items-center">
                          <div
                            dangerouslySetInnerHTML={{ __html: r.svg }}
                            className="w-full max-w-[150px] aspect-video border border-slate-100 bg-zinc-50 flex items-center justify-center p-1 overflow-hidden"
                          />
                          <button
                            onClick={() => downloadSVG(r.svg, i)}
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
                  {state.apiLogs}
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
  );
}
