import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, 'public', 'icons');

// Simple PNG generator using raw bytes (1-pixel placeholder - replace with real icons)
function createPlaceholderPng(size) {
  // Minimal valid PNG with a colored pixel
  // This creates a cyan-colored square placeholder
  // In production, replace these with actual designed icons
  
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const width = size;
  const height = size;
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdr = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCrc
  ]);
  
  // IDAT chunk - simple uncompressed image data
  // For a real implementation, use a canvas library or sharp
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      // Cyan color gradient
      rawData.push(6);   // R
      rawData.push(182); // G
      rawData.push(212); // B
    }
  }
  
  // Compress with zlib (sync)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressed]));
  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(compressed.length, 0);
  const idat = Buffer.concat([
    idatLen,
    Buffer.from('IDAT'),
    compressed,
    idatCrc
  ]);
  
  // IEND chunk
  const iendCrc = crc32(Buffer.from('IEND'));
  const iend = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('IEND'),
    iendCrc
  ]);
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

// CRC32 implementation
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];
  
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  
  const result = Buffer.alloc(4);
  result.writeUInt32BE((crc ^ 0xFFFFFFFF) >>> 0, 0);
  return result;
}

async function main() {
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }
  
  console.log('Gerando ícones placeholder...');
  console.log('⚠️  IMPORTANTE: Substitua esses arquivos por ícones reais com seu design!');
  console.log('');
  
  // Generate placeholder icons
  const sizes = [192, 512, 72, 96, 128, 144, 152, 180];
  
  for (const size of sizes) {
    const filename = size === 512 ? 'icon-512.png' : `icon-${size}.png`;
    const filepath = join(iconsDir, filename);
    
    try {
      const png = await createPlaceholderPng(size);
      writeFileSync(filepath, png);
      console.log(`✓ ${filename}`);
    } catch (e) {
      console.log(`✗ Erro em ${filename}: ${e.message}`);
    }
  }
  
  // Copy 192 as maskable
  const png192 = await createPlaceholderPng(192);
  writeFileSync(join(iconsDir, 'icon-maskable.png'), png192);
  console.log('✓ icon-maskable.png');
  
  console.log('');
  console.log('Agora você pode:');
  console.log('1. Abrir https://progressier.com/pwa-icon-generator');
  console.log('2. Ou https://www.favicon.cc/');
  console.log('3. Criar seus ícones com o branding ReyBraztech');
  console.log('4. Substituir os arquivos em public/icons/');
}

main().catch(console.error);
