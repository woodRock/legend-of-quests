// Rasterizes the app icon (three gold triangles on navy) to PNG without dependencies.
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, c])
}
const inTri = (x, y, [ax, ay], [bx, by], [cx, cy]) => {
  const s = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry)
  const d1 = s(x, y, ax, ay, bx, by), d2 = s(x, y, bx, by, cx, cy), d3 = s(x, y, cx, cy, ax, ay)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}

function icon(size, file) {
  const u = size / 64, ss = 3
  const tris = [[[32, 10], [44, 31], [20, 31]], [[20, 31], [32, 52], [8, 52]], [[44, 31], [56, 52], [32, 52]]]
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      let hit = 0
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const px = (x + (sx + 0.5) / ss) / u, py = (y + (sy + 0.5) / ss) / u
        if (tris.some((t) => inTri(px, py, ...t))) hit++
      }
      const a = hit / (ss * ss)
      const shade = 1 - (y / size) * 0.25
      const bg = [11, 22, 48], fg = [242 * shade, 201 * shade, 76 * shade]
      const o = y * (size * 4 + 1) + 1 + x * 4
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(bg[i] * (1 - a) + fg[i] * a)
      raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6
  writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]))
}

icon(192, 'public/icon-192.png')
icon(512, 'public/icon-512.png')
icon(180, 'public/apple-touch-icon.png')
