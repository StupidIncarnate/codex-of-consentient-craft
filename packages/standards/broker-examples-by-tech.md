# Broker Examples by Technology Stack

This document provides concrete examples of brokers across different technology stacks, demonstrating their atomic
nature and natural evolution patterns into triggers.

---

## Frontend Brokers

### UI Component Evolution

#### Initial Brokers (Atomic Operations)

```typescript
// brokers/primary-button/primary-button.tsx
// Wraps MUI Button with semantic meaning
export const primaryButton = ({label, onClick}: { label: string; onClick: () => void }) =>
    <Button variant = "contained"
color = "primary"
onClick = {onClick} > {label} < /Button>;

// brokers/toast-success/toast-success.tsx
// Wraps notification library with success styling
export const toastSuccess = ({message}: { message: string }) =>
    toast.success(message, {duration: 3000, position: 'top-right'});

// brokers/analytics-track/analytics-track.ts
// Wraps analytics library
export const analyticsTrack = async ({event, properties}: {
    event: string;
    properties: Record<string, any>;
}) => {
    return await analytics.track(event, properties);
};
```

#### Evolution to Trigger (Multiple Systems)

```typescript
// triggers/submit-with-tracking/submit-with-tracking.ts
// Orchestrates button click with analytics and notifications
export const submitWithTracking = async ({
                                             formData,
                                             eventName,
                                             onSuccess
                                         }: {
    formData: any;
    eventName: string;
    onSuccess?: () => void;
}) => {
    try {
        // Call multiple brokers (3 different packages)
        const result = await formSubmit({data: formData});
        await analyticsTrack({
            event: eventName,
            properties: {formId: result.id, timestamp: Date.now()}
        });
        await toastSuccess({message: 'Submitted successfully!'});
        if (onSuccess) onSuccess();
        return result;
    } catch (error) {
        await toastError({message: 'Submission failed'});
        throw error;
    }
};
```

---

### API Call Evolution

#### Initial Brokers (Atomic Operations)

```typescript
// brokers/user-profile-fetch/user-profile-fetch.ts
// Knows specific endpoint for user profiles
export const userProfileFetch = async ({userId}: { userId: string }) => {
    const response = await get({url: `/api/v1/users/${userId}/profile`});
    return parseUserProfile(response.data);
};

// brokers/user-cache-get/user-cache-get.ts
// Gets user from local cache
export const userCacheGet = ({userId}: { userId: string }): User | null => {
    const cached = localStorage.getItem(`user:${userId}`);
    return cached ? JSON.parse(cached) : null;
};

// brokers/user-cache-set/user-cache-set.ts
// Sets user in local cache
export const userCacheSet = ({userId, user}: { userId: string; user: User }) => {
    localStorage.setItem(`user:${userId}`, JSON.stringify(user));
};
```

#### Evolution to Trigger (Multiple Systems)

```typescript
// triggers/user-fetch-with-cache/user-fetch-with-cache.ts
// Orchestrates API call with caching strategy
export const userFetchWithCache = async ({
                                             userId,
                                             forceRefresh = false
                                         }: {
    userId: string;
    forceRefresh?: boolean;
}) => {
    // Check cache first (unless forced refresh)
    if (!forceRefresh) {
        const cached = userCacheGet({userId});
        if (cached) {
            return cached;
        }
    }

    // Fetch from API (broker 1)
    const user = await userProfileFetch({userId});

    // Update cache (broker 2)
    userCacheSet({userId, user});

    // Track analytics (broker 3 - different package)
    await analyticsTrack({
        event: 'user_profile_loaded',
        properties: {userId, fromCache: false}
    });

    return user;
};
```

---

### Browser API Evolution

#### Initial Brokers (Atomic Operations)

```typescript
// brokers/clipboard-copy/clipboard-copy.ts
// Wraps clipboard API with error handling
export const clipboardCopy = async ({text}: { text: string }) => {
    await navigator.clipboard.writeText(text);
    return true;
};

// brokers/toast-info/toast-info.tsx
// Shows info notification
export const toastInfo = ({message}: { message: string }) => {
    toast.info(message, {duration: 2000});
};

// brokers/analytics-track/analytics-track.ts
// Tracks analytics event
export const analyticsTrack = async ({event, properties}: {
    event: string;
    properties?: Record<string, any>;
}) => {
    return await analytics.track(event, properties);
};
```

#### Evolution to Trigger (Multiple Systems)

```typescript
// triggers/copy-with-feedback/copy-with-feedback.ts
// Orchestrates copy with user feedback and tracking
export const copyWithFeedback = async ({
                                           text,
                                           label,
                                           trackingId
                                       }: {
    text: string;
    label: string;
    trackingId?: string;
}) => {
    try {
        // Copy to clipboard (broker 1 - browser API)
        await clipboardCopy({text});

        // Show success notification (broker 2 - toast library)
        toastInfo({message: `${label} copied to clipboard`});

        // Track usage (broker 3 - analytics library)
        await analyticsTrack({
            event: 'clipboard_copy',
            properties: {
                label,
                textLength: text.length,
                trackingId
            }
        });

        return true;
    } catch (error) {
        toastError({message: 'Failed to copy to clipboard'});
        return false;
    }
};
```

---

### Search Autocomplete Evolution

#### Initial Brokers (Atomic Operations)

```typescript
// brokers/search-suggestions-fetch/search-suggestions-fetch.ts
// Fetches search suggestions from API
export const searchSuggestionsFetch = async ({query}: { query: string }) => {
    const response = await get({url: `/api/v1/search/suggestions?q=${query}`});
    return response.data.suggestions;
};

// brokers/recent-searches-get/recent-searches-get.ts
// Gets recent searches from localStorage
export const recentSearchesGet = (): string[] => {
    const stored = localStorage.getItem('recent-searches');
    return stored ? JSON.parse(stored) : [];
};

// brokers/recent-searches-add/recent-searches-add.ts
// Adds to recent searches in localStorage
export const recentSearchesAdd = ({query}: { query: string }) => {
    const recent = recentSearchesGet();
    const updated = [query, ...recent.filter(q => q !== query)].slice(0, 10);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
};
```

#### Evolution to Trigger (Multiple Systems)

```typescript
// triggers/search-autocomplete-process/search-autocomplete-process.ts
// Orchestrates search with suggestions, history, and analytics
export const searchAutocompleteProcess = async ({
                                                    query,
                                                    userId
                                                }: {
    query: string;
    userId: string;
}) => {
    // Get recent searches (broker 1 - localStorage)
    const recentSearches = recentSearchesGet();

    // Fetch suggestions if query length > 2 (broker 2 - API)
    let suggestions: string[] = [];
    if (query.length > 2) {
        suggestions = await searchSuggestionsFetch({query});
    }

    // Combine and dedupe results
    const combined = [...new Set([
        ...recentSearches.filter(s => s.includes(query)),
        ...suggestions
    ])];

    // Track search intent (broker 3 - analytics)
    await analyticsTrack({
        event: 'search_autocomplete',
        properties: {
            query,
            userId,
            suggestionsCount: suggestions.length,
            recentMatchCount: recentSearches.filter(s => s.includes(query)).length
        }
    });

    return combined;
};
```

---

## Backend Brokers

### Database Operation Evolution

#### Initial Brokers (Atomic Operations)

```typescript
// brokers/user-create/user-create.ts
// Creates user in database
export const userCreate = async ({email, name, password}: {
    email: string;
    name: string;
    password: string;
}) => {
    return await insert({
        model: UserModel,
        data: {email: email.toLowerCase(), name, password}
    });
};

// brokers/welcome-email-send/welcome-email-send.ts
// Sends welcome email via SendGrid
export const welcomeEmailSend = async ({email, name}: {
    email: string;
    name: string;
}) => {
    return await sendgridSend({
        to: email,
        templateId: 'WELCOME_TEMPLATE',
        dynamicData: {user_name: name}
    });
};

// brokers/audit-log-create/audit-log-create.ts
// Creates audit log entry
export const auditLogCreate = async ({action, userId, metadata}: {
    action: string;
    userId: string;
    metadata?: Record<string, any>;
}) => {
    return await insert({
        model: AuditLogModel,
        data: {action, userId, metadata, timestamp: new Date()}
    });
};
```

#### Evolution to Trigger (Multiple Systems)

```typescript
// triggers/user-registration-process/user-registration-process.ts
// Orchestrates full user registration with side effects
export const userRegistrationProcess = async ({
                                                  email,
                                                  name,
                                                  password
                                              }: {
    email: string;
    name: string;
    password: string;
}) => {
    // Create user (broker 1 - database)
    const user = await userCreate({email, name, password});

    // Send welcome email (broker 2 - SendGrid)
    await welcomeEmailSend({email, name});

    // Create audit log (broker 3 - database, different collection)
    await auditLogCreate({
        action: 'user.registered',
        userId: user.id,
        metadata: {email, registrationSource: 'web'}
    });

    // Track in analytics (broker 4 - external service)
    await analyticsTrack({
        event: 'user_registered',
        userId: user.id,
        properties: {email, name}
    });

    return user;
};
```

---

### Payment Processing Evolution

#### Initial Brokers (Atomic Operations)

```typescript
// brokers/stripe-charge-create/stripe-charge-create.ts
// Creates Stripe charge
export const stripeChargeCreate = async ({amount, customerId, description}: {
    amount: number;
    customerId: string;
    description: string;
}) => {
    return await stripePost({
        endpoint: '/charges',
        data: {amount, currency: 'usd', customer: customerId, description}
    });
};

// brokers/order-status-update/order-status-update.ts
// Updates order status in database
export const orderStatusUpdate = async ({orderId, status}: {
    orderId: string;
    status: string;
}) => {
    return await update({
        model: OrderModel,
        id: orderId,
        data: {status, updatedAt: new Date()}
    });
};

// brokers/receipt-email-send/receipt-email-send.ts
// Sends receipt email
export const receiptEmailSend = async ({email, orderDetails}: {
    email: string;
    orderDetails: any;
}) => {
    return await sendgridSend({
        to: email,
        templateId: 'RECEIPT_TEMPLATE',
        dynamicData: orderDetails
    });
};
```

#### Evolution to Trigger (Multiple Systems)

```typescript
// triggers/payment-process/payment-process.ts
// Orchestrates complete payment flow
export const paymentProcess = async ({
                                         orderId,
                                         amount,
                                         customerId,
                                         email
                                     }: {
    orderId: string;
    amount: number;
    customerId: string;
    email: string;
}) => {
    try {
        // Create charge (broker 1 - Stripe API)
        const charge = await stripeChargeCreate({
            amount,
            customerId,
            description: `Order #${orderId}`
        });

        // Update order status (broker 2 - database)
        await orderStatusUpdate({
            orderId,
            status: 'paid'
        });

        // Send receipt (broker 3 - SendGrid)
        await receiptEmailSend({
            email,
            orderDetails: {
                orderId,
                amount,
                chargeId: charge.id
            }
        });

        // Queue fulfillment job (broker 4 - Redis queue)
        await jobEnqueue({
            type: 'fulfill_order',
            payload: {orderId}
        });

        return {success: true, chargeId: charge.id};
    } catch (error) {
        await orderStatusUpdate({orderId, status: 'payment_failed'});
        throw error;
    }
};
```

---

### Cache Strategy Evolution

#### Initial Brokers (Atomic Operations)

```typescript
// brokers/user-fetch/user-fetch.ts
// Fetches user from database
export const userFetch = async ({userId}: { userId: string }) => {
    return await findOne({
        model: UserModel,
        filter: {id: userId}
    });
};

// brokers/cache-user-get/cache-user-get.ts
// Gets user from Redis cache
export const cacheUserGet = async ({userId}: { userId: string }): Promise<User | null> => {
    return await redisGet({key: `user:${userId}`});
};

// brokers/cache-user-set/cache-user-set.ts
// Sets user in Redis cache
export const cacheUserSet = async ({userId, userData}: {
    userId: string;
    userData: User;
}) => {
    return await redisSet({
        key: `user:${userId}`,
        value: userData,
        ttl: 300
    });
};
```

#### Evolution to Trigger (Multiple Systems)

```typescript
// triggers/user-fetch-cached/user-fetch-cached.ts
// Orchestrates database fetch with caching layer
export const userFetchCached = async ({
                                          userId,
                                          skipCache = false
                                      }: {
    userId: string;
    skipCache?: boolean;
}) => {
    // Check cache first (broker 1 - Redis)
    if (!skipCache) {
        const cached = await cacheUserGet({userId});
        if (cached) {
            // Track cache hit (broker 2 - metrics)
            await metricsIncrement({metric: 'cache.hit.user'});
            return cached;
        }
    }

    // Fetch from database (broker 3 - MongoDB)
    const user = await userFetch({userId});

    if (!user) {
        throw new UserNotFoundError({userId});
    }

    // Update cache (broker 4 - Redis)
    await cacheUserSet({userId, userData: user});

    // Track cache miss (broker 5 - metrics)
    await metricsIncrement({metric: 'cache.miss.user'});

    return user;
};
```

---

## CLI Brokers

### File Processing Evolution

#### Initial Brokers (Atomic Operations)

```typescript
// brokers/markdown-parse/markdown-parse.ts
// Parses markdown to AST
export const markdownParse = async ({content}: { content: string }) => {
    return await markdownParser({content});
};

// brokers/syntax-highlight/syntax-highlight.ts
// Adds syntax highlighting to code blocks
export const syntaxHighlight = async ({content}: { content: string }) => {
    return await highlighter({content, theme: 'github-dark'});
};

// brokers/pdf-generate/pdf-generate.ts
// Generates PDF from HTML
export const pdfGenerate = async ({html, outputPath}: {
    html: string;
    outputPath: string;
}) => {
    return await puppeteerPdf({html, output: outputPath});
};

// brokers/file-write/file-write.ts
// Writes content to file
export const fileWrite = async ({path, content}: {
    path: string;
    content: string;
}) => {
    await writeFile({path, content, encoding: 'utf8'});
};
```

#### Evolution to Trigger (Multiple Systems)

```typescript
// triggers/markdown-full-process/markdown-full-process.ts
// Orchestrates complete markdown processing pipeline
export const markdownFullProcess = async ({
                                              inputFile,
                                              outputDir,
                                              options
                                          }: {
    inputFile: string;
    outputDir: string;
    options?: { toc?: boolean; pdf?: boolean };
}) => {
    // Read file (broker 1 - fs)
    const content = await fileRead({path: inputFile});

    // Parse markdown (broker 2 - markdown parser)
    const parsed = await markdownParse({content});

    // Add syntax highlighting (broker 3 - highlighter library)
    const highlighted = await syntaxHighlight({content: parsed});

    // Generate TOC if requested (broker 4 - TOC generator)
    let final = highlighted;
    if (options?.toc) {
        final = await tocGenerate({content: highlighted});
    }

    // Write HTML output (broker 5 - fs)
    const htmlPath = path.join(outputDir, 'output.html');
    await fileWrite({path: htmlPath, content: final});

    // Generate PDF if requested (broker 6 - puppeteer)
    if (options?.pdf) {
        const pdfPath = path.join(outputDir, 'output.pdf');
        await pdfGenerate({html: final, outputPath: pdfPath});
    }

    // Log processing stats (broker 7 - logger)
    await logInfo({
        message: 'Markdown processed',
        stats: {inputFile, outputDir, hasToC: options?.toc, hasPdf: options?.pdf}
    });

    return {htmlPath, pdfPath: options?.pdf ? path.join(outputDir, 'output.pdf') : null};
};
```

---

### Git Operations Evolution

#### Initial Brokers (Atomic Operations)

```typescript
// brokers/git-status-get/git-status-get.ts
// Gets git status
export const gitStatusGet = async (): Promise<GitStatus> => {
    const output = await exec({command: 'git status --porcelain'});
    return parseGitStatus(output);
};

// brokers/git-add/git-add.ts
// Stages files for commit
export const gitAdd = async ({files}: { files: string[] }) => {
    await exec({command: `git add ${files.join(' ')}`});
};

// brokers/git-commit/git-commit.ts
// Creates commit with message
export const gitCommit = async ({message}: { message: string }) => {
    await exec({command: `git commit -m "${message}"`});
};

// brokers/changelog-append/changelog-append.ts
// Appends to changelog file
export const changelogAppend = async ({version, changes}: {
    version: string;
    changes: string[];
}) => {
    const entry = formatChangelogEntry({version, changes, date: new Date()});
    await fileAppend({path: 'CHANGELOG.md', content: entry});
};
```

#### Evolution to Trigger (Multiple Systems)

```typescript
// triggers/release-process/release-process.ts
// Orchestrates complete release workflow
export const releaseProcess = async ({
                                         version,
                                         changes
                                     }: {
    version: string;
    changes: string[];
}) => {
    // Check git status (broker 1 - git)
    const status = await gitStatusGet();
    if (status.modified.length > 0) {
        throw new Error('Working directory not clean');
    }

    // Update package.json version (broker 2 - fs/json)
    await packageVersionUpdate({version});

    // Update changelog (broker 3 - fs)
    await changelogAppend({version, changes});

    // Stage files (broker 4 - git)
    await gitAdd({files: ['package.json', 'CHANGELOG.md']});

    // Create commit (broker 5 - git)
    await gitCommit({message: `Release v${version}`});

    // Create tag (broker 6 - git)
    await gitTag({name: `v${version}`, message: `Release ${version}`});

    // Push to remote (broker 7 - git)
    await gitPush({includeTags: true});

    // Publish to npm (broker 8 - npm)
    await npmPublish();

    // Send notification (broker 9 - slack API)
    await slackNotify({
        channel: '#releases',
        message: `Released v${version} to npm`
    });

    return {version, published: true};
};
```

---

### Interactive CLI Evolution

#### Initial Brokers (Atomic Operations)

```typescript
// brokers/prompt-select/prompt-select.ts
// Shows selection prompt
export const promptSelect = async ({message, choices}: {
    message: string;
    choices: string[];
}) => {
    return await inquirerPrompt({type: 'list', message, choices});
};

// brokers/spinner-start/spinner-start.ts
// Starts loading spinner
export const spinnerStart = ({text}: { text: string }) => {
    return ora({text}).start();
};

// brokers/template-generate/template-generate.ts
// Generates from template
export const templateGenerate = async ({template, data}: {
    template: string;
    data: Record<string, any>;
}) => {
    return await handlebars.compile(template)(data);
};
```

#### Evolution to Trigger (Multiple Systems)

```typescript
// triggers/scaffold-project/scaffold-project.ts
// Orchestrates interactive project scaffolding
export const scaffoldProject = async () => {
    // Get project type (broker 1 - inquirer)
    const projectType = await promptSelect({
        message: 'Select project type',
        choices: ['react', 'node', 'fullstack']
    });

    // Get project name (broker 2 - inquirer)
    const projectName = await promptInput({
        message: 'Enter project name',
        validate: (input) => /^[a-z0-9-]+$/.test(input)
    });

    // Start spinner (broker 3 - ora)
    const spinner = spinnerStart({text: 'Creating project...'});

    // Create directory (broker 4 - fs)
    await directoryCreate({path: projectName});

    // Copy template files (broker 5 - fs)
    await templateCopy({
        from: `./templates/${projectType}`,
        to: projectName
    });

    // Process templates (broker 6 - handlebars)
    const packageJson = await templateGenerate({
        template: await fileRead({path: `${projectName}/package.json.hbs`}),
        data: {name: projectName, type: projectType}
    });

    // Write processed files (broker 7 - fs)
    await fileWrite({
        path: `${projectName}/package.json`,
        content: packageJson
    });

    // Install dependencies (broker 8 - npm)
    spinner.text = 'Installing dependencies...';
    await exec({command: 'npm install', cwd: projectName});

    // Initialize git (broker 9 - git)
    await exec({command: 'git init', cwd: projectName});

    spinner.succeed('Project created successfully!');

    return {projectName, projectType};
};
```

---

## Key Patterns Across All Tech Stacks

1. **Brokers are domain-specific** - They know business details like endpoint URLs, table names, template IDs
2. **Natural evolution pressure** - Real features almost always need multiple systems
3. **The trigger boundary is clear** - When you need a second npm package, you need a trigger
4. **Semantic brokers provide clarity** - `dangerButton` vs `button({variant: 'danger'})`
5. **Brokers enable testing** - Each atomic operation can be mocked independently

The architecture successfully prevents the "god service" problem by forcing orchestration into triggers when complexity
grows.