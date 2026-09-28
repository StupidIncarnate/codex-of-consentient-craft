import { readFileSync } from 'fs';
import { join } from 'path';
import { dungeonmasterRuleEnforceOnStatics } from '@dungeonmaster/shared/statics';
import { configDungeonmasterBroker } from './brokers/config/dungeonmaster/config-dungeonmaster-broker';

// Rules registered at 'error' in configDungeonmasterBroker that still carry no
// dungeonmasterRuleEnforceOnStatics entry — genuinely ward-only. Each needs the TYPE CHECKER (the
// program `parserServices` expose), so it cannot run pre-edit (the hook parses one file in
// isolation, no program) and 'post-edit' would fail the fs-operation check below (these rules read
// no file — they call the type checker, not fsExistsSyncAdapter/fsReadFileSyncAdapter). BR row 2194:
// `enforce-folder-return-types` "loses its tag" once R1 lands, the same way `ban-primitives` and
// `require-zod-on-primitives` are slated to "leave the map" later — dropped entirely, not given a
// third timing value.
const WARD_ONLY_TYPE_CHECKED_RULES = ['@dungeonmaster/enforce-folder-return-types'];

interface Violation {
  ruleName: unknown;
  pattern: unknown;
  line: unknown;
}

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
  const fsAdapterPatterns = [
    'fsExistsSyncAdapter',
    'fsEnsureReadFileSyncAdapter',
    'fsReadFileSyncAdapter',
    'fsWriteFileSyncAdapter',
    'fsReadFileAdapter',
    'fsWriteFileAdapter',
    'fs.existsSync',
    'fs.readFileSync',
    'fs.writeFileSync',
    'readFileSync',
    'writeFileSync',
  ];

  const violatingRules: Violation[] = [];

  rules.forEach((ruleName) => {
    const ruleSlug = String(ruleName).replace('@dungeonmaster/', '');
    const rulePath = join(
      __dirname,
      '../../src/brokers/rule',
      ruleSlug,
      `rule-${ruleSlug}-broker.ts`,
    );

    try {
      const ruleContent = readFileSync(rulePath, 'utf8');
      const lines = ruleContent.split('\n');

      lines.forEach((line, index) => {
        fsAdapterPatterns.forEach((pattern) => {
          if (line.includes(pattern)) {
            violatingRules.push({
              ruleName,
              pattern,
              line: `Line ${String(index + 1)}: ${line.trim()}`,
            });
          }
        });
      });
    } catch {
      // Rule file not found - that's a different problem, not our concern here
    }
  });

  return violatingRules;
};

const checkPostEditRulesForFsOperations = (rules: unknown[]): unknown[] => {
  const fsAdapterPatterns = [
    'fsExistsSyncAdapter',
    'fsEnsureReadFileSyncAdapter',
    'fsReadFileSyncAdapter',
    'fsWriteFileSyncAdapter',
    'fsReadFileAdapter',
    'fsWriteFileAdapter',
    // A rule migrated off its adapter reaches file-system work through the gateway instead —
    // these two import specifiers are what "uses file system operations" means once the adapter
    // name itself is gone from the rule's source.
    '#gateway/node/fs',
    '#gateway/node/fs__promises',
  ];

  const rulesWithoutFsOps: unknown[] = [];

  rules.forEach((ruleName) => {
    const ruleSlug = String(ruleName).replace('@dungeonmaster/', '');
    const rulePath = join(
      __dirname,
      '../../src/brokers/rule',
      ruleSlug,
      `rule-${ruleSlug}-broker.ts`,
    );

    try {
      const ruleContent = readFileSync(rulePath, 'utf8');
      const hasFs = fsAdapterPatterns.some((pattern) => {
        return ruleContent.includes(pattern);
      });

      if (!hasFs) {
        rulesWithoutFsOps.push(ruleName);
      }
    } catch {
      // Rule file not found - that's a different problem
    }
  });

  return rulesWithoutFsOps;
};

const throwErrorIfViolationsFound = (violatingRules: Violation[]): void => {
  if (violatingRules.length > 0) {
    const errorMessage = violatingRules
      .map((v) => {
        return [String(v.ruleName), ' uses ', String(v.pattern), ' at ', String(v.line)].join('');
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

    it('VALID: pre-edit count => 74 rules (11 third-party + 63 @dungeonmaster)', () => {
      const preEditCount = getPreEditRuleCount();

      expect(preEditCount).toBe(74);
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
