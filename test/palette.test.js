import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PALETTE, nextFreeColor } from '../js/palette.js';

test('bez použitých barev vrátí první z palety', () => {
  assert.equal(nextFreeColor([]), PALETTE[0]);
});

test('použité barvy se přeskočí', () => {
  assert.equal(nextFreeColor([PALETTE[0], PALETTE[1]]), PALETTE[2]);
});

test('nezáleží na pořadí použitých barev', () => {
  assert.equal(nextFreeColor([PALETTE[1], PALETTE[0]]), PALETTE[2]);
});

test('s výchozí barvou hledá až za ní', () => {
  assert.equal(nextFreeColor([], PALETTE[3]), PALETTE[4]);
});

test('hledání za výchozí barvou přeskočí obsazené', () => {
  assert.equal(nextFreeColor([PALETTE[4]], PALETTE[3]), PALETTE[5]);
});

test('hledání se na konci palety otočí na začátek', () => {
  const posledni = PALETTE[PALETTE.length - 1];
  assert.equal(nextFreeColor([], posledni), PALETTE[0]);
});

test('když jsou všechny barvy obsazené, vrátí první z palety', () => {
  assert.equal(nextFreeColor([...PALETTE]), PALETTE[0]);
});

test('barva mimo paletu se bere, jako by nebyla zadaná', () => {
  assert.equal(nextFreeColor([], '#123456'), PALETTE[0]);
});
