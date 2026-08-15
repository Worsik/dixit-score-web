/**
 * Opens, closes and re-renders a <dialog>.
 *
 * Text inputs are uncontrolled (AD-2), so a re-render that happens while the dialog is
 * open would wipe half-typed text - picking a colour is such a re-render. Their values
 * are therefore carried across.
 *
 * They are carried across ONLY while the dialog stays open. A closed dialog keeps the
 * previous occupant's markup, so on a fresh open the freshly rendered values are the
 * authoritative ones - restoring there would resurrect the previous player's name.
 */
export function syncDialog(dialog, isOpen, renderContent, inputIds = []) {
  if (!isOpen) {
    if (dialog.open) dialog.close();
    return;
  }

  const wasOpen = dialog.open;
  const saved = wasOpen
    ? inputIds.map((id) => dialog.querySelector(`#${id}`)?.value)
    : [];

  dialog.innerHTML = renderContent();

  if (wasOpen) {
    inputIds.forEach((id, index) => {
      const input = dialog.querySelector(`#${id}`);
      if (input && saved[index] !== undefined) input.value = saved[index];
    });
  }

  if (!dialog.open) dialog.showModal();
}
