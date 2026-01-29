```
    ____    __  __   ______           __  __   __  __    _   __  ______    ______    ____
   / __ )  / / / /  / ____/          / / / /  / / / /   / | / / /_  __/   / ____/   / __ \
  / __  | / / / /  / / __           / /_/ /  / / / /   /  |/ /   / /     / __/     / /_/ /
 / /_/ / / /_/ /  / /_/ /          / __  /  / /_/ /   / /|  /   / /     / /___    / _, _/
/_____/  \____/   \____/          /_/ /_/   \____/   /_/ |_/   /_/     /_____/   /_/ |_|
```

> *"Become the open source champion you were meant to be"* (⌐■_■)

An MCP server that automates hunting, analyzing, and solving open source issues.

```bash
# See this banner in full neon glory:
moji banner "BUG HUNTER" --font slant --gradient neon
```

---

## Features (ノ◕ヮ◕)ノ*:・゚✧

| Tool | Description |
|:-----|:------------|
| `hunt_issues` | Find good first issues matching your skills |
| `analyze_repo` | Clone and analyze repository structure |
| `scaffold_solution` | Generate starter implementation for an issue |
| `claim_issue` | Comment on an issue to claim it |
| `generate_chant_spec` | Generate a Chant driver spec from an issue |

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
        "GITHUB_TOKEN": "your_github_token"
      }
    },
    "chant": {
      "command": "/Users/YOUR_USERNAME/Developer/chant/target/release/chant",
      "args": ["mcp"]
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
┃   ╔═══════════════╗                                                    ┃
┃   ║ GENERATE SPEC ║  Create a Chant driver spec from the issue         ┃
┃   ╚═══════╤═══════╝                                                    ┃
┃           │                                                            ┃
┃           ▼                                                            ┃
┃   ╔═══════════════╗                                                    ┃
┃   ║  CHANT SPLIT  ║  Break into focused sub-specs                      ┃
┃   ╚═══════╤═══════╝                                                    ┃
┃           │                                                            ┃
┃           ▼                                                            ┃
┃   ╔═══════════════╗                                                    ┃
┃   ║  CHANT WORK   ║  AI agents implement each spec                     ┃
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

### Generate Chant Spec ✧･ﾟ: *✧

```
Generate a chant spec for zigtools/zls issue #2098
```

This creates a driver spec that can be:
1. Split into focused sub-specs with `chant split`
2. Executed by AI agents with `chant work`
3. Automatically committed with proper messages

### Claim an Issue (｀・ω・´)

```
Claim issue #2098 on zigtools/zls
```

---

## Chant Integration

Bug Hunter integrates with [Chant](https://github.com/lex00/chant) for spec-driven development.

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
│  │ type: driver                                          │  │
│  │ status: pending                                       │  │
│  │ ---                                                   │  │
│  │ # Fix Authentication Bug                              │  │
│  │                                                       │  │
│  │ ## Acceptance Criteria                                │  │
│  │ - [ ] Fix token validation                            │  │
│  │ - [ ] Add tests                                       │  │
│  │ - [ ] Update docs                                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│                    ┌──────────────┐                         │
│                    │ chant split  │                         │
│                    └──────────────┘                         │
│                            │                                │
│              ┌─────────────┼─────────────┐                  │
│              ▼             ▼             ▼                  │
│         spec.1.md     spec.2.md     spec.3.md               │
│              │             │             │                  │
│              ▼             ▼             ▼                  │
│         chant work    chant work    chant work              │
│              │             │             │                  │
│              └─────────────┴─────────────┘                  │
│                            │                                │
│                            ▼                                │
│                     ┌────────────┐                          │
│                     │  PR Ready  │                          │
│                     └────────────┘                          │
└─────────────────────────────────────────────────────────────┘
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
│           └── _scaffold_*/    # Legacy scaffolds
└── bug-hunter-mcp/             # This MCP server
```

---

## Cyberpunk Dev Environment Integration ⌐(ಠ۾ಠ)¬

This pairs perfectly with your terminal setup:

```bash
# After generating a chant spec
y                    # Browse with yazi
v spec.md            # Edit in LazyVim
chant split spec-id  # Split into sub-specs
chant work spec-id.1 # Execute the spec
lg                   # Git workflow with lazygit
gh pr create         # Submit your PR
```

---

## Moji Commands for Style Points ★~(◡﹏◕✿)

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

<p align="center">
<strong>Built for the altruistic open source champion lifestyle.</strong>
<br><br>
<code>(ノ◕ヮ◕)ノ*:・゚✧ Happy Hunting! ✧･ﾟ:*ヽ(◕ヮ◕ヽ)</code>
</p>
