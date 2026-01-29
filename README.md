```
    ____    __  __   ______           __  __   __  __    _   __  ______    ______    ____
   / __ )  / / / /  / ____/          / / / /  / / / /   / | / / /_  __/   / ____/   / __ \
  / __  | / / / /  / / __           / /_/ /  / / / /   /  |/ /   / /     / __/     / /_/ /
 / /_/ / / /_/ /  / /_/ /          / __  /  / /_/ /   / /|  /   / /     / /___    / _, _/
/_____/  \____/   \____/          /_/ /_/   \____/   /_/ |_/   /_/     /_____/   /_/ |_|
```

> *"Become the open source champion you were meant to be"* (⌐■_■)

An MCP server that automates hunting, analyzing, and solving open source issues.
Powered by [Chant](https://github.com/lex00/chant) for spec-driven development and [Moji](https://github.com/ddmoney420/moji) for styled terminal output.

```bash
# See this banner in full neon glory:
moji banner "BUG HUNTER" --font slant --gradient neon
```

---

## Features (ノ◕ヮ◕)ノ*:・゚✧

### Core Tools

| Tool | Description |
|:-----|:------------|
| `hunt_issues` | Find good first issues matching your skills |
| `analyze_repo` | Clone and analyze repository structure |
| `scaffold_solution` | Generate starter implementation for an issue |
| `claim_issue` | Comment on an issue to claim it |

### Chant Integration Tools

| Tool | Description |
|:-----|:------------|
| `generate_chant_spec` | Generate a Chant driver spec from an issue |
| `chant_init` | Initialize Chant in a cloned repository |
| `chant_list` | List all Chant specs with status |
| `chant_show` | Show details of a specific spec |
| `research_workflow` | Run the full research → implementation workflow |

---

## Installation

```bash
cd ~/Developer/bug-hunter-mcp
npm install
npm run build
```

---

## Setup

### 1. Set GitHub Token

```bash
export GITHUB_TOKEN="your_github_token"
```

Get a token from: https://github.com/settings/tokens
Required scopes: `repo`, `read:org`

### 2. Add to Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "bug-hunter": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/Developer/bug-hunter-mcp/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token",
        "CHANT_BIN": "/Users/YOUR_USERNAME/Developer/chant/target/release/chant",
        "MOJI_BIN": "moji"
      }
    }
  }
}
```

### 3. Restart Claude Code

```bash
/mcp  # Verify servers are loaded
```

---

## The Workflow ◝(ᵔᵕᵔ)◜

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                                        ┃
┃   ╔═══════════════╗                                                    ┃
┃   ║  HUNT ISSUES  ║  Find a good issue to work on                      ┃
┃   ╚═══════╤═══════╝                                                    ┃
┃           │                                                            ┃
┃           ▼                                                            ┃
┃   ╔═══════════════╗                                                    ┃
┃   ║ ANALYZE REPO  ║  Clone and understand the codebase                 ┃
┃   ╚═══════╤═══════╝                                                    ┃
┃           │                                                            ┃
┃           ▼                                                            ┃
┃   ╔═══════════════════╗                                                ┃
┃   ║ RESEARCH WORKFLOW ║  Create research + implementation specs        ┃
┃   ╚═══════╤═══════════╝                                                ┃
┃           │                                                            ┃
┃           ▼                                                            ┃
┃   ╔═══════════════╗                                                    ┃
┃   ║  CHANT WORK   ║  AI agents execute specs                           ┃
┃   ╚═══════╤═══════╝                                                    ┃
┃           │                                                            ┃
┃           ▼                                                            ┃
┃   ╔═══════════════╗                                                    ┃
┃   ║  CLAIM ISSUE  ║  Comment on the issue to claim it                  ┃
┃   ╚═══════╤═══════╝                                                    ┃
┃           │                                                            ┃
┃           ▼                                                            ┃
┃   ╔═══════════════╗                                                    ┃
┃   ║  GH PR CREATE ║  Submit your PR                                    ┃
┃   ╚═══════════════╝                                                    ┃
┃                                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Usage Examples

### Hunt for Issues ψ(｀∇´)ψ

```
Find good first issues in Zig projects
```

```
Hunt for TypeScript CLI issues with at least 500 stars
```

### Analyze a Repo (◕‿◕)

```
Analyze the zigtools/zls repository
```

```
Analyze wailsapp/wails and focus on issue #3782
```

### Research Workflow ✧･ﾟ: *✧

```
Run the research workflow for zigtools/zls issue #2098
```

This creates:
1. **Research spec** - Investigate the codebase, document findings
2. **Implementation spec** - Depends on research, executes the solution

### Chant Tools (⌐■_■)

```
Initialize chant in zigtools/zls
```

```
List all specs in zigtools/zls
```

```
Show spec 2026-01-29-001-abc in zigtools/zls
```

### Claim an Issue (｀・ω・´)

```
Claim issue #2098 on zigtools/zls
```

---

## Chant Integration

Bug Hunter deeply integrates with [Chant](https://github.com/lex00/chant) for spec-driven development.

```bash
# See the chant banner in rainbow:
moji banner "CHANT" --font small --gradient rainbow
```

### What is Chant?

Chant is a spec execution platform where AI agents implement markdown specifications:

```
┌─────────────────────────────────────────────────────────────┐
│  SPEC.md                                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ---                                                   │  │
│  │ type: research                                        │  │
│  │ status: pending                                       │  │
│  │ informed_by:                                          │  │
│  │ - src/                                                │  │
│  │ ---                                                   │  │
│  │ # Research: Fix Authentication Bug                    │  │
│  │                                                       │  │
│  │ ## Research Questions                                 │  │
│  │ - [ ] What files handle auth?                         │  │
│  │ - [ ] What patterns are used?                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│                    ┌──────────────┐                         │
│                    │ chant work   │                         │
│                    └──────────────┘                         │
│                            │                                │
│                            ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ RESEARCH_123.md                                       │  │
│  │ - Relevant files: src/auth/*.ts                       │  │
│  │ - Pattern: middleware chain                           │  │
│  │ - Recommended approach: ...                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│                    ┌──────────────┐                         │
│                    │ impl spec    │ (depends_on: research)  │
│                    └──────────────┘                         │
│                            │                                │
│                            ▼                                │
│                     ┌────────────┐                          │
│                     │  PR Ready  │                          │
│                     └────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Research Workflow

The `research_workflow` tool implements [Chant's enterprise research workflow](https://github.com/lex00/chant/tree/main/docs/guides/enterprise/research-workflow):

1. **Investigation Phase** - Research spec with `informed_by:` to analyze codebase
2. **Implementation Phase** - Code spec with `depends_on:` for ordered execution

---

## Moji Integration

Bug Hunter uses [Moji](https://github.com/ddmoney420/moji) for styled terminal output with kaomojis and ASCII banners.

```bash
# Main banner
moji banner "BUG HUNTER" --font slant --gradient neon

# Workflow steps
moji banner "HUNT" --font small --gradient fire
moji banner "ANALYZE" --font small --gradient neon
moji banner "CHANT" --font small --gradient rainbow

# Celebratory kaomojis
moji happy           # (◕‿◕)
moji cool            # (⌐■_■)
moji magic           # (ノ◕ヮ◕)ノ*:・゚✧
moji shrug           # ¯\_(ツ)_/¯
```

---

## Directory Structure

```
~/Developer/
├── bug-hunter-repos/           # Cloned repositories
│   └── owner/
│       └── repo/
│           ├── .chant/
│           │   └── specs/      # Generated Chant specs
│           └── RESEARCH_*.md   # Research findings
├── bug-hunter-mcp/             # This MCP server
├── chant/                      # Chant CLI
└── moji/                       # Moji CLI (optional)
```

---

## Environment Variables

| Variable | Description | Default |
|:---------|:------------|:--------|
| `GITHUB_TOKEN` | GitHub API token | Required |
| `CHANT_BIN` | Path to chant binary | `~/Developer/chant/target/release/chant` |
| `MOJI_BIN` | Path to moji binary | `moji` |

---

## Credits (ノ◕ヮ◕)ノ*:・゚✧

Bug Hunter MCP is built with and powered by:

### [Chant](https://github.com/lex00/chant)
> *Spec-driven development platform*

Chant enables AI agents to implement markdown specifications with:
- Research workflows for codebase investigation
- Dependency-ordered spec execution
- Parallel agent orchestration
- Git worktree isolation

**Created by:** [lex00](https://github.com/lex00)

### [Moji](https://github.com/ddmoney420/moji)
> *Terminal styling and kaomojis*

Moji provides:
- ASCII art banners with gradient colors
- Kaomoji lookup and generation
- Text effects and filters
- Image to ASCII conversion

**Created by:** [ddmoney420](https://github.com/ddmoney420)

---

## License

MIT

---

<p align="center">
<strong>Built for the altruistic open source champion lifestyle.</strong>
<br><br>
<code>(ノ◕ヮ◕)ノ*:・゚✧ Happy Hunting! ✧･ﾟ:*ヽ(◕ヮ◕ヽ)</code>
</p>
