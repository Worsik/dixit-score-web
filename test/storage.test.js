import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serialize, deserialize } from '../js/storage.js';

const sample = {
  players: [{
    id: 'a', name: 'Petr', color: '#FF0000', score: 5,
    isStoryteller: true, isNextStoryteller: false, turnOrder: 0
  }],
  roundNumber: 3
};

test('serializace a zpětné načtení vrátí ekvivalentní stav', () => {
  assert.deepEqual(deserialize(serialize(sample)), sample);
});

test('serializovaný záznam nese číslo verze', () => {
  assert.equal(JSON.parse(serialize(sample)).v, 1);
});

test('stav UI se neukládá', () => {
  const stored = JSON.parse(serialize({ ...sample, addDialog: { isOpen: true } }));
  assert.equal(stored.addDialog, undefined);
});

test('neznámá verze se ignoruje', () => {
  assert.equal(deserialize('{"v":99,"players":[],"roundNumber":1}'), null);
});

test('poškozený JSON se ignoruje', () => {
  assert.equal(deserialize('{tohle není json'), null);
});

test('prázdný vstup se ignoruje', () => {
  assert.equal(deserialize(null), null);
  assert.equal(deserialize(''), null);
});

test('záznam bez pole hráčů se ignoruje', () => {
  assert.equal(deserialize('{"v":1,"roundNumber":1}'), null);
});
