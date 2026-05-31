import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Local templates in-memory storage with some initial defaults
let templatesStore = [
  {
    id: "default-product",
    name: "기본 상품 택 (Product Retail Tag)",
    widthMm: 80,
    heightMm: 40,
    variables: [
      { id: "prod_name", name: "상품명", type: "text", defaultValue: "프리미엄 무선 헤드폰" },
      { id: "price", name: "단가", type: "price", defaultValue: "189,000" },
      { id: "sku", name: "상품 코드", type: "text", defaultValue: "HP-2026-X7" },
      { id: "origin", name: "원산지", type: "text", defaultValue: "대한민국" }
    ],
    elements: [
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
      },
      {
        id: "title",
        type: "text",
        x: 5,
        y: 6,
        width: 70,
        height: 8,
        strokeWidth: 0,
        strokeColor: "",
        fillColor: "",
        opacity: 1,
        rotation: 0,
        name: "상품명 텍스트",
        text: "품명: {{prod_name}}",
        fontSize: 14,
        fontFamily: "Inter",
        fontColor: "#0f172a",
        fontWeight: "bold",
        fontStyle: "normal",
        textAlign: "left"
      },
      {
        id: "price-text",
        type: "text",
        x: 5,
        y: 14,
        width: 40,
        height: 6,
        strokeWidth: 0,
        strokeColor: "",
        fillColor: "",
        opacity: 1,
        rotation: 0,
        name: "가격 텍스트",
        text: "판매가: ₩{{price}}",
        fontSize: 11,
        fontFamily: "Inter",
        fontColor: "#e11d48",
        fontWeight: "bold",
        fontStyle: "normal",
        textAlign: "left"
      },
      {
        id: "origin-text",
        type: "text",
        x: 45,
        y: 14,
        width: 30,
        height: 6,
        strokeWidth: 0,
        strokeColor: "",
        fillColor: "",
        opacity: 1,
        rotation: 0,
        name: "원산지 텍스트",
        text: "지역: {{origin}}",
        fontSize: 9,
        fontFamily: "Inter",
        fontColor: "#475569",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "right"
      },
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
        value: "{{sku}}",
        showText: true
      }
    ]
  },
  {
    id: "logistics-address",
    name: "물류 배송 라벨 (Logistics Shipping)",
    widthMm: 100,
    heightMm: 60,
    variables: [
      { id: "receiver", name: "받는사람", type: "text", defaultValue: "정우성" },
      { id: "contact", name: "연락처", type: "text", defaultValue: "010-1234-5678" },
      { id: "address", name: "주소", type: "text", defaultValue: "서울특별시 강남구 테헤란로 501" },
      { id: "tracking_no", name: "운송장번호", type: "text", defaultValue: "4019-9832-1102" }
    ],
    elements: [
      {
        id: "outer-rect",
        type: "rect",
        x: 2,
        y: 2,
        width: 96,
        height: 56,
        strokeWidth: 1.5,
        strokeColor: "#000000",
        fillColor: "transparent",
        opacity: 1,
        rotation: 0,
        name: "전체 테두리",
        borderRadius: 0
      },
      {
        id: "header-bg",
        type: "rect",
        x: 2,
        y: 2,
        width: 96,
        height: 10,
        strokeWidth: 1,
        strokeColor: "#000000",
        fillColor: "#0f172a",
        opacity: 1,
        rotation: 0,
        name: "헤더배경",
        borderRadius: 0
      },
      {
        id: "header-title",
        type: "text",
        x: 4,
        y: 4,
        width: 92,
        height: 6,
        strokeWidth: 0,
        strokeColor: "",
        fillColor: "",
        opacity: 1,
        rotation: 0,
        name: "헤더타이틀",
        text: "★ 대한민국 특송 우편 배송라벨 ★",
        fontSize: 11,
        fontFamily: "Inter",
        fontColor: "#ffffff",
        fontWeight: "bold",
        fontStyle: "normal",
        textAlign: "center"
      },
      {
        id: "receiver-label",
        type: "text",
        x: 6,
        y: 15,
        width: 20,
        height: 5,
        strokeWidth: 0,
        strokeColor: "",
        fillColor: "",
        opacity: 1,
        rotation: 0,
        name: "수하인라벨",
        text: "수하인:",
        fontSize: 9,
        fontFamily: "Inter",
        fontColor: "#475569",
        fontWeight: "bold",
        fontStyle: "normal",
        textAlign: "left"
      },
      {
        id: "receiver-val",
        type: "text",
        x: 22,
        y: 14,
        width: 30,
        height: 6,
        strokeWidth: 0,
        strokeColor: "",
        fillColor: "",
        opacity: 1,
        rotation: 0,
        name: "수하인명",
        text: "{{receiver}} 님",
        fontSize: 12,
        fontFamily: "Inter",
        fontColor: "#000000",
        fontWeight: "bold",
        fontStyle: "normal",
        textAlign: "left"
      },
      {
        id: "contact-val",
        type: "text",
        x: 55,
        y: 14,
        width: 40,
        height: 6,
        strokeWidth: 0,
        strokeColor: "",
        fillColor: "",
        opacity: 1,
        rotation: 0,
        name: "연락처값",
        text: "연락처: {{contact}}",
        fontSize: 10,
        fontFamily: "Inter",
        fontColor: "#000000",
        fontWeight: "bold",
        fontStyle: "normal",
        textAlign: "right"
      },
      {
        id: "addr-val",
        type: "text",
        x: 6,
        y: 22,
        width: 88,
        height: 10,
        strokeWidth: 0,
        strokeColor: "",
        fillColor: "",
        opacity: 1,
        rotation: 0,
        name: "주소값",
        text: "배송지: {{address}}",
        fontSize: 10,
        fontFamily: "Inter",
        fontColor: "#0f172a",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "left"
      },
      {
        id: "divider",
        type: "line",
        x: 5,
        y: 33,
        width: 90,
        height: 1,
        strokeWidth: 0.5,
        strokeColor: "#94a3b8",
        fillColor: "",
        opacity: 1,
        rotation: 0,
        name: "구분선",
        lineThickness: 1
      },
      {
        id: "track-val",
        type: "barcode",
        x: 15,
        y: 36,
        width: 70,
        height: 14,
        strokeWidth: 0,
        strokeColor: "",
        fillColor: "",
        opacity: 1,
        rotation: 0,
        name: "운송장바코드",
        barcodeType: "CODE128",
        value: "{{tracking_no}}",
        showText: true
      },
      {
        id: "qrcode-val",
        type: "qrcode",
        x: 82,
        y: 14,
        width: 12,
        height: 12,
        strokeWidth: 0,
        strokeColor: "",
        fillColor: "",
        opacity: 1,
        rotation: 0,
        name: "인증QR",
        value: "TEL:{{contact}}"
      }
    ]
  }
];

// Barcode stripe utilities for pure-code vector generation on the API
function getBarcodeSVGPath(value: string, barcodeType: string, width: number, height: number): { path: string; strokeWidth: string } {
  // Return simple visual pattern paths for the barcode based on value to look neat and realistic
  const cleaned = (value || "12345678").replace(/[\{\}]/g, "");
  let pattern = "";
  // Draw randomized, repeatable vertical stripes based on string sum to keep it visually realistic
  let hash = 0;
  for (let i = 0; i < cleaned.length; i++) {
    hash = cleaned.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  // Create solid and space patterns
  for (let i = 0; i < 40; i++) {
    const bit = ((hash >> (i % 30)) & 1) ^ (i % 2 === 0 ? 1 : 0);
    pattern += bit === 1 ? "1" : "0";
  }
  // Standard start and end stripes
  pattern = "101" + pattern + "101";

  const numBars = pattern.length;
  const barWidth = width / numBars;
  let pathStr = "";
  for (let i = 0; i < numBars; i++) {
    if (pattern[i] === "1") {
      const xStart = i * barWidth;
      pathStr += `M ${xStart.toFixed(2)},0 L ${xStart.toFixed(2)},${height.toFixed(2)} `;
    }
  }
  return { path: pathStr, strokeWidth: barWidth.toFixed(2) };
}

function getQRCodeSVGBlocks(value: string, width: number, height: number): string {
  const cleaned = (value || "HELLO").replace(/[\{\}]/g, "");
  // Simple QR matrix mock based on hash to look exactly like standard QR grids
  let hash = 5381;
  for (let i = 0; i < cleaned.length; i++) {
    hash = ((hash << 5) + hash) + cleaned.charCodeAt(i);
  }
  
  const size = 15; // 15x15 layout
  const blockW = width / size;
  const blockH = height / size;
  let rects = "";

  // Standard visual finder patterns at top-left, top-right, bottom-left
  const isFinder = (r: number, c: number) => {
    if (r < 4 && c < 4) return true;
    if (r < 4 && c >= size - 4) return true;
    if (r >= size - 4 && c < 4) return true;
    return false;
  };

  const isFinderFill = (r: number, c: number) => {
    // finder pattern border/inner blocks
    const rBorder = r === 0 || r === 3 || c === 0 || c === 3;
    const r_trBorder = r === 0 || r === 3 || c === size - 1 || c === size - 4;
    const r_blBorder = r === size - 1 || r === size - 4 || c === 0 || c === 3;
    
    if (r < 4 && c < 4) return rBorder || (r === 1 && c === 1 && false) || (r !== 1 && c !== 1);
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
        rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${blockW.toFixed(2)}" height="${blockH.toFixed(2)}" fill="#000000" />`;
      }
    }
  }
  return rects;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // API: Get all active design templates
  app.get("/api/templates", (req, res) => {
    res.json(templatesStore);
  });

  // API: Save or create a design template
  app.post("/api/templates", (req, res) => {
    const { id, name, widthMm, heightMm, elements, variables } = req.body;
    if (!name || isNaN(widthMm) || isNaN(heightMm)) {
      return res.status(400).json({ error: "Invalid template parameters" });
    }

    const templateId = id || "tmpl-" + Date.now();
    const newTemplate = {
      id: templateId,
      name,
      widthMm: Number(widthMm),
      heightMm: Number(heightMm),
      elements: elements || [],
      variables: variables || []
    };

    const existingIndex = templatesStore.findIndex((t) => t.id === templateId);
    if (existingIndex >= 0) {
      templatesStore[existingIndex] = newTemplate;
    } else {
      templatesStore.push(newTemplate);
    }

    res.json({ success: true, template: newTemplate });
  });

  // API: Render labels with dynamically bound dataset values (OUTPUT RENDERING API)
  app.post("/api/render-labels", (req, res) => {
    const { elements, widthMm, heightMm, dataset } = req.body;
    
    if (!elements || !Array.isArray(elements)) {
      return res.status(400).json({ error: "No elements provided for printing" });
    }
    
    // Dataset can be a single object or an array of objects
    const records = Array.isArray(dataset) ? dataset : [dataset || {}];
    const w = Number(widthMm) || 80;
    const h = Number(heightMm) || 40;

    const renderedResults = records.map((record, index) => {
      // Create deep clone of elements for substitution
      const boundElements = elements.map(el => {
        let cloned = { ...el };

        // Helper to replace Mustache placeholders
        const replacePlaceholders = (text: string) => {
          if (!text) return "";
          return text.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
            const key = expression.trim();
            return record[key] !== undefined ? String(record[key]) : match;
          });
        };

        if (cloned.type === "text") {
          cloned.text = replacePlaceholders(cloned.text);
        } else if (cloned.type === "barcode" || cloned.type === "qrcode") {
          cloned.value = replacePlaceholders(cloned.value);
        }
        return cloned;
      });

      // Build SVG Markup for this label index
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm" style="background:#ffffff; overflow:hidden; font-family: sans-serif;">`;
      
      boundElements.forEach(el => {
        const opacityAttr = el.opacity !== undefined ? `opacity="${el.opacity}"` : "";
        const transformAttr = el.rotation ? `transform="rotate(${el.rotation} ${el.x + el.width/2} ${el.y + el.height/2})"` : "";
        
        if (el.type === "rect") {
          const rx = el.borderRadius || 0;
          svgContent += `<rect id="${el.id}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${rx}" ry="${rx}" fill="${el.fillColor}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" ${opacityAttr} ${transformAttr} />`;
        } 
        else if (el.type === "circle") {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          const r = Math.min(el.width, el.height) / 2;
          svgContent += `<circle id="${el.id}" cx="${cx}" cy="${cy}" r="${r}" fill="${el.fillColor}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" ${opacityAttr} ${transformAttr} />`;
        } 
        else if (el.type === "line") {
          const x2 = el.x + el.width;
          const y2 = el.y + el.height;
          svgContent += `<line id="${el.id}" x1="${el.x}" y1="${el.y}" x2="${x2}" y2="${y2}" stroke="${el.strokeColor}" stroke-width="${el.lineThickness || el.strokeWidth || 1}" ${opacityAttr} ${transformAttr} />`;
        } 
        else if (el.type === "text") {
          const fs = el.fontSize ? (el.fontSize * 0.3527) : 4; // pt to mm conversion factor (1pt ~ 0.35mm)
          const textAnchor = el.textAlign === "center" ? "middle" : el.textAlign === "right" ? "end" : "start";
          const textX = el.textAlign === "center" ? el.x + el.width / 2 : el.textAlign === "right" ? el.x + el.width : el.x;
          // Align text dynamically inside bounding box height
          const textY = el.y + (el.height / 2) + (fs / 3);
          const styleStr = `font-family:${el.fontFamily || 'Inter'}; font-weight:${el.fontWeight || 'normal'}; font-style:${el.fontStyle || 'normal'};`;

          svgContent += `<text id="${el.id}" x="${textX}" y="${textY}" fill="${el.fontColor || '#000000'}" font-size="${fs}px" text-anchor="${textAnchor}" style="${styleStr}" ${opacityAttr} ${transformAttr}>${el.text}</text>`;
        } 
        else if (el.type === "barcode") {
          const codeWidth = el.width;
          const codeHeight = el.height * 0.8;
          const details = getBarcodeSVGPath(el.value, el.barcodeType || "CODE128", codeWidth, codeHeight);
          
          let barcodeGroup = `<g transform="translate(${el.x}, ${el.y})">`;
          // Draw standard background behind binary bar patterns for contrast
          barcodeGroup += `<rect x="0" y="0" width="${codeWidth}" height="${el.height}" fill="#ffffff" />`;
          barcodeGroup += `<path d="${details.path}" stroke="#000000" stroke-width="${details.strokeWidth}" />`;
          
          if (el.showText) {
            const fs = 3; // small legible millimeter label
            const labelY = el.height - 1;
            barcodeGroup += `<text x="${codeWidth / 2}" y="${labelY}" fill="#000000" font-size="${fs}px" text-anchor="middle" font-family="monospace">${el.value}</text>`;
          }
          barcodeGroup += `</g>`;
          
          svgContent += `<g id="${el.id}" ${opacityAttr} ${transformAttr}>${barcodeGroup}</g>`;
        } 
        else if (el.type === "qrcode") {
          let qrGroup = `<g transform="translate(${el.x}, ${el.y})">`;
          qrGroup += `<rect x="0" y="0" width="${el.width}" height="${el.height}" fill="#ffffff" />`;
          qrGroup += getQRCodeSVGBlocks(el.value, el.width, el.height);
          qrGroup += `</g>`;

          svgContent += `<g id="${el.id}" ${opacityAttr} ${transformAttr}>${qrGroup}</g>`;
        }
        else if (el.type === "image") {
          svgContent += `<image id="${el.id}" href="${el.url}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" ${opacityAttr} ${transformAttr} />`;
        }
      });
      
      svgContent += `</svg>`;
      
      return {
        recordIndex: index,
        recordData: record,
        svg: svgContent
      };
    });

    res.json({
      success: true,
      widthMm: w,
      heightMm: h,
      count: records.length,
      renders: renderedResults
    });
  });

  // Client SPA mounting
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booting! Ready on http://localhost:${PORT}`);
  });
}

startServer();
