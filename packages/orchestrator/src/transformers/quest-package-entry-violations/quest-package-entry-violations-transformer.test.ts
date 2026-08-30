import { QuestPackageEntryStub } from '@dungeonmaster/shared/contracts';

import { questPackageEntryViolationsTransformer } from './quest-package-entry-violations-transformer';

describe('questPackageEntryViolationsTransformer', () => {
  describe('location matches what changeType claims', () => {
    it('EMPTY: {entries: []} => returns empty array', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [],
        existingLocations: new Set<unknown>(),
        dependentsByPackage: new Map<unknown, unknown[]>(),
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {changeType: edit, location resolves on disk} => returns empty array', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({ name: 'web', location: './packages/web', changeType: 'edit' }),
        ],
        existingLocations: new Set<unknown>(['./packages/web']),
        dependentsByPackage: new Map<unknown, unknown[]>(),
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {changeType: delete, location resolves on disk} => returns empty array', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({ name: 'web', location: './packages/web', changeType: 'delete' }),
        ],
        existingLocations: new Set<unknown>(['./packages/web']),
        dependentsByPackage: new Map<unknown, unknown[]>(),
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {changeType: edit, location missing from disk} => names the entry, the location and the way out', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({ name: 'web', location: './packages/web', changeType: 'edit' }),
        ],
        existingLocations: new Set<unknown>(),
        dependentsByPackage: new Map<unknown, unknown[]>(),
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package entry 'web' declares changeType 'edit' but its location './packages/web' does not resolve on disk. An 'edit' or 'delete' entry names a package that already exists — correct the location, or set changeType to 'new' if this quest is what creates it.",
      ]);
    });

    it('INVALID: {changeType: delete, location missing from disk} => names the entry, the location and the way out', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({ name: 'web', location: './packages/web', changeType: 'delete' }),
        ],
        existingLocations: new Set<unknown>(),
        dependentsByPackage: new Map<unknown, unknown[]>(),
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package entry 'web' declares changeType 'delete' but its location './packages/web' does not resolve on disk. An 'edit' or 'delete' entry names a package that already exists — correct the location, or set changeType to 'new' if this quest is what creates it.",
      ]);
    });

    it('VALID: {changeType: new, location absent from disk, usedBy names a consumer} => returns empty array', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({
            name: 'queue-runner',
            location: './packages/queue-runner',
            changeType: 'new',
            usedBy: ['orchestrator'],
          }),
        ],
        existingLocations: new Set<unknown>(),
        dependentsByPackage: new Map<unknown, unknown[]>(),
      });

      expect(offenders).toStrictEqual([]);
    });

    it("INVALID: {changeType: new, location already on disk} => says a 'new' package is one this quest creates", () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            changeType: 'new',
            usedBy: ['server'],
          }),
        ],
        existingLocations: new Set<unknown>(['./packages/web']),
        dependentsByPackage: new Map<unknown, unknown[]>(),
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package entry 'web' declares changeType 'new' but its location './packages/web' already resolves on disk. A 'new' package is one this quest creates — set changeType to 'edit', or point location at the path the new package will actually live at.",
      ]);
    });
  });

  describe("'new' requires usedBy", () => {
    it('INVALID: {changeType: new, usedBy omitted} => explains the reverse edges have no other source', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({
            name: 'queue-runner',
            location: './packages/queue-runner',
            changeType: 'new',
          }),
        ],
        existingLocations: new Set<unknown>(),
        dependentsByPackage: new Map<unknown, unknown[]>(),
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package entry 'queue-runner' declares changeType 'new' but names no usedBy[] consumers. A package with no package.json on disk yet has no other source of reverse edges, so the post-quest dependency graph cannot place it — list every package that will depend on 'queue-runner'.",
      ]);
    });

    it('EMPTY: {changeType: new, usedBy: []} => an empty list is the same hole as an omitted one', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({
            name: 'queue-runner',
            location: './packages/queue-runner',
            changeType: 'new',
            usedBy: [],
          }),
        ],
        existingLocations: new Set<unknown>(),
        dependentsByPackage: new Map<unknown, unknown[]>(),
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package entry 'queue-runner' declares changeType 'new' but names no usedBy[] consumers. A package with no package.json on disk yet has no other source of reverse edges, so the post-quest dependency graph cannot place it — list every package that will depend on 'queue-runner'.",
      ]);
    });

    it('INVALID: {changeType: new, location on disk AND usedBy omitted} => reports both violations', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({ name: 'web', location: './packages/web', changeType: 'new' }),
        ],
        existingLocations: new Set<unknown>(['./packages/web']),
        dependentsByPackage: new Map<unknown, unknown[]>(),
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package entry 'web' declares changeType 'new' but its location './packages/web' already resolves on disk. A 'new' package is one this quest creates — set changeType to 'edit', or point location at the path the new package will actually live at.",
        "Package entry 'web' declares changeType 'new' but names no usedBy[] consumers. A package with no package.json on disk yet has no other source of reverse edges, so the post-quest dependency graph cannot place it — list every package that will depend on 'web'.",
      ]);
    });
  });

  describe("'delete' strands no dependent", () => {
    it('VALID: {delete of a package nothing depends on} => returns empty array', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({ name: 'web', location: './packages/web', changeType: 'delete' }),
        ],
        existingLocations: new Set<unknown>(['./packages/web']),
        dependentsByPackage: new Map<unknown, unknown[]>(),
      });

      expect(offenders).toStrictEqual([]);
    });

    it("VALID: {delete of shared, every dependent also declared 'edit' or 'delete'} => returns empty array", () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'delete',
          }),
          QuestPackageEntryStub({ name: 'cli', location: './packages/cli', changeType: 'edit' }),
          QuestPackageEntryStub({
            name: 'server',
            location: './packages/server',
            changeType: 'delete',
          }),
        ],
        existingLocations: new Set<unknown>([
          './packages/shared',
          './packages/cli',
          './packages/server',
        ]),
        dependentsByPackage: new Map<unknown, unknown[]>([['shared', ['cli', 'server']]]),
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {delete of shared, cli and server still depend on it and are not declared} => names both orphans', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'delete',
          }),
        ],
        existingLocations: new Set<unknown>(['./packages/shared']),
        dependentsByPackage: new Map<unknown, unknown[]>([['shared', ['cli', 'server']]]),
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package entry 'shared' declares changeType 'delete' but these packages still depend on it and are not declared as 'edit' or 'delete': cli, server. Removing 'shared' would leave the post-quest dependency graph with a dangling edge — add an entry for each of them (usually 'edit', for the import removal), or keep 'shared'.",
      ]);
    });

    it("INVALID: {delete of shared, its dependent is declared 'new'} => a package this quest has yet to create cannot already import it", () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'delete',
          }),
          QuestPackageEntryStub({
            name: 'cli',
            location: './packages/cli-next',
            changeType: 'new',
            usedBy: ['server'],
          }),
        ],
        existingLocations: new Set<unknown>(['./packages/shared']),
        dependentsByPackage: new Map<unknown, unknown[]>([['shared', ['cli']]]),
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package entry 'shared' declares changeType 'delete' but these packages still depend on it and are not declared as 'edit' or 'delete': cli. Removing 'shared' would leave the post-quest dependency graph with a dangling edge — add an entry for each of them (usually 'edit', for the import removal), or keep 'shared'.",
      ]);
    });

    it('INVALID: {delete whose location is missing AND whose dependent is unaccounted} => reports both violations', () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'delete',
          }),
        ],
        existingLocations: new Set<unknown>(),
        dependentsByPackage: new Map<unknown, unknown[]>([['shared', ['cli']]]),
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Package entry 'shared' declares changeType 'delete' but its location './packages/shared' does not resolve on disk. An 'edit' or 'delete' entry names a package that already exists — correct the location, or set changeType to 'new' if this quest is what creates it.",
        "Package entry 'shared' declares changeType 'delete' but these packages still depend on it and are not declared as 'edit' or 'delete': cli. Removing 'shared' would leave the post-quest dependency graph with a dangling edge — add an entry for each of them (usually 'edit', for the import removal), or keep 'shared'.",
      ]);
    });

    it("VALID: {edit entry whose package has unaccounted dependents} => the orphan rule applies to 'delete' alone", () => {
      const offenders = questPackageEntryViolationsTransformer({
        entries: [
          QuestPackageEntryStub({
            name: 'shared',
            location: './packages/shared',
            changeType: 'edit',
          }),
        ],
        existingLocations: new Set<unknown>(['./packages/shared']),
        dependentsByPackage: new Map<unknown, unknown[]>([['shared', ['cli', 'server']]]),
      });

      expect(offenders).toStrictEqual([]);
    });
  });
});
