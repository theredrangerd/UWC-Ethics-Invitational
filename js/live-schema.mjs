// js/live-schema.mjs
// Validation for data/live.json — the live competition board's single source of truth.

export const LIVE_STATES = ['round', 'main-room', 'break', 'info', 'finished'];

export function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isValidDate(value) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkList(data, key, errors, checkItem) {
  if (data[key] === undefined) return;
  if (!Array.isArray(data[key])) {
    errors.push(`${key} must be an array`);
    return;
  }
  data[key].forEach((item, i) => {
    const path = `${key}[${i}]`;
    if (!isObject(item)) {
      errors.push(`${path} must be an object`);
      return;
    }
    checkItem(item, path);
  });
}

/**
 * @param {unknown} data
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateLive(data) {
  const errors = [];

  if (!isObject(data)) {
    return { ok: false, errors: ['live.json must be a JSON object'] };
  }

  if (typeof data.enabled !== 'boolean') errors.push('enabled must be true or false');
  if (!LIVE_STATES.includes(data.state)) {
    errors.push(`state must be one of: ${LIVE_STATES.join(', ')}`);
  }
  if (!isNonEmptyString(data.headline)) errors.push('headline must be a non-empty string');
  if (!isValidDate(data.updated)) errors.push('updated must be a valid date/time');
  if (data.instruction !== undefined && typeof data.instruction !== 'string') {
    errors.push('instruction must be a string');
  }

  if (data.button !== undefined && data.button !== null) {
    if (!isObject(data.button)) {
      errors.push('button must be an object or null');
    } else {
      if (!isNonEmptyString(data.button.label)) errors.push('button.label must be a non-empty string');
      if (!isHttpUrl(data.button.url)) errors.push('button.url must be an http(s) URL');
    }
  }

  checkList(data, 'announcements', errors, (a, path) => {
    if (!isValidDate(a.time)) errors.push(`${path}.time must be a valid date/time`);
    if (!isNonEmptyString(a.text)) errors.push(`${path}.text must be a non-empty string`);
    if (a.pinned !== undefined && typeof a.pinned !== 'boolean') {
      errors.push(`${path}.pinned must be true or false`);
    }
  });

  checkList(data, 'schedule', errors, (s, path) => {
    if (!isValidDate(s.time)) errors.push(`${path}.time must be a valid date/time`);
    if (!isNonEmptyString(s.label)) errors.push(`${path}.label must be a non-empty string`);
  });

  checkList(data, 'links', errors, (l, path) => {
    if (!isNonEmptyString(l.label)) errors.push(`${path}.label must be a non-empty string`);
    if (!isHttpUrl(l.url)) errors.push(`${path}.url must be an http(s) URL`);
  });

  checkList(data, 'rooms', errors, (r, path) => {
    if (!isNonEmptyString(r.team)) errors.push(`${path}.team must be a non-empty string`);
    if (!isNonEmptyString(r.room)) errors.push(`${path}.room must be a non-empty string`);
    if (r.school !== undefined && typeof r.school !== 'string') {
      errors.push(`${path}.school must be a string`);
    }
  });

  return { ok: errors.length === 0, errors };
}
