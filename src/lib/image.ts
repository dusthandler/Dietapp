/**
 * Reduce una foto a una miniatura muy ligera (máx. 320 px de lado, WebP ~0.72 o JPEG)
 * para guardarla en IndexedDB y sincronizarla sin coste: ~10-25 KB por receta.
 */
export async function optimizeImage(file: File, maxSide = 320): Promise<string> {
  const bitmap = await loadImage(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  let out = canvas.toDataURL('image/webp', 0.72)
  if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/jpeg', 0.7)
  return out
}

function loadImage(file: File): Promise<HTMLImageElement | ImageBitmap> {
  if ('createImageBitmap' in window) return createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions).catch(() => viaElement(file))
  return viaElement(file)
}

function viaElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = reject
    img.src = url
  })
}
