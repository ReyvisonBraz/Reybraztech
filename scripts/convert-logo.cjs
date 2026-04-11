// Converter logo para ícones PWA
// Execute: node scripts/convert-logo.cjs

const sharp = require('sharp');
const { join } = require('path');

const logoPath = join(__dirname, '..', 'public', 'logo', 'logo.avif');
const iconsDir = join(__dirname, '..', 'public', 'icons');

const sizes = [72, 96, 128, 144, 152, 180, 192, 512];

async function main() {
  console.log('Lendo logo...\n');
  
  const logo = sharp(logoPath);
  const metadata = await logo.metadata();
  console.log(`Logo original: ${metadata.width}x${metadata.height}\n`);
  
  for (const size of sizes) {
    const name = size === 512 ? 'icon-512.png' : `icon-${size}.png`;
    const outPath = join(iconsDir, name);
    
    await sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 10, g: 10, b: 10 } })
      .png()
      .toFile(outPath);
    
    console.log(`✓ ${name}`);
  }
  
  // Maskable icon (512x512 with padding)
  const maskablePath = join(iconsDir, 'icon-maskable.png');
  await sharp(logoPath)
    .resize(512, 512, { fit: 'contain', background: { r: 10, g: 10, b: 10 } })
    .png()
    .toFile(maskablePath);
  console.log('✓ icon-maskable.png');
  
  console.log('\n✅ Ícones gerados com sucesso!');
}

main().catch(console.error);
