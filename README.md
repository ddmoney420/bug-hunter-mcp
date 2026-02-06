```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     ____    __  __   ______           __  __   __  __    _   __  ______    ______    ____  ┃
┃    / __ )  / / / /  / ____/          / / / /  / / / /   / | / / /_  __/   / ____/   / __ \ ┃
┃   / __  | / / / /  / / __           / /_/ /  / / / /   /  |/ /   / /     / __/     / /_/ / ┃
┃  / /_/ / / /_/ /  / /_/ /          / __  /  / /_/ /   / /|  /   / /     / /___    / _, _/  ┃
┃ /_____/  \____/   \____/          /_/ /_/   \____/   /_/ |_/   /_/     /_____/   /_/ |_|   ┃
┃                                                                                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

> *"Become the open source champion you were meant to be"* (⌐■_■)

An MCP server that teaches you to fix open source bugs by doing. Hunt issues, learn concepts, track progress, earn achievements.

**100% Local** - All data stays on your machine. Only GitHub API calls for issue hunting.

---

```
  _   _   _   _   _   _   _____
 | | | | | | | | | \ | | |_   _|
 | |_| | | | | | |  \| |   | |
 |  _  | | |_| | | |\  |   | |
 |_| |_|  \___/  |_| \_|   |_|
```

## Hunt (4 tools)

| Tool | Description |
|:-----|:------------|
| `hunt_issues` | Find good first issues by language, keywords, stars |
| `analyze_repo` | Clone and study codebase structure |
| `scaffold_solution` | Generate starter code for a fix |
| `scaffold_reproduce_environment` | Auto-generate Dockerfile for any tech stack |
| `claim_issue` | Comment on GitHub to claim it |

---

```
  _       _____      _      ____    _   _
 | |     | ____|    / \    |  _ \  | \ | |
 | |     |  _|     / _ \   | |_) | |  \| |
 | |___  | |___   / ___ \  |  _ <  | |\  |
 |_____| |_____| /_/   \_\ |_| \_\ |_| \_|
```

## Learn (10 tools)

### Concept Graph
| Tool | Description |
|:-----|:------------|
| `show_graph` | 26 CS concepts with prerequisites (ASCII dependency graph) |
| `next_bug` | Personalized "what to learn next" based on mastery |
| `filter_lessons` | Search lessons by difficulty/concept tags |
| `get_strategy` | 10 issue categories with debugging strategies |

### Lessons
| Tool | Description |
|:-----|:------------|
| `new_lesson` | Generate lesson template (4 sections) |
| `validate_lesson` | Check lesson structure |

### Quizzes & Retention
| Tool | Description |
|:-----|:------------|
| `validate_quiz` | Validate quiz structure |
| `validate_quiz_answers` | Score quiz, track pass/fail |
| `record_quiz_attempt` | Save results to profile |
| `get_concept_retention` | See weak/strong concepts, pass rates |

---

```
   ____   ____     ___   __        __
  / ___| |  _ \   / _ \  \ \      / /
 | |  _  | |_) | | | | |  \ \ /\ / /
 | |_| | |  _ <  | |_| |   \ V  V /
  \____| |_| \_\  \___/     \_/\_/
```

## Grow (1 tool)

| Tool | Description |
|:-----|:------------|
| `get_player_profile` | Stats, 20+ achievements, streaks, concept mastery |

### Achievements
- **Race Condition Slayer** - Fix 3 concurrency bugs
- **Memory Expert** - Master memory management
- **Cross-Language Hunter** - Fix bugs in 3+ languages
- **Quiz Master** - Pass 10 quizzes
- *...and 16 more*

---

## Chant Integration (5 tools)

| Tool | Description |
|:-----|:------------|
| `generate_chant_spec` | Create spec from GitHub issue |
| `chant_init` | Initialize Chant in a repo |
| `chant_list` | List all specs |
| `chant_show` | Show spec details |
| `research_workflow` | Full research → implementation flow |

---

## The Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   1. HUNT                        2. REPRODUCE                           │
│   ┌──────────────┐               ┌─────────────────────────────┐        │
│   │ hunt_issues  │ ──────────▶   │ scaffold_reproduce_env      │        │
│   └──────────────┘               └─────────────────────────────┘        │
│         │                                    │                          │
│         ▼                                    ▼                          │
│   3. LEARN                       4. FIX                                 │
│   ┌──────────────┐               ┌─────────────────────────────┐        │
│   │ get_strategy │               │ scaffold_solution           │        │
│   │ show_graph   │               │ (your code here)            │        │
│   └──────────────┘               └─────────────────────────────┘        │
│         │                                    │                          │
│         ▼                                    ▼                          │
│   5. VALIDATE                    6. SHARE                               │
│   ┌──────────────┐               ┌─────────────────────────────┐        │
│   │ run tests    │               │ Open issue, link branch     │        │
│   │ take quiz    │               │ Let maintainer invite PR    │        │
│   └──────────────┘               └─────────────────────────────┘        │
│         │                                                               │
│         ▼                                                               │
│   7. GROW                                                               │
│   ┌──────────────────────────────────────────────────────────┐          │
│   │ get_player_profile  →  achievements, streaks, mastery    │          │
│   └──────────────────────────────────────────────────────────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
cd ~/Developer/bug-hunter-mcp
npm install
npm run build
npm test  # 119 tests
```

---

## Setup

### 1. GitHub Token

```bash
export GITHUB_TOKEN="your_github_token"
```

Get one at: https://github.com/settings/tokens (scopes: `repo`, `read:org`)

### 2. Add to Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "bug-hunter": {
      "command": "node",
      "args": ["/path/to/bug-hunter-mcp/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token"
      }
    }
  }
}
```

### 3. Restart Claude Code

```bash
/mcp  # Verify server loaded
```

---

## Data Storage

All local, no cloud:

```
~/.bug-hunter/
└── profiles/
    └── your-name.json    # Stats, achievements, quiz history

~/Developer/bug-hunter-mcp/
├── LESSONS.md            # Bug lessons with quizzes
├── RESEARCH.md           # Platform research
└── ROADMAP.md            # Feature roadmap
```

---

## Concept Graph

26 CS concepts with prerequisites:

```
┌─ BEGINNER ────────────────────────────────────────────┐
│ Basic Types → Control Flow → Functions                │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌─ INTERMEDIATE ────────────────────────────────────────┐
│ Memory Management → Pointers → Data Structures        │
│ Type Systems → Pattern Matching → Error Handling      │
│ Async/Await → Testing → Debugging                     │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌─ ADVANCED ────────────────────────────────────────────┐
│ Concurrency → Atomics → Locks → Race Conditions       │
│ Optimization → Performance Bottleneck                 │
│ Garbage Collection → Memory Leak → Deadlock           │
└───────────────────────────────────────────────────────┘
```

Use `show_graph` to see full visualization, `next_bug` for recommendations.

---

## Issue Taxonomy

10 bug categories with debugging strategies:

| Category | Strategies |
|:---------|:-----------|
| `race-condition` | Logging, thread sanitizer, lock review |
| `memory-leak` | Heap profiling, allocation tracking |
| `incorrect-logic` | Test isolation, input fuzzing |
| `api-incompatibility` | Version check, docs comparison |
| `type-mismatch` | Type inference, conversion audit |
| `null-reference` | Null checks, optional chaining |
| `performance-bottleneck` | Profiling, flame graphs |
| `encoding-error` | Hex inspection, charset detection |
| `deadlock` | Lock ordering, timeout detection |
| `assertion-error` | Invariant checks, precondition review |

Use `get_strategy {category: "race-condition"}` for full details.

---

## Credits (ノ◕ヮ◕)ノ*:・゚✧

### [Chant](https://github.com/lex00/chant) by [lex00](https://github.com/lex00)
> Spec-driven development platform

### [Moji](https://github.com/ddmoney420/moji) by [ddmoney420](https://github.com/ddmoney420)
> Terminal styling and kaomojis

---

## License

MIT

---

<p align="center">
<code>(ノ◕ヮ◕)ノ*:・゚✧ Happy Hunting! ✧･ﾟ:*ヽ(◕ヮ◕ヽ)</code>
</p>
