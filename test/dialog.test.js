import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncDialog } from '../js/ui/dialog.js';

/**
 * Minimal stand-in for a <dialog>. Assigning innerHTML models a render: the fields are
 * replaced by whatever the current render produces, exactly like real markup would be.
 */
function fakeDialog() {
  return {
    open: false,
    fields: {},
    rendered: null,
    set innerHTML(html) {
      this.rendered = html;
      this.fields = { ...html };  // the "markup" is a plain {id: value} object
    },
    querySelector(selector) {
      const id = selector.replace('#', '');
      if (!(id in this.fields)) return null;
      const owner = this;
      return {
        get value() { return owner.fields[id]; },
        set value(next) { owner.fields[id] = next; },
      };
    },
    close() { this.open = false; },
    showModal() { this.open = true; },
  };
}

test('otevření zavřeného dialogu použije čerstvě vykreslené hodnoty', () => {
  const dialog = fakeDialog();

  // Úprava Anny se skóre 5
  syncDialog(dialog, true, () => ({ 'edit-name': 'Anna', 'edit-score': '5' }),
    ['edit-name', 'edit-score']);
  assert.equal(dialog.fields['edit-name'], 'Anna');

  // Zavřít - obsah zůstává v DOM
  syncDialog(dialog, false, () => ({}), ['edit-name', 'edit-score']);
  assert.equal(dialog.open, false);

  // Úprava Báry se skóre 0 nesmí ukázat Annu ani její skóre
  syncDialog(dialog, true, () => ({ 'edit-name': 'Bára', 'edit-score': '0' }),
    ['edit-name', 'edit-score']);
  assert.equal(dialog.fields['edit-name'], 'Bára');
  assert.equal(dialog.fields['edit-score'], '0');
});

test('dialog přidání se otevře s prázdným polem i po předchozím vyplnění', () => {
  const dialog = fakeDialog();

  syncDialog(dialog, true, () => ({ 'add-name': '' }), ['add-name']);
  dialog.fields['add-name'] = 'Anna';                       // uživatel píše
  syncDialog(dialog, false, () => ({ 'add-name': '' }), ['add-name']);  // potvrdí a zavře

  syncDialog(dialog, true, () => ({ 'add-name': '' }), ['add-name']);
  assert.equal(dialog.fields['add-name'], '');
});

test('překreslení otevřeného dialogu zachová rozepsaný text', () => {
  const dialog = fakeDialog();

  syncDialog(dialog, true, () => ({ 'add-name': '' }), ['add-name']);
  dialog.fields['add-name'] = 'Rozepsan';                   // uživatel píše

  // Výběr barvy = překreslení otevřeného dialogu; text musí přežít
  syncDialog(dialog, true, () => ({ 'add-name': '' }), ['add-name']);
  assert.equal(dialog.fields['add-name'], 'Rozepsan');
});

test('dialog bez textových polí se překresluje bez potíží', () => {
  const dialog = fakeDialog();
  syncDialog(dialog, true, () => ({ step: 'selection' }));
  assert.equal(dialog.open, true);
  syncDialog(dialog, true, () => ({ step: 'summary' }));
  assert.equal(dialog.fields.step, 'summary');
});
