# Claude Code Agent Instructions for Chant

## Overview

Claude Code is an AI-powered coding assistant that helps implement specifications for the Chant project. These instructions guide Claude on how to work with the Chant specification-driven development workflow.

## Your Role

In this conversation, you are the **spec implementer agent**. You:
- Receive a specific spec to implement from the orchestrator
- Work inside an isolated worktree managed by chant
- Modify files directly to fulfill the spec's acceptance criteria
- Run tests and verify your implementation
- Commit your work with a message referencing the spec ID

You are NOT the orchestrator. The orchestrator:
- Creates and manages specs
- Dispatches specs to you with `chant work`
- Reviews your completed work

## Spec Creation Workflow

⚠️ **Important**: Do NOT immediately work a freshly-created spec. Follow this 3-step workflow:

1. **Create the spec skeleton** with `chant add "description"`
   - This creates a minimal spec with just a description

2. **Edit the spec file** to add detailed information
   - Add a detailed problem description
   - Describe the solution approach
   - Define clear acceptance criteria as a checklist
   - Example acceptance criteria structure:
     ```markdown
     ## Acceptance Criteria

     - [ ] Feature X implemented
     - [ ] All tests passing
     - [ ] Code linted and formatted
     ```

3. **Work the spec** with `chant work <spec-id>`
   - Now that acceptance criteria are defined, the agent knows exactly what "done" means
   - Implementation can be validated against clear criteria

This workflow ensures:
- Clear definition of done before work starts
- Agent doesn't guess what "complete" means
- Work matches expectations
- All specs are thoroughly documented

## Primary Rules

### 1. Always Use `chant` for CLI Operations

Use the `chant` command to interact with the chant CLI. This is the primary tool for managing and executing specs.

```bash
chant add "description of work"
chant work <spec-id>
chant list
chant show <spec-id>
```

### 2. Never Touch the Disk Directly

Only the chant CLI gets to write files during spec execution. You should not:
- Edit files directly unless authorized by the spec system
- Make ad-hoc changes outside of specs

All work must flow through the spec system.

### 3. Always Use Specs for Every Operation

Even small changes require a spec. This ensures:
- All work is documented and auditable
- Changes are executed in isolated worktrees
- Work can be reviewed, rejected, or modified
- History is maintained in git

## Workflow

When implementing a spec:

1. **Read** the relevant code first to understand existing patterns
2. **Plan** your approach before making changes
3. **Implement** the changes according to spec acceptance criteria
4. **Verify** with tests and ensure all pass
5. **Commit** with message referencing the spec ID: `chant(SPEC-ID): description`

## Core Commands

### Spec Management

- `chant add "description"` - Create a new spec
- `chant list` - List all specs (with `--ready`, `--type`, `--status`, `--label` filters)
- `chant show <spec-id>` - View spec details
- `chant ready` - Show ready specs
- `chant lint` - Validate all specs
- `chant search [query]` - Search specs (or launch interactive wizard)
  - Non-TTY hint: When stdin is not a terminal, run with explicit query: `chant search "keyword"`
  - Supports filters: `--status`, `--type`, `--label`, `--since`, `--until`
- `chant archive <spec-id>` - Archive completed specs
- `chant cancel <spec-id>` - Cancel a spec
- `chant delete <spec-id>` - Delete a spec and clean up artifacts

### Execution

- `chant work <spec-id>` - Execute a spec
  - Non-TTY hint: When stdin is not a terminal, provide spec ID explicitly: `chant work <SPEC_ID>`
  - Optional: `--prompt <name>`, `--branch`, `--force`, `--finalize`
- `chant work <spec-id> --branch` - Execute with feature branch
- `chant work --parallel` - Execute all ready specs in parallel
  - Supports: `--max-parallel N` to limit concurrent agents
  - Supports: `--label <LABEL>` to execute only labeled specs
  - Supports: `--no-merge` to disable auto-merge (branches preserved for manual merge)
  - Auto-merge behavior: Completed specs are automatically merged to main; failed specs preserve branches for debugging
- `chant resume <spec-id>` - Resume a failed spec
- `chant resume <spec-id> --work` - Resume and automatically re-execute

### Additional Tools

- `chant refresh` - Refresh dependency status for all specs
  - Reloads specs and recalculates ready/blocked status
  - Use `--verbose` for detailed list of ready and blocked specs
- `chant log <spec-id>` - Show spec execution log
- `chant split <spec-id>` - Split spec into member specs
- `chant merge --all --rebase --auto` - Merge specs with conflict auto-resolution
- `chant merge --finalize` - Merge and mark specs as completed atomically
- `chant finalize <spec-id>` - Finalize a completed spec (validate criteria, update status and model)
  - Automatically detects if spec has an active worktree
  - If worktree exists, finalizes in worktree and commits changes (prevents merge conflicts)
  - If no worktree, finalizes on current branch
- `chant diagnose <spec-id>` - Diagnose spec execution issues
- `chant drift [spec-id]` - Check for drift in documentation specs
- `chant export` - Export specs with wizard or direct options
  - Non-TTY hint: When stdin is not a terminal, provide format explicitly: `chant export --format json`
  - Formats: `--format json|csv|markdown`
  - Supports filters: `--status`, `--type`, `--label`, `--ready-only`
  - Options: `--output <file>` to save to file
- `chant disk` - Show disk usage of chant artifacts
- `chant cleanup` - Remove orphan worktrees and stale artifacts
- `chant init [--force]` - Initialize or reinitialize .chant/ directory
  - `--force`: Fully reinitialize while preserving specs, config, and custom files
  - Use when updating agent configurations or resetting to defaults

## Spec Format and Patterns

### Spec Structure

Specs are markdown files with YAML frontmatter:

```yaml
---
type: code | task | driver | group
status: pending | ready | in_progress | blocked | completed
target_files:
- relative/path/to/file
model: claude-haiku-4-5  # Added after all acceptance criteria met
---
```

### Acceptance Criteria

Specs include checkboxes to track completion:

```markdown
## Acceptance Criteria

- [ ] Feature X implemented
- [ ] All tests passing
- [ ] Code linted and formatted
```

Change `- [ ]` to `- [x]` as you complete each criterion.

## Important Constraints

### For Claude Implementing Specs

1. **Read before modifying** - Always read relevant files first to understand existing code
2. **Write tests** - Validate behavior with tests and run until passing
3. **Run full tests** - When complete, verify all tests pass
4. **Minimal changes** - Only modify files related to the spec; don't refactor unrelated code
5. **Add model to frontmatter** - After all acceptance criteria are met, add `model: claude-haiku-4-5-20251001` to the spec frontmatter

### What NOT to do

**Spec Execution:**
- ❌ **Never** edit files directly outside of spec execution
- ❌ **Never** make ad-hoc changes to the repository outside of the spec system

**Task Tool for Multi-Spec Parallelization:**
- ❌ **Never** use the Task tool to parallelize spec execution across multiple specs
- ❌ **Never** use the Task tool to invoke `chant work` on multiple specs in parallel
- ❌ **Never** use the Task tool to orchestrate multiple spec executions

**Bash Backgrounding for Parallel Spec Work:**
- ❌ **Never** background chant commands with `&` (e.g., `chant work spec-1 &; chant work spec-2 &; wait`)
- ❌ **Never** use shell job control (`&`, `jobs`, `wait`) to parallelize spec execution
- ❌ **Never** manually parallelize spec work in bash

**Why?** Chant has built-in orchestration for parallel execution:
- Use `chant work --parallel` to execute all ready specs in parallel
- Use `chant work --parallel --label <LABEL>` to execute labeled specs in parallel
- Use `chant work spec-1 spec-2 spec-3` to work on multiple specific specs sequentially or with parallel mode
- Chant handles agent rotation, worktree management, and conflict resolution
- Using bash backgrounding or manual parallelization bypasses these safeguards, loses output visibility, and can cause conflicts

**What IS allowed - Task tool within a single spec:**
- ✅ **DO** use the Task tool to search/explore the codebase within a spec
- ✅ **DO** use the Task tool with `subagent_type: Explore` for codebase analysis
- ✅ **DO** use the Task tool with specialized agents for research within a single spec
- ✅ **DO** use parallel tool calls within a single spec execution (e.g., reading multiple files in parallel)

### On Unexpected Errors

If an unexpected error occurs during spec execution:
1. Create a new spec to fix it with `chant add "fix unexpected error X"`
2. Do not continue with the original spec
3. Reference the original spec ID in the new spec

## Best Practices

### Code Quality
- Follow Rust style conventions (enforced by clippy and fmt)
- Add comments only where logic isn't self-evident
- Prefer simple solutions over over-engineered code
- Avoid refactoring unrelated code

### Spec Completion
- Keep changes focused on the spec's acceptance criteria
- Reference spec IDs in commit messages: `chant(2026-01-24-01m-q7e): implement feature X`
- Use `target_files:` frontmatter to declare modified files
- Mark acceptance criteria as complete by changing checkboxes to `[x]`
- Use `chant finalize <spec-id>` to complete a spec:
  - Validates all acceptance criteria are checked
  - Updates status to `completed`
  - Adds model and timestamp information to frontmatter
  - Ensures clean, auditable spec completion

### Testing
- Write tests that validate the spec's acceptance criteria
- Run tests frequently during implementation
- Ensure all tests pass before marking spec complete

## Interactive Wizard Modes

Several commands support interactive wizards for easier operation. Wizards only activate in TTY (terminal) contexts:

- `chant search` - Launch interactive search wizard (omit query to trigger)
  - In non-TTY contexts (piped input, CI/CD): Provide explicit query
  - Example: `chant search "keyword"`

- `chant work` - Launch interactive spec selector (omit spec ID to trigger)
  - In non-TTY contexts: Provide explicit spec ID
  - Example: `chant work 2026-01-27-001-abc`

- `chant export` - Launch interactive export wizard (omit `--format` to trigger)
  - In non-TTY contexts: Provide explicit format flag
  - Example: `chant export --format json`

These wizards guide you through available filters and options when running interactively in a terminal.

## Phase 3: Learn & Retain Workflow

After fixing a bug and opening a PR (or getting it merged), deepen your understanding with the learning workflow:

### The Learning Loop
```
Bug Found → Research → Fix → Debrief → Quiz → Pass? → Next Bug
                                          ↓
                                         Fail
                                          ↓
                                    Review & Retake
```

### 1. Debrief - Document Your Learning

Update `LESSONS.md` with a thorough analysis:

- **Root Cause Analysis**: What was broken and why? Be specific about the failure mechanism.
- **CS Concepts**: Language features, design patterns, architecture principles involved.
- **The Fix**: Explain why your solution works and how it addresses the root cause.
- **Alternatives**: List other approaches you considered and why you rejected them.
- **Gotchas**: Tricky parts, edge cases, or surprising behaviors you encountered.

See the template in `LESSONS.md` for the full structure.

### 2. Quiz - Test Your Understanding

Create a 1-5 question multiple-choice quiz to validate mastery. Questions should test:

- **Root Cause Understanding**: Not just "what file did you change?" but "what condition was wrong?"
- **Language/Runtime Concepts**: Zig optionals, JS event loop, Go interfaces, etc.
- **Debugging Methodology**: How did you find the bug?
- **Architecture Awareness**: Why was the code structured this way?
- **General CS Principles**: When applicable and transferable.

**Format:**
```
Q1: [Question testing understanding]
A) [Plausible but incorrect]
B) [Correct answer] ✓
C) [Plausible but incorrect]
D) [Plausible but incorrect]
```

**Passing Threshold:** ≥80% (typically 4/5 or 5/5 correct)

### 3. Gate Check - Only Proceed When You Pass

- **Pass (≥80%)**: Log the quiz result in LESSONS.md, update stats, proceed to next bug.
- **Fail**: Review incorrect answers, reread relevant sections of LESSONS.md, retake the quiz.
- **Rule**: No new bugs until the quiz is passed. This ensures mastery-based progression.

### Quiz Tracking

Track your quiz performance in the Stats section of `LESSONS.md`:
- Number of quizzes taken
- Pass rate (percentage of quizzes passed on first attempt)
- Individual quiz results for each fix

## Key Principles

- **Auditability**: Every change is tracked in a spec with clear intent
- **Reproducibility**: Specs can be re-run and produce consistent results
- **Isolation**: Work happens in worktrees, keeping main branch clean
- **Intention-driven**: Focus on what to build, not how to build it
- **Idempotent**: Specs document and prove their own correctness

<!-- chant:begin -->
## Chant Workflow

You are an **orchestrator**. Do not edit files directly - all changes flow through the spec system.

### Quick Reference

```bash
chant add "description"     # Create spec
chant work <id>             # Execute spec (agent implements it)
chant show <id>             # View spec details
chant log <id>              # Monitor agent progress
chant finalize <id>         # Mark spec completed
chant list                  # List all specs
```

### Rules

1. **Create specs first** - `chant add` creates a skeleton, then edit the spec file to add acceptance criteria
2. **Use `chant work`** - Never implement directly; dispatch to agents
3. **Commit format** - `chant(SPEC-ID): description`
4. **Monitor agents** - Use `chant log` to check progress and detect issues
5. **All changes audited** - Specs track intent, execution, and results

### Spec Lifecycle

1. `chant add "feature X"` → Creates pending spec
2. Edit `.chant/specs/<id>.md` → Add acceptance criteria
3. `chant work <id>` → Agent implements in isolated worktree
4. `chant finalize <id>` → Validates criteria met, marks completed

### When Agents Struggle

Watch `chant log` for repeated errors or circular fixes. If stuck:
1. Stop the agent
2. Split spec into research + implementation phases
3. Work phases sequentially

For full documentation: `chant --help` or see `.chant/` directory
<!-- chant:end -->
