import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  remember, suggest, parseKnown, MAX_REMEMBERED, MAX_SUGGESTIONS,
} from '../js/known-players.js';

const known = (...names) => names.map((name) => ({ name, color: '#FF0000' }));

// --- remember ---

test('nové jméno se zapamatuje na začátku seznamu', () => {
  const result = remember(known('Petr'), { name: 'Jana', color: '#00FF00' });
  assert.deepEqual(result, [{ name: 'Jana', color: '#00FF00' }, { name: 'Petr', color: '#FF0000' }]);
});

test('známé jméno se posune na začátek a nezdvojí se', () => {
  const result = remember(known('Petr', 'Jana'), { name: 'Jana', color: '#FF0000' });
  assert.deepEqual(result.map((it) => it.name), ['Jana', 'Petr']);
});

test('u známého jména se přepíše barva na naposledy použitou', () => {
  const result = remember(known('Petr'), { name: 'Petr', color: '#0000FF' });
  assert.deepEqual(result, [{ name: 'Petr', color: '#0000FF' }]);
});

test('jméno se páruje bez ohledu na velikost písmen, zapíše se poslední tvar', () => {
  const result = remember(known('petr'), { name: 'PETR', color: '#FF0000' });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'PETR');
});

test('seznam nepřeroste strop, vypadne nejstarší jméno', () => {
  const full = known(...Array.from({ length: MAX_REMEMBERED }, (_, i) => `Hráč ${i}`));
  const result = remember(full, { name: 'Nový', color: '#FF0000' });

  assert.equal(result.length, MAX_REMEMBERED);
  assert.equal(result[0].name, 'Nový');
  assert.equal(result.some((it) => it.name === `Hráč ${MAX_REMEMBERED - 1}`), false);
});

test('prázdné jméno se nezapamatuje', () => {
  assert.deepEqual(remember(known('Petr'), { name: '   ', color: '#FF0000' }), known('Petr'));
});

// --- suggest ---

test('nabídnou se jména seřazená od naposledy použitého', () => {
  assert.deepEqual(
    suggest(known('Jana', 'Petr'), []).map((it) => it.name),
    ['Jana', 'Petr']
  );
});

test('hráči, kteří už jsou ve hře, se nenabízejí', () => {
  const result = suggest(known('Jana', 'Petr', 'Eva'), [{ name: 'Petr' }]);
  assert.deepEqual(result.map((it) => it.name), ['Jana', 'Eva']);
});

test('vyloučení hrajících nezáleží na velikosti písmen', () => {
  const result = suggest(known('Petr'), [{ name: 'petr' }]);
  assert.deepEqual(result, []);
});

test('nabídka nepřeroste strop', () => {
  const many = known(...Array.from({ length: MAX_REMEMBERED }, (_, i) => `Hráč ${i}`));
  assert.equal(suggest(many, []).length, MAX_SUGGESTIONS);
});

// --- parseKnown ---

test('poškozený nebo prázdný vstup dá prázdný seznam', () => {
  assert.deepEqual(parseKnown(null), []);
  assert.deepEqual(parseKnown(''), []);
  assert.deepEqual(parseKnown('{tohle není json'), []);
  assert.deepEqual(parseKnown('{"neni":"pole"}'), []);
});

test('vadné položky se zahodí, zbytek seznamu zůstane', () => {
  const json = '[{"name":"Petr","color":"#FF0000"},{"name":"Jana"},{"color":"#00FF00"},null]';
  assert.deepEqual(parseKnown(json), [{ name: 'Petr', color: '#FF0000' }]);
});
