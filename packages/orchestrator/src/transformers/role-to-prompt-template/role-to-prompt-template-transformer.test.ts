import { AgentRoleStub } from '../../contracts/agent-role/agent-role.stub';
import { DisciplineStub } from '../../contracts/discipline/discipline.stub';
import { operationOrchestratorPromptStatics } from '../../statics/operation-orchestrator-prompt/operation-orchestrator-prompt-statics';
import { roleToDisciplineStatics } from '../../statics/role-to-discipline/role-to-discipline-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { warpgatePromptStatics } from '../../statics/warpgate-prompt/warpgate-prompt-statics';
import { disciplineToPackTransformer } from '../discipline-to-pack/discipline-to-pack-transformer';
import { roleToPromptTemplateTransformer } from './role-to-prompt-template-transformer';

type OrchestratorRole = keyof typeof roleToDisciplineStatics;

// Read off the role map rather than listed here: a role added there and forgotten in a hand-written
// case list is served an unparameterized template with nothing failing.
const ORCHESTRATOR_ROLE_CASES = (
  Object.keys(roleToDisciplineStatics) as readonly OrchestratorRole[]
).map((role) => [role, roleToDisciplineStatics[role]] as const);

describe('roleToPromptTemplateTransformer', () => {
  describe('every operation-owning role gets the same template with its own discipline pack', () => {
    it.each(ORCHESTRATOR_ROLE_CASES)(
      'VALID: {role: %s} => returns the operation-orchestrator template with the %s pack substituted at $DISCIPLINE',
      (role, discipline) => {
        const result = roleToPromptTemplateTransformer({ role: AgentRoleStub({ value: role }) });

        expect(String(result)).toBe(
          operationOrchestratorPromptStatics.prompt.template
            .replace(
              '$DISCIPLINE',
              () =>
                disciplineToPackTransformer({ discipline: DisciplineStub({ value: discipline }) })
                  .orchestratorMarkdown,
            )
            .replace('$MY_DISCIPLINE', () => discipline),
        );
      },
    );

    it.each(ORCHESTRATOR_ROLE_CASES)(
      'VALID: {role: %s} => returned template carries no unresolved $DISCIPLINE or $MY_DISCIPLINE token',
      (role) => {
        const result = roleToPromptTemplateTransformer({ role: AgentRoleStub({ value: role }) });

        expect({
          discipline: String(result).split('$DISCIPLINE').length - 1,
          myDiscipline: String(result).split('$MY_DISCIPLINE').length - 1,
        }).toStrictEqual({ discipline: 0, myDiscipline: 0 });
      },
    );

    // This transformer is the path `work-item-to-prompt-transformer` actually serves a role
    // through, so a `$MY_DISCIPLINE` fixed only in the agent-name switch would leave the literal
    // token in every dispatched session's prompt and every minion fetch would be refused.
    it.each(ORCHESTRATOR_ROLE_CASES)(
      'VALID: {role: %s} => tells its minions to fetch with that role own discipline id',
      (role, discipline) => {
        const result = roleToPromptTemplateTransformer({ role: AgentRoleStub({ value: role }) });

        expect(
          String(result)
            .replace(/^[\s\S]*?discipline: '/u, '')
            .replace(/'[\s\S]*$/u, ''),
        ).toBe(discipline);
      },
    );
  });

  describe('the two bespoke-template roles', () => {
    it('VALID: {role: spiritmender} => returns the spiritmender template verbatim', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'spiritmender' }),
      });

      expect(String(result)).toBe(spiritmenderPromptStatics.prompt.template);
    });

    it('VALID: {role: warpgate} => returns the warpgate template verbatim', () => {
      const result = roleToPromptTemplateTransformer({
        role: AgentRoleStub({ value: 'warpgate' }),
      });

      expect(String(result)).toBe(warpgatePromptStatics.prompt.template);
    });
  });

  describe('retired role names are not valid agent roles', () => {
    it.each(['blightscout', 'pathseeker', 'pathseeker-surface', 'lawbringer'])(
      'INVALID: {role: "%s"} => throws parsing the role',
      (value) => {
        expect(() => {
          AgentRoleStub({ value: value as never });
        }).toThrow(/Invalid enum value/u);
      },
    );
  });
});
