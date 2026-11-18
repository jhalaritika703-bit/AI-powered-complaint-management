import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAnalysis } from '../src/services/gemini.js';

const valid = {
  category: 'Delivery',
  priority: 'High',
  priorityReason: 'Order is two weeks late.',
  summary: 'Customer has not received an order after two weeks.',
  suggestedResponse: 'Hi Sam, we are sorry about the delay and are looking into it. Customer Support Team',
};

test('accepts a valid analysis', () => {
  assert.deepEqual(parseAnalysis(JSON.stringify(valid)), valid);
});

test('accepts JSON wrapped in markdown fences', () => {
  assert.equal(parseAnalysis('```json\n' + JSON.stringify(valid) + '\n```').category, 'Delivery');
});

test('strips unexpected extra keys', () => {
  const out = parseAnalysis(JSON.stringify({ ...valid, hacked: true }));
  assert.equal('hacked' in out, false);
});

test('rejects invalid JSON', () => {
  assert.throws(() => parseAnalysis('not json'), /invalid JSON/);
});

test('rejects empty output', () => {
  assert.throws(() => parseAnalysis(''), /Empty/);
  assert.throws(() => parseAnalysis(undefined), /Empty/);
});

test('rejects a category outside the allowed list', () => {
  assert.throws(() => parseAnalysis(JSON.stringify({ ...valid, category: 'Shipping' })), /validation/);
});

test('rejects a priority outside the allowed list', () => {
  assert.throws(() => parseAnalysis(JSON.stringify({ ...valid, priority: 'Urgent' })), /validation/);
});

test('rejects missing fields', () => {
  const { summary, ...rest } = valid;
  assert.throws(() => parseAnalysis(JSON.stringify(rest)), /summary/);
});
