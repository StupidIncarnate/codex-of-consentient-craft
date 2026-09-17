import { StepRefUnresolvedError } from './step-ref-unresolved-error';

describe('StepRefUnresolvedError', () => {
  describe('constructor()', () => {
    it('VALID: {reason: two-segment} => names the step and lists the rows it saved', () => {
      const error = new StepRefUnresolvedError({
        ref: '{g.guildId}',
        reason: 'two-segment',
        step: 'g',
        row: null,
        field: null,
        available: ['guild'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepRefUnresolvedError',
        message:
          'Step reference "{g.guildId}" has two segments — "as:" names a STEP\'s output, and a step\'s output holds one or more ROWS, so a reference always has three: {step.row.field}. Step "g" saved: guild.',
      });
    });

    it('VALID: {reason: unknown-step} => lists the steps named so far', () => {
      const error = new StepRefUnresolvedError({
        ref: '{zzz.guild.id}',
        reason: 'unknown-step',
        step: 'zzz',
        row: null,
        field: null,
        available: ['g'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepRefUnresolvedError',
        message:
          'Step reference "{zzz.guild.id}" names step "zzz", but no earlier step named its output "zzz" with as:. Steps named so far: g.',
      });
    });

    it('EMPTY: {reason: unknown-step, available: []} => says none, rather than trailing off after a colon', () => {
      const error = new StepRefUnresolvedError({
        ref: '{zzz.guild.id}',
        reason: 'unknown-step',
        step: 'zzz',
        row: null,
        field: null,
        available: [],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepRefUnresolvedError',
        message:
          'Step reference "{zzz.guild.id}" names step "zzz", but no earlier step named its output "zzz" with as:. Steps named so far: (none).',
      });
    });

    it('VALID: {reason: unknown-row} => names the row and lists the rows the step DID save', () => {
      const error = new StepRefUnresolvedError({
        ref: '{g.session.id}',
        reason: 'unknown-row',
        step: 'g',
        row: 'session',
        field: null,
        available: ['guild'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepRefUnresolvedError',
        message:
          'Step reference "{g.session.id}" names row "session" on step "g", but step "g" saved no row by that name. It saved: guild.',
      });
    });

    it("VALID: {reason: unknown-field} => names the field and lists the row's fields", () => {
      const error = new StepRefUnresolvedError({
        ref: '{g.guild.slug}',
        reason: 'unknown-field',
        step: 'g',
        row: 'guild',
        field: 'slug',
        available: ['id', 'urlSlug'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'StepRefUnresolvedError',
        message:
          'Step reference "{g.guild.slug}" names field "slug" on row "guild" of step "g", but that row carries no field "slug". It carries: id, urlSlug.',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof StepRefUnresolvedError => returns true', () => {
      const error = new StepRefUnresolvedError({
        ref: '{g.guildId}',
        reason: 'two-segment',
        step: 'g',
        row: null,
        field: null,
        available: ['guild'],
      });

      expect(error instanceof StepRefUnresolvedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new StepRefUnresolvedError({
        ref: '{g.guildId}',
        reason: 'two-segment',
        step: 'g',
        row: null,
        field: null,
        available: ['guild'],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
