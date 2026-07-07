import test from 'node:test';
import assert from 'node:assert/strict';
import { canUserDownload, DOWNLOAD_LIMIT_PER_DAY, getDayKey } from '../utils/downloads.js';

test('free users can download once per day', () => {
  const result = canUserDownload({ plan: 'free' }, 0);

  assert.equal(result.allowed, true);
  assert.equal(result.remaining, DOWNLOAD_LIMIT_PER_DAY);
  assert.equal(result.limit, DOWNLOAD_LIMIT_PER_DAY);
});

test('free users are blocked after reaching the daily download limit', () => {
  const result = canUserDownload({ plan: 'free' }, DOWNLOAD_LIMIT_PER_DAY);

  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'limit');
  assert.equal(result.remaining, 0);
});

test('premium users can download without the daily cap', () => {
  const result = canUserDownload({ plan: 'gold' }, 10);

  assert.equal(result.allowed, true);
  assert.equal(result.limit, null);
  assert.equal(result.remaining, null);
});

test('day keys are generated as yyyy-mm-dd', () => {
  const key = getDayKey(new Date('2026-06-25T13:45:00.000Z'));

  assert.equal(key, '2026-06-25');
});
