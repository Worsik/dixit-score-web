import { test } from 'node:test';
import assert from 'node:assert/strict';
import { t, translate, STRINGS } from '../js/i18n.js';

test('vrátí text v požadovaném jazyce', () => {
  assert.equal(translate('cs', 'add_player'), 'Přidat hráče');
  assert.equal(translate('en', 'add_player'), 'Add Player');
});

test('neznámý jazyk spadne zpět na angličtinu', () => {
  assert.equal(translate('de', 'add_player'), 'Add Player');
});

test('dosadí poziční argumenty', () => {
  assert.equal(translate('en', 'scoring_button_round', 3), 'Scoring for round 3');
  assert.equal(translate('cs', 'scoring_button_round', 3), 'Hodnocení pro 3. kolo');
  assert.ok(translate('cs', 'delete_player_confirmation_message', 'Petr').includes('Petr'));
});

test('neznámý klíč vrátí klíč sám', () => {
  assert.equal(translate('en', 'tohle_neexistuje'), 'tohle_neexistuje');
});

test('oba jazyky mají stejnou sadu klíčů', () => {
  assert.deepEqual(Object.keys(STRINGS.en).sort(), Object.keys(STRINGS.cs).sort());
});

test('t je funkce', () => {
  assert.equal(typeof t, 'function');
});
