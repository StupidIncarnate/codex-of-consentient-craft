/**
 * PURPOSE: Represents a `{step.row.field}` reference a run cannot resolve against the steps named
 * so far — a step no earlier `as:` declared, a row that step's plan did not save, a field that row
 * does not carry, or a two-segment form (`{step.field}`) that reads like `as:` names a ROW when it
 * names a STEP. Every reason renders what the reference asked for against what is actually
 * available, because "unresolved reference" sends a caller back to guessing what to type instead.
 *
 * USAGE:
 * throw new StepRefUnresolvedError({ ref: '{g.guildId}', reason: 'two-segment', step: 'g', row: null, field: null, available: ['guild'] });
 * throw new StepRefUnresolvedError({ ref: '{zzz.guild.id}', reason: 'unknown-step', step: 'zzz', row: null, field: null, available: ['g'] });
 * throw new StepRefUnresolvedError({ ref: '{g.session.id}', reason: 'unknown-row', step: 'g', row: 'session', field: null, available: ['guild'] });
 * throw new StepRefUnresolvedError({ ref: '{g.guild.slug}', reason: 'unknown-field', step: 'g', row: 'guild', field: 'slug', available: ['id', 'urlSlug'] });
 * // Throws error naming the reference, what was wrong, and every option that reason's stage holds
 *
 * WHEN-TO-USE: From `stepRefResolveTransformer`, once a `{step.row.field}` reference cannot be
 * resolved against the map of steps named so far — before the malformed value ever reaches a
 * browser or a recipe.
 * WHEN-NOT-TO-USE: When every segment resolves — resolution proceeds and never throws this.
 */
export class StepRefUnresolvedError extends Error {
  public constructor({
    ref,
    reason,
    step,
    row,
    field,
    available,
  }: {
    ref: string;
    reason: 'two-segment' | 'unknown-step' | 'unknown-row' | 'unknown-field';
    step: string;
    row: string | null;
    field: string | null;
    available: readonly string[];
  }) {
    const availableList = available.length > 0 ? available.join(', ') : '(none)';

    if (reason === 'two-segment') {
      super(
        `Step reference "${ref}" has two segments — "as:" names a STEP's output, and a step's output holds one or more ROWS, so a reference always has three: {step.row.field}. Step "${step}" saved: ${availableList}.`,
      );
    } else if (reason === 'unknown-step') {
      super(
        `Step reference "${ref}" names step "${step}", but no earlier step named its output "${step}" with as:. Steps named so far: ${availableList}.`,
      );
    } else if (reason === 'unknown-row') {
      super(
        `Step reference "${ref}" names row "${String(row)}" on step "${step}", but step "${step}" saved no row by that name. It saved: ${availableList}.`,
      );
    } else {
      super(
        `Step reference "${ref}" names field "${String(field)}" on row "${String(row)}" of step "${step}", but that row carries no field "${String(field)}". It carries: ${availableList}.`,
      );
    }
    this.name = 'StepRefUnresolvedError';
  }
}
