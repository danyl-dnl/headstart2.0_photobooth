const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  module._compile(output, filename);
};

const { composePhotoStrip, drawPhotoStrip, PHOTO_STRIP_LAYOUT, renderPhotoStrip } = require('../src/composition/photoStrip.ts');

function createPhoto(label, overrides = {}) {
  return { id: label, objectUrl: `blob:${label}`, blob: new Blob([label], { type: 'image/jpeg' }), capturedAt: 100, mimeType: 'image/jpeg', width: 640, height: 480, ...overrides };
}

function createCanvas() {
  const draws = [];
  const fills = [];
  const gradientStops = [];
  const context = {
    fillStyle: '', font: '', textBaseline: '', letterSpacing: '',
    fillRect: (...args) => fills.push({ fillStyle: context.fillStyle, args }),
    drawImage: (...args) => draws.push(args),
    createLinearGradient: (...args) => ({ args, addColorStop: (...stop) => gradientStops.push(stop) }),
    fillText: (...args) => context.lastText = args,
  };
  const outputBlob = new Blob(['composed strip'], { type: 'image/jpeg' });
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    toBlob: (callback, mimeType, quality) => { canvas.encoding = { mimeType, quality }; callback(outputBlob); },
  };
  return { canvas, context, draws, fills, gradientStops, outputBlob };
}

test('photo strip uses the three reference slots in fixed vertical order', () => {
  assert.deepEqual(PHOTO_STRIP_LAYOUT.slots, [
    { x: 35, y: 213, width: 463, height: 350 },
    { x: 35, y: 626, width: 463, height: 349 },
    { x: 35, y: 1038, width: 463, height: 349 },
  ]);
  assert.equal(PHOTO_STRIP_LAYOUT.width, 532);
  assert.equal(PHOTO_STRIP_LAYOUT.height, 1600);
});

test('progressive layout fills only captured slots and leaves remaining black placeholders', async () => {
  const { canvas, draws, fills } = createCanvas();
  const photos = [createPhoto('first'), createPhoto('second')];
  const logo = { width: 194, height: 174, label: 'brand mark' };
  const closed = [];
  await renderPhotoStrip(canvas, photos, logo, async (blob) => ({ label: await blob.text(), width: 640, height: 480, close: () => closed.push(blob) }));

  assert.deepEqual([canvas.width, canvas.height], [532, 1600]);
  assert.deepEqual(fills.filter((fill) => fill.fillStyle === '#000000').map((fill) => fill.args), PHOTO_STRIP_LAYOUT.slots.map(({ x, y, width, height }) => [x, y, width, height]));
  assert.deepEqual(draws.filter((draw) => draw.length === 9).map((draw) => draw[0].label), ['first', 'second']);
  assert.deepEqual(draws.at(-1), [logo, 58, 1414, 128, 132]);
  assert.deepEqual(closed.map((blob) => blob), photos.map((photo) => photo.blob));
});

test('final composition encodes one full-resolution JPEG using the same drawing routine', async () => {
  const { canvas, outputBlob, draws } = createCanvas();
  const photos = [createPhoto('one'), createPhoto('two'), createPhoto('three')];
  const bitmapCloses = [];
  const composed = await composePhotoStrip(photos, { width: 194, height: 174 }, {
    canvas,
    bitmapFactory: async (blob) => ({ label: await blob.text(), width: 640, height: 480, close: () => bitmapCloses.push(blob) }),
  });

  assert.equal(composed, outputBlob);
  assert.deepEqual(canvas.encoding, { mimeType: 'image/jpeg', quality: 0.94 });
  assert.deepEqual([canvas.width, canvas.height], [532, 1600]);
  assert.deepEqual(draws.filter((draw) => draw.length === 9).map((draw) => draw[0].label), ['one', 'two', 'three']);
  assert.equal(draws.length, 4, 'three captures and one brand mark are drawn');
  assert.deepEqual(bitmapCloses, photos.map((photo) => photo.blob));
  await assert.rejects(composePhotoStrip(photos.slice(0, 2), { width: 10, height: 10 }, { canvas }), /exactly three photos/);
});

test('draw routine places the logo and event wordmark in the footer of the composed image', () => {
  const { context, draws, gradientStops } = createCanvas();
  const logo = { width: 100, height: 100 };
  drawPhotoStrip(context, [], logo);
  assert.deepEqual(draws, [[logo, 58, 1414, 128, 132]]);
  assert.deepEqual(context.lastText, ['EXCEL 2026', 222, 1508]);
  assert.equal(gradientStops.length, 2);
});
