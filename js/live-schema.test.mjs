import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLive, isHttpUrl, LIVE_STATES } from './live-schema.mjs';

const base = () => ({
  enabled: true,
  state: 'round',
  headline: 'HEAT 1 IN PROGRESS',
  updated: '2026-11-21T19:30:00+08:00',
});

function errorsFor(patch) {
  return validateLive({ ...base(), ...patch }).errors;
}

function assertErrorMentions(errors, needle) {
  assert.ok(
    errors.some((e) => e.includes(needle)),
    `expected an error mentioning "${needle}", got: ${JSON.stringify(errors)}`
  );
}

test('minimal valid file is ok', () => {
  assert.deepEqual(validateLive(base()), { ok: true, errors: [] });
});

test('non-object is not ok', () => {
  assert.equal(validateLive(null).ok, false);
  assert.equal(validateLive([]).ok, false);
  assert.equal(validateLive('x').ok, false);
});

test('LIVE_STATES lists the five states', () => {
  assert.deepEqual(LIVE_STATES, ['round', 'main-room', 'break', 'info', 'finished']);
});

test('enabled must be boolean', () => {
  assertErrorMentions(errorsFor({ enabled: 'yes' }), 'enabled');
});

test('state must be a known state', () => {
  assertErrorMentions(errorsFor({ state: 'bogus' }), 'state');
});

test('headline must be non-empty', () => {
  assertErrorMentions(errorsFor({ headline: '   ' }), 'headline');
});

test('updated must be a parseable date', () => {
  assertErrorMentions(errorsFor({ updated: 'not a date' }), 'updated');
});

test('instruction must be a string when present', () => {
  assertErrorMentions(errorsFor({ instruction: 5 }), 'instruction');
});

test('button with javascript: url is rejected', () => {
  assertErrorMentions(
    errorsFor({ button: { label: 'Go', url: 'javascript:alert(1)' } }),
    'button.url'
  );
});

test('button needs a label', () => {
  assertErrorMentions(
    errorsFor({ button: { label: '', url: 'https://example.com' } }),
    'button.label'
  );
});

test('button null is valid', () => {
  assert.equal(validateLive({ ...base(), button: null }).ok, true);
});

test('announcement with bad time is reported with its index', () => {
  assertErrorMentions(
    errorsFor({ announcements: [{ time: '2026-11-21T19:00:00+08:00', text: 'ok' }, { time: 'x', text: 'hi' }] }),
    'announcements[1].time'
  );
});

test('announcement with empty text is reported', () => {
  assertErrorMentions(
    errorsFor({ announcements: [{ time: '2026-11-21T19:00:00+08:00', text: '' }] }),
    'announcements[0].text'
  );
});

test('announcement pinned must be boolean when present', () => {
  assertErrorMentions(
    errorsFor({ announcements: [{ time: '2026-11-21T19:00:00+08:00', text: 'a', pinned: 'yes' }] }),
    'announcements[0].pinned'
  );
});

test('rooms entry needs a room', () => {
  assertErrorMentions(errorsFor({ rooms: [{ team: 'A' }] }), 'rooms[0].room');
});

test('links entry with ftp url is rejected', () => {
  assertErrorMentions(
    errorsFor({ links: [{ label: 'x', url: 'ftp://example.com' }] }),
    'links[0].url'
  );
});

test('schedule entry with bad time is reported', () => {
  assertErrorMentions(errorsFor({ schedule: [{ time: 'later', label: 'Heat 1' }] }), 'schedule[0].time');
});

test('optional arrays may be omitted', () => {
  const { announcements, schedule, links, rooms } = base();
  assert.equal(announcements, undefined);
  assert.equal(schedule, undefined);
  assert.equal(links, undefined);
  assert.equal(rooms, undefined);
  assert.equal(validateLive(base()).ok, true);
});

test('optional arrays must be arrays when present', () => {
  assertErrorMentions(errorsFor({ announcements: 'none' }), 'announcements');
});

test('collects every error rather than stopping at the first', () => {
  const { errors } = validateLive({ enabled: 'x', state: 'bogus', headline: '', updated: 'nope' });
  assert.ok(errors.length >= 4, JSON.stringify(errors));
});

test('isHttpUrl accepts only http and https', () => {
  assert.equal(isHttpUrl('https://zoom.us/j/1'), true);
  assert.equal(isHttpUrl('http://example.com'), true);
  assert.equal(isHttpUrl('javascript:alert(1)'), false);
  assert.equal(isHttpUrl('ftp://example.com'), false);
  assert.equal(isHttpUrl('not a url'), false);
  assert.equal(isHttpUrl(undefined), false);
});
