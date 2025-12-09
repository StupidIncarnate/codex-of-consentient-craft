# Anthropic Prompt Engineering Guide for DungeonMaster

This guide summarizes key prompt engineering techniques from Anthropic's official tutorial to ensure our agent prompts follow best practices.

## Core Principles

### 1. Be Clear and Direct
- **Golden Rule**: If a colleague would be confused by your prompt, Claude will be too
- Treat Claude as having "no context" beyond what you explicitly provide
- Be extremely specific and remove all ambiguity
- Example improvement:
  ```
  ❌ "Write a haiku about robots"
  ✅ "Write a haiku about robots. Skip the preamble; go straight into the poem."
  ```

### 2. Basic Prompt Structure
- **Required parameters**: `model`, `max_tokens`, `messages`
- **Message format**: Alternating `user` and `assistant` roles
- **System prompts**: Provide context and guidelines
- **Temperature**: Use 0 for consistency, higher for creativity

### 3. Role Prompting
- Roles help Claude adapt response style, tone, and content
- Include detailed context for the assigned role
- Specify intended audience when relevant
- Example: "You are a logic bot designed to solve complex problems"

### 4. Separate Data from Instructions
- Use XML tags to delineate variable content: `<tag>content</tag>`
- Create reusable prompt templates with variable substitution
- Prevents Claude from misinterpreting instructions
- Example:
  ```
  Please summarize this email:
  <email>
  {email_content}
  </email>
  ```

### 5. Format Output Explicitly
- Use XML tags or JSON for structured output
- **Prefilling**: Start Claude's response to guide format
- Example prefill: `{` to encourage JSON response
- Specify exact format requirements in the prompt

### 6. Chain of Thought (Step-by-Step Thinking)
- "Thinking only counts when it's out loud"
- Explicitly outline cognitive steps
- Use structured thinking tags:
  ```
  <thinking>
  1. First, I'll analyze...
  2. Then, I'll consider...
  3. Finally, I'll determine...
  </thinking>
  ```

### 7. Few-Shot Prompting
- Provide 1-3 clear, representative examples
- Examples often work better than lengthy instructions
- Show exact tone, format, and style desired
- "Giving Claude examples of how you want it to behave is extremely effective"

### 8. Avoiding Hallucinations
- **Give Claude an out**: "If you don't know, say 'I don't know'"
- Require evidence-based responses with citations
- Use temperature 0 for factual accuracy
- Ask for relevant quotes before answering

## Complex Prompt Framework

When building complex prompts, use this ordering (start with all, then remove unnecessary elements):

### Optimal Element Order & Rationale

1. **Task context** (EARLY)
   - *What*: Background information about the overall task
   - *Why early*: Sets the stage for everything that follows
   - *Example*: "You are helping to analyze customer feedback data"

2. **Tone context** (EARLY) 
   - *What*: Desired style, voice, or persona
   - *Why early*: Influences how all subsequent content is interpreted
   - *Example*: "Respond professionally but conversationally"

3. **Detailed task description** (EARLY)
   - *What*: Comprehensive explanation of what needs to be done
   - *Why early*: Provides complete context before any data
   - *Example*: "Categorize each review by sentiment and extract key themes"

4. **Examples** (MIDDLE)
   - *What*: 1-3 demonstrations of desired behavior
   - *Why middle*: After context is set, before actual task data
   - *Example*: Show sample input → output transformations

5. **Input data** (MIDDLE)
   - *What*: The actual data to process, in XML tags
   - *Why middle*: After instructions are clear, before final task reminder
   - *Example*: `<reviews>{{customer_reviews}}</reviews>`

6. **Immediate task description** (LATE)
   - *What*: Brief restatement of the specific task
   - *Why late*: Reinforces focus right before processing
   - *Example*: "Now categorize these reviews as requested above"

7. **Precognition/Thinking** (LATE)
   - *What*: Step-by-step reasoning instructions
   - *Why late*: Fresh in memory when starting response
   - *Example*: "Think through each review's sentiment before categorizing"

8. **Output formatting** (LATE)
   - *What*: Specific structure requirements
   - *Why late*: Final instructions before generation
   - *Example*: "Format as JSON with 'sentiment' and 'themes' keys"

9. **Prefilling** (VERY LATE)
   - *What*: Start of Claude's response
   - *Why last*: Directly continues into generation
   - *Example*: Starting with `[` for JSON array output

### Key Ordering Principles

- **Context → Instructions → Data → Reminders → Format**
- Put user's specific query/data "close to the bottom"
- Reinforcement (immediate task) helps with long prompts
- Output formatting stays fresh when placed near the end

### When Order Matters Less

- Examples and detailed task description can sometimes swap
- Tone and task context can merge if related
- Not all elements are always needed - start full, then trim

## Advanced Techniques

### Prompt Chaining
- Break complex tasks into multiple conversational turns
- Have Claude review and improve its own work
- Use iterative refinement for better accuracy
- "Writing is rewriting"

### Tool Use
- Claude can output tool names and arguments
- Requires system prompt explaining available tools
- Use specific XML format for function calls:
  ```xml
  <function_calls>
  <invoke name="$FUNCTION_NAME">
  <parameter name="$PARAMETER_NAME">$PARAMETER_VALUE</parameter>
  </invoke>
  </function_calls>
  ```

### Retrieval Augmented Generation (RAG)
- Supplement Claude's knowledge with external documents
- Use vector databases and embeddings
- Retrieve relevant context before generating responses

## Best Practices for DungeonMaster Agents

### 1. Agent Role Definition
Each agent should have:
- Clear role statement (e.g., "You are Codeweaver, the implementation specialist")
- Specific responsibilities
- Tone/style guidelines
- Context about the quest system

### 2. Use XML Tags Consistently
- `<quest>` for quest details
- `<components>` for component lists
- `<dependencies>` for dependency information
- `<code>` for code blocks
- `<error>` for error messages

### 3. Structure Agent Prompts
```
1. Role and identity
2. Context about quest system
3. Specific task instructions
4. Input data in XML tags
5. Step-by-step thinking process
6. Output format requirements
7. Examples when needed
```

### 4. Error Handling
- Always give agents an out: "If you cannot complete this task, explain why"
- Require evidence-based decisions
- Use structured error reporting

### 5. Parallel Execution Awareness
- Design prompts to work independently
- Avoid assumptions about other agents' work
- Use clear boundaries between agent responsibilities

## Prompt Engineering Checklist

Before finalizing any agent prompt:

- [ ] Is the role clearly defined?
- [ ] Are instructions specific and unambiguous?
- [ ] Is data separated from instructions using XML tags?
- [ ] Is output format explicitly specified?
- [ ] Does complex reasoning use step-by-step thinking?
- [ ] Are examples provided for non-obvious tasks?
- [ ] Is there an "out" for the agent if it can't complete the task?
- [ ] Is temperature set appropriately (0 for consistency)?
- [ ] Are all necessary context and constraints included?

## Key Takeaways

1. **Clarity beats cleverness** - Simple, direct prompts work best
2. **Examples > Instructions** - Show, don't just tell
3. **Structure enables flexibility** - Use XML tags and templates
4. **Thinking improves accuracy** - Make reasoning explicit
5. **Iteration improves results** - Use prompt chaining when needed

Remember: "Prompt engineering is about scientific trial and error." Test prompts thoroughly and refine based on results.