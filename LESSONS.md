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

### Bun - Issue #19952
**Date:** 2026-02-01
**Outcome:** PR closed (part of cleanup)
**Branch:** https://github.com/ddmoney420/bun/tree/fix-console-trace-stderr-19952

#### What Worked
- Searching Zig code for `writeTrace` led directly to the bug
- Following the fork workflow (comment first, PR later)
- Small, focused fix (4 lines changed)

#### What Didn't Work
- Initial clone to `~/Developer/bug-hunter-repos/` failed, used `/tmp/bun-repo`
- Branch name with `/` caused "directory file conflict" on push

#### Root Cause Analysis
The `console.trace()` function was outputting to stdout instead of stderr. The bug was in the writer selection logic in the Bun runtime's console implementation. The code checked the log *level* (info, warn, error) when deciding between stdout and stderr, but `trace()` is a special case that should always use stderr according to the WHATWG Console Standard. The condition selecting the writer didn't account for this message *type*.

#### CS Concepts Involved
- **WHATWG Console Standard**: Specifications for web APIs
- **Stream routing patterns**: Selecting between multiple output destinations based on message properties
- **Zig optionals and control flow**: Using `orelse` for fallback behavior in systems code
- **Conditional logic in output systems**: Complete condition coverage when routing messages

#### The Fix
Changed the writer selection logic in Bun's console implementation to check both the log level AND message type. For `trace()` messages, always use stderr regardless of level.

#### Alternatives Considered
1. Add a separate trace stream for trace-specific output (more complex, breaks abstraction)
2. Configure trace routing via environment variable (over-engineered for this fix)
3. Change WHATWG standard interpretation (not possible, standard is fixed)

**Why the chosen approach:** Minimal change, respects the standard, follows existing patterns in the codebase.

#### Gotchas & Surprises
- Zig's optional type system requires explicit unwrapping with `orelse` - easy to miss when adding conditions
- Stream selection happens at multiple levels; had to verify the fix applied at the right level
- Test coverage for trace output was minimal, making the bug easy to miss

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

### The Volume Disaster - 2026-02-02
**Date:** 2026-02-02
**Outcome:** Mass cleanup required
**Projects affected:** Bun (16 PRs), Deno (2 PRs + 1 issue comment)

**What happened:**
- Opened 16 PRs to Bun in a short period
- Opened 2 PRs to Deno
- Commented on Deno issue #26671 with a fix that duplicated existing PR #27363
- Got called out by @OIRNOIR: "The above comment and code smells AI-generated to me"
- Received concerned emails from maintainers
- One fix was Windows-specific but presented as cross-platform

**What we had to do:**
- Closed 14 of 16 Bun PRs with apologies
- Closed both Deno PRs with apologies
- Replied honestly to AI callout on Deno
- Acknowledged Windows-specific code issue on Bun #14255
- Kept only 2 tiny PRs (+1/-1 and +7/-1)

**What went wrong:**
- Quantity over quality
- No local testing before submitting
- Didn't check for existing PRs/work
- No AI disclosure when called for
- Incomplete fixes (Windows-only code)
- Flooded maintainers = looked like spam/bot

**Key lessons:**
1. **One PR at a time** — Wait for merge/close before next
2. **Check for existing work** — Search issues AND PRs first
3. **Test locally** — Don't submit untested code
4. **Disclose AI assistance** — Be upfront, it's obvious anyway
5. **Smaller is better** — Typo fixes build trust, big PRs raise flags
6. **Maintainers talk** — Reputation spans projects

---

### Template: Debrief & Quiz

```markdown
#### [Project Name] - Issue #XXX
**Date:** YYYY-MM-DD
**Outcome:** success/failed/abandoned
**Branch:** [link to branch]

##### What Worked
-

##### What Didn't Work
-

##### Root Cause Analysis
[Explain what was actually broken and why. Be specific about the failure mechanism.]

##### CS Concepts Involved
- [Relevant language features, design patterns, architecture principles]

##### The Fix
[Explain why this solution works and how it addresses the root cause.]

##### Alternatives Considered
1. [Alternative approach and why it was rejected]
2. [Another alternative and why we didn't use it]

**Why the chosen approach:** [Justify your decision]

##### Gotchas & Surprises
- [Tricky parts that caught you off guard]
- [Edge cases or unusual behavior]

##### Quiz: [Project] - [Brief Issue Description]

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

## Stats

| Metric | Count |
|--------|-------|
| Bugs hunted | 1 |
| PRs submitted | 1 (Deno) |
| PRs closed (cleanup) | 29 |
| PRs merged | 0 |
| Abandoned | 0 |
| Quizzes taken | 1 |
| Quiz pass rate | 100% |

**Quiz Performance:**
- Bun #19952: 4/4 (100%) ✓

**Open PRs:**
- Deno #31985 (maintainer approved, needs Windows test fix)

---

*Last updated: 2026-02-03*
