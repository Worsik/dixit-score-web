import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  updateStorytellerRoles, pointsToDistribute, scoreRound, MAX_PLAYERS, GRID_THRESHOLD,
  reindexTurnOrder, addPlayer, removePlayer, movePlayer, startNewGame, applyScores,
  canConfirmBonusVotes
} from '../js/rules.js';

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

// --- Bodování kola ---

test('uhodli všichni: vypravěč 0, každý hlasující +2', () => {
  const result = scoreRound({ voterIds: ['b', 'c'], selectedIds: ['b', 'c'] });
  assert.equal(result.storytellerPoints, 0);
  assert.deepEqual(result.voterPoints, { b: 2, c: 2 });
});

test('neuhodl nikdo: vypravěč 0, každý hlasující +2', () => {
  const result = scoreRound({ voterIds: ['b', 'c'], selectedIds: [] });
  assert.equal(result.storytellerPoints, 0);
  assert.deepEqual(result.voterPoints, { b: 2, c: 2 });
});

test('uhodl někdo: vypravěč +3, kdo uhodl +3, kdo neuhodl 0', () => {
  const result = scoreRound({ voterIds: ['b', 'c', 'd'], selectedIds: ['b'] });
  assert.equal(result.storytellerPoints, 3);
  assert.deepEqual(result.voterPoints, { b: 3, c: 0, d: 0 });
});

test('bonusové body se přičítají k základu', () => {
  const result = scoreRound({
    voterIds: ['b', 'c'], selectedIds: ['b'], bonusAssignments: { b: 1, c: 2 }
  });
  assert.deepEqual(result.voterPoints, { b: 4, c: 2 });
});

test('bez hlasujících dá vypravěči 0 a prázdné body', () => {
  const result = scoreRound({ voterIds: [], selectedIds: [] });
  assert.equal(result.storytellerPoints, 0);
  assert.deepEqual(result.voterPoints, {});
});

test('bodů k rozdělení je tolik, kolik hlasujících neuhodlo', () => {
  assert.equal(pointsToDistribute(['b', 'c', 'd'], ['b']), 2);
  assert.equal(pointsToDistribute(['b', 'c'], []), 2);
  assert.equal(pointsToDistribute(['b', 'c'], ['b', 'c']), 0);
});

// --- Správa seznamu hráčů ---

test('přepočet pořadí přepíše turnOrder na index v poli', () => {
  const result = reindexTurnOrder([p('a', 7), p('b', 3), p('c', 9)]);
  assert.deepEqual(result.map((it) => it.turnOrder), [0, 1, 2]);
});

test('nový hráč jde na konec pořadí a role se přepočítají', () => {
  const result = addPlayer([p('a', 0, { isStoryteller: true })], p('b', 99));
  assert.deepEqual(result.map((it) => it.id), ['a', 'b']);
  assert.equal(result[1].turnOrder, 1);
  assert.equal(result[0].isStoryteller, true);
  assert.equal(result[1].isNextStoryteller, true);
});

test('smazání hráče přepočítá pořadí', () => {
  const result = removePlayer([p('a', 0), p('b', 1), p('c', 2)], 'b');
  assert.deepEqual(result.map((it) => it.id), ['a', 'c']);
  assert.deepEqual(result.map((it) => it.turnOrder), [0, 1]);
});

test('smazání vypravěče předá roli označenému dalšímu', () => {
  const players = [
    p('a', 0, { isStoryteller: true }),
    p('b', 1, { isNextStoryteller: true }),
    p('c', 2)
  ];
  const result = removePlayer(players, 'a');
  assert.equal(result.find((it) => it.id === 'b').isStoryteller, true);
});

test('smazání posledního hráče vrátí prázdný seznam', () => {
  assert.deepEqual(removePlayer([p('a', 0)], 'a'), []);
});

test('přesun hráče přeskládá pořadí', () => {
  const result = movePlayer([p('a', 0), p('b', 1), p('c', 2)], 0, 2);
  assert.deepEqual(result.map((it) => it.id), ['b', 'c', 'a']);
  assert.deepEqual(result.map((it) => it.turnOrder), [0, 1, 2]);
});

test('nová hra vynuluje skóre a nastaví vybraného vypravěče', () => {
  const players = [
    p('a', 0, { score: 12, isStoryteller: true }),
    p('b', 1, { score: 7 })
  ];
  const result = startNewGame(players, 'b');
  assert.deepEqual(result.map((it) => it.score), [0, 0]);
  assert.equal(result[1].isStoryteller, true);
  assert.equal(result[0].isNextStoryteller, true);
});

test('zápis bodů přičte body a posune vypravěče na označeného dalšího', () => {
  const players = [
    p('a', 0, { score: 5, isStoryteller: true }),
    p('b', 1, { score: 5, isNextStoryteller: true }),
    p('c', 2, { score: 5 })
  ];
  const result = applyScores(players, {
    storytellerId: 'a', storytellerPoints: 3, voterPoints: { b: 3, c: 0 }
  });
  assert.deepEqual(result.map((it) => it.score), [8, 8, 5]);
  assert.equal(result[1].isStoryteller, true);
  assert.equal(result[2].isNextStoryteller, true);
});

// --- Potvrzení bonusových bodů ---

test('bonusy nelze potvrdit, dokud zbývají nerozdané body', () => {
  assert.equal(canConfirmBonusVotes(2, ['b'], { b: 1 }), false);
});

test('bonusy nelze potvrdit, když vybraný hráč nemá ani bod', () => {
  assert.equal(canConfirmBonusVotes(2, ['b', 'c'], { b: 2, c: 0 }), false);
});

test('bonusy lze potvrdit, když jsou body rozdány a každý vybraný má aspoň bod', () => {
  assert.equal(canConfirmBonusVotes(2, ['b', 'c'], { b: 1, c: 1 }), true);
});

test('bez bodů k rozdělení a bez vybraných hráčů lze potvrdit', () => {
  assert.equal(canConfirmBonusVotes(0, [], {}), true);
});
