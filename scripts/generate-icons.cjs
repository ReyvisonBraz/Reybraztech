// Gera ícones PWA a partir de public/logo/logo-icon.png
// Execute: node scripts/generate-icons.cjs

const sharp = require('sharp');
const { join } = require('path');
const { mkdirSync, existsSync } = require('fs');

const logoPath = join(__dirname, '..', 'public', 'logo', 'logox.png');
const iconsDir = join(__dirname, '..', 'public', 'icons');

if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 180, 192, 512];

async function generateIcon(size, filename, padding = 0.15) {
  const logoSize = Math.round(size * (1 - padding * 2));
  const offset = Math.round(size * padding);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp(logoPath)
          .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer(),
        top: offset,
        left: offset,
      },
    ])
    .png()
    .toFile(join(iconsDir, filename));

  console.log(`✓ ${filename} (${size}x${size})`);
}

async function main() {
  console.log('Gerando ícones PWA com logo real...\n');

  for (const size of sizes) {
    await generateIcon(size, `icon-${size}.png`);
  }

  // Maskable: padding maior (safe zone de 20%)
  await generateIcon(512, 'icon-maskable.png', 0.2);

  console.log('\n✅ Ícones gerados em public/icons/');
}

main().catch((err) => {
  console.error('Erro:', err.message);
  console.error('Certifique-se de que sharp está instalado: npm install sharp');
});
