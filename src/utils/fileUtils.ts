import { LabelElement, LabelVariable } from '../types';
import { parseCSVToDataset } from './csvParser';

export interface ParsedDesign {
  widthMm: number;
  heightMm: number;
  elements: LabelElement[];
  variables: LabelVariable[];
  dataset: Record<string, string>[];
}

export function exportDesignAsJson(
  widthMm: number,
  heightMm: number,
  elements: LabelElement[],
  variables: LabelVariable[],
  dataset: Record<string, string>[]
): void {
  const designData = {
    version: "2.5",
    widthMm,
    heightMm,
    elements,
    variables,
    dataset,
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
}

export function downloadSVG(svgContent: string, index: number): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `templated_label_${index + 1}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readJsonDesignFile(file: File): Promise<ParsedDesign> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          reject(new Error('파일 내용이 없습니다.'));
          return;
        }

        const parsed = JSON.parse(text);

        if (!parsed || !Array.isArray(parsed.elements)) {
          reject(new Error('유효하지 않은 디자인 템플릿 JSON 파일입니다. elements 배열이 유실되었습니다.'));
          return;
        }

        const parsedW = parseFloat(parsed.widthMm);
        const parsedH = parseFloat(parsed.heightMm);
        if (isNaN(parsedW) || isNaN(parsedH)) {
          reject(new Error('유효하지 않은 라벨 크기(폭/높이)를 가진 템플릿입니다.'));
          return;
        }

        resolve({
          widthMm: parsedW,
          heightMm: parsedH,
          elements: parsed.elements,
          variables: Array.isArray(parsed.variables) ? parsed.variables : [],
          dataset: Array.isArray(parsed.dataset) && parsed.dataset.length > 0 ? parsed.dataset : [],
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file);
  });
}

export function readCsvFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          reject(new Error('파일 내용이 없습니다.'));
          return;
        }
        const parsedDataset = parseCSVToDataset(text);
        if (parsedDataset.length === 0) {
          reject(new Error('CSV 데이터 파싱 실패: 파싱된 데이터 행이 없습니다.'));
          return;
        }
        resolve(parsedDataset);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file, 'utf-8');
  });
}
