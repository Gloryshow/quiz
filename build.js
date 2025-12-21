import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

// Copy files
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

// Build JavaScript - minify but keep modules separate
async function buildJs() {
  try {
    console.log('Building JavaScript...');
    
    await esbuild.build({
      entryPoints: ['script.js'],
      outfile: 'public/script.js',
      minify: true,
      bundle: false,
      format: 'esm',
      target: 'es2020',
      sourcemap: false,
    });

    // Also minify firebase-utils
    await esbuild.build({
      entryPoints: ['firebase-utils.js'],
      outfile: 'public/firebase-utils.js',
      minify: true,
      bundle: false,
      format: 'esm',
      target: 'es2020',
      sourcemap: false,
    });
    
    console.log('✅ JavaScript built successfully');
  } catch (error) {
    console.error('❌ JavaScript build failed:', error.message);
    process.exit(1);
  }
}

// Minify CSS
async function buildCss() {
  try {
    console.log('Building CSS...');
    
    const css = fs.readFileSync('styles.css', 'utf-8');
    
    // Simple CSS minification
    const minified = css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ')              // Remove extra whitespace
      .replace(/\s*([{}:;,>+~])\s*/g, '$1') // Remove spaces around special chars
      .trim();
    
    fs.writeFileSync('public/styles.min.css', minified);
    
    console.log('✅ CSS built successfully');
  } catch (error) {
    console.error('❌ CSS build failed:', error.message);
    process.exit(1);
  }
}

// Copy HTML with updated references
async function buildHtml() {
  try {
    console.log('Building HTML...');
    
    let html = fs.readFileSync('index.html', 'utf-8');
    
    // Update CSS reference to minified version
    html = html.replace(
      'href="styles.css"',
      'href="styles.min.css"'
    );
    
    fs.writeFileSync('public/index.html', html);
    
    console.log('✅ HTML built successfully');
  } catch (error) {
    console.error('❌ HTML build failed:', error.message);
    process.exit(1);
  }
}

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

async function build() {
  const startTime = Date.now();
  await buildJs();
  await buildCss();
  await buildHtml();
  const endTime = Date.now();
  console.log(`\n✨ Build complete in ${endTime - startTime}ms`);
  console.log('📦 Your minified files are in the public/ folder');
  console.log('🚀 Vercel will deploy the public/ folder automatically');
}

build();
