// Gerador de ícones PWA básico
// Execute: node scripts/generate-icons.cjs

const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const zlib = require('zlib');

const iconsDir = join(__dirname, '..', 'public', 'icons');

function createPng(size) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdr = createChunk('IHDR', ihdrData);
  
  // Raw image data (cyan square)
  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      rawData.push(6, 182, 212); // RGB cyan
    }
  }
  
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idat = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  const crcInput = Buffer.concat([typeBuffer, data]);
  
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput) >>> 0, 0);
  
  return Buffer.concat([len, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return crc ^ 0xFFFFFFFF;
}

function main() {
  if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
  
  console.log('Gerando ícones PWA placeholder...\n');
  
  const sizes = [72, 96, 128, 144, 152, 180, 192, 512];
  
  sizes.forEach(size => {
    const name = size === 512 ? 'icon-512.png' : `icon-${size}.png`;
    const png = createPng(size);
    writeFileSync(join(iconsDir, name), png);
    console.log(`✓ ${name}`);
  });
  
  // Maskable icon (same as 512)
  const maskable = createPng(512);
  writeFileSync(join(iconsDir, 'icon-maskable.png'), maskable);
  console.log('✓ icon-maskable.png');
  
  console.log('\n⚠️  Placeholders criados. Substitua por ícones reais!');
  console.log('   Use https://progressier.com/pwa-icon-generator para criar ícones com seu design');
}

main();
