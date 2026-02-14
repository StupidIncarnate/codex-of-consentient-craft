import React, { useState } from 'react';
import { Box, Group, Stack, Text, UnstyledButton, ScrollArea } from '@mantine/core';
import { PixelSprite } from '../components/pixel-sprite.jsx';
import { fireballPixels } from '../sprites/fireball.jsx';
import { raccoonWizardPixels } from '../sprites/raccoon-wizard.jsx';
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
