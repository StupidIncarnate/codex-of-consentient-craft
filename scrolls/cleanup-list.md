Remember, orchastrate these aggresively with sub agents. You can switch in and out of worktrees though and commit if its
easy.

1. cleanup on master and worktrees/flows-one-file-per-route

```
the agent I killed was editing siegelense-results-layer-flow.integration.test.ts. I don't know whether it wrote anything before it died. That needs checking before anything else — a half-edited test file is the worst thing to build on.

Then, in order:

┌─────┬──────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  #  │           Item           │                                                             Notes                                                              │
├─────┼──────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1   │ Verify the 13 renames on │ Seven commands were renamed since my last binary check. Needs a build, then each command bare and with --json. This is the one │
│     │  the real CLI            │  I'd insist on — a polarity slip already happened once this session.                                                           │
├─────┼──────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2   │ Commit on master         │ most things should be commited already and they might be pre-existing bugs committed.                                         │
│     │                          │                                                                                                                 │
├─────┼──────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3   │ Clean up the worktree    │ worktrees/flows-one-file-per-route still exists. Its patch is already applied to master, so it's redundant.                    │
├─────┼──────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 4   │ Full ward                │ --uncommitted --committed across all packages.                                                                                 │
└─────┴──────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

Left undone, and I'd rather name it than quietly drop it:

┌───────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         Item                          │                                          Why it's not trivial                                           │
├───────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Self-referential assertions in results, compare,      │ They compare stdout against a call to the same broker. Proves the parse, not the answer. Three files of │
│ status layer tests                                    │  careful literal-value work.                                                                            │
├───────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ~360 lines still in the router test                   │ chunk-3 and status-through-argv. They're the only thing proving those answers are right, so they can't  │
│                                                       │ move until the above is fixed.                                                                          │
└───────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

If theres any work to pull into master on worktrees/flows-one-file-per-route, do so as well. Then do a full
`npm run ward` till green

2. Switch into worktrees/orchestrator-step-engine, finish the clean mentioned below,

```
 ### Handoff Highlights                                                                                                                                              
                                                                                                                                                                      
  • Worktree & Branch: /home/brutus-home/projects/codex-of-consentient-craft/worktrees/orchestrator-step-engine/ (orchestrator-step-engine)                           
  • Base Commit: 884e81b98 ("story 25: the prompts — registered, old operators retired, and dispatch separated")                                                      
  • Progress: 27 of 31 Sessions Completed (87%) — all passing ward exit 0.                                                                                            
  • Key Achievements Completed in This Wave:                                                                                                                          
      • All 9 production readers of signoff-track-eligibility-statics.ts have been successfully re-pointed to stepScopeStatics.                                       
      • The entire session-forensics contracts and calculation pipeline (is-track-owed-unit-guard.ts, quest-to-units-transformer.ts, quest-to-coverage-transformer.ts,
      and digest test fixtures) have been re-keyed to family names (codeweaver, flowrider, siegemaster).                                                              
      • smoketest-sign-outstanding-units-broker.ts, smoketest-sweep-pending-work-items-layer-broker.ts, and quest-summary-build-transformer.ts are fully aligned and  
      green.                                                                                                                                                          
                                                                                                                                                                      
                                                                                                                                                                      
  ### Remaining 4 Cleanup Steps to Finish Set 26:                                                                                                                     
                                                                                                                                                                      
  1. Delete Dead Transformers (Sessions 15 & 16):                                                                                                                     
      • Remove packages/orchestrator/src/transformers/signoff-outstanding/ and packages/orchestrator/src/transformers/signoff-flow-outstanding/ (along with their test
      files).                                                                                                                                                         
      • In quest-get-qa-checklist-broker.test.ts, replace the residual test import with checklists[0]?.items.map(i => i.id).                                          
  2. Delete signoffTrackEligibilityStatics (Session 7):                                                                                                               
      • Remove packages/orchestrator/src/statics/signoff-track-eligibility/ (no live production readers remain).                                                      
  3. Retire Unused Contracts (Session 3):                                                                                                                             
      • Retire signoff-contract.ts, signoff-track-contract.ts, and signoff-tracks-statics.ts.                                                                         
  4. Final Gate & Commit:                                                                                                                                             
      • npm run ward -- --committed --uncommitted                                                                                                                     
      • git commit -m "story 26: retire the sign-off tracks"                                                                                                          
                   
```

Then merge master into worktrees/orchestrator-step-engine and deal with any merge conflicts, ensuring we keep both sets
of changes, unless the conflict. Then worktree probably wins out depending on context.

3. Do ward --committed till green, then full ward, then merge worktrees/orchestrator-step-engine into master.
4. Then a parallel set of work in new worktrees. Each orchastrator should use one sub agent sequentially at a time, but
   should use sub agents for planning, work and review of code.
   a. Assign an orchastrator to work on scrolls/orcha-changes/27-ui.md and scrolls/orcha-changes/28-independent.md in a
   new work tree. Once its finished, it should send sub agent to read scrolls/workflow-paralellizer-plan.md and see
   what's been missed in the implementation.
   b. Assign an orchastrator to work through scrolls/seigelense/remaining-build-items.md in a new work tree. If some
   items are already done, or cant be done with the current code pivots, have it notate as such.
5. When both orchastrator agents have signaled that their work, you need to assign a new agent to merge both sets into
   master, do a full ward and fix any issues.

----
Orchastrator rules for yourself and the two orchastrators being launched in step 4:

- you Must set a 45 min ping timer to keep your cache warm, since agents can take more than an 1hr to complete any piece
  of work
- you must have planning/work/code review done by sub agents
- Orchastrators do not touch files. They read plans and dull out work. If something comes up, they should use a sub
  agent to answer questions so that orchastrator knows how to pivot without reading code or make calls to the mcp for
  information. Mcp call to make a worktree is however ok.
- Running ward is fine, unless the orchastrator has run it twice with errors, then it needs to be assigned to a sub
  agent to unblock.
- "Pre-existing bugs" and clean up items that make code cleaner are not to be ignored and tabled. We have a couple large
  feature sets trying to merge at once and we need to make sure alls clean by the time we're done.
- Orchastrators are free to use best judgment if decision calls come up. A user will manually review all functionality
  once these feature sets get merged into master after they are feature complement and fully implemented.
- Do not ask the user questions about requirements. Make best judgement call based on info available. 
