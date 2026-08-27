import { agentPromptClassificationStatics } from '../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { codeweaverPromptStatics } from '../../statics/codeweaver-prompt/codeweaver-prompt-statics';
import { flowriderPromptStatics } from '../../statics/flowrider-prompt/flowrider-prompt-statics';
import { groundstomperPromptStatics } from '../../statics/groundstomper-prompt/groundstomper-prompt-statics';
import { pesteaterPromptStatics } from '../../statics/pesteater-prompt/pesteater-prompt-statics';
import { siegemasterPromptStatics } from '../../statics/siegemaster-prompt/siegemaster-prompt-statics';
import { spiritmenderPromptStatics } from '../../statics/spiritmender-prompt/spiritmender-prompt-statics';
import { warpgatePromptStatics } from '../../statics/warpgate-prompt/warpgate-prompt-statics';
import { roleToPromptTemplateTransformer } from './role-to-prompt-template-transformer';

type RoleName = Parameters<typeof roleToPromptTemplateTransformer>[0]['role'];

// Each role's own `<role>-prompt` file, read live rather than copied. `satisfies Record<RoleName,
// unknown>` is the test-side twin of this transformer's `never` default: a role added to
// `agentPromptClassificationStatics.roleNames` with no template here fails to compile, which is the
// only thing that stops the derived case list below from silently skipping it.
const EXPECTED_TEMPLATE_BY_ROLE = {
  codeweaver: codeweaverPromptStatics.prompt.template,
  pesteater: pesteaterPromptStatics.prompt.template,
  flowrider: flowriderPromptStatics.prompt.template,
  groundstomper: groundstomperPromptStatics.prompt.template,
  siegemaster: siegemasterPromptStatics.prompt.template,
  spiritmender: spiritmenderPromptStatics.prompt.template,
  warpgate: warpgatePromptStatics.prompt.template,
} as const satisfies Record<RoleName, unknown>;

// Derived from the same list `agentRoleContract` builds its enum from — a hand-written seven would
// go stale the day an eighth role is dispatched.
const EVERY_ROLE_CASE = agentPromptClassificationStatics.roleNames.map(
  (role) => [role, EXPECTED_TEMPLATE_BY_ROLE[role]] as const,
);

describe('roleToPromptTemplateTransformer', () => {
  describe('every dispatched role gets the prompt file that carries its own name', () => {
    it.each(EVERY_ROLE_CASE)(
      'VALID: {role: %s} => returns that role own prompt template',
      (role, template) => {
        const result = roleToPromptTemplateTransformer({ role });

        expect(String(result)).toBe(template);
      },
    );
  });

  describe('the template is handed over unsubstituted', () => {
    // This is the path `workItemToPromptTransformer` serves a dispatched role through, and the
    // `$ARGUMENTS` it leaves standing is where that transformer writes the work item's operation
    // context. A template arriving here with the slot already spent would leave the session with no
    // scope at all. `$DISCIPLINE` / `$MY_DISCIPLINE` are the tokens the retired generic template
    // carried; nothing substitutes either any more, so either one surviving in a served prompt is a
    // literal string handed to an agent in place of its instructions.
    it.each(agentPromptClassificationStatics.roleNames)(
      'VALID: {role: %s} => returned template carries one $ARGUMENTS and no discipline token',
      (role) => {
        const result = roleToPromptTemplateTransformer({ role });

        expect({
          argumentsSlots: String(result).split('$ARGUMENTS').length - 1,
          discipline: String(result).split('$DISCIPLINE').length - 1,
          myDiscipline: String(result).split('$MY_DISCIPLINE').length - 1,
        }).toStrictEqual({ argumentsSlots: 1, discipline: 0, myDiscipline: 0 });
      },
    );
  });
});
