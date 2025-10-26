import { readFileSync } from 'fs';
import { join } from 'path';
import { questmaestroRuleEnforceOnStatics } from './statics/questmaestro-rule-enforce-on/questmaestro-rule-enforce-on-statics';
import { configQuestmaestroBroker } from './brokers/config/questmaestro/config-questmaestro-broker';

interface Violation {
  ruleName: unknown;
  pattern: unknown;
  line: unknown;
}

const getPreEditQuestmaestroRules = (): unknown[] => {
  return Object.entries(questmaestroRuleEnforceOnStatics)
    .filter(([ruleName, timing]) => {
      return timing === 'pre-edit' && ruleName.startsWith('@questmaestro/');
    })
    .map(([ruleName]) => {
      return ruleName;
    });
};

const getPostEditQuestmaestroRules = (): unknown[] => {
  return Object.entries(questmaestroRuleEnforceOnStatics)
    .filter(([ruleName, timing]) => {
      return timing === 'post-edit' && ruleName.startsWith('@questmaestro/');
    })
    .map(([ruleName]) => {
      return ruleName;
    });
};

const getAllPostEditRules = (): unknown[] => {
  return Object.entries(questmaestroRuleEnforceOnStatics).filter(([_, timing]) => {
    return timing === 'post-edit';
  });
};

const getPreEditRuleCount = (): unknown => {
  return Object.values(questmaestroRuleEnforceOnStatics).filter((timing) => {
    return timing === 'pre-edit';
  }).length;
};

const getPostEditRuleCount = (): unknown => {
  return Object.values(questmaestroRuleEnforceOnStatics).filter((timing) => {
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
    const ruleSlug = String(ruleName).replace('@questmaestro/', '');
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
  ];

  const rulesWithoutFsOps: unknown[] = [];

  rules.forEach((ruleName) => {
    const ruleSlug = String(ruleName).replace('@questmaestro/', '');
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
      `Pre-edit rules must not use file system operations. Found violations:\n${errorMessage}\n\nThese rules should be marked as 'post-edit' in questmaestroRuleEnforceOnStatics.`,
    );
  }
};

const throwErrorIfRulesWithoutFs = (rulesWithoutFsOps: unknown[]): void => {
  if (rulesWithoutFsOps.length > 0) {
    const errorMessage = rulesWithoutFsOps.map(String).join('\n');
    throw new Error(
      `Post-edit rules must use file system operations. Found rules without fs operations:\n${errorMessage}\n\nThese rules should be marked as 'pre-edit' in questmaestroRuleEnforceOnStatics.`,
    );
  }
};

const getRegisteredQuestmaestroRules = (): unknown[] => {
  const config = configQuestmaestroBroker({ forTesting: false });
  const allRules = Object.keys(config.typescript.rules ?? {});
  return allRules.filter((rule) => {
    return rule.startsWith('@questmaestro/');
  });
};

const getStaticsQuestmaestroRules = (): unknown[] => {
  return Object.keys(questmaestroRuleEnforceOnStatics).filter((rule) => {
    return rule.startsWith('@questmaestro/');
  });
};

const getMissingRules = (registeredRules: unknown[], staticsRules: unknown[]): unknown[] => {
  return registeredRules.filter((rule) => {
    return !staticsRules.includes(rule);
  });
};

const throwErrorIfMissingRules = (missingRules: unknown[]): void => {
  if (missingRules.length > 0) {
    const errorMessage = missingRules.map(String).join('\n');
    throw new Error(
      `Missing rules in questmaestroRuleEnforceOnStatics:\n${errorMessage}\n\nAdd these rules to src/statics/questmaestro-rule-enforce-on/questmaestro-rule-enforce-on-statics.ts with 'pre-edit' or 'post-edit' timing.`,
    );
  }
};

const throwErrorIfExtraRules = (extraRules: unknown[]): void => {
  if (extraRules.length > 0) {
    const errorMessage = extraRules.map(String).join('\n');
    throw new Error(
      `Found rules in questmaestroRuleEnforceOnStatics that are not registered:\n${errorMessage}\n\nRemove these rules from src/statics/questmaestro-rule-enforce-on/questmaestro-rule-enforce-on-statics.ts or register them in src/startup/start-eslint-plugin.ts`,
    );
  }
};

describe('questmaestroRuleEnforceOnStatics integration', () => {
  describe('pre-edit rule validation', () => {
    it('VALID: all pre-edit @questmaestro rules => do not use file system operations', () => {
      const preEditRules = getPreEditQuestmaestroRules();
      const violatingRules = checkPreEditRulesForFsOperations(preEditRules);

      throwErrorIfViolationsFound(violatingRules);

      expect(violatingRules).toHaveLength(0);
    });
  });

  describe('post-edit rule validation', () => {
    it('VALID: all post-edit @questmaestro rules => use file system operations', () => {
      const postEditRules = getPostEditQuestmaestroRules();
      const rulesWithoutFsOps = checkPostEditRulesForFsOperations(postEditRules);

      throwErrorIfRulesWithoutFs(rulesWithoutFsOps);

      expect(rulesWithoutFsOps).toHaveLength(0);
    });

    it('VALID: all post-edit rules count => matches expected 4 rules', () => {
      const postEditRules = getAllPostEditRules();

      expect(postEditRules).toHaveLength(4);
    });
  });

  describe('rule count validation', () => {
    it('VALID: total rule count => matches sum of pre-edit and post-edit', () => {
      const preEditCount = getPreEditRuleCount();
      const postEditCount = getPostEditRuleCount();
      const totalCount = Object.keys(questmaestroRuleEnforceOnStatics).length;

      expect(totalCount).toBe(Number(preEditCount) + Number(postEditCount));
    });

    it('VALID: pre-edit count => 33 rules (9 third-party + 24 @questmaestro)', () => {
      const preEditCount = getPreEditRuleCount();

      expect(preEditCount).toBe(34);
    });
  });

  describe('completeness validation', () => {
    it('VALID: all registered @questmaestro rules => exist in questmaestroRuleEnforceOnStatics', () => {
      const registeredRules = getRegisteredQuestmaestroRules();
      const staticsRules = getStaticsQuestmaestroRules();
      const missingRules = getMissingRules(registeredRules, staticsRules);

      throwErrorIfMissingRules(missingRules);

      expect(missingRules).toHaveLength(0);
    });

    it('VALID: questmaestroRuleEnforceOnStatics => does not contain unregistered rules', () => {
      const registeredRules = getRegisteredQuestmaestroRules();
      const staticsRules = getStaticsQuestmaestroRules();
      const extraRules = getMissingRules(staticsRules, registeredRules);

      throwErrorIfExtraRules(extraRules);

      expect(extraRules).toHaveLength(0);
    });
  });
});
