import { readFileSync, readdirEntriesSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import {
  dungeonmasterRuleEnforceOnStatics,
  gatewayLocationsStatics,
} from '@dungeonmaster/shared/statics';
import { configDungeonmasterBroker } from './brokers/config/dungeonmaster/config-dungeonmaster-broker';

// Rules registered at 'error' in configDungeonmasterBroker that still carry no
// dungeonmasterRuleEnforceOnStatics entry — genuinely ward-only. Each needs the TYPE CHECKER (the
// program `parserServices` expose), so it cannot run pre-edit (the hook parses one file in
// isolation, no program) and 'post-edit' would fail the fs-operation check below (these rules read
// no file — they call the type checker, not fsExistsSyncAdapter/fsReadFileSyncAdapter). BR row 2194:
// `enforce-folder-return-types` "loses its tag" once R1 lands, and `ban-primitives` and
// `require-zod-on-primitives` have left the map — dropped entirely, not given a third timing value.
const WARD_ONLY_TYPE_CHECKED_RULES = [
  '@dungeonmaster/enforce-folder-return-types',
  '@dungeonmaster/raw-import-ban',
  '@dungeonmaster/platform-globals-ban',
  '@dungeonmaster/bin-program-spawn-ban',
  '@dungeonmaster/require-contract-parse',
  '@dungeonmaster/enforce-unique-contract-names',
  '@dungeonmaster/enforce-owner-field-reuse',
];

interface Violation {
  ruleName: unknown;
  specifier: unknown;
  location: unknown;
}

// This file's own directory IS `packages/eslint-plugin/src` (ts-jest resolves `__dirname` to the
// source file's real location, not a compiled `dist` layout), so a rule's folder sits directly
// below it — no `../../` climb needed.
const RULE_FOLDER_ROOT = join(__dirname, 'brokers', 'rule');

// Files beside a rule's own implementation that are never part of what the rule DOES at lint
// time: its own test, its own mock-composing proxy, and any hand-built fixture stub.
const NON_IMPLEMENTATION_SUFFIXES = ['.test.ts', '.proxy.ts', '.stub.ts'];

// Every real implementation file inside one rule's folder — the entry `rule-<slug>-broker.ts` AND
// any layer broker beside it (`enforce-project-structure`'s "flat beside the parent" rule means
// this never needs to recurse into subfolders). Reading a rule's REAL folder listing, rather than
// guessing one filename, is what lets this check see fs work a layer file does on the rule's
// behalf. Untyped (`unknown[]`) rather than `FilePath[]`: a test file may not import a contract
// value (`@dungeonmaster/shared/contracts` ships only stubs here), and there is no stub for "a
// path this test just walked off disk".
const ruleImplementationFilePaths = ({ ruleSlug }: { ruleSlug: string }): unknown[] => {
  const ruleDir = join(RULE_FOLDER_ROOT, ruleSlug);
  return readdirEntriesSync(ruleDir)
    .filter((entry) => entry.kind === 'file' && entry.name.endsWith('.ts'))
    .filter((entry) => !NON_IMPLEMENTATION_SUFFIXES.some((suffix) => entry.name.endsWith(suffix)))
    .map((entry) => join(ruleDir, entry.name));
};

// Matches an import/export-from specifier, a `require(...)` call, or a dynamic `import(...)` —
// never comment text, so a doc comment that merely NAMES a pattern (`ban-gateway-export`'s own
// header prose mentions "readFileSync") can never match this.
const IMPORT_SPECIFIER_REGEX = /(?:from\s+|require\(\s*|import\(\s*)['"]([^'"]+)['"]/gu;
const BLOCK_COMMENT_REGEX = /\/\*[\s\S]*?\*\//gu;
const LINE_COMMENT_REGEX = /\/\/[^\n]*/gu;

// Blanks comment TEXT to spaces, character-for-character (never deletes a character), so a doc
// comment mentioning an import-shaped string (`ban-gateway-export`'s own header prose: "Flags
// `import { readFileSync } from '#gateway/node/fs'`") can never match IMPORT_SPECIFIER_REGEX, and
// every real specifier keeps its exact file offset for line-number reporting.
const withCommentsBlanked = (contents: string) =>
  contents
    .replace(BLOCK_COMMENT_REGEX, (match) => match.replace(/[^\n]/gu, ' '))
    .replace(LINE_COMMENT_REGEX, (match) => ' '.repeat(match.length));

const importSpecifiersInFile = ({
  filePath,
}: {
  filePath: string;
}): { specifier: unknown; location: unknown }[] => {
  const contents = readFileSync(filePath);
  const scannable = withCommentsBlanked(contents);
  return Array.from(scannable.matchAll(IMPORT_SPECIFIER_REGEX)).map((match) => {
    const specifier = match[1] ?? '';
    const upToMatch = scannable.slice(0, match.index);
    const lineNumber = upToMatch.split('\n').length;
    return { specifier, location: `${filePath}:${String(lineNumber)}` };
  });
};

// The gateway's own fs barrels — built from the statics, never hardcoded, so a renamed gateway
// folder or fs subpath still matches. A per-file subpath import
// (`#gateway/node/fs__promises/ensure-dir/ensure-dir`) starts with one of these too.
const gatewayFsBarrelSpecifiers = [
  `${gatewayLocationsStatics.importPrefix}/${gatewayLocationsStatics.folders.node}/fs`,
  `${gatewayLocationsStatics.importPrefix}/${gatewayLocationsStatics.folders.node}/fs__promises`,
];

// A specifier "does file-system work" either through the not-yet-migrated raw adapter path
// (`.../adapters/fs/<name>/fs-<name>-adapter`) or through the gateway's own fs barrels.
const isFsOperationSpecifier = ({ specifier }: { specifier: string }): boolean => {
  if (specifier.includes('/adapters/fs/')) {
    return true;
  }
  return gatewayFsBarrelSpecifiers.some(
    (barrelSpecifier) =>
      specifier === barrelSpecifier || specifier.startsWith(`${barrelSpecifier}/`),
  );
};

const getPreEditDungeonmasterRules = (): unknown[] => {
  return Object.entries(dungeonmasterRuleEnforceOnStatics)
    .filter(([ruleName, timing]) => {
      return timing === 'pre-edit' && ruleName.startsWith('@dungeonmaster/');
    })
    .map(([ruleName]) => {
      return ruleName;
    });
};

const getPostEditDungeonmasterRules = (): unknown[] => {
  return Object.entries(dungeonmasterRuleEnforceOnStatics)
    .filter(([ruleName, timing]) => {
      return timing === 'post-edit' && ruleName.startsWith('@dungeonmaster/');
    })
    .map(([ruleName]) => {
      return ruleName;
    });
};

const getAllPostEditRules = (): unknown[] => {
  return Object.entries(dungeonmasterRuleEnforceOnStatics).filter(([_, timing]) => {
    return timing === 'post-edit';
  });
};

const getPreEditRuleCount = (): unknown => {
  return Object.values(dungeonmasterRuleEnforceOnStatics).filter((timing) => {
    return timing === 'pre-edit';
  }).length;
};

const getPostEditRuleCount = (): unknown => {
  return Object.values(dungeonmasterRuleEnforceOnStatics).filter((timing) => {
    return timing === 'post-edit';
  }).length;
};

const checkPreEditRulesForFsOperations = (rules: unknown[]): Violation[] => {
  const violatingRules: Violation[] = [];

  rules.forEach((ruleName) => {
    const ruleSlug = String(ruleName).replace('@dungeonmaster/', '');
    const filePaths = ruleImplementationFilePaths({ ruleSlug });

    filePaths.forEach((filePath) => {
      importSpecifiersInFile({ filePath: String(filePath) }).forEach(({ specifier, location }) => {
        if (!isFsOperationSpecifier({ specifier: String(specifier) })) {
          return;
        }
        violatingRules.push({ ruleName, specifier, location });
      });
    });
  });

  return violatingRules;
};

const checkPostEditRulesForFsOperations = (rules: unknown[]): unknown[] => {
  const rulesWithoutFsOps: unknown[] = [];

  rules.forEach((ruleName) => {
    const ruleSlug = String(ruleName).replace('@dungeonmaster/', '');
    const filePaths = ruleImplementationFilePaths({ ruleSlug });

    const hasFs = filePaths.some((filePath) =>
      importSpecifiersInFile({ filePath: String(filePath) }).some(({ specifier }) =>
        isFsOperationSpecifier({ specifier: String(specifier) }),
      ),
    );

    if (!hasFs) {
      rulesWithoutFsOps.push(ruleName);
    }
  });

  return rulesWithoutFsOps;
};

const throwErrorIfViolationsFound = (violatingRules: Violation[]): void => {
  if (violatingRules.length > 0) {
    const errorMessage = violatingRules
      .map((v) => {
        return [String(v.ruleName), ' uses ', String(v.specifier), ' at ', String(v.location)].join(
          '',
        );
      })
      .join('\n');
    throw new Error(
      `Pre-edit rules must not use file system operations. Found violations:\n${errorMessage}\n\nThese rules should be marked as 'post-edit' in dungeonmasterRuleEnforceOnStatics.`,
    );
  }
};

const throwErrorIfRulesWithoutFs = (rulesWithoutFsOps: unknown[]): void => {
  if (rulesWithoutFsOps.length > 0) {
    const errorMessage = rulesWithoutFsOps.map(String).join('\n');
    throw new Error(
      `Post-edit rules must use file system operations. Found rules without fs operations:\n${errorMessage}\n\nThese rules should be marked as 'pre-edit' in dungeonmasterRuleEnforceOnStatics.`,
    );
  }
};

const getRegisteredDungeonmasterRules = (): unknown[] => {
  const config = configDungeonmasterBroker({ forTesting: false });
  const allRules = Object.keys(config.typescript.rules ?? {});
  return allRules.filter((rule) => {
    return rule.startsWith('@dungeonmaster/');
  });
};

const getStaticsDungeonmasterRules = (): unknown[] => {
  return Object.keys(dungeonmasterRuleEnforceOnStatics).filter((rule) => {
    return rule.startsWith('@dungeonmaster/');
  });
};

const getMissingRules = (registeredRules: unknown[], staticsRules: unknown[]): unknown[] => {
  return registeredRules.filter((rule) => {
    return !staticsRules.includes(rule);
  });
};

const excludeWardOnlyTypeCheckedRules = (rules: unknown[]): unknown[] => {
  return rules.filter((rule) => {
    return !WARD_ONLY_TYPE_CHECKED_RULES.includes(String(rule));
  });
};

const throwErrorIfMissingRules = (missingRules: unknown[]): void => {
  if (missingRules.length > 0) {
    const errorMessage = missingRules.map(String).join('\n');
    throw new Error(
      `Missing rules in dungeonmasterRuleEnforceOnStatics:\n${errorMessage}\n\nAdd these rules to src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts with 'pre-edit' or 'post-edit' timing.`,
    );
  }
};

const throwErrorIfExtraRules = (extraRules: unknown[]): void => {
  if (extraRules.length > 0) {
    const errorMessage = extraRules.map(String).join('\n');
    throw new Error(
      `Found rules in dungeonmasterRuleEnforceOnStatics that are not registered:\n${errorMessage}\n\nRemove these rules from src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts or register them in src/startup/start-eslint-plugin.ts`,
    );
  }
};

describe('dungeonmasterRuleEnforceOnStatics integration', () => {
  describe('pre-edit rule validation', () => {
    it('VALID: all pre-edit @dungeonmaster rules => do not use file system operations', () => {
      const preEditRules = getPreEditDungeonmasterRules();
      const violatingRules = checkPreEditRulesForFsOperations(preEditRules);

      throwErrorIfViolationsFound(violatingRules);

      expect(violatingRules).toStrictEqual([]);
    });
  });

  describe('post-edit rule validation', () => {
    it('VALID: all post-edit @dungeonmaster rules => use file system operations', () => {
      const postEditRules = getPostEditDungeonmasterRules();
      const rulesWithoutFsOps = checkPostEditRulesForFsOperations(postEditRules);

      throwErrorIfRulesWithoutFs(rulesWithoutFsOps);

      expect(rulesWithoutFsOps).toStrictEqual([]);
    });

    it('VALID: all post-edit rules => matches the expected list', () => {
      const postEditRules = getAllPostEditRules();

      expect(postEditRules).toStrictEqual([
        ['@dungeonmaster/enforce-proxy-patterns', 'post-edit'],
        ['@dungeonmaster/enforce-proxy-child-creation', 'post-edit'],
        ['@dungeonmaster/enforce-implementation-colocation', 'post-edit'],
        ['@dungeonmaster/enforce-test-colocation', 'post-edit'],
        ['@dungeonmaster/enforce-hydration-recipes-structure', 'post-edit'],
        ['@dungeonmaster/gateway-dependency-declared', 'post-edit'],
        ['@dungeonmaster/enforce-gateway-config-names-exist', 'post-edit'],
      ]);
    });
  });

  describe('rule count validation', () => {
    it('VALID: total rule count => matches sum of pre-edit and post-edit', () => {
      const preEditCount = getPreEditRuleCount();
      const postEditCount = getPostEditRuleCount();
      const totalCount = Object.keys(dungeonmasterRuleEnforceOnStatics).length;

      expect(totalCount).toBe(Number(preEditCount) + Number(postEditCount));
    });

    it('VALID: pre-edit count => 77 rules (11 third-party + 66 @dungeonmaster)', () => {
      const preEditCount = getPreEditRuleCount();

      expect(preEditCount).toBe(77);
    });
  });

  describe('completeness validation', () => {
    it('VALID: all registered @dungeonmaster rules => exist in dungeonmasterRuleEnforceOnStatics, except ward-only type-checked rules', () => {
      const registeredRules = getRegisteredDungeonmasterRules();
      const staticsRules = getStaticsDungeonmasterRules();
      const missingRules = excludeWardOnlyTypeCheckedRules(
        getMissingRules(registeredRules, staticsRules),
      );

      throwErrorIfMissingRules(missingRules);

      expect(missingRules).toStrictEqual([]);
    });

    it('VALID: dungeonmasterRuleEnforceOnStatics => does not contain unregistered rules', () => {
      const registeredRules = getRegisteredDungeonmasterRules();
      const staticsRules = getStaticsDungeonmasterRules();
      const extraRules = getMissingRules(staticsRules, registeredRules);

      throwErrorIfExtraRules(extraRules);

      expect(extraRules).toStrictEqual([]);
    });
  });
});
