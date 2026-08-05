/**
 * PURPOSE: The Create Feature / Create Bug choices offered on the new-quest chat surface, paired
 * with the QuestType each one creates.
 *
 * USAGE:
 * questTypeOptionsStatics.options;
 * // Returns [{ label: 'Create Feature', questType: 'feature' }, { label: 'Create Bug', questType: 'bug-hunt' }]
 * questTypeOptionsStatics.defaultLabel;
 * // Returns 'Create Feature' — the selection the composer starts on.
 *
 * This is DATA only. The dropdown renders `label` (FormDropdownWidget shows the option value
 * verbatim, so the label IS the select value) and the composer maps the chosen label back to
 * `questType` for questNewBroker. Keeping both halves in one list is what stops the rendered
 * choices and the values actually POSTed from drifting apart.
 */

export const questTypeOptionsStatics = {
  options: [
    { label: 'Create Feature', questType: 'feature' },
    { label: 'Create Bug', questType: 'bug-hunt' },
  ],
  defaultLabel: 'Create Feature',
} as const;
