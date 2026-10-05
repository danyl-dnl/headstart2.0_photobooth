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

const { appendPhoto, createEmptyPhotoSession, isValidCapturedPhotoData, maxSessionPhotos, replacePhoto } = require('../src/types/photoSession.ts');
const { createDeliveryAttemptGuard } = require('../src/services/delivery/createDeliveryAttemptGuard.ts');
const { PhotoObjectUrlRegistry } = require('../src/services/delivery/PhotoObjectUrlRegistry.ts');
const { createCaptureAttemptGate } = require('../src/camera/captureAttemptGate.ts');

function createPhoto(overrides = {}) {
  return {
    id: globalThis.crypto.randomUUID(),
    blob: new Blob(['photo'], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    capturedAt: Date.now(),
    width: 640,
    height: 480,
    objectUrl: 'blob:session-photo',
    ...overrides,
  };
}

test('a new guest session contains no prior photo or selected delivery state', () => {
  const previousPhoto = createPhoto();
  const previousSession = { photos: [previousPhoto] };
  const nextSession = createEmptyPhotoSession();

  assert.deepEqual(nextSession.photos, []);
  assert.notEqual(nextSession, previousSession);
  assert.equal(previousSession.photos[0], previousPhoto);
});

test('photo collection caps at three, stays ordered, and preserves distinct photo metadata', () => {
  let session = createEmptyPhotoSession();
  const photos = [createPhoto(), createPhoto(), createPhoto(), createPhoto()];
  photos.slice(0, maxSessionPhotos).forEach((photo) => { session = appendPhoto(session, photo); });
  const atLimit = appendPhoto(session, photos[3]);
  assert.equal(atLimit, session);
  assert.deepEqual(session.photos, photos.slice(0, 3));
  assert.notEqual(session.photos[0].blob, session.photos[1].blob);
  assert.equal(session.photos[0].capturedAt, photos[0].capturedAt);
  assert.equal(session.photos[0].width, photos[0].width);
  assert.equal(session.photos[0].height, photos[0].height);
  assert.equal(session.photos[0].mimeType, photos[0].mimeType);
  assert.equal(session.photos[0].objectUrl, photos[0].objectUrl);
  assert.equal(appendPhoto(session, photos[0]), session, 'one duplicate capture cannot add a second copy of the same ID');
});

test('a first capture occupies slot one in a fresh session', () => {
  const photo = createPhoto();
  const session = appendPhoto(createEmptyPhotoSession(), photo);
  assert.deepEqual(session.photos, [photo]);
});

test('retake replaces only the target photo and keeps its deterministic slot', () => {
  const first = createPhoto();
  const second = createPhoto();
  let session = appendPhoto(appendPhoto(createEmptyPhotoSession(), first), second);
  const replacement = createPhoto();
  session = replacePhoto(session, second.id, replacement);
  assert.equal(session.photos[0], first);
  assert.equal(session.photos[1].blob, replacement.blob);
  assert.equal(session.photos[1].id, second.id);
});

test('rapid capture requests during one countdown are rejected until the attempt completes', () => {
  const gate = createCaptureAttemptGate();
  assert.equal(gate.acquire(), true);
  for (let tap = 0; tap < 20; tap += 1) assert.equal(gate.acquire(), false);
  assert.equal(gate.isActive, true);
  gate.release();
  assert.equal(gate.acquire(), true);
  gate.release();
  assert.equal(gate.isActive, false);
});

test('object URL registry revokes removed/replaced URLs, preserves active previews, and disposes session URLs', () => {
  const revoked = [];
  let nextUrl = 0;
  const registry = new PhotoObjectUrlRegistry({
    createObjectURL: () => `blob:photo-${++nextUrl}`,
    revokeObjectURL: (url) => revoked.push(url),
  });
  const blob = new Blob(['photo'], { type: 'image/jpeg' });
  const firstUrl = registry.create(blob);
  const secondUrl = registry.create(blob);
  registry.releaseUnused(new Set([firstUrl]));
  assert.equal(registry.size, 1);
  assert.deepEqual(revoked, [secondUrl]);
  registry.releaseUnused(new Set());
  assert.deepEqual(revoked, [secondUrl, firstUrl]);
  const guestBUrl = registry.create(blob);
  registry.dispose();
  assert.deepEqual(revoked, [secondUrl, firstUrl, guestBUrl]);
  assert.equal(registry.size, 0);
});

test('invalid or unsupported captures cannot enter a photo session', () => {
  assert.equal(isValidCapturedPhotoData(null), false);
  assert.equal(isValidCapturedPhotoData(createPhoto({ blob: new Blob([], { type: 'image/jpeg' }) })), false);
  assert.equal(isValidCapturedPhotoData(createPhoto({ mimeType: 'image/gif' })), false);
  assert.equal(isValidCapturedPhotoData(createPhoto({ width: 0 })), false);
  assert.equal(isValidCapturedPhotoData(createPhoto({ capturedAt: Number.NaN })), false);
  assert.equal(isValidCapturedPhotoData(createPhoto({ capturedAt: 1e300 })), false);
  assert.equal(isValidCapturedPhotoData(createPhoto({ mimeType: 'image/png' })), false);
  assert.equal(isValidCapturedPhotoData(createPhoto()), true);
});

test('only one concurrent delivery runs, and a completed failure can be retried with the same photo', async () => {
  const guard = createDeliveryAttemptGuard();
  const photo = createPhoto();
  const session = { photos: [photo] };
  let calls = 0;
  let finishAttempt;
  const operation = () => {
    calls += 1;
    return new Promise((resolve) => { finishAttempt = resolve; });
  };

  const firstAttempt = guard.run(operation);
  const duplicateAttempt = await guard.run(operation);
  assert.equal(duplicateAttempt, null);
  assert.equal(calls, 1);
  assert.equal(guard.inFlight, true);

  finishAttempt({ status: 'failed', error: 'temporary failure' });
  const failure = await firstAttempt;
  assert.equal(failure.status, 'failed');
  assert.equal(guard.inFlight, false);
  assert.equal(session.photos[0], photo);
  assert.equal(session.photos[0], photo);
  assert.equal(photo.blob.size, 5);

  const retry = await guard.run(async () => {
    calls += 1;
    return { status: 'success', photo };
  });
  assert.equal(calls, 2);
  assert.equal(retry.photo, photo);
});

test('separate guest photos retain distinct identities through delivery callbacks', async () => {
  const guard = createDeliveryAttemptGuard();
  const photoA = createPhoto({ blob: new Blob(['guest A'], { type: 'image/jpeg' }) });
  const photoB = createPhoto({ blob: new Blob(['guest B'], { type: 'image/jpeg' }) });
  const delivered = [];

  await guard.run(async () => { delivered.push(photoA); return 'A'; });
  await guard.run(async () => { delivered.push(photoB); return 'B'; });

  assert.deepEqual(delivered, [photoA, photoB]);
  assert.notEqual(delivered[0].blob, delivered[1].blob);
  assert.equal(await delivered[0].blob.text(), 'guest A');
  assert.equal(await delivered[1].blob.text(), 'guest B');
});
