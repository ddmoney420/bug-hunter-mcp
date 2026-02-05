# Bug Hunter Lessons Learned

> (ノ◕ヮ◕)ノ*:・゚✧ Wisdom earned through the hunt

## Workflow

### 1. Scout
Find interesting issues:
- `good-first-issue` / `help-wanted` labels
- Recent activity (not stale)
- Clear reproduction steps
- Responsive maintainers

### 2. Qualify
Before committing, ask:
- [ ] Is the issue well-defined?
- [ ] Can I reproduce it?
- [ ] Is the fix scope reasonable?
- [ ] Are maintainers active?
- [ ] Will they accept external PRs?

### 3. Research
Understand before coding:
- Read related code thoroughly
- Check existing tests
- Look for similar past fixes
- Understand the project's patterns

### 4. Plan
Create a spec with:
- Clear problem statement
- Proposed solution approach
- Specific acceptance criteria (testable!)
- Target files identified

### 5. Execute
- Small, focused changes
- Run tests frequently
- Match project style
- Write tests for the fix

### 6. Debrief
Document the learning in LESSONS.md:
- Root cause analysis
- CS concepts involved
- Solution explanation
- Alternative approaches considered
- Tricky parts and gotchas

### 7. Quiz
Answer 1-5 multiple choice questions to validate understanding:
- Must score ≥80% to pass
- Questions test root cause understanding, language concepts, debugging methodology
- Retake if you don't pass

### 8. Reflect
Update stats and move to the next bug:
- Only proceed to new bugs after quiz passes
- Log lessons learned for future reference

---

## Lessons by Project

### Bun - Issue #19952: Fix console.trace() stderr output
---
difficulty: medium
concepts:
  - stream-processing
  - debugging
  - type-systems
---
**Date:** 2026-02-01
**Issue:** #19952
**Outcome:** success
**Branch:** https://github.com/ddmoney420/bun/tree/fix-console-trace-stderr-19952

#### Root Cause Analysis
The `console.trace()` function was outputting to stdout instead of stderr. The bug was in the writer selection logic in the Bun runtime's console implementation. The code checked the log *level* (info, warn, error) when deciding between stdout and stderr, but `trace()` is a special case that should always use stderr according to the WHATWG Console Standard. The condition selecting the writer didn't account for this message *type*.

#### Learning Outcomes
- **Understand stream routing patterns**: Learn how different output messages are routed to stdout vs stderr based on message properties
- **Apply standard compliance**: Understand how specifications (WHATWG Console Standard) define expected behavior
- **Debug output redirection issues**: Know how to trace where messages are being sent and why

#### CS Concepts
- **WHATWG Console Standard**: Specifications for web APIs and their expected behaviors
- **Stream routing patterns**: Selecting between multiple output destinations based on message properties or characteristics
- **Zig optionals and control flow**: Using `orelse` for fallback behavior in systems programming languages
- **Conditional logic in output systems**: Importance of complete condition coverage when routing messages

#### Transferable Principles
- **Specification-first debugging**: When behavior doesn't match expectations, check the relevant standard first before assuming implementation bugs
- **Message type vs. message level**: Different properties of messages (type, level, severity) may have different routing logic
- **Small, focused fixes**: Minimal changes that respect existing patterns are safer and easier to review
- **Test coverage gaps reveal bugs**: Undercovered code paths are where bugs hide; look for untested branches

#### Gotchas & Edge Cases
- **Zig's optional unwrapping**: Zig's optional type system requires explicit unwrapping with `orelse` - easy to miss when adding conditions. Prevention: Always use type-checker to catch missing unwraps.
- **Multi-level stream selection**: Stream selection logic may exist at multiple levels in the code. You must verify the fix is applied at the correct level. Prevention: Trace the entire code path from entry point to stream selection.
- **Test coverage minimums**: Test coverage for trace output was minimal in this codebase, making the bug easy to miss. Prevention: Write tests for all logging levels and special message types.

#### The Fix
Changed the writer selection logic in Bun's console implementation to check both the log level AND message type. For `trace()` messages, always use stderr regardless of level.

#### Alternatives Considered
1. Add a separate trace stream for trace-specific output (more complex, breaks abstraction)
2. Configure trace routing via environment variable (over-engineered for this fix)
3. Change WHATWG standard interpretation (not possible, standard is fixed)

**Why the chosen approach:** Minimal change, respects the standard, follows existing patterns in the codebase.

#### Quiz: Bun console.trace() stderr fix

**Q1: Why did console.trace() output to stdout instead of stderr?**
- A) The writeTrace() function had a typo
- B) The writer selection checked log LEVEL but not message TYPE ✓
- C) stderr was locked by another process
- D) Bun intentionally differs from Node.js

**Q2: In Zig, what does the `orelse` keyword do?**
- A) Performs a logical OR operation
- B) Unwraps an optional value, providing a fallback if null ✓
- C) Handles exceptions like try/catch
- D) Continues to the next loop iteration

**Q3: According to WHATWG Console Standard, where should trace output go?**
- A) stdout (standard output)
- B) stderr (standard error) ✓
- C) A separate trace log file
- D) Depends on the runtime implementation

**Q4: What pattern should you look for when output goes to the wrong stream?**
- A) Check if the file descriptor is correct
- B) Look for conditions that select between stdout/stderr writers ✓
- C) Verify the terminal supports the output
- D) Check network connectivity

**Quiz Result:** Pass ✓ (4/4 correct, 100%)

---

### The Volume Disaster - 2026-02-02: Bulk PR spam and community reputation
---
difficulty: hard
concepts:
  - error-handling
  - community-dynamics
  - project-management
---
**Date:** 2026-02-02
**Outcome:** abandoned
**Projects affected:** Bun (16 PRs closed), Deno (2 PRs + 1 issue comment closed)

#### Root Cause Analysis
A fundamental misunderstanding of how open source communities work. Submitted 18 pull requests across two major projects in a short time period without understanding the maintainers' workflow or community expectations. This created the perception of spam/bot activity, triggered maintainer concerns, and resulted in mass closures.

The specific failures:
- Quantity over quality: Focused on volume of fixes rather than quality and impact
- Lack of research: Didn't check for existing PRs or related work before submitting
- No validation: Didn't test locally before pushing to remote
- Timing violation: Multiple PRs in same project without waiting for review cycles
- Incomplete work: One fix was Windows-specific but presented as cross-platform
- No disclosure: Didn't acknowledge AI assistance when flagged by maintainers

#### Learning Outcomes
- **Understand community dynamics**: Open source communities have implicit norms about PR frequency, review cycles, and maintainer bandwidth
- **Master PR hygiene**: One quality PR beats ten mediocre ones; focus on impact over quantity
- **Build trust through transparency**: AI assistance must be disclosed upfront; communities value honesty
- **Validate before submitting**: Local testing and verification prevent wasted review time

#### CS Concepts
- **Distributed version control workflows**: How teams coordinate around Git and pull requests
- **Open source etiquette**: Implicit norms and expectations in collaborative projects
- **Platform-specific code**: Understanding when fixes are platform-specific vs. cross-platform
- **Community perception and reputation**: How individual actions affect long-term standing in projects

#### Transferable Principles
- **Quality compounds across interactions**: Each PR builds or erodes trust with maintainers; treat it as relationship-building, not quota-filling
- **Check for existing solutions first**: Search open issues, closed PRs, and discussions before implementing
- **Batch work strategically**: Wait for review/merge cycles rather than flooding with PRs
- **Transparency about tooling**: Always disclose when using AI assistance; communities appreciate honesty
- **Read contributing guidelines carefully**: Each project has different expectations about PR frequency, testing, and review process

#### Gotchas & Edge Cases
- **Platform-specific code masquerading as cross-platform**: A Windows-specific fix was presented as cross-platform, causing confusion and maintainer frustration. Prevention: Always specify which platforms a fix applies to; test on all target platforms.
- **Duplicate work already in flight**: Submitted a fix that duplicated existing PR #27363, showing lack of due diligence. Prevention: Search ALL issues and PRs (open and closed) before starting work.
- **Maintainer communication breaks down**: Multiple PRs across projects created perception of bot/spam, triggering defensive responses. Prevention: One PR per project at a time; wait for feedback before next submission.

**What we had to do (aftermath):**
- Closed 14 of 16 Bun PRs with apologies
- Closed both Deno PRs with apologies
- Replied honestly to maintainer callout about AI assistance
- Acknowledged platform-specific code issue
- Kept only 2 tiny PRs (+1/-1 and +7/-1) that survived review

**What we learned:**
1. One quality PR at a time—wait for merge/close before next
2. Check for existing work (search issues AND PRs, open AND closed)
3. Test locally and validate cross-platform compatibility
4. Disclose AI assistance upfront—maintainers can spot it anyway
5. Smaller PRs build trust; big PRs raise flags
6. Maintainers talk to each other; reputation spans projects

---

### Template: Enhanced Lesson Structure

Use this template when documenting a new lesson. The four required sections ensure measurable concept retention.

```markdown
### [Project Name] - Issue #XXX: [Concise title]
---
difficulty: easy|medium|hard
concepts:
  - concept-1
  - concept-2
---
**Date:** YYYY-MM-DD
**Issue:** #XXX
**Outcome:** success|failed|abandoned|in-progress
**Branch:** [link to branch]

#### Root Cause Analysis
[Explain what was actually broken and why. Be specific about the failure mechanism.]

#### Learning Outcomes
- **Outcome 1:** Description of what was learned
- **Outcome 2:** Another measurable learning goal
- **Outcome 3:** Skills or knowledge gained

#### CS Concepts
- **Concept Name**: Explanation of the concept and how it applied to the bug
- **Another Concept**: How this language feature or pattern was relevant
- **Design Pattern**: What architectural principle was involved

#### Transferable Principles
- **Principle 1:** How this principle applies beyond this specific bug
- **Principle 2:** A broader lesson applicable to similar problems
- **Principle 3:** A meta-skill or debugging approach applicable elsewhere

#### Gotchas & Edge Cases
- **Gotcha Title**: What was tricky or unexpected. Prevention: How to avoid this in the future.
- **Another Gotcha**: Edge case that could confuse others. Prevention: Best practice to prevent recurrence.
- **Platform/version specific**: If there were platform-specific surprises. Prevention: Always test on all targets.

#### The Fix
[Explain why this solution works and how it addresses the root cause.]

#### Alternatives Considered
1. [Alternative approach and why it was rejected]
2. [Another alternative and why we didn't use it]

**Why the chosen approach:** [Justify your decision]

#### Quiz: [Project] - [Brief Issue Description]

**Q1: [Root cause question]**
- A) [Plausible but wrong]
- B) [Correct answer] ✓
- C) [Plausible but wrong]
- D) [Plausible but wrong]

**Q2: [Language/runtime concept question]**
- A) [Plausible but wrong]
- B) [Correct answer] ✓
- C) [Plausible but wrong]
- D) [Plausible but wrong]

**Q3: [Architecture/design question]**
- A) [Plausible but wrong]
- B) [Correct answer] ✓
- C) [Plausible but wrong]
- D) [Plausible but wrong]

[Additional questions as needed, up to 5 total]

**Quiz Result:** [Pass ✓ or Fail ✗] (X/Y correct, Z%)
```

#### Required Sections Explained

**Learning Outcomes:** What measurable skills or knowledge will readers gain? Make these concrete and testable. Example: "Understand race condition detection patterns" not just "Learn concurrency."

**CS Concepts:** What programming concepts, language features, or design patterns were central? Tag them for pattern recognition across bugs. Each concept should have a brief explanation of how it applied.

**Transferable Principles:** What applies beyond this specific bug? These are the meta-skills and debugging approaches that make the learning durable. Example: "Check specifications first before assuming bugs" is more valuable than "Bun had a bug."

**Gotchas & Edge Cases:** What tricky parts could catch others? Include prevention strategies so future developers avoid the same mistakes. These are where real learning happens.

---

## General Insights

### Spec Quality Matters
- Vague acceptance criteria = wasted cycles
- "Research first" specs prevent rabbit holes
- Split large issues into research + implementation phases

### Red Flags
- Issues open for years with no response
- Vague descriptions ("make it better")
- No reproduction steps
- Maintainer says "we might not want this"

### Green Flags
- Maintainer commented recently
- Clear steps to reproduce
- Labeled `good-first-issue` by core team
- Similar issues were merged quickly

### Time Sinks to Avoid
- Jumping into code before understanding the problem
- Fixing symptoms instead of root cause
- Over-engineering simple fixes
- Not running existing tests first

### The Fork Workflow (Don't Be Presumptuous)

#### Phase 0: Gate Check
Before starting ANY work, all must pass:
- [ ] Do I have ZERO open PRs right now? (must be yes)
- [ ] Has anyone already claimed this issue? (must be no)
- [ ] Are there existing PRs for this? Search open AND closed (must be no)

**All three must pass. If not, stop here.**

#### Phase 1: Validate Before Committing
1. **Fork the repo** — Clone locally
2. **Replicate the bug** — Must reproduce it in your branch, no exceptions
3. **Analyze blast radius** — Trace what the fix touches across the entire codebase
4. **Go/No-Go decision:**
   - ✅ Tight bug, limited touch points → Proceed
   - ❌ Sprawling, touches many files/systems → **STOP. Do not work it.**

**Hard limits:**
- If the fix touches **more than 3 files** → Walk away
- If the fix exceeds **+50/-50 lines** → Walk away
- If replication + analysis takes **more than 1 hour** → Bug is too complex, walk away

> This is final. If the bug touches too much, walk away. No heroics.

#### Phase 2: Fix and Propose
5. **Implement the fix** — Small, focused, tested locally
6. **Comment "I have a fix"** — Link to your branch, **disclose AI assistance upfront**
7. **Wait for invitation** — Let maintainers ask for the PR
   - If no response in **2 weeks**, move on
   - Don't ping repeatedly — silence is an answer

Why? Maintainers may not want the fix, or prefer a different approach. Unsolicited PRs can feel pushy. And sprawling fixes are impossible to review.

### Engaging Maintainers
- Keep responses short and human
- Ask questions, don't dump fixes
- Examples: "Good catch, fixing now" / "Would you prefer X or Y?"
- Listen more than explain
- Disclose AI assistance if project requires it

### The Cardinal Rules (Learned the Hard Way)

1. **One PR at a time, one project at a time**
   - Wait for merge or close before opening another
   - Multiple PRs = spam flags, even if they're good

2. **Check for existing work FIRST**
   - Search open PRs before starting
   - Search closed PRs for context
   - Read recent issue comments — someone may already be on it

3. **Test locally or don't submit**
   - Untested code wastes maintainer time
   - "It compiles" is not testing
   - Cross-platform means test cross-platform

4. **AI disclosure is not optional**
   - Experienced devs can spot AI-generated code instantly
   - Hiding it destroys trust permanently
   - Being upfront is respected, even if some projects decline

5. **When you mess up, own it fast**
   - Close the noisy PRs yourself
   - Apologize briefly and genuinely
   - Don't make excuses
   - Silence is worse than acknowledgment

6. **Reputation is portable**
   - Maintainers talk across projects
   - Getting flagged on Deno affects Bun perception
   - One bad week can take months to recover from

---

### Deno #26557: Fix error suggestions for ESM files
---
difficulty: easy
concepts:
  - module-systems
  - error-handling
  - file-extension-based-detection
---
**Date:** 2026-02-04
**Issue:** #26557
**Outcome:** success
**PR:** https://github.com/denoland/deno/pull/XXXXX

#### Root Cause Analysis

When a `.mjs` or `.mts` file (explicitly marked as ES modules) references the `module` object which doesn't exist in ESM scope, Deno showed unhelpful error suggestions recommending CommonJS conversion. The bug was in the error suggestion logic in `runtime/fmt_errors.rs` around lines 307-309, which checked for references to `module` without verifying the file's module type first.

The code generated CommonJS suggestions for ANY file containing "module is not defined", regardless of whether it was already an explicit ESM file. Since `.mjs` and `.mts` files are inherently ES modules by specification, they cannot use CommonJS features, making the suggestions nonsensical and confusing to developers.

#### Learning Outcomes

- **Understand module system distinctions**: Learn how `.mjs` and `.mts` file extensions declare module type independent of package.json configuration
- **File extension-based detection patterns**: Recognize when file extensions carry semantic meaning in error handling logic
- **Error message context awareness**: Understand that helpful error suggestions must account for execution context, not just error content
- **Specification compliance**: Learn how language specifications define what features are available in different module systems

#### CS Concepts

- **Module systems**: JavaScript's dual CommonJS and ESM module systems, and how file extensions determine module type
- **Error suggestion logic**: Generating contextually appropriate suggestions rather than generic ones
- **File type detection**: Using file extensions to determine which code paths and features are valid
- **Specification-driven development**: Using standards (ES module spec) to validate error handling behavior
- **Conditional logic correctness**: Ensuring all relevant conditions are checked before generating suggestions

#### Transferable Principles

- **Context matters in error messages**: Generic error suggestions without context awareness frustrate users
- **File extension semantics**: When extensions carry meaning (`.mjs` = ES module, `.cjs` = CommonJS), detection logic must account for them
- **Specification-first design**: Check what the specification says; don't assume behavior
- **Backwards compatibility**: When fixing error suggestions, ensure existing behavior for non-ESM files isn't broken
- **Test different file types**: Test cases must cover all file type variants (`.js`, `.mjs`, `.ts`, `.mts`, `.cjs`, `.cts`)

#### Gotchas & Edge Cases

- **File extension vs package.json configuration**: A `.js` file's module type can be determined by file extension OR package.json's "type" field. The error logic must account for both. Prevention: Check both extension and package.json when determining module type.
- **Platform-specific path handling**: File path string matching must account for different OS path separators. Prevention: Use path parsing utilities that handle OS differences, not string startswith/endswith checks.
- **Edge case: No package.json**: Files without a package.json nearby default to CommonJS for `.js` files, but `.mjs` is always ESM. Prevention: Test files in directories with and without package.json.
- **Similar-looking extensions**: `.mjs` vs `.js` are easy to confuse in code; `.mts` vs `.ts` even more so. Prevention: Use constants or enums for file type detection rather than string literals.

#### The Fix

Added a file extension check in `runtime/fmt_errors.rs` that skips CommonJS suggestions when the file extension is `.mjs` or `.mts`. For ESM files, the error message was simplified to state that `module is not defined in ES module scope` without suggesting CommonJS conversion workarounds.

The logic flow became:
1. Check if error is "module is not defined"
2. Check the file extension
3. If `.mjs` or `.mts`: Show ESM-specific error (no CJS suggestions)
4. If `.js`, `.ts`, `.cjs`, etc.: Show original suggestions with CommonJS workarounds

#### Alternatives Considered

1. Check both extension AND package.json's "type" field (unnecessary complexity for this fix; extension is definitive for `.mjs`/`.mts`)
2. Parse the full module context to determine module type (over-engineered; file extension is the correct signal)
3. Remove CommonJS suggestions entirely (breaks backward compatibility; users with `.cjs` files still need the hints)
4. Add a configuration flag to control suggestion behavior (adds complexity without clear benefit)

**Why the chosen approach:** Minimal, focused change that respects file extension semantics while maintaining backward compatibility.

#### Quiz: Deno #26557 ESM error suggestions

**Q1: Why did Deno suggest CommonJS workarounds for `.mjs` files?**
- A) To help developers migrate from older JavaScript
- B) The error suggestion logic didn't check file extension before recommending CJS workarounds ✓
- C) Deno intentionally supports both module systems in all files
- D) The developer passed a CommonJS flag in package.json

**Q2: What does the `.mjs` file extension mean according to the ES module specification?**
- A) ES module with JavaScript syntax
- B) Explicitly marks the file as an ES module, not CommonJS ✓
- C) An MIT-licensed JavaScript module
- D) Metadata JavaScript for build tools

**Q3: When checking file module type, which should take priority?**
- A) package.json "type" field (always correct)
- B) File extension (definitive for `.mjs`/`.mts`) ✓
- C) Filename pattern matching
- D) The directory structure

**Q4: Which of these is NOT a valid ESM file marker?**
- A) `.mjs` extension
- B) `.mts` extension
- C) `.cts` extension ✓
- D) `.js` with "type": "module" in package.json

**Q5: What pattern should you look for when error messages give inappropriate suggestions?**
- A) Check if the error condition is too broad
- B) Verify error suggestions account for execution context and file type ✓
- C) Read the error message out loud
- D) Run the same code in a different runtime

**Quiz Result:** Pass ✓ (5/5 correct, 100%)

---

## Stats

| Metric | Count |
|--------|-------|
| Bugs hunted | 2 |
| PRs submitted | 1 (Deno) |
| PRs closed (cleanup) | 29 |
| PRs merged | 1 |
| Abandoned | 0 |
| Quizzes taken | 2 |
| Quiz pass rate | 100% |

**Quiz Performance:**
- Bun #19952: 4/4 (100%) ✓
- Deno #26557: 5/5 (100%) ✓

**Merged PRs:**
- Deno #31985 — hasColors() for process.stdout/stderr ✓
- Deno #26557 — Fix CJS suggestion for ESM modules ✓

**Open PRs:** None

---

*Last updated: 2026-02-04*
