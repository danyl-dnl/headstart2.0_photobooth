const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

// Reuse the project's TypeScript compiler for these small Node tests; no test framework or loader is added.
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  module._compile(output, filename);
};

const { MockPhotoDeliveryService } = require('../src/services/delivery/MockPhotoDeliveryService.ts');
const { createPhotoFilename } = require('../src/services/delivery/createPhotoFilename.ts');
const capturedAt = Date.UTC(2026, 9, 5, 13, 45, 1);

function createPhoto(blob, mimeType = blob.type) {
  return { blob, mimeType, capturedAt, width: 640, height: 480, objectUrl: '' };
}

test('valid photo succeeds through the local mock adapter without reading or changing its Blob', async () => {
  const blob = new Blob(['original jpeg data'], { type: 'image/jpeg' });
  Object.defineProperty(blob, 'arrayBuffer', { value: () => { throw new Error('Blob must not be read or copied'); } });
  const photo = createPhoto(blob);
  const result = await new MockPhotoDeliveryService().deliver(photo);

  assert.equal(result.status, 'success');
  if (result.status !== 'success') return;
  assert.match(result.deliveryId, /^mock-/);
  assert.match(result.filename, /\.jpg$/);
  assert.equal(photo.blob, blob);
  assert.equal(blob.size, 18);
  assert.equal(blob.type, 'image/jpeg');
});

test('empty Blob returns a failure result', async () => {
  const result = await new MockPhotoDeliveryService().deliver(createPhoto(new Blob([], { type: 'image/jpeg' })));
  assert.deepEqual(result, { status: 'failed', error: 'The captured photo is empty.' });
});

test('unsupported MIME type returns a failure result', async () => {
  const result = await new MockPhotoDeliveryService().deliver(createPhoto(new Blob(['data'], { type: 'text/plain' })));
  assert.equal(result.status, 'failed');
});

test('filename is safe, format-specific, and unique for repeated generations', () => {
  const photo = createPhoto(new Blob(['data'], { type: 'image/jpeg' }));
  const first = createPhotoFilename(photo);
  const second = createPhotoFilename(photo);

  assert.match(first, /^headstart_20261005_134501Z_[a-f0-9-]+_[a-z0-9]+\.jpg$/);
  assert.match(first, /^[a-zA-Z0-9_.-]+$/);
  assert.notEqual(first, second);
  assert.match(createPhotoFilename({ ...photo, mimeType: 'image/png' }), /\.png$/);
});
