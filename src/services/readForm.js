import ocrWorkerUrl from "tesseract.js/dist/worker.min.js?url";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
export const readForm = async (file, onProgress) => {
  let source = file;
  if (file.type === "application/pdf") {
    const pdf = await import("pdfjs-dist");
    pdf.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const doc = await pdf.getDocument({
      data: await file.arrayBuffer(),
      isEvalSupported: false,
    }).promise;
    try {
      if (doc.numPages !== 1)
        throw new Error("Upload a single-page station return.");
      const page = await doc.getPage(1);
      const content = await page.getTextContent();
      let text = "",
        lastY = null;
      for (const item of content.items) {
        const y = item.transform?.[5];
        if (lastY !== null && Math.abs(y - lastY) > 3) text += "\n";
        text += item.str + " ";
        if (item.hasEOL) text += "\n";
        lastY = y;
      }
      if (text.trim().length > 100) return { text, confidence: null };
      const canvas = document.createElement("canvas"),
        view = page.getViewport({ scale: 2 });
      canvas.width = view.width;
      canvas.height = view.height;
      await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport: view,
      }).promise;
      source = canvas;
    } finally {
      await doc.destroy();
    }
  }
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    workerPath: ocrWorkerUrl,
    logger: (m) => onProgress(m.status),
  });
  try {
    const { data } = await worker.recognize(source);
    return { text: data.text, confidence: data.confidence };
  } finally {
    await worker.terminate();
  }
};
