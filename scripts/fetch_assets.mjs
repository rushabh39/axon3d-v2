import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import AdmZip from 'adm-zip';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_PATH = path.join(ROOT, 'assets.lock.json');
const PUBLIC_DIR = path.join(ROOT, 'public');

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const buffer = fs.readFileSync(filePath);
  hash.update(buffer);
  return hash.digest('hex');
}

function verifyAssets(lock) {
  for (const file of lock.files) {
    const fullPath = path.join(PUBLIC_DIR, file.path);
    if (!fs.existsSync(fullPath)) return false;
    const stat = fs.statSync(fullPath);
    if (stat.size !== file.bytes) return false;
    if (sha256File(fullPath) !== file.sha256) return false;
  }
  return true;
}

async function downloadFile(url, destPath, expectedBytes, expectedSha256) {
  console.log(`Downloading runtime assets bundle from ${url}...`);
  const response = await fetch(url, {
    headers: { 'User-Agent': 'img2interior-modern-bedroom-fetch-assets/1' },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`Failed to download bundle: ${response.status} ${response.statusText}`);
  }

  const fileStream = fs.createWriteStream(destPath);
  let downloadedBytes = 0;
  let lastReport = Date.now();

  const bodyReader = Readable.fromWeb(response.body);
  bodyReader.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    if (Date.now() - lastReport > 1000) {
      const mb = (downloadedBytes / (1024 * 1024)).toFixed(1);
      const totalMb = (expectedBytes / (1024 * 1024)).toFixed(1);
      console.log(`Progress: ${mb} MB / ${totalMb} MB...`);
      lastReport = Date.now();
    }
  });

  await finished(bodyReader.pipe(fileStream));

  console.log(`Verifying bundle integrity...`);
  const stat = fs.statSync(destPath);
  if (stat.size !== expectedBytes) {
    throw new Error(`Bundle size mismatch: got ${stat.size}, expected ${expectedBytes}`);
  }
  const actualHash = sha256File(destPath);
  if (actualHash !== expectedSha256) {
    throw new Error(`Bundle sha256 mismatch: got ${actualHash}, expected ${expectedSha256}`);
  }
  console.log('Bundle integrity verified.');
}

async function main() {
  const lock = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));

  if (verifyAssets(lock)) {
    console.log('fetch_assets: assets already present and verified');
    return;
  }

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const tempZip = path.join(ROOT, 'bundle_temp.zip');

  try {
    await downloadFile(lock.bundle.url, tempZip, lock.bundle.bytes, lock.bundle.sha256);
    console.log(`Extracting assets into ${PUBLIC_DIR}...`);
    const zip = new AdmZip(tempZip);
    zip.extractAllTo(PUBLIC_DIR, true);

    if (!verifyAssets(lock)) {
      throw new Error('Extracted assets failed verification against assets.lock.json');
    }
    console.log(`fetch_assets: successfully installed and verified ${lock.files.length} assets.`);
  } finally {
    if (fs.existsSync(tempZip)) {
      fs.unlinkSync(tempZip);
    }
  }
}

main().catch((err) => {
  console.error('fetch_assets error:', err);
  process.exit(1);
});
