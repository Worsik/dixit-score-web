import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateStorytellerRoles, MAX_PLAYERS, GRID_THRESHOLD } from '../js/rules.js';

// Test helper: builds a player with sensible defaults.
const p = (id, turnOrder, over = {}) => ({
  id, name: id, color: '#888888', score: 0,
  isStoryteller: false, isNextStoryteller: false, turnOrder, ...over
});

test('konstanty odpovídají předloze', () => {
  assert.equal(MAX_PLAYERS, 12);
  assert.equal(GRID_THRESHOLD, 6);
});

test('prázdný seznam vrátí prázdný seznam', () => {
  assert.deepEqual(updateStorytellerRoles([]), []);
});

test('bez vypravěče se jím stane první hráč', () => {
  const result = updateStorytellerRoles([p('a', 0), p('b', 1), p('c', 2)]);
  assert.equal(result[0].isStoryteller, true);
  assert.equal(result[1].isNextStoryteller, true);
  assert.equal(result[2].isNextStoryteller, false);
});

test('stávající vypravěč zůstává, další je následující v pořadí', () => {
  const result = updateStorytellerRoles([
    p('a', 0), p('b', 1, { isStoryteller: true }), p('c', 2)
  ]);
  assert.equal(result[1].isStoryteller, true);
  assert.equal(result[2].isNextStoryteller, true);
});

test('další vypravěč přeteče na začátek seznamu', () => {
  const result = updateStorytellerRoles([
    p('a', 0), p('b', 1), p('c', 2, { isStoryteller: true })
  ]);
  assert.equal(result[2].isStoryteller, true);
  assert.equal(result[0].isNextStoryteller, true);
});

test('určený vypravěč přebije stávajícího', () => {
  const result = updateStorytellerRoles(
    [p('a', 0, { isStoryteller: true }), p('b', 1), p('c', 2)], 'c'
  );
  assert.equal(result[2].isStoryteller, true);
  assert.equal(result[0].isStoryteller, false);
  assert.equal(result[0].isNextStoryteller, true);
});

test('u jediného hráče je vypravěč zároveň dalším vypravěčem', () => {
  const result = updateStorytellerRoles([p('a', 0)]);
  assert.equal(result[0].isStoryteller, true);
  assert.equal(result[0].isNextStoryteller, true);
});

test('neexistující určený vypravěč se ignoruje', () => {
  const result = updateStorytellerRoles([p('a', 0), p('b', 1, { isStoryteller: true })], 'zzz');
  assert.equal(result[1].isStoryteller, true);
});
