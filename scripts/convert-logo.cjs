// Gerar ícones PWA com fundo preto usando logox.svg
// Execute: node scripts/convert-logo.cjs

const sharp = require('sharp');
const { join } = require('path');

const logoPath = join(__dirname, '..', 'public', 'logo', 'logox.svg');
const iconsDir = join(__dirname, '..', 'public', 'icons');

// Fundo preto (#0a0a0a - tema do app)
const BLACK_BG = { r: 10, g: 10, b: 10, alpha: 1 };

const sizes = [72, 96, 128, 144, 152, 180, 192, 512];

async function main() {
  console.log('Gerando ícones com fundo preto...\n');
  
  for (const size of sizes) {
    const name = size === 512 ? 'icon-512.png' : `icon-${size}.png`;
    const outPath = join(iconsDir, name);
    
    await sharp(logoPath)
      .resize(size, size, {
        fit: 'contain',
        background: BLACK_BG
      })
      .png()
      .toFile(outPath);
    
    console.log(`✓ ${name}`);
  }
  
  // Maskable icon
  const maskablePath = join(iconsDir, 'icon-maskable.png');
  await sharp(logoPath)
    .resize(512, 512, {
      fit: 'contain',
      background: BLACK_BG
    })
    .png()
    .toFile(maskablePath);
  console.log('✓ icon-maskable.png');
  
  console.log('\n✅ Ícones com fundo preto gerados!');
}

main().catch(console.error);
