// Genera los PNG del manifest PWA a partir de public/icons/icon.svg
import sharp from 'sharp'
import fs from 'node:fs'
const svg = fs.readFileSync('public/icons/icon.svg')
await sharp(svg).resize(192, 192).png().toFile('public/icons/icon-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/icons/icon-512.png')
// maskable: mismo icono con margen de seguridad
const inner = await sharp(svg).resize(400, 400).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#FF7A1A' } }).composite([{ input: inner, gravity: 'center' }]).png().toFile('public/icons/icon-512-maskable.png')
console.log('iconos generados')
