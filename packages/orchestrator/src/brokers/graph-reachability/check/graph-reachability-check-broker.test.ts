import { graphReachabilityCheckBroker } from './graph-reachability-check-broker';
import { graphReachabilityCheckBrokerProxy } from './graph-reachability-check-broker.proxy';

describe('graphReachabilityCheckBroker', () => {
  // Story 05 built agentFlowStatics with fifteen `prompt:` names, of which only four
  // (codeweaver-reviewer, flowrider-reviewer, spiritmender, warpgate) are registered in
  // agentPromptClassificationStatics.promptNames today — the other eleven are story 25's, and
  // story 05 says so explicitly: "Story 06's rule 8 is what turns a dangling name into a red, and
  // it lands after this one... Registering a name in agentPromptClassificationStatics is story
  // 25q's and not yours." So THIS list — twelve rule-8 violations, one per (step, dangling-name)
  // pair across the three prompt-driven families, and nothing else — is the true, expected state
  // of the real questFlowStatics + agentFlowStatics combined between story 06 and story 25: the
  // family graph (questFlowStatics) contributes zero, and every OTHER rule against the step
  // graphs (reachability, terminal, target validity, the no-`done`-route contract, the outcome
  // vocabulary, bounded cycles, and every `handler:` name) passes cleanly today. Once story 25
  // registers a name, this pin goes red for a good reason — update it to drop that one line, not
  // to add the name back.
  it('VALID: {} => the real graphs carry zero dangling prompts now that story 25 names are registered', () => {
    graphReachabilityCheckBrokerProxy();

    const result = graphReachabilityCheckBroker();

    expect(result).toStrictEqual([]);
  });
});
