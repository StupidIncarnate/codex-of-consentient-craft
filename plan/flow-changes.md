# Quest Funnel Redesign: Flows + Enhanced Observables

## The Problem

The current ChaosWhisperer funnel has three structural issues:

### 1. The Observable Wall

When a user says "I want auth with email/password," the current funnel goes:

```
User request → Requirements → BDD Observables (GIVEN/WHEN/THEN)
```

The user jumps from approving 2-3 high-level requirements to staring at 15+ observables like:

```
GIVEN LoginPage WHEN user submits valid credentials THEN session cookie is set
GIVEN LoginPage WHEN user submits invalid password THEN error banner shows "Invalid email or password"
GIVEN DashboardPage WHEN session cookie expired THEN user redirected to /login
...12 more
```

This is overwhelming and causes the user to rubber-stamp instead of meaningfully reviewing.

### 2. The Missing Glue

Without a visual flow artifact, the LLM treats each requirement as an island. For "I want a modal to submit a form," it
generates observables for modal-opens, form-validates, form-submits, success-shows — but misses:

- What button opens the modal? On what page?
- After success, does the modal close? Does the list behind it refresh?
- What loading state appears during submission?
- If the user navigates away mid-form, what happens?

These "glue" transitions only surface when you force the LLM to draw a **connected state flow** where every node must
have an entry and exit.

### 3. No Verification Plan

After implementation, the LLM must manually verify the feature works (click around the browser, call endpoints).
Currently this is ad-hoc — the agent improvises what to check. There's no spec-time artifact that says "here are the
exact steps to verify this works." This means:

- Verification is inconsistent
- The user can't review the verification plan upfront
- E2e tests get written but the agent still needs to manually confirm things are wired up

## The Solution: Flows + Enhanced Observables

Two changes to the quest funnel, not three or four. No new intermediate layers that duplicate information.

**1. Add Flows** — Mermaid diagrams that force the LLM to think through connected state transitions before writing
observables. This solves the glue problem.

**2. Enhance Observables** — Replace the abstract `outcomes` array with concrete `verification` steps (setup → trigger →
assertions). This bakes the verification plan into the observable itself. No separate playbook or scenarios — the
observable IS the scenario AND the verification plan.

```
Flows         (mermaid diagrams — the visual discovery tool)
    ↓          FORCES GLUE DISCOVERY, surfaces what needs to be built
Requirements  (derived from flows — WHAT falls out of the journey)
    ↓          User approves flows + requirements together
Observables   (derived from flow paths, with verification steps baked in — user approves)
    ↓
Contracts     (type dictionary, derived from observable details)
    ↓
Steps         (file-level implementation plan — PathSeeker generates)
```

### What is a Flow?

A flow is a **mermaid diagram** showing connected state transitions for a requirement or group of requirements. The LLM
thinks through every entry point, exit point, happy path, and error branch.

Flows have **no type enum**. The LLM picks whatever mermaid diagram style fits — `graph TD` for state machines,
`sequenceDiagram` for API interactions, whatever works. A single quest can mix styles. The mermaid syntax itself encodes
what kind of diagram it is.

**Example flow** for "I want a modal on the widgets page to create a widget":

```
┌─────────────────────────────────┐
│  /widgets page - list visible   │
└──────────────┬──────────────────┘
               │ clicks 'Add Widget'
               ▼
┌─────────────────────────────────┐
│  Modal opens - empty form       │
└──────────────┬──────────────────┘
               │ fills name + selects type
               ▼
┌─────────────────────────────────┐
│  Form has values                │◄────────────────────────┐
└──────────────┬──────────────────┘                         │
               │ clicks Submit                              │
               ▼                                            │
        ┌──────────────┐                                    │
        │   Client     │                                    │
        │  validation  │                                    │
        └──┬───────┬───┘                                    │
    valid  │       │ name empty                             │
           │       ▼                                        │
           │  ┌─────────────────────┐   fixes field         │
           │  │ Name shows Required │──────────────────────►│
           │  └─────────────────────┘                       │
           ▼                                                │
┌─────────────────────────────────┐                         │
│  Spinner on Submit, fields off  │                         │
└──────────────┬──────────────────┘                         │
               │ POST /api/widgets                          │
               ▼                                            │
        ┌──────────────┐                                    │
        │ API response │                                    │
        └─┬──────┬───┬─┘                                    │
     201  │      │   │ 500                                  │
          │   400│   ▼                                      │
          │      │ ┌──────────────────────┐                 │
          │      │ │ Toast: 'Something    │                 │
          │      │ │ went wrong'          │────────────────►│
          │      │ └──────────────────────┘                 │
          │      ▼                                          │
          │ ┌──────────────────────┐                        │
          │ │ Error banner with    │                        │
          │ │ API message          │───────────────────────►┘
          │ └──────────────────────┘
          ▼
┌─────────────────────────────────┐
│  Modal closes                   │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  List refetches GET /api/widgets│
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  New widget in list             │
└──────────────┬──────────────────┘
               ▼
┌─────────────────────────────────┐
│  Toast: 'Widget created'        │
└─────────────────────────────────┘
```

Every box has an arrow in and out. Error paths loop back. If a transition is missing, it's visible. **The flow forces
glue discovery.**

### What are Enhanced Observables?

The old observable had `outcomes` (abstract descriptions) AND a separate verification concept was proposed. These said
the same thing twice. The fix: **merge them**. Each observable carries `verification` steps — a single ordered list that
serves as both the description of what should happen AND the executable test plan.

Verification steps have three roles:

- **Setup** steps (action: navigate, click, fill) — get the system into the right state
- **Trigger** step — the action being tested
- **Assert** steps — what should be true, with an optional `type` tag PathSeeker uses for categorization

```json
{
  "id": "obs-2",
  "contextId": "ctx-widget-modal",
  "requirementId": "req-1",
  "trigger": "User submits valid widget creation form",
  "dependsOn": [
    "obs-1"
  ],
  "verification": [
    {
      "action": "navigate",
      "target": "/widgets"
    },
    {
      "action": "click",
      "target": "'Add Widget' button"
    },
    {
      "action": "fill",
      "target": "Name field",
      "value": "Test Widget"
    },
    {
      "action": "fill",
      "target": "Type dropdown",
      "value": "Standard"
    },
    {
      "action": "click",
      "target": "Submit button"
    },
    {
      "action": "assert",
      "condition": "Spinner on Submit button",
      "type": "ui-state"
    },
    {
      "action": "assert",
      "condition": "POST /api/widgets called",
      "type": "api-call"
    },
    {
      "action": "assert",
      "condition": "Modal closes",
      "type": "ui-state"
    },
    {
      "action": "assert",
      "condition": "'Test Widget' in widget list",
      "type": "ui-state"
    },
    {
      "action": "assert",
      "condition": "Toast: 'Widget created'",
      "type": "ui-state"
    }
  ]
}
```

**Who reads what:**

- **User** reads trigger + assert conditions — "do this, expect that" (human-readable QA checklist)
- **PathSeeker** reads assert `type` tags — "this needs ui-state work, this needs api-call work" (file planning)
- **Siegemaster** executes the full sequence — navigate, click, fill, assert (automated verification)

One data structure, three consumers, no duplication.

## Worked Example: Full Funnel

**User Request:** "I want a modal on the widgets page to create a new widget with a name and type"

### Layer 1: Flows (the LLM draws the journey first)

The LLM explores the codebase, talks to the user, then draws what the journey looks like. Two flows here — one for the
frontend user journey, one for the API sequence:

```json
{
  "flows": [
    {
      "id": "flow-1",
      "name": "Widget Creation Flow",
      "requirementIds": [
        "req-1"
      ],
      "entryPoint": "Widgets list page at /widgets",
      "exitPoints": [
        "Widgets list with new widget visible",
        "Modal with error state (on API failure)"
      ],
      "diagram": "graph TD\n  A[/widgets - list visible] -->|clicks Add Widget| B[Modal - empty form]\n  B -->|fills name + type| C[Form has values]\n  C -->|clicks Submit| D{Client validation}\n  D -->|name empty| E[Name shows Required]\n  E -->|fixes| C\n  D -->|valid| F[Spinner on Submit, fields disabled]\n  F -->|POST /api/widgets| G{API response}\n  G -->|201| H[Modal closes]\n  H --> I[List refetches]\n  I --> J[New widget in list]\n  J --> K[Toast: Widget created]\n  G -->|400| L[Error banner with API message]\n  L --> C\n  G -->|500| M[Toast: Something went wrong]\n  M --> C"
    },
    {
      "id": "flow-2",
      "name": "Widget Creation API",
      "requirementIds": [
        "req-1"
      ],
      "entryPoint": "POST /api/widgets request",
      "exitPoints": [
        "201 with widget object",
        "400 with errors",
        "500"
      ],
      "diagram": "sequenceDiagram\n  Client->>API: POST /api/widgets {name, type}\n  API->>Validator: Parse body\n  alt invalid\n    API-->>Client: 400 {errors}\n  end\n  API->>DB: INSERT widget\n  DB-->>API: Widget record\n  API-->>Client: 201 {id, name, type, createdAt}"
    }
  ]
}
```

### Layer 2: Requirements (derived from the flows)

Looking at the flows, the LLM extracts what needs to be built. Design decisions are recorded as they emerge during the
conversation.

```json
{
  "requirements": [
    {
      "id": "req-1",
      "name": "Widget Creation Modal",
      "description": "Users can create new widgets via a modal form on the widgets page",
      "scope": "packages/web, packages/server",
      "status": "approved"
    }
  ],
  "designDecisions": [
    {
      "id": "dd-1",
      "title": "Use Mantine Modal component",
      "rationale": "Mantine is already in the dependency tree, used for all other modals",
      "relatedRequirements": [
        "req-1"
      ]
    },
    {
      "id": "dd-2",
      "title": "Refetch list on modal close instead of optimistic insert",
      "rationale": "Simpler, consistent with existing patterns",
      "relatedRequirements": [
        "req-1"
      ]
    }
  ]
}
```

**Approval Gate:** User sees flows + requirements together. Approves/defers requirements, confirms flows look right.

### Layer 3: Observables (with verification steps)

Each observable is a path through a flow. The `verification` array is the executable test — setup, trigger, assertions.

```json
{
  "contexts": [
    {
      "id": "ctx-1",
      "name": "WidgetsPage",
      "description": "Widgets list page",
      "locator": {
        "page": "/widgets"
      }
    },
    {
      "id": "ctx-2",
      "name": "WidgetModal",
      "description": "Create widget modal form",
      "locator": {
        "page": "/widgets",
        "section": "modal"
      }
    },
    {
      "id": "ctx-3",
      "name": "WidgetAPI",
      "description": "Widget creation endpoint",
      "locator": {
        "page": "/api/widgets"
      }
    }
  ],
  "observables": [
    {
      "id": "obs-1",
      "contextId": "ctx-1",
      "requirementId": "req-1",
      "trigger": "User clicks 'Add Widget' button",
      "dependsOn": [],
      "verification": [
        {
          "action": "navigate",
          "target": "/widgets"
        },
        {
          "action": "click",
          "target": "'Add Widget' button"
        },
        {
          "action": "assert",
          "condition": "Modal visible with empty Name field and Type dropdown",
          "type": "ui-state"
        }
      ]
    },
    {
      "id": "obs-2",
      "contextId": "ctx-2",
      "requirementId": "req-1",
      "trigger": "User submits valid form (name: 'Test Widget', type: 'Standard')",
      "dependsOn": [
        "obs-1"
      ],
      "verification": [
        {
          "action": "navigate",
          "target": "/widgets"
        },
        {
          "action": "click",
          "target": "'Add Widget' button"
        },
        {
          "action": "fill",
          "target": "Name field",
          "value": "Test Widget"
        },
        {
          "action": "fill",
          "target": "Type dropdown",
          "value": "Standard"
        },
        {
          "action": "click",
          "target": "Submit button"
        },
        {
          "action": "assert",
          "condition": "Spinner on Submit, fields disabled",
          "type": "ui-state"
        },
        {
          "action": "assert",
          "condition": "POST /api/widgets called with {name: 'Test Widget', type: 'Standard'}",
          "type": "api-call"
        },
        {
          "action": "assert",
          "condition": "Modal closes",
          "type": "ui-state"
        },
        {
          "action": "assert",
          "condition": "'Test Widget' appears in widget list",
          "type": "ui-state"
        },
        {
          "action": "assert",
          "condition": "Toast: 'Widget created'",
          "type": "ui-state"
        }
      ]
    },
    {
      "id": "obs-3",
      "contextId": "ctx-2",
      "requirementId": "req-1",
      "trigger": "User submits form with empty name",
      "dependsOn": [
        "obs-1"
      ],
      "verification": [
        {
          "action": "navigate",
          "target": "/widgets"
        },
        {
          "action": "click",
          "target": "'Add Widget' button"
        },
        {
          "action": "click",
          "target": "Submit button"
        },
        {
          "action": "assert",
          "condition": "Name field shows 'Required' error",
          "type": "ui-state"
        },
        {
          "action": "assert",
          "condition": "Modal stays open",
          "type": "ui-state"
        },
        {
          "action": "assert",
          "condition": "No API request made",
          "type": "api-call"
        }
      ]
    },
    {
      "id": "obs-4",
      "contextId": "ctx-3",
      "requirementId": "req-1",
      "trigger": "POST /api/widgets with valid body",
      "dependsOn": [],
      "verification": [
        {
          "action": "request",
          "target": "POST /api/widgets",
          "value": "{\"name\": \"Test Widget\", \"type\": \"Standard\"}"
        },
        {
          "action": "assert",
          "condition": "Status 201",
          "type": "api-call"
        },
        {
          "action": "assert",
          "condition": "Response has id, name, type, createdAt",
          "type": "api-call"
        }
      ]
    },
    {
      "id": "obs-5",
      "contextId": "ctx-3",
      "requirementId": "req-1",
      "trigger": "POST /api/widgets with empty name",
      "dependsOn": [],
      "verification": [
        {
          "action": "request",
          "target": "POST /api/widgets",
          "value": "{\"name\": \"\", \"type\": \"Standard\"}"
        },
        {
          "action": "assert",
          "condition": "Status 400",
          "type": "api-call"
        },
        {
          "action": "assert",
          "condition": "Errors array includes name field",
          "type": "api-call"
        }
      ]
    },
    {
      "id": "obs-6",
      "contextId": "ctx-2",
      "requirementId": "req-1",
      "trigger": "API returns 400 after form submit",
      "dependsOn": [
        "obs-1"
      ],
      "verification": [
        {
          "action": "navigate",
          "target": "/widgets"
        },
        {
          "action": "click",
          "target": "'Add Widget' button"
        },
        {
          "action": "fill",
          "target": "Name field",
          "value": "INVALID_TRIGGER_400"
        },
        {
          "action": "click",
          "target": "Submit button"
        },
        {
          "action": "assert",
          "condition": "Error banner shows API error message",
          "type": "ui-state"
        },
        {
          "action": "assert",
          "condition": "Modal stays open, form editable",
          "type": "ui-state"
        }
      ]
    }
  ]
}
```

### Layer 4: Contracts

```json
{
  "contracts": [
    {
      "id": "c-1",
      "name": "WidgetCreateInput",
      "kind": "data",
      "status": "new",
      "properties": [
        {
          "name": "name",
          "type": "WidgetName",
          "description": "1-100 chars"
        },
        {
          "name": "type",
          "type": "WidgetType",
          "description": "'Standard' | 'Advanced'"
        }
      ]
    },
    {
      "id": "c-2",
      "name": "Widget",
      "kind": "data",
      "status": "new",
      "properties": [
        {
          "name": "id",
          "type": "WidgetId"
        },
        {
          "name": "name",
          "type": "WidgetName"
        },
        {
          "name": "type",
          "type": "WidgetType"
        },
        {
          "name": "createdAt",
          "type": "IsoTimestamp"
        }
      ]
    },
    {
      "id": "c-3",
      "name": "WidgetCreateEndpoint",
      "kind": "endpoint",
      "status": "new",
      "properties": [
        {
          "name": "method",
          "value": "POST"
        },
        {
          "name": "path",
          "value": "/api/widgets"
        },
        {
          "name": "requestBody",
          "type": "WidgetCreateInput"
        },
        {
          "name": "responseBody",
          "type": "Widget"
        }
      ]
    }
  ]
}
```

### Layer 5: Steps (PathSeeker generates)

```json
{
  "steps": [
    {
      "id": "s-1",
      "name": "Widget contracts",
      "observablesSatisfied": [],
      "dependsOn": [],
      "filesToCreate": [
        "shared/src/contracts/widget/..."
      ],
      "filesToModify": []
    },
    {
      "id": "s-2",
      "name": "Widget create endpoint",
      "observablesSatisfied": [
        "obs-4",
        "obs-5"
      ],
      "dependsOn": [
        "s-1"
      ],
      "filesToCreate": [
        "server/src/responders/widget/create/..."
      ],
      "filesToModify": []
    },
    {
      "id": "s-3",
      "name": "Widget create modal",
      "observablesSatisfied": [
        "obs-1",
        "obs-2",
        "obs-3",
        "obs-6"
      ],
      "dependsOn": [
        "s-1",
        "s-2"
      ],
      "filesToCreate": [
        "web/src/widgets/widget-create-modal/..."
      ],
      "filesToModify": [
        "web/src/flows/..."
      ]
    }
  ]
}
```

## Design Decisions

- **No flow type enum** — The mermaid syntax encodes the diagram style. No artificial constraint.
- **Verification replaces outcomes** — Assert steps carry optional `type` tags for PathSeeker categorization. One list (
  setup → trigger → assert) instead of two parallel descriptions.
- **No separate scenarios or playbook layers** — The observable trigger IS the scenario. The verification array IS the
  playbook. No duplication.
- **Observables stay visible** — User sees and approves them. The flow is the primary visual artifact, observables are
  the detailed checklist.
- **Flows before requirements** — The flow is the discovery tool. You draw the journey, and requirements fall out of it.
  User approves both together in one gate.
- **Quest status gets lifecycle gates** — Formalize `created`, `requirements_approved`, `approved` in the enum.
- **All new fields use `.default([])`** — Existing quest JSON files parse without error.

## New ChaosWhisperer Workflow

```
Phase 1: Discovery
  └─ Explore codebase, interview user
  └─ Understand what exists, what patterns are in use

Phase 2: Flow Mapping (NEW — flows come FIRST)
  └─ Draw mermaid flow diagrams based on user request
  └─ Every node needs entry + exit — forces glue discovery
  └─ Design decisions recorded as they emerge
  └─ PATCH flows + designDecisions

Phase 3: Requirements (derived FROM flows)
  └─ Extract requirements from flow nodes/paths
  └─ "Looking at these flows, here's what needs to be built..."
  └─ PATCH requirements

Phase 4: Flows + Requirements Approval Gate
  └─ Present flows (visual) + requirements (list) together
  └─ User sees the journey AND what it implies
  └─ Approves/defers requirements, confirms flows
  └─ PATCH status → 'requirements_approved'

Phase 5: Observables + Contracts (enhanced)
  └─ Derive observables from flow paths
  └─ Each observable carries verification steps (setup → trigger → asserts)
  └─ Lock down tangible values (routes, endpoints, error messages)
  └─ Declare contracts from observable details
  └─ PATCH observables, contexts, contracts, toolingRequirements

Phase 6: Observables Approval Gate
  └─ Present: observables with verification steps, contracts
  └─ User approves
  └─ PATCH status → 'approved'

Phase 7: Gap Review + Handoff
  └─ Spawn quest-gap-reviewer
  └─ Address gaps, final summary
```

---

## Implementation Changes

### Phase 0: New Contracts (packages/shared) [x] DONE

All in `packages/shared/src/contracts/`. Each gets `-contract.ts`, `-contract.test.ts`, `.stub.ts`.

#### Batch 0A — New ID Contract

| # | Contract                      | Schema                                |
|---|-------------------------------|---------------------------------------|
| 1 | `flow-id/flow-id-contract.ts` | `z.string().uuid().brand<'FlowId'>()` |

Pattern: `packages/shared/src/contracts/requirement-id/requirement-id-contract.ts`

#### Batch 0B — New Entity Contracts

| # | Contract                                          | Fields                                                                                                                                                                                  |
|---|---------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 2 | `verification-step/verification-step-contract.ts` | `action: VerificationAction`, `target?: VerificationTarget`, `value?: VerificationValue`, `condition?: VerificationCondition`, `type?: OutcomeType` (reuses existing outcome-type enum) |
| 3 | `flow/flow-contract.ts`                           | `id: FlowId`, `name: FlowName`, `requirementIds: RequirementId[].default([])`, `diagram: MermaidDiagram`, `entryPoint: FlowEntryPoint`, `exitPoints: FlowExitPoint[]`                   |

**Note on flow.requirementIds:** Defaults to `[]` because flows are created BEFORE requirements. The LLM PATCHes flows
first, then PATCHes requirements, then backfills `requirementIds` on flows in the same approval gate cycle. The
`quest-has-valid-flow-refs` guard only runs at verify-quest time (after all spec data is populated), not on every PATCH.

#### Batch 0C — Modify Existing Contracts

| # | File                                                   | Change                                                                                                                                                                                                                                                                                                            |
|---|--------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 4 | `observable/observable-contract.ts`                    | Add `verification: z.array(verificationStepContract).default([])`. Keep `outcomes` with `.default([])` — both exist during transition. ChaosWhisperer generates BOTH: `verification` (new, primary) and `outcomes` (derived from verification asserts, for backward compat until downstream agents are migrated). |
| 5 | `quest-status/quest-status-contract.ts`                | Add `'created'`, `'requirements_approved'`, `'approved'` to enum                                                                                                                                                                                                                                                  |
| 6 | `quest/quest-contract.ts`                              | Add `flows: z.array(flowContract).default([])`                                                                                                                                                                                                                                                                    |
| 7 | `quest/quest.stub.ts` + `quest/quest-contract.test.ts` | Update for new fields                                                                                                                                                                                                                                                                                             |

#### Batch 0D — Barrel Exports

| # | File                           | Change                                                     |
|---|--------------------------------|------------------------------------------------------------|
| 8 | `packages/shared/contracts.ts` | Add exports for flow-id, verification-step, flow contracts |

**Then:** `npm run build --workspace=@dungeonmaster/shared`

---

### Phase 1: Orchestrator Wiring (packages/orchestrator) [x] DONE

#### Batch 1A — Section + Stage

| #  | File                                                         | Change                                                                                                                 |
|----|--------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| 9  | `contracts/quest-section/quest-section-contract.ts`          | Add `'flows'` to enum                                                                                                  |
| 10 | `contracts/quest-stage/quest-stage-contract.ts`              | Add `'spec-flows'` stage                                                                                               |
| 11 | `statics/quest-stage-mapping/quest-stage-mapping-statics.ts` | Add `'spec-flows': ['requirements', 'designDecisions', 'flows', 'contracts']`. Add `'flows'` to existing `spec` stage. |

#### Batch 1B — Modify Quest Input + Broker

| #  | File                                                          | Change                                                                     |
|----|---------------------------------------------------------------|----------------------------------------------------------------------------|
| 12 | `contracts/modify-quest-input/modify-quest-input-contract.ts` | Add `flows?` optional array. Add `status?` for lifecycle gate transitions. |
| 13 | `brokers/quest/modify/quest-modify-broker.ts`                 | Add upsert block for `flows`. Add `status` write-through.                  |
| 14 | Update broker test + proxy                                    |                                                                            |

#### Batch 1C — Add Quest Broker

| #  | File                                    | Change                                                    |
|----|-----------------------------------------|-----------------------------------------------------------|
| 15 | `brokers/quest/add/quest-add-broker.ts` | Change initial status from `'in_progress'` to `'created'` |
| 16 | Update broker test                      |                                                           |

---

### Phase 2: Verification Guards (packages/orchestrator) [x] DONE

New guards, each in own folder with `-guard.ts`, `-guard.test.ts`, `-guard.proxy.ts`:

| #  | Guard                               | Check                                                         |
|----|-------------------------------------|---------------------------------------------------------------|
| 17 | `guards/quest-has-valid-flow-refs/` | All flow `requirementIds` point to existing requirements      |
| 18 | `guards/quest-has-flow-coverage/`   | Every approved requirement is referenced by at least one flow |

Update `transformers/quest-verify/quest-verify-transformer.ts` to include new guards.

---

### Phase 3: Prompt + Agent Pipeline Updates

| #  | File                                                                             | Change                                                                                                                                                                                                                       |
|----|----------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 19 | `statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics.ts`                 | Full rewrite with new workflow (flows-first, verification on observables). ChaosWhisperer generates BOTH `verification` and `outcomes` on observables during transition.                                                     |
| 20 | `.claude/commands/quest.md`                                                      | Mirror new workflow                                                                                                                                                                                                          |
| 21 | `.claude/agents/quest-gap-reviewer.md`                                           | Add review criteria for flows and verification steps. Update "Outcomes (THEN)" review to also cover verification steps.                                                                                                      |
| 22 | `statics/pathseeker-prompt/pathseeker-prompt-statics.ts`                         | Update to reference `verification` steps (assert type tags) alongside `outcomes` for file categorization                                                                                                                     |
| 23 | `statics/gap-reviewer-agent-prompt/gap-reviewer-agent-prompt-statics.ts`         | Update Step 5 outcomes review to include verification step review                                                                                                                                                            |
| 24 | `transformers/work-unit-to-arguments/work-unit-to-arguments-transformer.ts`      | **CRITICAL**: This feeds `observable.outcomes` to Codeweaver and Siegemaster agents. Update to also include `verification` assert steps in agent arguments. During transition, read from both `outcomes` and `verification`. |
| 25 | `transformers/work-unit-to-arguments/work-unit-to-arguments-transformer.test.ts` | Update tests for new verification data in arguments                                                                                                                                                                          |

---

### Phase 4: Exhaustive Switch Fixups

Adding `'created'`, `'requirements_approved'`, `'approved'` to `questStatusContract` and `'flows'` to
`questSectionContract` may cause TypeScript errors in exhaustive switches.

Key files to check:

- `packages/web/src/statics/quest-status-colors/`
- `packages/orchestrator/src/transformers/quest-section-filter/` — must handle `'flows'` section
- Any transformers/guards switching on quest status or section

---

## Key Risks and Mitigations

**Risk: Flows are optional for simple quests.** Not every quest needs a flow diagram (simple bug fixes, config changes).
Since `flows` uses `.default([])`, a quest with zero flows parses fine. The `quest-has-flow-coverage` guard (item 18)
should be soft — warn in gap review rather than block in verify-quest. ChaosWhisperer prompt should treat flows as "
recommended" not "mandatory."

**Risk: Status transitions have no guard.** Adding `status` to modify-quest-input without a transition guard means any
PATCH can set any status. For now this is acceptable — ChaosWhisperer prompt logic enforces the gates. A status
transition guard can be added later as a hardening step.

**Risk: Outcomes → verification migration.** During transition, ChaosWhisperer generates BOTH `outcomes` (for existing
downstream agents) and `verification` (new). The `workUnitToArgumentsTransformer` is updated to read both. Once all
prompts are migrated to use `verification`, `outcomes` can be deprecated.

## Dependency Graph

```
Phase 0 (shared contracts)
  0A (flow-id) ─┐
                 ├── 0B (verification-step, flow) ── 0C (modify observable, status, quest) ── 0D (barrel)
                 │
                 └── npm run build --workspace=@dungeonmaster/shared

Phase 1 (orchestrator wiring) ── depends on Phase 0
  1A (section+stage) ─┐
  1B (modify input)   ├── ward run
  1C (add broker)     ─┘

Phase 2 (guards) ── depends on Phase 0, parallel with Phase 1

Phase 3 (prompts + pipeline) ── depends on Phase 1
  ChaosWhisperer, PathSeeker, gap reviewer prompts
  workUnitToArgumentsTransformer (CRITICAL — feeds agents)

Phase 4 (fixups) ── depends on Phase 0C
  Exhaustive switches, section filter, status colors
```

---

## Verification

1. `npm run build --workspace=@dungeonmaster/shared` — shared compiles
2. `dungeonmaster-ward run --only typecheck` — all packages type-check
3. `dungeonmaster-ward run --only test` — all tests pass
4. `dungeonmaster-ward run --only lint` — no lint errors
5. Manual: Create quest, PATCH flows, GET with `?stage=spec-flows` to verify filtering
6. Manual: Verify `workUnitToArgumentsTransformer` includes verification data in agent arguments

---

## File Count Summary

- **New files:** ~9 (3 contracts x 3 files each: flow-id, verification-step, flow)
- **Modified files:** ~20 (observable contract, quest contract, quest status, modify-quest input, modify broker, add
  broker, section contract, stage contract, stage mapping, verify transformer, section filter transformer,
  workUnitToArguments transformer + test, chaoswhisperer prompt, pathseeker prompt, quest.md skill, gap reviewer
  prompt + statics, quest-status-colors)
- **Breaking changes:** Quest status enum expansion (exhaustive switches), observable contract gets `verification`
  field (outcomes kept for backward compat)
- **Non-breaking:** New `flows` field uses `.default([])`, existing JSON parses fine
