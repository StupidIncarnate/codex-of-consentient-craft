import { universalSyntaxRulesStatics } from './universal-syntax-rules-statics';

describe('universalSyntaxRulesStatics', () => {
  describe('fileNaming', () => {
    it('VALID: {rule} => returns rule string', () => {
      expect(universalSyntaxRulesStatics.fileNaming.rule).toBe('All filenames must use kebab-case');
    });

    it('VALID: {patternDescription} => returns pattern description', () => {
      expect(universalSyntaxRulesStatics.fileNaming.patternDescription).toBe(
        'Lowercase letters, numbers, and hyphens only, with valid file extensions',
      );
    });

    it('VALID: {examples} => returns array of valid filenames', () => {
      expect(universalSyntaxRulesStatics.fileNaming.examples).toStrictEqual([
        'user-fetch-broker.ts',
        'format-date-transformer.ts',
        'user-contract.ts',
      ]);
    });

    it('VALID: {violations} => returns array of invalid filenames', () => {
      expect(universalSyntaxRulesStatics.fileNaming.violations).toStrictEqual([
        'userFetchBroker.ts',
        'format_date_transformer.ts',
        'UserContract.ts',
      ]);
    });
  });

  describe('functionExports', () => {
    it('VALID: {rule} => returns rule string', () => {
      expect(universalSyntaxRulesStatics.functionExports.rule).toBe(
        'All functions must use export const with arrow function syntax',
      );
    });

    it('VALID: {exceptions} => returns array of exceptions', () => {
      expect(universalSyntaxRulesStatics.functionExports.exceptions).toStrictEqual([
        'Error classes use export class',
      ]);
    });

    it('VALID: {examples} => returns array of valid examples', () => {
      expect(universalSyntaxRulesStatics.functionExports.examples).toHaveLength(2);
      expect(universalSyntaxRulesStatics.functionExports.examples[0]).toMatch(
        /export const userFetchBroker/u,
      );
    });

    it('VALID: {violations} => returns array of violations', () => {
      expect(universalSyntaxRulesStatics.functionExports.violations).toHaveLength(2);
      expect(universalSyntaxRulesStatics.functionExports.violations[0]).toMatch(
        /export function userFetchBroker/u,
      );
    });
  });

  describe('namedExports', () => {
    it('VALID: {rule} => returns rule string', () => {
      expect(universalSyntaxRulesStatics.namedExports.rule).toBe(
        'Always use named exports, never default exports',
      );
    });

    it('VALID: {exceptions} => returns array of exceptions', () => {
      expect(universalSyntaxRulesStatics.namedExports.exceptions).toStrictEqual([
        'Index files ONLY when connecting to systems that REQUIRE default exports (not just prefer)',
      ]);
    });

    it('VALID: {examples} => returns array of valid examples', () => {
      expect(universalSyntaxRulesStatics.namedExports.examples).toHaveLength(2);
    });

    it('VALID: {violations} => returns array of violations', () => {
      expect(universalSyntaxRulesStatics.namedExports.violations).toHaveLength(2);
    });
  });

  describe('singleResponsibility', () => {
    it('VALID: {rule} => returns rule string', () => {
      expect(universalSyntaxRulesStatics.singleResponsibility.rule).toBe(
        'Each file must contain and export exactly one primary piece of functionality',
      );
    });

    it('VALID: {allowedCoExports} => returns array of allowed co-exports', () => {
      expect(universalSyntaxRulesStatics.singleResponsibility.allowedCoExports).toStrictEqual([
        'Supporting types and interfaces directly related to that functionality',
      ]);
    });

    it('VALID: {examples} => returns array of valid examples', () => {
      expect(universalSyntaxRulesStatics.singleResponsibility.examples).toHaveLength(1);
      expect(universalSyntaxRulesStatics.singleResponsibility.examples[0]).toMatch(
        /UserFetchParams/u,
      );
    });

    it('VALID: {violations} => returns array of violations', () => {
      expect(universalSyntaxRulesStatics.singleResponsibility.violations).toHaveLength(1);
      expect(universalSyntaxRulesStatics.singleResponsibility.violations[0]).toMatch(
        /userFetchBroker.*userCreateBroker.*userDeleteBroker/u,
      );
    });
  });

  describe('fileMetadata', () => {
    it('VALID: {rule} => returns rule string', () => {
      expect(universalSyntaxRulesStatics.fileMetadata.rule).toBe(
        'Every implementation file must have structured metadata comments at the very top (before imports)',
      );
    });

    it('VALID: {requiredFormat} => returns format string', () => {
      expect(universalSyntaxRulesStatics.fileMetadata.requiredFormat).toMatch(/PURPOSE:/u);
      expect(universalSyntaxRulesStatics.fileMetadata.requiredFormat).toMatch(/USAGE:/u);
    });

    it('VALID: {requiredFor} => returns array of file types', () => {
      expect(universalSyntaxRulesStatics.fileMetadata.requiredFor).toHaveLength(1);
      expect(universalSyntaxRulesStatics.fileMetadata.requiredFor[0]).toMatch(
        /implementation files/u,
      );
    });

    it('VALID: {notRequiredFor} => returns array of excluded file types', () => {
      expect(universalSyntaxRulesStatics.fileMetadata.notRequiredFor).toStrictEqual([
        'Test files (.test.ts)',
        'Proxy files (.proxy.ts)',
        'Stub files (.stub.ts)',
      ]);
    });

    it('VALID: {optionalFields} => returns array of optional fields', () => {
      expect(universalSyntaxRulesStatics.fileMetadata.optionalFields).toStrictEqual([
        'WHEN-TO-USE',
        'WHEN-NOT-TO-USE',
      ]);
    });

    it('VALID: {examples} => returns array of valid metadata examples', () => {
      expect(universalSyntaxRulesStatics.fileMetadata.examples).toHaveLength(1);
      expect(universalSyntaxRulesStatics.fileMetadata.examples[0]).toMatch(/hasPermissionGuard/u);
    });
  });

  describe('functionParameters', () => {
    it('VALID: {rule} => returns rule string', () => {
      expect(universalSyntaxRulesStatics.functionParameters.rule).toBe(
        'All app code functions must use object destructuring with inline types',
      );
    });

    it('VALID: {exceptions} => returns array of exceptions', () => {
      expect(universalSyntaxRulesStatics.functionParameters.exceptions).toStrictEqual([
        'Only when integrating with external APIs that require specific signatures',
      ]);
    });

    it('VALID: {examples} => returns array of valid examples', () => {
      expect(universalSyntaxRulesStatics.functionParameters.examples).toHaveLength(2);
      expect(universalSyntaxRulesStatics.functionParameters.examples[0]).toMatch(/updateUser/u);
    });

    it('VALID: {violations} => returns array of violations', () => {
      expect(universalSyntaxRulesStatics.functionParameters.violations).toHaveLength(2);
    });

    it('VALID: {passCompleteObjects} => returns guidance string', () => {
      expect(universalSyntaxRulesStatics.functionParameters.passCompleteObjects).toMatch(
        /complete objects/u,
      );
    });

    it('VALID: {extractIdPattern} => returns pattern string', () => {
      expect(universalSyntaxRulesStatics.functionParameters.extractIdPattern).toBe(
        "When you need just an ID, extract it with Type['id'] notation",
      );
    });
  });

  describe('importRules', () => {
    it('VALID: {rule} => returns rule string', () => {
      expect(universalSyntaxRulesStatics.importRules.rule).toBe(
        'All imports at top of file - No inline imports, requires, or dynamic imports',
      );
    });

    it('VALID: {preferEs6} => returns preference string', () => {
      expect(universalSyntaxRulesStatics.importRules.preferEs6).toBe(
        'Use ES6 imports - Prefer import over require()',
      );
    });

    it('VALID: {grouping} => returns grouping guidance', () => {
      expect(universalSyntaxRulesStatics.importRules.grouping).toMatch(/logically/u);
    });

    it('VALID: {examples} => returns array of valid examples', () => {
      expect(universalSyntaxRulesStatics.importRules.examples).toHaveLength(1);
      expect(universalSyntaxRulesStatics.importRules.examples[0]).toMatch(/readFile/u);
    });

    it('VALID: {violations} => returns array of violations', () => {
      expect(universalSyntaxRulesStatics.importRules.violations).toHaveLength(1);
      expect(universalSyntaxRulesStatics.importRules.violations[0]).toMatch(/await import/u);
    });
  });

  describe('typeExports', () => {
    it('VALID: {rule} => returns rule string', () => {
      expect(universalSyntaxRulesStatics.typeExports.rule).toBe(
        'Type export syntax varies by file type',
      );
    });

    it('VALID: {regularFiles} => returns regular files rule', () => {
      expect(universalSyntaxRulesStatics.typeExports.regularFiles).toMatch(/export type Name =/u);
    });

    it('VALID: {indexFiles} => returns index files rule', () => {
      expect(universalSyntaxRulesStatics.typeExports.indexFiles).toMatch(
        /export type \{ Name \} from/u,
      );
    });

    it('VALID: {forbidden} => returns forbidden syntax', () => {
      expect(universalSyntaxRulesStatics.typeExports.forbidden).toMatch(/export \{ type Name \}/u);
    });

    it('VALID: {examples} => returns array of valid examples', () => {
      expect(universalSyntaxRulesStatics.typeExports.examples).toHaveLength(2);
    });

    it('VALID: {violations} => returns array of violations', () => {
      expect(universalSyntaxRulesStatics.typeExports.violations).toHaveLength(1);
    });
  });

  describe('typeSafety', () => {
    describe('strictTyping', () => {
      it('VALID: {rule} => returns strict typing rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.strictTyping.rule).toBe(
          'Strict typing required - No type suppression allowed',
        );
      });

      it('VALID: {noTypeSuppression} => returns no suppression rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.strictTyping.noTypeSuppression).toBe(
          'Never use @ts-ignore or @ts-expect-error',
        );
      });

      it('VALID: {useContracts} => returns contracts rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.strictTyping.useContracts).toMatch(
          /Zod contracts/u,
        );
      });

      it('VALID: {explicitReturnTypes} => returns return types rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.strictTyping.explicitReturnTypes).toMatch(
          /explicit return types/u,
        );
      });
    });

    describe('uncertainData', () => {
      it('VALID: {rule} => returns uncertain data rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.uncertainData.rule).toMatch(/unknown/u);
      });

      it('VALID: {examples} => returns array of examples', () => {
        expect(universalSyntaxRulesStatics.typeSafety.uncertainData.examples).toHaveLength(1);
        expect(universalSyntaxRulesStatics.typeSafety.uncertainData.examples[0]).toMatch(
          /handleError/u,
        );
      });
    });

    describe('fixAtSource', () => {
      it('VALID: {rule} => returns fix at source rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.fixAtSource.rule).toBe(
          'Never suppress errors - fix at source',
        );
      });

      it('VALID: {violations} => returns array of violations', () => {
        expect(universalSyntaxRulesStatics.typeSafety.fixAtSource.violations).toHaveLength(2);
        expect(universalSyntaxRulesStatics.typeSafety.fixAtSource.violations[0]).toMatch(
          /@ts-ignore/u,
        );
      });

      it('VALID: {correctApproach} => returns correct approach string', () => {
        expect(universalSyntaxRulesStatics.typeSafety.fixAtSource.correctApproach).toMatch(
          /Zod contracts/u,
        );
      });
    });

    describe('typeInference', () => {
      it('VALID: {rule} => returns type inference rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.typeInference.rule).toMatch(/infer/u);
      });

      it('VALID: {examples} => returns array of examples', () => {
        expect(universalSyntaxRulesStatics.typeSafety.typeInference.examples).toHaveLength(4);
      });

      it('VALID: {violations} => returns array of violations', () => {
        expect(universalSyntaxRulesStatics.typeSafety.typeInference.violations).toHaveLength(1);
        expect(universalSyntaxRulesStatics.typeSafety.typeInference.violations[0]).toMatch(/any/u);
      });
    });

    describe('typeAssertions', () => {
      it('VALID: {satisfies.rule} => returns satisfies rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.typeAssertions.satisfies.rule).toMatch(
          /satisfies/u,
        );
      });

      it('VALID: {satisfies.examples} => returns satisfies examples', () => {
        expect(
          universalSyntaxRulesStatics.typeSafety.typeAssertions.satisfies.examples,
        ).toHaveLength(1);
      });

      it('VALID: {as.rule} => returns as rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.typeAssertions.as.rule).toMatch(
          /information compiler lacks/u,
        );
      });

      it('VALID: {as.examples} => returns as examples', () => {
        expect(universalSyntaxRulesStatics.typeSafety.typeAssertions.as.examples).toHaveLength(1);
      });

      it('VALID: {as.violations} => returns as violations', () => {
        expect(universalSyntaxRulesStatics.typeSafety.typeAssertions.as.violations).toHaveLength(1);
      });

      it('VALID: {neverBypassErrors} => returns bypass rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.typeAssertions.neverBypassErrors).toBe(
          'Never use as to bypass type errors - fix the type instead',
        );
      });
    });

    describe('functionSignatures', () => {
      it('VALID: {rule} => returns function signatures rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.functionSignatures.rule).toMatch(
          /ban-primitives/u,
        );
      });

      it('VALID: {inputsAllowPrimitives} => returns inputs rule', () => {
        expect(
          universalSyntaxRulesStatics.typeSafety.functionSignatures.inputsAllowPrimitives,
        ).toMatch(/primitives/u);
      });

      it('VALID: {returnsMustUseBranded} => returns returns rule', () => {
        expect(
          universalSyntaxRulesStatics.typeSafety.functionSignatures.returnsMustUseBranded,
        ).toMatch(/branded/u);
      });

      it('VALID: {examples} => returns array of examples', () => {
        expect(universalSyntaxRulesStatics.typeSafety.functionSignatures.examples).toHaveLength(2);
      });

      it('VALID: {violations} => returns array of violations', () => {
        expect(universalSyntaxRulesStatics.typeSafety.functionSignatures.violations).toHaveLength(
          1,
        );
      });
    });

    describe('noRawPrimitives', () => {
      it('VALID: {rule} => returns no raw primitives rule', () => {
        expect(universalSyntaxRulesStatics.typeSafety.noRawPrimitives.rule).toMatch(
          /branded types/u,
        );
      });

      it('VALID: {violations} => returns array of violations', () => {
        expect(universalSyntaxRulesStatics.typeSafety.noRawPrimitives.violations).toHaveLength(1);
      });

      it('VALID: {examples} => returns array of examples', () => {
        expect(universalSyntaxRulesStatics.typeSafety.noRawPrimitives.examples).toHaveLength(1);
      });
    });
  });

  describe('promiseHandling', () => {
    it('VALID: {rule} => returns promise handling rule', () => {
      expect(universalSyntaxRulesStatics.promiseHandling.rule).toBe(
        'Always use async/await over .then() chains for readability',
      );
    });

    it('VALID: {handleErrorsAppropriately} => returns error handling guidance', () => {
      expect(universalSyntaxRulesStatics.promiseHandling.handleErrorsAppropriately).toMatch(
        /appropriate level/u,
      );
    });

    it('VALID: {parallelOperations} => returns parallel operations rule', () => {
      expect(universalSyntaxRulesStatics.promiseHandling.parallelOperations).toMatch(
        /Promise.all/u,
      );
    });

    it('VALID: {sequentialOperations} => returns sequential operations rule', () => {
      expect(universalSyntaxRulesStatics.promiseHandling.sequentialOperations).toMatch(
        /dependent/u,
      );
    });

    it('VALID: {examples} => returns array of examples', () => {
      expect(universalSyntaxRulesStatics.promiseHandling.examples).toHaveLength(2);
    });

    it('VALID: {violations} => returns array of violations', () => {
      expect(universalSyntaxRulesStatics.promiseHandling.violations).toHaveLength(1);
    });
  });

  describe('loopControl', () => {
    it('VALID: {rule} => returns loop control rule', () => {
      expect(universalSyntaxRulesStatics.loopControl.rule).toMatch(/recursion/u);
      expect(universalSyntaxRulesStatics.loopControl.rule).toMatch(/while \(true\)/u);
    });

    it('VALID: {recursion} => returns recursion guidance', () => {
      expect(universalSyntaxRulesStatics.loopControl.recursion).toMatch(/early returns/u);
    });

    it('VALID: {regularLoopsOk} => returns regular loops guidance', () => {
      expect(universalSyntaxRulesStatics.loopControl.regularLoopsOk).toMatch(/for loops/u);
    });

    it('VALID: {examples} => returns array of examples', () => {
      expect(universalSyntaxRulesStatics.loopControl.examples).toHaveLength(1);
      expect(universalSyntaxRulesStatics.loopControl.examples[0]).toMatch(/findConfig/u);
    });

    it('VALID: {violations} => returns array of violations', () => {
      expect(universalSyntaxRulesStatics.loopControl.violations).toHaveLength(1);
      expect(universalSyntaxRulesStatics.loopControl.violations[0]).toMatch(/while \(true\)/u);
    });
  });

  describe('errorHandling', () => {
    it('VALID: {rule} => returns error handling rule', () => {
      expect(universalSyntaxRulesStatics.errorHandling.rule).toBe(
        'Handle errors explicitly for every operation that can fail',
      );
    });

    it('VALID: {neverSilentlySwallow} => returns swallow rule', () => {
      expect(universalSyntaxRulesStatics.errorHandling.neverSilentlySwallow).toMatch(
        /silently swallow/u,
      );
    });

    it('VALID: {provideContext} => returns context guidance', () => {
      expect(universalSyntaxRulesStatics.errorHandling.provideContext).toMatch(/context/u);
    });

    it('VALID: {examples} => returns array of examples', () => {
      expect(universalSyntaxRulesStatics.errorHandling.examples).toHaveLength(2);
    });

    it('VALID: {violations} => returns array of violations', () => {
      expect(universalSyntaxRulesStatics.errorHandling.violations).toHaveLength(2);
    });
  });

  describe('performance', () => {
    describe('efficientAlgorithms', () => {
      it('VALID: {rule} => returns efficient algorithms rule', () => {
        expect(universalSyntaxRulesStatics.performance.efficientAlgorithms.rule).toMatch(
          /Map\/Set/u,
        );
      });

      it('VALID: {examples} => returns array of examples', () => {
        expect(universalSyntaxRulesStatics.performance.efficientAlgorithms.examples).toHaveLength(
          1,
        );
      });

      it('VALID: {violations} => returns array of violations', () => {
        expect(universalSyntaxRulesStatics.performance.efficientAlgorithms.violations).toHaveLength(
          1,
        );
      });
    });

    describe('removeDeadCode', () => {
      it('VALID: {rule} => returns dead code rule', () => {
        expect(universalSyntaxRulesStatics.performance.removeDeadCode.rule).toMatch(
          /Delete unused/u,
        );
      });
    });

    describe('useReflectMethods', () => {
      describe('deleteProperty', () => {
        it('VALID: {rule} => returns delete property rule', () => {
          expect(
            universalSyntaxRulesStatics.performance.useReflectMethods.deleteProperty.rule,
          ).toMatch(/Reflect.deleteProperty/u);
        });

        it('VALID: {examples} => returns array of examples', () => {
          expect(
            universalSyntaxRulesStatics.performance.useReflectMethods.deleteProperty.examples,
          ).toHaveLength(1);
        });

        it('VALID: {violations} => returns array of violations', () => {
          expect(
            universalSyntaxRulesStatics.performance.useReflectMethods.deleteProperty.violations,
          ).toHaveLength(1);
        });
      });

      describe('get', () => {
        it('VALID: {rule} => returns get rule', () => {
          expect(universalSyntaxRulesStatics.performance.useReflectMethods.get.rule).toMatch(
            /Reflect.get/u,
          );
        });

        it('VALID: {rationale} => returns rationale', () => {
          expect(universalSyntaxRulesStatics.performance.useReflectMethods.get.rationale).toMatch(
            /unsafe type assertions/u,
          );
        });

        it('VALID: {examples} => returns array of examples', () => {
          expect(
            universalSyntaxRulesStatics.performance.useReflectMethods.get.examples,
          ).toHaveLength(1);
        });

        it('VALID: {violations} => returns array of violations', () => {
          expect(
            universalSyntaxRulesStatics.performance.useReflectMethods.get.violations,
          ).toHaveLength(1);
        });
      });
    });
  });

  describe('cliOutput', () => {
    it('VALID: {rule} => returns CLI output rule', () => {
      expect(universalSyntaxRulesStatics.cliOutput.rule).toMatch(/process.stdout\/stderr/u);
    });

    it('VALID: {standardOutput} => returns standard output rule', () => {
      expect(universalSyntaxRulesStatics.cliOutput.standardOutput).toBe(
        'process.stdout.write() for normal output',
      );
    });

    it('VALID: {errorOutput} => returns error output rule', () => {
      expect(universalSyntaxRulesStatics.cliOutput.errorOutput).toBe(
        'process.stderr.write() for errors',
      );
    });

    it('VALID: {includeNewlines} => returns newlines rule', () => {
      expect(universalSyntaxRulesStatics.cliOutput.includeNewlines).toMatch(/\\n/u);
    });

    it('VALID: {examples} => returns array of examples', () => {
      expect(universalSyntaxRulesStatics.cliOutput.examples).toHaveLength(2);
    });

    it('VALID: {violations} => returns array of violations', () => {
      expect(universalSyntaxRulesStatics.cliOutput.violations).toHaveLength(2);
      expect(universalSyntaxRulesStatics.cliOutput.violations[0]).toMatch(/console.log/u);
    });
  });

  describe('summaryChecklist', () => {
    it('VALID: {items} => returns array of checklist items', () => {
      expect(universalSyntaxRulesStatics.summaryChecklist.items).toHaveLength(13);
    });

    it('VALID: {items[0]} => returns first checklist item', () => {
      expect(universalSyntaxRulesStatics.summaryChecklist.items[0]).toBe(
        'File uses kebab-case naming',
      );
    });

    it('VALID: {items} => includes all critical checks', () => {
      const expectedItems = [
        'File uses kebab-case naming',
        'Function uses export const with arrow syntax',
        'File has PURPOSE/USAGE metadata comment at top',
        'Function parameters use object destructuring',
        'All imports are at the top of the file',
        'Exported function has explicit return type using contracts',
        'No any, @ts-ignore, or type suppressions',
        'All string/number types are branded through Zod contracts',
        'Error handling provides context',
        'No console.log in production code',
        'No while (true) loops (use recursion)',
        'Efficient algorithms (Map/Set for lookups)',
        'No dead code or commented-out code',
      ];

      expect(universalSyntaxRulesStatics.summaryChecklist.items).toStrictEqual(expectedItems);
    });
  });

  describe('structure validation', () => {
    it('VALID: exports as const => has all expected top-level properties', () => {
      const topLevelKeys = Object.keys(universalSyntaxRulesStatics);
      const expectedKeys = [
        'fileNaming',
        'functionExports',
        'namedExports',
        'singleResponsibility',
        'fileMetadata',
        'functionParameters',
        'importRules',
        'typeExports',
        'typeSafety',
        'promiseHandling',
        'loopControl',
        'errorHandling',
        'performance',
        'cliOutput',
        'testing',
        'summaryChecklist',
      ];

      expect(topLevelKeys).toStrictEqual(expectedKeys);
    });
  });
});
