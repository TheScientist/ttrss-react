#!/usr/bin/env node

/**
 * Generate PWA icons from a source image
 * Usage: node scripts/generate-icons.js <source-image-path> [output-dir]
 * Example: node scripts/generate-icons.js icon.png public
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateIcon(sharp, sourcePath, iconName, config, outputDir) {
  try {
    if (config.svg) {
      // SVG favicon - skip for now, will be generated after icon-512
      return;
    }

    const outputPath = path.join(outputDir, iconName);
    let imageProcess = sharp(sourcePath).resize(config.size, config.size, {
      fit: 'contain',
      background: config.background ? { r: 18, g: 18, b: 18, alpha: 1 } : { r: 0, g: 0, b: 0, alpha: 0 }
    });

    imageProcess = imageProcess.png();

    await imageProcess.toFile(outputPath);
    console.log(`✓ Generated ${iconName} (${config.size}x${config.size})`);
  } catch (error) {
    console.error(`❌ Failed to generate ${iconName}:`, error.message);
    throw error;
  }
}

async function main() {
  const sourcePath = process.argv[2];
  const outputDir = process.argv[3] || 'public';

  // Try to import sharp, provide helpful error if missing
  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
  } catch (e) {
    console.error('❌ Error: sharp module not found.');
    console.error('Please install it with: npm install --save-dev sharp');
    process.exit(1);
  }

  // Configuration for icon generation
  const ICON_CONFIG = {
    // Regular icons
    'app-icon-192.png': { size: 192, maskable: false },
    'app-icon-512.png': { size: 512, maskable: false },
    
    // Maskable icons (for Android Adaptive Icons)
    'manifest-icon-192.maskable.png': { size: 192, maskable: true },
    'manifest-icon-512.maskable.png': { size: 512, maskable: true },
    
    // Apple touch icon (square, no transparency)
    'apple-icon-180.png': { size: 180, maskable: false, background: '#121212' },
    
    // Favicon
    'favicon.ico': { size: 32, maskable: false, format: 'png' },
    'favicon.svg': { svg: true },
  };

  if (!sourcePath) {
    console.error('Usage: node scripts/generate-icons.js <source-image> [output-dir]');
    console.error('Example: node scripts/generate-icons.js icon.png public');
    process.exit(1);
  }

  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Error: Source image not found: ${sourcePath}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\n📦 Generating PWA icons from: ${sourcePath}`);
  console.log(`📁 Output directory: ${outputDir}\n`);

  try {
    for (const [iconName, config] of Object.entries(ICON_CONFIG)) {
      await generateIcon(sharp, sourcePath, iconName, config, outputDir);
    }

    // Generate SVG favicon after app-icon-512 is created
    const svgPath = path.join(outputDir, 'favicon.svg');
    const iconPath = path.join(outputDir, 'app-icon-512.png');
    if (fs.existsSync(iconPath)) {
      const imageBuffer = fs.readFileSync(iconPath);
      const base64Image = imageBuffer.toString('base64');
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n  <rect width="512" height="512" fill="#121212"/>\n  <image href="data:image/png;base64,${base64Image}" x="0" y="0" width="512" height="512"/>\n</svg>`;
      fs.writeFileSync(svgPath, svgContent);
      console.log(`✓ Generated favicon.svg`);
    }

    console.log('\n✅ All icons generated successfully!');
    console.log('\nGenerated files:');
    console.log('  • app-icon-192.png (regular icon)');
    console.log('  • app-icon-512.png (regular icon)');
    console.log('  • manifest-icon-192.maskable.png (Android Adaptive Icon)');
    console.log('  • manifest-icon-512.maskable.png (Android Adaptive Icon)');
    console.log('  • apple-icon-180.png (iOS)');
    console.log('  • favicon.ico (browser tab)');
    console.log('  • favicon.svg (modern favicon)');
    console.log('\nNext steps:');
    console.log('  1. Ensure manifest.json and manifest-dark.json reference these files');
    console.log('  2. Update HTML files to reference favicon.ico and apple-icon-180.png');
    console.log('  3. Run: npm run build');
  } catch (error) {
    console.error('\n❌ Icon generation failed:', error.message);
    process.exit(1);
  }
}

main();
