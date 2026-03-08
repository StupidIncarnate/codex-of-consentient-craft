import React, { useState } from 'react';
import { Box, Group, Stack, Text, UnstyledButton, ScrollArea } from '@mantine/core';
import { PixelSprite } from '../components/pixel-sprite.jsx';
import { fireballPixels } from '../sprites/fireball.jsx';
import { raccoonWizardPixels } from '../sprites/raccoon-wizard.jsx';
import { dumpsterFireFrameA, dumpsterFireFrameB } from '../sprites/dumpster-fire.jsx';
import { useTheme } from '../themes.jsx';

const logo = `
██████╗ ██╗   ██╗███╗   ██╗ ██████╗ ███████╗ ██████╗ ███╗   ██╗███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗
██╔══██╗██║   ██║████╗  ██║██╔════╝ ██╔════╝██╔═══██╗████╗  ██║████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██║  ██║██║   ██║██╔██╗ ██║██║  ███╗█████╗  ██║   ██║██╔██╗ ██║██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██║  ██║██║   ██║██║╚██╗██║██║   ██║██╔══╝  ██║   ██║██║╚██╗██║██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝╚██████╔╝██║ ╚████║╚██████╔╝███████╗╚██████╔╝██║ ╚████║██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
`.trimEnd();

const MOCK_QUEST_TITLE = 'Implement Auth Flow';

// --- Mock data ---

const MOCK_MESSAGES = [
  { from: 'user', text: 'I need an auth system with JWT tokens and refresh flow' },
  {
    from: 'chaos',
    text: 'Interesting. Let me explore your codebase to understand the current setup...',
  },
  { from: 'chaos', type: 'tool', text: 'Exploring packages/server/src/...' },
  {
    from: 'chaos',
    text: 'I see you have a Hono server with no auth middleware yet. A few questions to nail down the scope.',
  },
];

const MOCK_CLARIFY = {
  current: 1,
  total: 3,
  question: 'Where should the JWT secret be stored?',
  options: [
    { label: 'Environment variable', desc: 'Read from process.env.JWT_SECRET at startup' },
    { label: '.env file', desc: 'Loaded via dotenv, gitignored' },
    { label: 'Config broker', desc: 'Managed through existing config system' },
  ],
};

const MOCK_REQUIREMENTS = [
  {
    id: 'r1',
    name: 'JWT Authentication',
    desc: 'Issue signed JWT access tokens on login with 15min expiry',
    scope: 'packages/server',
    status: 'approved',
  },
  {
    id: 'r2',
    name: 'Refresh Token Flow',
    desc: 'Issue opaque refresh tokens stored server-side, 7-day expiry',
    scope: 'packages/server',
    status: 'approved',
  },
  {
    id: 'r3',
    name: 'Auth Middleware',
    desc: 'Hono middleware that validates JWT on protected routes',
    scope: 'packages/server',
    status: 'proposed',
  },
  {
    id: 'r4',
    name: 'Login Endpoint',
    desc: 'POST /api/auth/login accepting email + password',
    scope: 'packages/server',
    status: 'proposed',
  },
];

const MOCK_DECISIONS = [
  {
    id: 'd1',
    title: 'Use HS256 for JWT signing',
    rationale: 'Simpler than RS256, sufficient for single-server deployment',
    relatedRequirements: ['r1'],
  },
  {
    id: 'd2',
    title: 'Store refresh tokens in SQLite',
    rationale: 'Already using SQLite for other data, no new infra needed',
    relatedRequirements: ['r2'],
  },
];

const MOCK_CONTEXTS = [
  {
    id: 'c1',
    name: 'AuthLoginEndpoint',
    desc: 'POST /api/auth/login',
    locator: { page: '/api/auth/login', section: 'POST handler' },
  },
  {
    id: 'c2',
    name: 'ProtectedRoute',
    desc: 'Any route with auth middleware applied',
    locator: { page: '/api/*', section: 'middleware' },
  },
];

const MOCK_OBSERVABLES = [
  {
    id: 'o1',
    contextId: 'c1',
    reqId: 'r1',
    trigger: 'Valid credentials submitted to login',
    dependsOn: [],
    outcomes: [
      {
        type: 'api-call',
        description: 'Response contains signed JWT with 15min exp claim',
        criteria: { status: 200 },
      },
    ],
    verificationStatus: 'pending',
    verificationNotes: '',
  },
  {
    id: 'o2',
    contextId: 'c1',
    reqId: 'r1',
    trigger: 'Invalid credentials submitted',
    dependsOn: [],
    outcomes: [
      {
        type: 'api-call',
        description: 'Returns 401 with error message, no token issued',
        criteria: { status: 401 },
      },
    ],
    verificationStatus: 'pending',
    verificationNotes: '',
  },
  {
    id: 'o3',
    contextId: 'c1',
    reqId: 'r2',
    trigger: 'Access token expires, refresh token sent',
    dependsOn: ['o1'],
    outcomes: [
      {
        type: 'api-call',
        description: 'New access token issued, old refresh token rotated',
        criteria: { status: 200 },
      },
    ],
    verificationStatus: 'pending',
    verificationNotes: '',
  },
  {
    id: 'o4',
    contextId: 'c2',
    reqId: 'r3',
    trigger: 'Request to protected route without token',
    dependsOn: [],
    outcomes: [
      { type: 'api-call', description: 'Returns 401 Unauthorized', criteria: { status: 401 } },
    ],
    verificationStatus: 'pending',
    verificationNotes: '',
  },
];

const MOCK_CONTRACTS = [
  {
    id: 'ct1',
    name: 'LoginCredentials',
    kind: 'data',
    status: 'new',
    source: 'packages/shared/src/contracts/login-credentials/',
    properties: [
      { name: 'email', type: 'EmailAddress' },
      { name: 'password', type: 'PlainPassword' },
    ],
  },
  {
    id: 'ct2',
    name: 'AuthTokenPair',
    kind: 'data',
    status: 'new',
    source: 'packages/shared/src/contracts/auth-token-pair/',
    properties: [
      { name: 'accessToken', type: 'JwtToken' },
      { name: 'refreshToken', type: 'RefreshToken' },
      { name: 'expiresIn', type: 'Seconds' },
    ],
  },
  {
    id: 'ct3',
    name: 'AuthLoginEndpoint',
    kind: 'endpoint',
    status: 'new',
    source: 'packages/server/src/adapters/auth-login/',
    properties: [
      { name: 'method', value: 'POST' },
      { name: 'path', value: '/api/auth/login' },
    ],
  },
];

const MOCK_TOOLING = [
  {
    id: 't1',
    name: 'jsonwebtoken',
    pkg: 'jsonwebtoken',
    reason: 'JWT signing and verification',
    requiredByObservables: ['o1', 'o2', 'o3'],
  },
];

// --- Enums for dropdowns ---
const REQUIREMENT_STATUSES = ['proposed', 'approved', 'deferred'];
const OUTCOME_TYPES = [
  'api-call',
  'file-exists',
  'environment',
  'log-output',
  'process-state',
  'performance',
  'ui-state',
  'cache-state',
  'db-query',
  'queue-message',
  'external-api',
  'custom',
];
const CONTRACT_KINDS = ['data', 'endpoint', 'event'];
const CONTRACT_STATUSES = ['new', 'existing', 'modified'];
const VERIFICATION_STATUSES = ['pending', 'verified', 'failed'];

// --- Status colors ---
const STATUS_COLORS = {
  approved: 'success',
  proposed: 'warning',
  deferred: 'text-dim',
};

// --- Shared components ---

function PixelBtn({ label, onClick, theme, variant = 'primary', disabled = false, icon = false }) {
  const bg =
    variant === 'primary'
      ? theme.colors['primary']
      : variant === 'danger'
        ? theme.colors['danger']
        : theme.colors['bg-raised'];
  const fg =
    variant === 'primary'
      ? theme.colors['bg-deep']
      : variant === 'danger'
        ? theme.colors['bg-deep']
        : theme.colors['text'];
  return (
    <UnstyledButton
      onClick={disabled ? undefined : onClick}
      px={icon ? 8 : 'sm'}
      py={icon ? 0 : 4}
      style={{
        fontFamily: 'monospace',
        fontSize: icon ? 15 : 11,
        color: fg,
        backgroundColor: bg,
        border: `1px solid ${theme.colors['border']}`,
        borderRadius: 2,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {label}
    </UnstyledButton>
  );
}

function EditInput({ defaultValue, theme, placeholder, width = '100%', mt = 0, color }) {
  return (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      style={{
        fontFamily: 'monospace',
        fontSize: 11,
        color: color || theme.colors['text'],
        backgroundColor: theme.colors['bg-deep'],
        border: `1px solid ${theme.colors['border']}`,
        borderRadius: 2,
        padding: '2px 6px',
        width,
        marginTop: mt,
        boxSizing: 'border-box',
      }}
    />
  );
}

function EditSelect({ defaultValue, options, theme, width = 'auto', color }) {
  return (
    <select
      defaultValue={defaultValue}
      style={{
        fontFamily: 'monospace',
        fontSize: 11,
        color: color || theme.colors['text'],
        backgroundColor: theme.colors['bg-deep'],
        border: `1px solid ${theme.colors['border']}`,
        borderRadius: 2,
        padding: '2px 6px',
        width,
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function EditTagList({ label, items, theme }) {
  return (
    <Group gap={4} mt={2}>
      <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
        {label}:
      </Text>
      {items.map((item, i) => (
        <Text
          key={i}
          ff="monospace"
          style={{
            fontSize: 10,
            color: theme.colors['loot-rare'],
            backgroundColor: theme.colors['bg-deep'],
            border: `1px solid ${theme.colors['border']}`,
            borderRadius: 2,
            padding: '0 4px',
          }}
        >
          {item}
        </Text>
      ))}
      {items.length === 0 && (
        <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
          none
        </Text>
      )}
    </Group>
  );
}

function SectionHeader({ label, theme, count }) {
  return (
    <Group gap={6} mb={4}>
      <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['primary'] }}>
        {label}
      </Text>
      {count !== undefined && (
        <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
          ({count})
        </Text>
      )}
    </Group>
  );
}

function QuestTitleBar({ theme, editable = false }) {
  return (
    <Box style={{ borderBottom: `1px solid ${theme.colors['border']}`, padding: '8px 16px' }}>
      {editable ? (
        <EditInput
          defaultValue={MOCK_QUEST_TITLE}
          theme={theme}
          placeholder="Quest title"
          color={theme.colors['loot-gold']}
        />
      ) : (
        <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['loot-gold'] }}>
          {MOCK_QUEST_TITLE}
        </Text>
      )}
    </Box>
  );
}

function RaccoonAnimated() {
  const [flipped, setFlipped] = useState(false);
  React.useEffect(() => {
    const id = setInterval(() => setFlipped((f) => !f), 2000);
    return () => clearInterval(id);
  }, []);
  return (
    <Box style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
      <PixelSprite pixels={raccoonWizardPixels} scale={8} width={21} height={15} flip={flipped} />
    </Box>
  );
}

// --- Left panel: Chat ---

function ChatMessage({ msg, theme }) {
  const isUser = msg.from === 'user';
  const isTool = msg.type === 'tool';
  return (
    <Box
      style={{
        padding: '6px 10px',
        borderRadius: 2,
        backgroundColor: isUser ? theme.colors['bg-raised'] : 'transparent',
        borderRight: isUser
          ? `2px solid ${theme.colors['loot-gold']}`
          : isTool
            ? `2px solid ${theme.colors['text-dim']}`
            : `2px solid ${theme.colors['primary']}`,
        borderLeft: isUser
          ? `2px solid ${theme.colors['loot-gold']}`
          : isTool
            ? `2px solid ${theme.colors['text-dim']}`
            : `2px solid ${theme.colors['primary']}`,
        textAlign: isUser ? 'left' : 'right',
      }}
    >
      <Text
        ff="monospace"
        size="xs"
        fw={600}
        mb={2}
        style={{
          color: isUser
            ? theme.colors['loot-gold']
            : isTool
              ? theme.colors['text-dim']
              : theme.colors['primary'],
        }}
      >
        {isUser ? 'YOU' : isTool ? 'TOOL CALL' : 'CHAOSWHISPERER'}
      </Text>
      <Text
        ff="monospace"
        size="xs"
        style={{
          color: isTool ? theme.colors['text-dim'] : theme.colors['text'],
          fontStyle: isTool ? 'italic' : 'normal',
        }}
      >
        {msg.text}
      </Text>
    </Box>
  );
}

function ChatPanel({ theme }) {
  return (
    <Stack gap={8}>
      {MOCK_MESSAGES.map((msg, i) => (
        <ChatMessage key={i} msg={msg} theme={theme} />
      ))}
    </Stack>
  );
}

// --- Right panels ---

function ClarifyPanel({ theme }) {
  const q = MOCK_CLARIFY;
  return (
    <Stack gap={0} style={{ height: '100%' }}>
      <QuestTitleBar theme={theme} />
      <Stack gap="md" p={12}>
        <Group justify="space-between">
          <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['primary'] }}>
            CLARIFICATION
          </Text>
          <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
            Question {q.current} of {q.total}
          </Text>
        </Group>
        <Text ff="monospace" size="sm" style={{ color: theme.colors['text'] }}>
          {q.question}
        </Text>
        <Stack gap={6}>
          {q.options.map((opt, i) => (
            <UnstyledButton
              key={i}
              px="sm"
              py={8}
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                color: theme.colors['text'],
                backgroundColor: theme.colors['bg-raised'],
                border: `1px solid ${theme.colors['border']}`,
                borderRadius: 2,
                textAlign: 'left',
              }}
            >
              <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['loot-gold'] }}>
                {opt.label}
              </Text>
              <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                {opt.desc}
              </Text>
            </UnstyledButton>
          ))}
          <UnstyledButton
            px="sm"
            py={8}
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: theme.colors['text-dim'],
              backgroundColor: 'transparent',
              border: `1px dashed ${theme.colors['border']}`,
              borderRadius: 2,
            }}
          >
            Other...
          </UnstyledButton>
        </Stack>
      </Stack>
    </Stack>
  );
}

function PlanSection({ title, items, theme, renderItem, editable, onAdd, onRemove }) {
  return (
    <Box mb="sm">
      <Group justify="space-between" mb={4}>
        <SectionHeader label={title} theme={theme} count={items.length} />
        {editable && <PixelBtn label="+" onClick={onAdd} theme={theme} variant="ghost" icon />}
      </Group>
      <Stack gap={4}>
        {items.map((item, i) => (
          <Group key={item.id} gap={4} wrap="nowrap" align="flex-start">
            {editable && (
              <PixelBtn
                label="x"
                onClick={() => onRemove?.(item.id)}
                theme={theme}
                variant="danger"
                icon
              />
            )}
            <Box style={{ flex: 1 }}>{renderItem(item, editable)}</Box>
          </Group>
        ))}
      </Stack>
    </Box>
  );
}

function RequirementsApprovePanel({ theme, startEditing = false }) {
  const [editing, setEditing] = useState(startEditing);
  return (
    <Stack gap={0} style={{ height: '100%' }}>
      <QuestTitleBar theme={theme} editable={editing} />
      <Box style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <Text ff="monospace" size="xs" fw={600} mb="md" style={{ color: theme.colors['primary'] }}>
          {editing ? 'EDITING REQUIREMENTS' : 'REQUIREMENTS APPROVAL'}
        </Text>
        <PlanSection
          title="REQUIREMENTS"
          items={MOCK_REQUIREMENTS}
          theme={theme}
          editable={editing}
          renderItem={(req, edit) => (
            <Group gap={8} wrap="nowrap" align="flex-start">
              <Box style={{ flex: 1 }}>
                {edit ? (
                  <>
                    <input
                      defaultValue={req.name}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: theme.colors['text'],
                        backgroundColor: theme.colors['bg-deep'],
                        border: `1px solid ${theme.colors['border']}`,
                        borderRadius: 2,
                        padding: '2px 6px',
                        width: '100%',
                        marginBottom: 2,
                      }}
                    />
                    <input
                      defaultValue={req.desc}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: theme.colors['text-dim'],
                        backgroundColor: theme.colors['bg-deep'],
                        border: `1px solid ${theme.colors['border']}`,
                        borderRadius: 2,
                        padding: '2px 6px',
                        width: '100%',
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['text'] }}>
                      {req.name}
                    </Text>
                    <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                      {req.desc}
                    </Text>
                  </>
                )}
                {edit ? (
                  <input
                    defaultValue={req.scope}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: theme.colors['text-dim'],
                      backgroundColor: theme.colors['bg-deep'],
                      border: `1px solid ${theme.colors['border']}`,
                      borderRadius: 2,
                      padding: '2px 6px',
                      width: '100%',
                      marginTop: 2,
                    }}
                  />
                ) : (
                  <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                    scope: {req.scope}
                  </Text>
                )}
              </Box>
              <Text
                ff="monospace"
                size="xs"
                fw={600}
                style={{
                  color: theme.colors[STATUS_COLORS[req.status]],
                  flexShrink: 0,
                }}
              >
                {req.status.toUpperCase()}
              </Text>
            </Group>
          )}
        />
        <PlanSection
          title="DESIGN DECISIONS"
          items={MOCK_DECISIONS}
          theme={theme}
          editable={editing}
          renderItem={(dec, edit) => (
            <Box>
              {edit ? (
                <>
                  <input
                    defaultValue={dec.title}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: theme.colors['text'],
                      backgroundColor: theme.colors['bg-deep'],
                      border: `1px solid ${theme.colors['border']}`,
                      borderRadius: 2,
                      padding: '2px 6px',
                      width: '100%',
                      marginBottom: 2,
                    }}
                  />
                  <input
                    defaultValue={dec.rationale}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: theme.colors['text-dim'],
                      backgroundColor: theme.colors['bg-deep'],
                      border: `1px solid ${theme.colors['border']}`,
                      borderRadius: 2,
                      padding: '2px 6px',
                      width: '100%',
                    }}
                  />
                </>
              ) : (
                <>
                  <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['text'] }}>
                    {dec.title}
                  </Text>
                  <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                    {dec.rationale}
                  </Text>
                </>
              )}
            </Box>
          )}
        />
      </Box>
      <Box style={{ borderTop: `1px solid ${theme.colors['border']}`, padding: 12, flexShrink: 0 }}>
        <Group gap="xs">
          {editing ? (
            <>
              <PixelBtn label="SUBMIT" theme={theme} onClick={() => setEditing(false)} />
              <PixelBtn
                label="CANCEL"
                theme={theme}
                variant="ghost"
                onClick={() => setEditing(false)}
              />
            </>
          ) : (
            <>
              <PixelBtn label="APPROVE ALL" theme={theme} />
              <PixelBtn
                label="MODIFY"
                theme={theme}
                variant="ghost"
                onClick={() => setEditing(true)}
              />
            </>
          )}
        </Group>
      </Box>
    </Stack>
  );
}

function ObservablesApprovePanel({ theme, startEditing = false }) {
  const [editable, setEditable] = useState(startEditing);
  const edit = editable;
  return (
    <Stack gap={0} style={{ height: '100%' }}>
      <QuestTitleBar theme={theme} editable={edit} />
      <Box style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <Text ff="monospace" size="xs" fw={600} mb="md" style={{ color: theme.colors['primary'] }}>
          {editable ? 'EDITING SPEC' : 'OBSERVABLES APPROVAL'}
        </Text>

        {/* REQUIREMENTS */}
        <PlanSection
          title="REQUIREMENTS"
          items={MOCK_REQUIREMENTS}
          theme={theme}
          editable={edit}
          renderItem={(req) => (
            <Group gap={8} wrap="nowrap" align="flex-start">
              <Box style={{ flex: 1 }}>
                {edit ? (
                  <>
                    <EditInput defaultValue={req.name} theme={theme} placeholder="Name" />
                    <EditInput
                      defaultValue={req.desc}
                      theme={theme}
                      placeholder="Description"
                      mt={2}
                      color={theme.colors['text-dim']}
                    />
                    <EditInput
                      defaultValue={req.scope}
                      theme={theme}
                      placeholder="Scope"
                      mt={2}
                      color={theme.colors['text-dim']}
                    />
                  </>
                ) : (
                  <>
                    <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['text'] }}>
                      {req.name}
                    </Text>
                    <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                      {req.desc}
                    </Text>
                    <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                      scope: {req.scope}
                    </Text>
                  </>
                )}
              </Box>
              {edit ? (
                <EditSelect
                  defaultValue={req.status}
                  options={REQUIREMENT_STATUSES}
                  theme={theme}
                />
              ) : (
                <Text
                  ff="monospace"
                  size="xs"
                  fw={600}
                  style={{
                    color: theme.colors[STATUS_COLORS[req.status]],
                    flexShrink: 0,
                  }}
                >
                  {req.status.toUpperCase()}
                </Text>
              )}
            </Group>
          )}
        />

        {/* DESIGN DECISIONS */}
        <PlanSection
          title="DESIGN DECISIONS"
          items={MOCK_DECISIONS}
          theme={theme}
          editable={edit}
          renderItem={(dec) => (
            <Box>
              {edit ? (
                <>
                  <EditInput defaultValue={dec.title} theme={theme} placeholder="Title" />
                  <EditInput
                    defaultValue={dec.rationale}
                    theme={theme}
                    placeholder="Rationale"
                    mt={2}
                    color={theme.colors['text-dim']}
                  />
                  <EditTagList label="reqs" items={dec.relatedRequirements} theme={theme} />
                </>
              ) : (
                <>
                  <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['text'] }}>
                    {dec.title}
                  </Text>
                  <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                    {dec.rationale}
                  </Text>
                  <EditTagList label="reqs" items={dec.relatedRequirements} theme={theme} />
                </>
              )}
            </Box>
          )}
        />

        {/* CONTEXTS */}
        <PlanSection
          title="CONTEXTS"
          items={MOCK_CONTEXTS}
          theme={theme}
          editable={edit}
          renderItem={(ctx) => (
            <Box>
              {edit ? (
                <>
                  <EditInput
                    defaultValue={ctx.name}
                    theme={theme}
                    placeholder="Name"
                    color={theme.colors['loot-gold']}
                  />
                  <EditInput
                    defaultValue={ctx.desc}
                    theme={theme}
                    placeholder="Description"
                    mt={2}
                    color={theme.colors['text-dim']}
                  />
                  <Group gap={4} mt={2}>
                    <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                      locator:
                    </Text>
                    <EditInput
                      defaultValue={ctx.locator?.page || ''}
                      theme={theme}
                      placeholder="page"
                      width="40%"
                      color={theme.colors['text-dim']}
                    />
                    <EditInput
                      defaultValue={ctx.locator?.section || ''}
                      theme={theme}
                      placeholder="section"
                      width="40%"
                      color={theme.colors['text-dim']}
                    />
                  </Group>
                </>
              ) : (
                <>
                  <Text
                    ff="monospace"
                    size="xs"
                    fw={600}
                    style={{ color: theme.colors['loot-gold'] }}
                  >
                    {ctx.name}
                  </Text>
                  <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                    {ctx.desc}
                  </Text>
                  {ctx.locator && (
                    <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                      locator: {ctx.locator.page} &rarr; {ctx.locator.section}
                    </Text>
                  )}
                </>
              )}
            </Box>
          )}
        />

        {/* OBSERVABLES */}
        <PlanSection
          title="OBSERVABLES"
          items={MOCK_OBSERVABLES}
          theme={theme}
          editable={edit}
          renderItem={(obs) => (
            <Box>
              {edit ? (
                <>
                  <Group gap={4} mb={2}>
                    <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                      context:
                    </Text>
                    <EditSelect
                      defaultValue={obs.contextId}
                      options={MOCK_CONTEXTS.map((c) => c.id)}
                      theme={theme}
                      color={theme.colors['loot-gold']}
                    />
                    <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                      req:
                    </Text>
                    <EditSelect
                      defaultValue={obs.reqId || ''}
                      options={['', ...MOCK_REQUIREMENTS.map((r) => r.id)]}
                      theme={theme}
                      color={theme.colors['loot-rare']}
                    />
                    <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                      verify:
                    </Text>
                    <EditSelect
                      defaultValue={obs.verificationStatus}
                      options={VERIFICATION_STATUSES}
                      theme={theme}
                    />
                  </Group>
                  <EditInput
                    defaultValue={obs.trigger}
                    theme={theme}
                    placeholder="WHEN trigger..."
                  />
                  {obs.outcomes.map((oc, oi) => (
                    <Group key={oi} gap={4} mt={2} wrap="nowrap" align="flex-start">
                      <EditSelect
                        defaultValue={oc.type}
                        options={OUTCOME_TYPES}
                        theme={theme}
                        color={theme.colors['text-dim']}
                      />
                      <Box style={{ flex: 1 }}>
                        <EditInput
                          defaultValue={oc.description}
                          theme={theme}
                          placeholder="THEN outcome..."
                          color={theme.colors['success']}
                        />
                      </Box>
                    </Group>
                  ))}
                  <EditInput
                    defaultValue={obs.verificationNotes || ''}
                    theme={theme}
                    placeholder="Verification notes"
                    mt={2}
                    color={theme.colors['text-dim']}
                  />
                  <EditTagList label="depends" items={obs.dependsOn} theme={theme} />
                </>
              ) : (
                <>
                  <Group gap={8} mb={2}>
                    <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                      ctx: <span style={{ color: theme.colors['loot-gold'] }}>{obs.contextId}</span>
                    </Text>
                    {obs.reqId && (
                      <Text
                        ff="monospace"
                        style={{ fontSize: 10, color: theme.colors['text-dim'] }}
                      >
                        req: <span style={{ color: theme.colors['loot-rare'] }}>{obs.reqId}</span>
                      </Text>
                    )}
                    <Text
                      ff="monospace"
                      style={{
                        fontSize: 10,
                        color: theme.colors[STATUS_COLORS[obs.verificationStatus] || 'text-dim'],
                      }}
                    >
                      {obs.verificationStatus}
                    </Text>
                  </Group>
                  <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                    WHEN <span style={{ color: theme.colors['text'] }}>{obs.trigger}</span>
                  </Text>
                  {obs.outcomes.map((oc, oi) => (
                    <Text
                      key={oi}
                      ff="monospace"
                      size="xs"
                      style={{ color: theme.colors['text-dim'] }}
                    >
                      THEN <span style={{ color: theme.colors['success'] }}>{oc.description}</span>{' '}
                      <span style={{ fontSize: 10 }}>({oc.type})</span>
                    </Text>
                  ))}
                  {obs.dependsOn.length > 0 && (
                    <EditTagList label="depends" items={obs.dependsOn} theme={theme} />
                  )}
                </>
              )}
            </Box>
          )}
        />

        {/* CONTRACTS */}
        <PlanSection
          title="CONTRACTS"
          items={MOCK_CONTRACTS}
          theme={theme}
          editable={edit}
          renderItem={(ct) => (
            <Box>
              {edit ? (
                <>
                  <Group gap={4} mb={2}>
                    <EditInput
                      defaultValue={ct.name}
                      theme={theme}
                      placeholder="Name"
                      width="40%"
                      color={theme.colors['loot-rare']}
                    />
                    <EditSelect
                      defaultValue={ct.kind}
                      options={CONTRACT_KINDS}
                      theme={theme}
                      color={theme.colors['text-dim']}
                    />
                    <EditSelect
                      defaultValue={ct.status}
                      options={CONTRACT_STATUSES}
                      theme={theme}
                      color={theme.colors['success']}
                    />
                  </Group>
                  <EditInput
                    defaultValue={ct.source || ''}
                    theme={theme}
                    placeholder="Source path"
                    color={theme.colors['text-dim']}
                  />
                  {ct.properties?.map((p, pi) => (
                    <Group key={pi} gap={4} mt={2}>
                      <EditInput
                        defaultValue={p.name}
                        theme={theme}
                        placeholder="prop name"
                        width="30%"
                        color={theme.colors['text-dim']}
                      />
                      {p.type && (
                        <EditInput
                          defaultValue={p.type}
                          theme={theme}
                          placeholder="type"
                          width="30%"
                        />
                      )}
                      {p.value && (
                        <EditInput
                          defaultValue={p.value}
                          theme={theme}
                          placeholder="value"
                          width="30%"
                        />
                      )}
                    </Group>
                  ))}
                </>
              ) : (
                <>
                  <Group gap={8}>
                    <Text
                      ff="monospace"
                      size="xs"
                      fw={600}
                      style={{ color: theme.colors['loot-rare'] }}
                    >
                      {ct.name}
                    </Text>
                    <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                      {ct.kind}
                    </Text>
                    <Text ff="monospace" size="xs" style={{ color: theme.colors['success'] }}>
                      {ct.status}
                    </Text>
                  </Group>
                  {ct.source && (
                    <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                      {ct.source}
                    </Text>
                  )}
                  {ct.properties?.map((p, pi) => (
                    <Text
                      key={pi}
                      ff="monospace"
                      style={{ fontSize: 10, color: theme.colors['text-dim'] }}
                    >
                      {p.name}:{' '}
                      <span style={{ color: theme.colors['text'] }}>{p.type || p.value}</span>
                      {p.description && ` — ${p.description}`}
                    </Text>
                  ))}
                </>
              )}
            </Box>
          )}
        />

        {/* TOOLING */}
        <PlanSection
          title="TOOLING"
          items={MOCK_TOOLING}
          theme={theme}
          editable={edit}
          renderItem={(t) => (
            <Box>
              {edit ? (
                <>
                  <Group gap={4}>
                    <EditInput defaultValue={t.name} theme={theme} placeholder="Name" width="30%" />
                    <EditInput
                      defaultValue={t.pkg}
                      theme={theme}
                      placeholder="Package"
                      width="30%"
                      color={theme.colors['text-dim']}
                    />
                    <EditInput
                      defaultValue={t.reason}
                      theme={theme}
                      placeholder="Reason"
                      width="40%"
                      color={theme.colors['text-dim']}
                    />
                  </Group>
                  <EditTagList label="observables" items={t.requiredByObservables} theme={theme} />
                </>
              ) : (
                <>
                  <Group gap={8}>
                    <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['text'] }}>
                      {t.name}
                    </Text>
                    <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                      {t.pkg}
                    </Text>
                    <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                      — {t.reason}
                    </Text>
                  </Group>
                  <EditTagList label="observables" items={t.requiredByObservables} theme={theme} />
                </>
              )}
            </Box>
          )}
        />
      </Box>
      <Box style={{ borderTop: `1px solid ${theme.colors['border']}`, padding: 12, flexShrink: 0 }}>
        <Group gap="xs">
          {editable ? (
            <>
              <PixelBtn label="SUBMIT" theme={theme} onClick={() => setEditable(false)} />
              <PixelBtn
                label="CANCEL"
                theme={theme}
                variant="ghost"
                onClick={() => setEditable(false)}
              />
            </>
          ) : (
            <>
              <PixelBtn label="APPROVE" theme={theme} />
              <PixelBtn
                label="MODIFY"
                theme={theme}
                variant="ghost"
                onClick={() => setEditable(true)}
              />
            </>
          )}
        </Group>
      </Box>
    </Stack>
  );
}

function DesignProtoPanel({ theme }) {
  return (
    <Stack gap={0} style={{ height: '100%' }}>
      <QuestTitleBar theme={theme} />
      <Group
        justify="space-between"
        p={8}
        style={{ borderBottom: `1px solid ${theme.colors['border']}` }}
      >
        <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['primary'] }}>
          DESIGN PROTOTYPE
        </Text>
        <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
          localhost:4000
        </Text>
      </Group>
      <Box
        style={{
          flex: 1,
          backgroundColor: theme.colors['bg-surface'],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack align="center" gap="xs">
          <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
            &#9484;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9488;
          </Text>
          <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
            &#9474; iframe content &#9474;
          </Text>
          <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
            &#9474; design spec &#9474;
          </Text>
          <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
            &#9474; renders here &#9474;
          </Text>
          <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
            &#9492;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9472;&#9496;
          </Text>
        </Stack>
      </Box>
    </Stack>
  );
}

// --- Right panel router ---

function RightPanel({ scenario, theme }) {
  switch (scenario) {
    case 'clarify':
      return <ClarifyPanel theme={theme} />;
    case 'req-approve':
      return <RequirementsApprovePanel theme={theme} />;
    case 'req-edit':
      return <RequirementsApprovePanel theme={theme} startEditing />;
    case 'obs-approve':
      return <ObservablesApprovePanel theme={theme} startEditing={false} />;
    case 'obs-edit':
      return <ObservablesApprovePanel theme={theme} startEditing={true} />;
    case 'design-proto':
      return <DesignProtoPanel theme={theme} />;
    default:
      return null;
  }
}

// --- Main page ---

// --- Execution View ---

const ROLE_COLORS = {
  pathseeker: 'primary',
  codeweaver: 'primary',
  ward: 'warning',
  spiritmender: 'primary',
  siegemaster: 'primary',
  lawbringer: 'primary',
};

const STATUS_CONFIG = {
  queued: { label: 'QUEUED', color: 'text-dim', symbol: '···' },
  pending: { label: 'PENDING', color: 'text-dim', symbol: '···' },
  in_progress: { label: 'RUNNING', color: 'primary', symbol: '▶' },
  complete: { label: 'DONE', color: 'success', symbol: '✓' },
  failed: { label: 'FAILED', color: 'danger', symbol: '✗' },
  partially_complete: { label: 'PARTIAL', color: 'warning', symbol: '◇' },
};

const MOCK_EXEC_PLANNING = {
  phase: 'pathseeker',
  completed: 0,
  total: 0,
  steps: [],
  pathseekerMessages: [
    { from: 'pathseeker', text: 'Analyzing quest spec and dependency graph...' },
    { from: 'pathseeker', type: 'tool', text: 'Reading packages/server/src/adapters/...' },
    { from: 'pathseeker', text: 'Found existing Hono server with middleware pattern. Mapping dependencies...' },
    { from: 'pathseeker', type: 'tool', text: 'Reading packages/shared/src/contracts/...' },
    {
      from: 'pathseeker',
      text: "I've identified 8 implementation steps across 3 dependency tiers. Building the DAG now...",
    },
  ],
};

const MOCK_EXEC_RUNNING_STEPS = [
  {
    id: 's1',
    order: 1,
    name: 'Create login-credentials contract',
    role: 'codeweaver',
    status: 'complete',
    files: ['login-credentials-contract.ts'],
    dependsOn: [],
  },
  {
    id: 's2',
    order: 2,
    name: 'Create auth-token-pair contract',
    role: 'codeweaver',
    status: 'complete',
    files: ['auth-token-pair-contract.ts'],
    dependsOn: [],
  },
  {
    id: 's3',
    order: 3,
    name: 'Create jwt-sign adapter',
    role: 'codeweaver',
    status: 'complete',
    files: ['jwt-sign-adapter.ts', 'jwt-sign-adapter.test.ts'],
    dependsOn: [],
  },
  {
    id: 's4',
    order: 4,
    name: 'Create auth-login broker',
    role: 'codeweaver',
    status: 'in_progress',
    files: ['auth-login-broker.ts', 'auth-login-broker.test.ts'],
    dependsOn: ['s1', 's3'],
    messages: [
      {
        from: 'codeweaver',
        text: 'Creating the auth login broker. This composes the jwt-sign adapter with the user-fetch broker to validate credentials and issue tokens.',
      },
      { from: 'codeweaver', type: 'tool', text: 'Writing brokers/auth/login/auth-login-broker.ts' },
    ],
  },
  {
    id: 's5',
    order: 5,
    name: 'Create auth-refresh broker',
    role: 'codeweaver',
    status: 'in_progress',
    files: ['auth-refresh-broker.ts'],
    dependsOn: ['s2', 's3'],
  },
  {
    id: 's6',
    order: 6,
    name: 'Create auth middleware',
    role: 'codeweaver',
    status: 'in_progress',
    files: ['auth-middleware.ts'],
    dependsOn: ['s3'],
  },
  {
    id: 's7',
    order: 7,
    name: 'Create login responder',
    role: 'codeweaver',
    status: 'queued',
    files: ['auth-login-responder.ts'],
    dependsOn: ['s4'],
  },
  {
    id: 's8',
    order: 8,
    name: 'Create refresh responder',
    role: 'codeweaver',
    status: 'pending',
    files: ['auth-refresh-responder.ts'],
    dependsOn: ['s5', 's6'],
  },
];

const MOCK_EXEC_RUNNING = {
  phase: 'codeweaver',
  completed: 3,
  total: 8,
  concurrent: { active: 3, max: 3 },
  steps: MOCK_EXEC_RUNNING_STEPS,
};

const MOCK_EXEC_ADHOC = {
  phase: 'codeweaver',
  completed: 3,
  total: 8,
  concurrent: { active: 2, max: 3 },
  steps: [
    ...MOCK_EXEC_RUNNING_STEPS.slice(0, 3),
    { ...MOCK_EXEC_RUNNING_STEPS[3], status: 'partially_complete', messages: undefined },
    {
      id: 's4a',
      order: '4a',
      name: 'Fix auth-login broker',
      role: 'spiritmender',
      status: 'in_progress',
      files: ['auth-login-broker.ts'],
      dependsOn: ['s4'],
      isAdhoc: true,
      messages: [
        {
          from: 'spiritmender',
          text: 'The auth-login broker has a type error in the return type. The broker returns Promise<AuthToken> but the contract expects AuthTokenPair. Fixing the return shape now.',
        },
        { from: 'spiritmender', type: 'tool', text: 'Editing brokers/auth/login/auth-login-broker.ts' },
      ],
    },
    ...MOCK_EXEC_RUNNING_STEPS.slice(4),
  ],
};

function FloorHeader({ label, theme, concurrent }) {
  return (
    <Group
      gap={4}
      align="center"
      mt="sm"
      mb={6}
      style={{ overflow: 'hidden' }}
    >
      <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'], flexShrink: 0 }}>
        ──
      </Text>
      <Text
        ff="monospace"
        style={{ fontSize: 10, color: theme.colors['primary'], flexShrink: 0, fontWeight: 600 }}
      >
        {label}
      </Text>
      <Text
        ff="monospace"
        style={{
          fontSize: 10,
          color: theme.colors['text-dim'],
          flex: 1,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        ──────────────────────────────────────────
      </Text>
      {concurrent && (
        <Text
          ff="monospace"
          style={{ fontSize: 10, color: theme.colors['text-dim'], flexShrink: 0 }}
        >
          Concurrent: {concurrent.active}/{concurrent.max}
        </Text>
      )}
    </Group>
  );
}

function ExecutionStatusBar({ theme, completed, total, phase }) {
  return (
    <Group
      justify="space-between"
      px={12}
      py={6}
      style={{ borderBottom: `1px solid ${theme.colors['border']}` }}
    >
      <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['primary'] }}>
        EXECUTION
      </Text>
      <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['text-dim'] }}>
        {phase === 'pathseeker' ? 'PLANNING' : `${completed}/${total} COMPLETE`}
      </Text>
    </Group>
  );
}

function ExecutionMessage({ msg, theme, roleColor }) {
  const isTool = msg.type === 'tool';
  const color = isTool ? theme.colors['text-dim'] : theme.colors[roleColor];
  return (
    <Box
      style={{
        padding: '4px 8px',
        borderLeft: `2px solid ${color}`,
        marginBottom: 4,
      }}
    >
      <Text
        ff="monospace"
        style={{
          fontSize: 10,
          fontWeight: 600,
          color,
          marginBottom: 1,
        }}
      >
        {isTool ? 'TOOL CALL' : msg.from.toUpperCase()}
      </Text>
      <Text
        ff="monospace"
        style={{
          fontSize: 11,
          color: isTool ? theme.colors['text-dim'] : theme.colors['text'],
          fontStyle: isTool ? 'italic' : 'normal',
        }}
      >
        {msg.text}
      </Text>
    </Box>
  );
}

function StreamingBar({ theme }) {
  return (
    <Box
      style={{
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Text
        ff="monospace"
        style={{
          fontSize: 10,
          color: theme.colors['text-dim'],
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        {'░'.repeat(20)} streaming...
      </Text>
    </Box>
  );
}

function ExecutionRow({ step, theme, expanded, onToggle }) {
  const statusCfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
  const roleColor = ROLE_COLORS[step.role] || 'text';
  const isExpandable = step.status === 'in_progress' || step.status === 'complete' ||
    step.status === 'partially_complete' || step.status === 'failed';
  const orderDisplay = typeof step.order === 'number'
    ? String(step.order).padStart(2, '0')
    : typeof step.order === 'string'
      ? step.order.padStart(3, '0')
      : '--';

  return (
    <Box
      mb={2}
      style={{
        borderLeft: step.isAdhoc
          ? `2px dashed ${theme.colors['warning']}`
          : '2px solid transparent',
        paddingLeft: step.isAdhoc ? 4 : 0,
      }}
    >
      {/* Row header */}
      <UnstyledButton
        onClick={isExpandable ? onToggle : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 4px',
          cursor: isExpandable ? 'pointer' : 'default',
          borderRadius: 2,
          backgroundColor: expanded ? theme.colors['bg-raised'] : 'transparent',
        }}
      >
        {/* Chevron / dots */}
        <Text
          ff="monospace"
          style={{
            fontSize: 10,
            color: isExpandable
              ? theme.colors[roleColor]
              : theme.colors['text-dim'],
            width: 14,
            flexShrink: 0,
            textAlign: 'center',
          }}
        >
          {isExpandable ? (expanded ? '▾' : '▸') : '···'}
        </Text>

        {/* Order number */}
        <Text
          ff="monospace"
          style={{
            fontSize: 10,
            color: step.isAdhoc ? theme.colors['warning'] : theme.colors['text-dim'],
            width: 24,
            flexShrink: 0,
          }}
        >
          {orderDisplay}
        </Text>

        {/* Role badge */}
        <Text
          ff="monospace"
          style={{
            fontSize: 10,
            color: theme.colors[roleColor],
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          [{step.role.toUpperCase()}]
        </Text>

        {/* Step name */}
        <Text
          ff="monospace"
          style={{
            fontSize: 11,
            color: theme.colors['text'],
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {step.name}
        </Text>

        {/* AD-HOC tag */}
        {step.isAdhoc && (
          <Text
            ff="monospace"
            style={{
              fontSize: 9,
              color: theme.colors['warning'],
              fontWeight: 600,
              flexShrink: 0,
              border: `1px solid ${theme.colors['warning']}`,
              borderRadius: 2,
              padding: '0 3px',
            }}
          >
            AD-HOC
          </Text>
        )}

        {/* Status badge */}
        <Text
          ff="monospace"
          style={{
            fontSize: 10,
            color: theme.colors[statusCfg.color],
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {statusCfg.label}
        </Text>
      </UnstyledButton>

      {/* Subtitle: files or dependency info */}
      {!expanded && (
        <Text
          ff="monospace"
          style={{
            fontSize: 9,
            color: theme.colors['text-dim'],
            paddingLeft: 44,
            marginTop: -1,
          }}
        >
          {step.status === 'queued' && step.dependsOn?.length > 0
            ? `└─ waiting for slot (depends on: ${step.dependsOn.map((d) => d.replace('s', '')).join(', ')})`
            : step.status === 'pending' && step.dependsOn?.length > 0
              ? `└─ depends on: ${step.dependsOn.map((d) => d.replace('s', '')).join(', ')}`
              : step.files?.length > 0
                ? `└─ ${step.files.join(', ')}`
                : ''}
        </Text>
      )}

      {/* Expanded content: LLM messages */}
      {expanded && (
        <Box
          style={{
            margin: '4px 0 4px 20px',
            padding: 8,
            backgroundColor: theme.colors['bg-surface'],
            border: `1px solid ${theme.colors['border']}`,
            borderRadius: 2,
          }}
        >
          {step.messages?.map((msg, i) => (
            <ExecutionMessage key={i} msg={msg} theme={theme} roleColor={roleColor} />
          ))}
          {step.status === 'in_progress' && <StreamingBar theme={theme} />}
        </Box>
      )}
    </Box>
  );
}

function DumpsterRaccoonPlaceholder({ theme }) {
  const [flipped, setFlipped] = useState(false);
  const [flameFrame, setFlameFrame] = useState(false);
  React.useEffect(() => {
    const id = setInterval(() => setFlipped((f) => !f), 2500);
    return () => clearInterval(id);
  }, []);
  React.useEffect(() => {
    const id = setInterval(() => setFlameFrame((f) => !f), 300);
    return () => clearInterval(id);
  }, []);

  const d = theme.colors['text-dim'];

  return (
    <Box
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors['bg-surface'],
        gap: 8,
      }}
    >
      <Group gap={0} align="flex-end">
        {/* Raccoon */}
        <Box style={{ position: 'relative', zIndex: 1, marginRight: 12 }}>
          <PixelSprite pixels={raccoonWizardPixels} scale={8} width={21} height={15} flip={flipped} />
        </Box>
        {/* Dumpster fire */}
        <PixelSprite pixels={flameFrame ? dumpsterFireFrameB : dumpsterFireFrameA} scale={6} width={20} height={22} />
      </Group>
      <Text ff="monospace" style={{ fontSize: 11, color: d, marginTop: 8 }}>
        Loading dumpster dungeon visuals...
      </Text>
    </Box>
  );
}

function ExecutionPanel({ theme, scenario }) {
  const [expandedId, setExpandedId] = useState(null);
  const data =
    scenario === 'exec-planning'
      ? MOCK_EXEC_PLANNING
      : scenario === 'exec-adhoc'
        ? MOCK_EXEC_ADHOC
        : MOCK_EXEC_RUNNING;

  // Auto-expand the first running step or pathseeker
  React.useEffect(() => {
    if (scenario === 'exec-planning') {
      setExpandedId('pathseeker');
    } else {
      const firstRunning = data.steps.find((s) => s.status === 'in_progress');
      setExpandedId(firstRunning?.id || null);
    }
  }, [scenario]);

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <Stack gap={0} style={{ height: '100%' }}>
      <QuestTitleBar theme={theme} />
      <ExecutionStatusBar theme={theme} completed={data.completed} total={data.total} phase={data.phase} />
      <Box style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        {/* FLOOR 1: CARTOGRAPHY */}
        <FloorHeader label="FLOOR 1: CARTOGRAPHY" theme={theme} />
        {scenario === 'exec-planning' ? (
          <>
            <ExecutionRow
              step={{
                id: 'pathseeker',
                order: '--',
                name: 'Planning steps...',
                role: 'pathseeker',
                status: 'in_progress',
                files: [],
                dependsOn: [],
                messages: data.pathseekerMessages,
              }}
              theme={theme}
              expanded={expandedId === 'pathseeker'}
              onToggle={() => toggle('pathseeker')}
            />
            <Text
              ff="monospace"
              style={{
                fontSize: 10,
                color: theme.colors['text-dim'],
                textAlign: 'center',
                padding: '16px 0',
              }}
            >
              Steps will appear once cartography is complete...
            </Text>
          </>
        ) : (
          <ExecutionRow
            step={{
              id: 'pathseeker-done',
              order: '--',
              name: `Planned ${data.total} steps`,
              role: 'pathseeker',
              status: 'complete',
              files: [],
              dependsOn: [],
              messages: [
                { from: 'pathseeker', text: `Mapped ${data.total} implementation steps across 3 dependency tiers.` },
              ],
            }}
            theme={theme}
            expanded={expandedId === 'pathseeker-done'}
            onToggle={() => toggle('pathseeker-done')}
          />
        )}

        {/* FLOOR 2: FORGE (only when we have steps) */}
        {data.steps.length > 0 && (
          <>
            <FloorHeader
              label="FLOOR 2: FORGE"
              theme={theme}
              concurrent={data.concurrent}
            />
            {data.steps.map((step) => (
              <ExecutionRow
                key={step.id}
                step={step}
                theme={theme}
                expanded={expandedId === step.id}
                onToggle={() => toggle(step.id)}
              />
            ))}
          </>
        )}

        {/* FLOOR 3: GAUNTLET */}
        {data.steps.length > 0 && (
          <>
            <FloorHeader label="FLOOR 3: GAUNTLET" theme={theme} />
            <ExecutionRow
              step={{
                id: 'ward',
                order: '--',
                name: 'Lint + Typecheck + Tests',
                role: 'ward',
                status: 'pending',
                files: [],
                dependsOn: [],
              }}
              theme={theme}
              expanded={expandedId === 'ward'}
              onToggle={() => toggle('ward')}
            />
          </>
        )}

        {/* FLOOR 4: ARENA */}
        {data.steps.length > 0 && (
          <>
            <FloorHeader label="FLOOR 4: ARENA" theme={theme} />
            <ExecutionRow
              step={{
                id: 'siegemaster',
                order: '--',
                name: 'Verify observables',
                role: 'siegemaster',
                status: 'pending',
                files: [],
                dependsOn: [],
              }}
              theme={theme}
              expanded={expandedId === 'siegemaster'}
              onToggle={() => toggle('siegemaster')}
            />
          </>
        )}

        {/* FLOOR 5: TRIBUNAL */}
        {data.steps.length > 0 && (
          <>
            <FloorHeader label="FLOOR 5: TRIBUNAL" theme={theme} />
            <ExecutionRow
              step={{
                id: 'lawbringer',
                order: '--',
                name: 'Code quality review',
                role: 'lawbringer',
                status: 'pending',
                files: [],
                dependsOn: [],
              }}
              theme={theme}
              expanded={expandedId === 'lawbringer'}
              onToggle={() => toggle('lawbringer')}
            />
          </>
        )}
      </Box>
    </Stack>
  );
}

function QuestSpecReadonlyPanel({ theme }) {
  return (
    <Stack gap={0} style={{ height: '100%' }}>
      <QuestTitleBar theme={theme} />
      <Box style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {/* REQUIREMENTS */}
        <SectionHeader label="REQUIREMENTS" theme={theme} count={MOCK_REQUIREMENTS.length} />
        <Stack gap={4} mb="sm">
          {MOCK_REQUIREMENTS.map((req) => (
            <Group key={req.id} gap={8} wrap="nowrap" align="flex-start">
              <Box style={{ flex: 1 }}>
                <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['text'] }}>
                  {req.name}
                </Text>
                <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                  {req.desc}
                </Text>
                <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                  scope: {req.scope}
                </Text>
              </Box>
              <Text
                ff="monospace"
                size="xs"
                fw={600}
                style={{ color: theme.colors[STATUS_COLORS[req.status]], flexShrink: 0 }}
              >
                {req.status.toUpperCase()}
              </Text>
            </Group>
          ))}
        </Stack>

        {/* DESIGN DECISIONS */}
        <SectionHeader label="DESIGN DECISIONS" theme={theme} count={MOCK_DECISIONS.length} />
        <Stack gap={4} mb="sm">
          {MOCK_DECISIONS.map((dec) => (
            <Box key={dec.id}>
              <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['text'] }}>
                {dec.title}
              </Text>
              <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                {dec.rationale}
              </Text>
              <EditTagList label="reqs" items={dec.relatedRequirements} theme={theme} />
            </Box>
          ))}
        </Stack>

        {/* CONTEXTS */}
        <SectionHeader label="CONTEXTS" theme={theme} count={MOCK_CONTEXTS.length} />
        <Stack gap={4} mb="sm">
          {MOCK_CONTEXTS.map((ctx) => (
            <Box key={ctx.id}>
              <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['loot-gold'] }}>
                {ctx.name}
              </Text>
              <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                {ctx.desc}
              </Text>
              {ctx.locator && (
                <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                  locator: {ctx.locator.page} &rarr; {ctx.locator.section}
                </Text>
              )}
            </Box>
          ))}
        </Stack>

        {/* OBSERVABLES */}
        <SectionHeader label="OBSERVABLES" theme={theme} count={MOCK_OBSERVABLES.length} />
        <Stack gap={4} mb="sm">
          {MOCK_OBSERVABLES.map((obs) => (
            <Box key={obs.id}>
              <Group gap={8} mb={2}>
                <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                  ctx: <span style={{ color: theme.colors['loot-gold'] }}>{obs.contextId}</span>
                </Text>
                {obs.reqId && (
                  <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                    req: <span style={{ color: theme.colors['loot-rare'] }}>{obs.reqId}</span>
                  </Text>
                )}
              </Group>
              <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                WHEN <span style={{ color: theme.colors['text'] }}>{obs.trigger}</span>
              </Text>
              {obs.outcomes.map((oc, oi) => (
                <Text key={oi} ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                  THEN <span style={{ color: theme.colors['success'] }}>{oc.description}</span>{' '}
                  <span style={{ fontSize: 10 }}>({oc.type})</span>
                </Text>
              ))}
              {obs.dependsOn.length > 0 && (
                <EditTagList label="depends" items={obs.dependsOn} theme={theme} />
              )}
            </Box>
          ))}
        </Stack>

        {/* CONTRACTS */}
        <SectionHeader label="CONTRACTS" theme={theme} count={MOCK_CONTRACTS.length} />
        <Stack gap={4} mb="sm">
          {MOCK_CONTRACTS.map((ct) => (
            <Box key={ct.id}>
              <Group gap={8}>
                <Text ff="monospace" size="xs" fw={600} style={{ color: theme.colors['loot-rare'] }}>
                  {ct.name}
                </Text>
                <Text ff="monospace" size="xs" style={{ color: theme.colors['text-dim'] }}>
                  {ct.kind}
                </Text>
                <Text ff="monospace" size="xs" style={{ color: theme.colors['success'] }}>
                  {ct.status}
                </Text>
              </Group>
              {ct.source && (
                <Text ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                  {ct.source}
                </Text>
              )}
              {ct.properties?.map((p, pi) => (
                <Text key={pi} ff="monospace" style={{ fontSize: 10, color: theme.colors['text-dim'] }}>
                  {p.name}: <span style={{ color: theme.colors['text'] }}>{p.type || p.value}</span>
                </Text>
              ))}
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

function LeftPanelTabs({ activeTab, onTabChange, theme }) {
  const tabs = [
    { id: 'execution', label: 'EXECUTION' },
    { id: 'spec', label: 'QUEST SPEC' },
  ];
  return (
    <Group
      gap={0}
      style={{ borderBottom: `1px solid ${theme.colors['border']}`, flexShrink: 0 }}
    >
      {tabs.map((tab) => (
        <UnstyledButton
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          px="sm"
          py={5}
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            fontWeight: 600,
            color: activeTab === tab.id ? theme.colors['primary'] : theme.colors['text-dim'],
            borderBottom: activeTab === tab.id
              ? `2px solid ${theme.colors['primary']}`
              : '2px solid transparent',
          }}
        >
          {tab.label}
        </UnstyledButton>
      ))}
    </Group>
  );
}

export function ExecuteQuestPage({ scenario = 'exec-planning' }) {
  const { theme } = useTheme();
  const b = theme.colors['border'];
  const dim = theme.colors['text-dim'];
  const [leftTab, setLeftTab] = useState('execution');

  return (
    <Stack
      gap={0}
      style={{
        height: '100vh',
        paddingTop: 40,
        boxSizing: 'border-box',
      }}
    >
      {/* Logo - top center */}
      <Group align="center" justify="center" gap={40} py="sm">
        <PixelSprite pixels={fireballPixels} scale={3} width={12} height={12} />
        <pre
          style={{
            color: theme.colors['primary'],
            fontFamily: 'monospace',
            fontSize: '6px',
            lineHeight: 1.15,
            margin: 0,
            whiteSpace: 'pre',
          }}
        >
          {logo}
        </pre>
        <PixelSprite pixels={fireballPixels} scale={3} width={12} height={12} flip />
      </Group>

      {/* Main frame */}
      <Box
        style={{
          flex: 1,
          border: `2px solid ${b}`,
          borderRadius: 2,
          margin: '0 16px 16px 16px',
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Corner decorations */}
        <Text ff="monospace" size="xs" style={{ color: dim, position: 'absolute', top: -2, left: 8 }}>
          ┌──
        </Text>
        <Text ff="monospace" size="xs" style={{ color: dim, position: 'absolute', top: -2, right: 8 }}>
          ──┐
        </Text>
        <Text ff="monospace" size="xs" style={{ color: dim, position: 'absolute', bottom: -2, left: 8 }}>
          └──
        </Text>
        <Text ff="monospace" size="xs" style={{ color: dim, position: 'absolute', bottom: -2, right: 8 }}>
          ──┘
        </Text>

        {/* Left panel */}
        <Box
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <LeftPanelTabs activeTab={leftTab} onTabChange={setLeftTab} theme={theme} />
          {leftTab === 'execution' ? (
            <ExecutionPanel theme={theme} scenario={scenario} />
          ) : (
            <QuestSpecReadonlyPanel theme={theme} />
          )}
        </Box>

        {/* Delimiter */}
        <Box style={{ width: 1, backgroundColor: b, flexShrink: 0 }} />

        {/* Right panel: Raccoon placeholder */}
        <Box
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <DumpsterRaccoonPlaceholder theme={theme} />
        </Box>
      </Box>
    </Stack>
  );
}

export function QuestDetailPage({ onBack, scenario = 'chat' }) {
  const { theme } = useTheme();
  const b = theme.colors['border'];
  const dim = theme.colors['text-dim'];

  const hasRightPanel = scenario !== 'chat';

  return (
    <Stack
      gap={0}
      style={{
        height: '100vh',
        paddingTop: 40,
        boxSizing: 'border-box',
      }}
    >
      {/* Logo - top center */}
      <Group align="center" justify="center" gap={40} py="sm">
        <PixelSprite pixels={fireballPixels} scale={3} width={12} height={12} />
        <pre
          style={{
            color: theme.colors['primary'],
            fontFamily: 'monospace',
            fontSize: '6px',
            lineHeight: 1.15,
            margin: 0,
            whiteSpace: 'pre',
          }}
        >
          {logo}
        </pre>
        <PixelSprite pixels={fireballPixels} scale={3} width={12} height={12} flip />
      </Group>

      {/* Expanded map frame */}
      <Box
        style={{
          flex: 1,
          border: `2px solid ${b}`,
          borderRadius: 2,
          margin: '0 16px 16px 16px',
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Corner decorations */}
        <Text
          ff="monospace"
          size="xs"
          style={{ color: dim, position: 'absolute', top: -2, left: 8 }}
        >
          &#9484;&#9472;&#9472;
        </Text>
        <Text
          ff="monospace"
          size="xs"
          style={{ color: dim, position: 'absolute', top: -2, right: 8 }}
        >
          &#9472;&#9472;&#9488;
        </Text>
        <Text
          ff="monospace"
          size="xs"
          style={{ color: dim, position: 'absolute', bottom: -2, left: 8 }}
        >
          &#9492;&#9472;&#9472;
        </Text>
        <Text
          ff="monospace"
          size="xs"
          style={{ color: dim, position: 'absolute', bottom: -2, right: 8 }}
        >
          &#9472;&#9472;&#9496;
        </Text>

        {/* Left panel */}
        <Box
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Raccoon + chat area */}
          <Box style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
            <RaccoonAnimated theme={theme} />
            <Box mt="md">
              <ChatPanel theme={theme} />
            </Box>
          </Box>

          {/* Divider */}
          <Box style={{ height: 1, backgroundColor: b, flexShrink: 0 }} />

          {/* Chat input area */}
          <Box style={{ padding: 12 }}>
            <Group gap={12} align="center" wrap="nowrap">
              <textarea
                placeholder="Describe your quest..."
                rows={3}
                style={{
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: theme.colors['text'],
                  backgroundColor: theme.colors['bg-deep'],
                  border: `1px solid ${b}`,
                  borderRadius: 2,
                  padding: 8,
                  resize: 'none',
                  overflow: 'hidden',
                  lineHeight: 1.4,
                  outline: 'none',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
              <UnstyledButton
                style={{
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  backgroundColor: theme.colors['primary'],
                  border: `1px solid ${b}`,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.colors['bg-deep'],
                  fontFamily: 'monospace',
                  fontSize: 18,
                }}
              >
                &#9654;
              </UnstyledButton>
            </Group>
          </Box>
        </Box>

        {/* Delimiter (always present) */}
        <Box
          style={{
            width: 1,
            backgroundColor: b,
            flexShrink: 0,
          }}
        />

        {/* Right panel */}
        <Box
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: hasRightPanel ? 0 : 16,
          }}
        >
          {hasRightPanel ? (
            <Box style={{ flex: 1, overflow: 'hidden' }}>
              <RightPanel scenario={scenario} theme={theme} />
            </Box>
          ) : (
            <Text ff="monospace" size="xs" style={{ color: dim }}>
              Awaiting quest activity...
            </Text>
          )}
        </Box>
      </Box>
    </Stack>
  );
}
