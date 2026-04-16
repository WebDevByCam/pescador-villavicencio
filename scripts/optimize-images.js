import fs from 'fs/promises';
import path from 'path';

// Attempt to dynamically import sharp; if it's not available (pnpm blocked build scripts),
// fall back to copying and renaming files into the optimized folder so filenames follow
// best practices. This allows the script to run in environments where native builds
// cannot be executed.

const srcDir = path.resolve('./src/assets/images');
const outDir = path.resolve('./src/assets/images/optimized');

function toKebabCase(name) {
  return name
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9\.]+/g, '-')
    .replace(/[-_]{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();
}

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    // ignore
  }
}

async function optimizeFile(file) {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file, ext);
  const safeName = toKebabCase(base);

  const inputPath = path.join(srcDir, file);
  // Try to use sharp if available (dynamic import in run()). If not available,
  // fall back to copying the files with kebab-case names into the optimized folder.
  if (globalThis._OPTIMIZE_SHARP_AVAILABLE) {
    const sharp = globalThis._OPTIMIZE_SHARP;
    const sizes = [480, 1024, 1600];
    for (const w of sizes) {
      const outName = `${safeName}-${w}.webp`;
      const outPath = path.join(outDir, outName);
      try {
        await sharp(inputPath)
          .rotate()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(outPath);
        console.log(`Written ${outPath}`);
      } catch (err) {
        console.error(`Failed ${file} -> ${outName}:`, err.message);
      }
    }

    // Also write a full-size webp
    const outFull = path.join(outDir, `${safeName}.webp`);
    try {
      await sharp(inputPath).rotate().webp({ quality: 80 }).toFile(outFull);
      console.log(`Written ${outFull}`);
    } catch (err) {
      console.error(`Failed ${file} -> ${safeName}.webp:`, err.message);
    }
  } else {
    // Fallback: copy original file and create consistent kebab-case filenames
    const outFull = path.join(outDir, `${safeName}${ext}`);
    try {
      await fs.copyFile(inputPath, outFull);
      console.log(`Copied ${inputPath} -> ${outFull}`);
    } catch (err) {
      console.error(`Failed to copy ${inputPath} -> ${outFull}:`, err.message);
    }

    // Create placeholder sized filenames (same original content) so templates referencing
    // size-specific names won't break; these are not resized due to missing sharp.
    const sizes = [480, 1024, 1600];
    for (const w of sizes) {
      const outName = path.join(outDir, `${safeName}-${w}${ext}`);
      try {
        await fs.copyFile(inputPath, outName);
        console.log(`Copied ${inputPath} -> ${outName}`);
      } catch (err) {
        console.error(`Failed to copy ${inputPath} -> ${outName}:`, err.message);
      }
    }
  }
}

async function run() {
  console.log('Optimizing images from', srcDir, '->', outDir);
  await ensureDir(outDir);
  // Try to load sharp dynamically; if it fails, set a global flag so optimizeFile
  // can fall back to copying.
  try {
    const imported = await import('sharp');
    globalThis._OPTIMIZE_SHARP = imported.default || imported;
    globalThis._OPTIMIZE_SHARP_AVAILABLE = true;
    console.log('sharp available: using it for image conversions');
  } catch (err) {
    globalThis._OPTIMIZE_SHARP_AVAILABLE = false;
    console.warn('sharp not available; will copy files and rename only. To enable full optimization, install sharp and allow build scripts.');
  }

  const entries = await fs.readdir(srcDir);
  const images = entries.filter((f) => /\.(jpe?g|png|webp|tiff?)$/i.test(f));
  for (const img of images) {
    await optimizeFile(img);
  }
  console.log('Optimization complete. Optimized files are in src/assets/images/optimized');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
