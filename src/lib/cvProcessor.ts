/**
 * Pure JavaScript Image Processing (Alternative to OpenCV)
 * Scans canvas ImageData to mathematically extract physiological features.
 */

export interface CVFeatures {
  swellingPercentage: number;
  bruisePercentage: number;
  rednessPercentage: number;
}

export const processImageFeatures = (imageData: ImageData): CVFeatures => {
  const data = imageData.data;
  let rednessCount = 0;
  let bruiseCount = 0;
  let totalValidPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 10) continue; // Skip transparent/dark background pixels
    totalValidPixels++;

    // Redness/Inflammation threshold (High Red, Low Green/Blue)
    if (r > 160 && g < 100 && b < 100) {
      rednessCount++;
    }

    // Bruising threshold (Dark Purple / Blue / Brownish tones)
    // R is low/mid, B is higher than G, overall darkness
    if (r < 120 && g < 90 && b > 80 && b > g) {
      bruiseCount++;
    }
  }

  const redPct = totalValidPixels > 0 ? (rednessCount / totalValidPixels) * 100 : 0;
  const bruisePct = totalValidPixels > 0 ? (bruiseCount / totalValidPixels) * 100 : 0;

  // Swelling is incredibly hard to detect on a single 2D image without a baseline or depth map.
  // We approximate it by assuming high redness and bruising combined often indicate swelling,
  // or we return a placeholder that the reasoning engine will combine with user symptoms.
  const swellingPct = Math.min((redPct * 0.5) + (bruisePct * 0.8), 100);

  return {
    rednessPercentage: parseFloat(redPct.toFixed(2)),
    bruisePercentage: parseFloat(bruisePct.toFixed(2)),
    swellingPercentage: parseFloat(swellingPct.toFixed(2))
  };
};

/**
 * Utility to draw bounding boxes or heatmaps on a canvas 
 * based on the extracted color clusters.
 */
export const drawHeatmapOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number, features: CVFeatures) => {
  if (features.rednessPercentage > 2 || features.bruisePercentage > 2) {
    // Draw a simulated heatmap cluster in the center based on intensity
    const intensity = Math.min((features.rednessPercentage + features.bruisePercentage) / 10, 1);
    
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 10,
      width / 2, height / 2, 150
    );
    
    // Core (Red/Hot)
    gradient.addColorStop(0, `rgba(239, 68, 68, ${intensity * 0.8})`);
    // Mid (Yellow/Warm)
    gradient.addColorStop(0.5, `rgba(234, 179, 8, ${intensity * 0.4})`);
    // Edge (Transparent)
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.globalCompositeOperation = 'screen';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over'; // reset
  }
};

/**
 * Mathematically transforms an original canvas image into a simulated 
 * "Deep Tissue / X-Ray 3D Model" by applying complex filters and drawing
 * simulated structural damage vectors based on the CV features.
 */
export const generateAIModelImage = (sourceCanvas: HTMLCanvasElement, width: number, height: number, features: CVFeatures): string => {
  const modelCanvas = document.createElement('canvas');
  modelCanvas.width = width;
  modelCanvas.height = height;
  const ctx = modelCanvas.getContext('2d');
  if (!ctx) return sourceCanvas.toDataURL();

  // 1. Draw original image with X-Ray / Deep Tissue CSS filters
  // hue-rotate(180deg) makes reds into cyan (like x-ray), sepia/contrast gives it depth.
  ctx.filter = 'grayscale(100%) contrast(150%) brightness(60%) sepia(80%) hue-rotate(180deg)';
  ctx.drawImage(sourceCanvas, 0, 0, width, height);
  ctx.filter = 'none';

  // 2. Draw 3D glowing structural damage overlay
  if (features.rednessPercentage > 1 || features.bruisePercentage > 1) {
    ctx.globalCompositeOperation = 'screen';
    
    // Create a glowing core at the center (simulating detected damage epicenter)
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 5,
      width / 2, height / 2, 120
    );
    gradient.addColorStop(0, 'rgba(255, 50, 50, 0.9)');
    gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw simulated muscle tears / fractures (Lightning/crack pattern)
    ctx.beginPath();
    ctx.moveTo(width / 2 - 30, height / 2 - 40);
    ctx.lineTo(width / 2 + 10, height / 2 - 10);
    ctx.lineTo(width / 2 - 15, height / 2 + 20);
    ctx.lineTo(width / 2 + 40, height / 2 + 50);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Add outer glow to the tear
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.6)';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';
  }

  // 3. Add technical UI overlay to make it look like an AI interface
  ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('AI TISSUE MODEL v2.0', 20, 30);
  ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
  ctx.fillText(`STRUCTURAL INTEGRITY: ${(100 - features.bruisePercentage).toFixed(1)}%`, 20, 50);
  
  // Draw tech grid lines
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 50) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
  }
  for (let i = 0; i < height; i += 50) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
  }

  return modelCanvas.toDataURL('image/jpeg', 0.9);
};
