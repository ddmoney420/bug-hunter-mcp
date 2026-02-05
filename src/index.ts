#!/usr/bin/env node

/**
 * Bug Hunter MCP Server
 *
 * An MCP server that helps you find and solve open source issues.
 * Integrates with Chant for spec-driven development and Moji for styled output.
 *
 * Tools:
 * - hunt_issues: Find good first issues matching your skills
 * - analyze_repo: Clone and analyze a repository structure
 * - scaffold_solution: Generate starter implementation for an issue
 * - scaffold_reproduce_environment: Generate reproducible environment templates
 * - claim_issue: Comment on an issue to claim it
 * - generate_chant_spec: Generate a Chant driver spec from an issue
 * - chant_init: Initialize Chant in a repository
 * - chant_list: List Chant specs in a repository
 * - chant_show: Show details of a Chant spec
 * - research_workflow: Run the full Chant research workflow
 *
 * Credits:
 * - Chant (https://github.com/lex00/chant) - Spec-driven development platform
 * - Moji (https://github.com/ddmoney420/moji) - Terminal styling and kaomojis
 *
 * @author ddmoney420
 * @license MIT
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "@octokit/rest";
import { execSync, exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import {
  validateRepoFormat,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateNumberRange,
  validateEnum,
  validateSpecId,
  validateLanguage,
  validateKeywords,
  validateLabels,
  validateAgent,
  validateDirectoryPath,
  validateMessage,
  validateStringArray,
  type ValidationResult,
} from "./validators.js";
import {
  ISSUE_TAXONOMY,
  getStrategy,
  listCategories,
  searchCategories,
  suggestCategory,
} from "./taxonomy.js";
import {
  generateGraphVisualization,
  recommendNextConcept,
  generateMasteryReport,
  searchConcepts,
  listAllConcepts,
  type MasteryStatus,
} from "./graph.js";
import {
  validateLesson,
  validateQuiz,
  lessonToMarkdown,
  createLessonTemplate,
  checkQuizAnswers,
  type LessonTemplate,
  type QuizValidationResult,
  type QuizAttemptResult,
  type QuizQuestion,
  type UserQuizAnswer,
} from "./lessons.js";
import {
  ACHIEVEMENTS,
  getUnlockedAchievements,
  getNearlyUnlockedAchievements,
  getAchievementStats,
  type PlayerProfile,
} from "./achievements.js";
import {
  loadProfile,
  saveProfile,
  getPublicProfileSummary,
  listProfiles,
  exportProfileJSON,
  exportProfileMarkdown,
  recordBugSolved,
  recordQuizPassed,
  recordQuizAttempt,
  getConceptRetentionAnalytics,
} from "./profile.js";
import {
  detectTechStack,
  generateDockerfile,
  generateDockerCompose,
  generateSetupScript,
  generateBatchScript,
  generateEnvironmentSummary,
  type TechStack,
} from "./reproduce-environment.js";

const execAsync = promisify(exec);

// =============================================================================
// Configuration
// =============================================================================

// Initialize GitHub client (uses GITHUB_TOKEN env var if available)
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Base directory for cloned repos
const REPOS_DIR = path.join(process.env.HOME || "~", "Developer", "bug-hunter-repos");

/**
 * Chant Integration
 * https://github.com/lex00/chant - Spec-driven development platform
 */
const CHANT_BIN = process.env.CHANT_BIN || path.join(process.env.HOME || "~", "Developer", "chant", "target", "release", "chant");

/**
 * Moji Integration
 * https://github.com/ddmoney420/moji - Terminal styling and kaomojis
 */
const MOJI_BIN = process.env.MOJI_BIN || "moji";

// =============================================================================
// Moji Helpers - Styled Output (https://github.com/ddmoney420/moji)
// =============================================================================

/** Get a kaomoji by name */
function kaomoji(name: string): string {
  try {
    return execSync(`${MOJI_BIN} ${name}`, { encoding: "utf-8" }).trim();
  } catch {
    // Fallback kaomojis if moji not available
    const fallbacks: Record<string, string> = {
      happy: "(◕‿◕)",
      cool: "(⌐■_■)",
      magic: "(ノ◕ヮ◕)ノ*:・゚✧",
      shrug: "¯\\_(ツ)_/¯",
      success: "✓",
      error: "✗",
      thinking: "(°ヘ°)?",
      celebrate: "ヽ(°〇°)ノ",
    };
    return fallbacks[name] || "";
  }
}

/** Generate ASCII banner (moji banner) */
function banner(text: string, font: string = "small"): string {
  try {
    return execSync(`${MOJI_BIN} banner "${text}" --font ${font}`, { encoding: "utf-8" });
  } catch {
    return `=== ${text} ===`;
  }
}

/** Apply gradient to text */
function gradient(text: string, style: string = "neon"): string {
  try {
    return execSync(`echo "${text}" | ${MOJI_BIN} gradient --style ${style}`, { encoding: "utf-8" });
  } catch {
    return text;
  }
}

// Ensure repos directory exists
if (!fs.existsSync(REPOS_DIR)) {
  fs.mkdirSync(REPOS_DIR, { recursive: true });
}

/**
 * Constants for Difficulty & Concept Tagging System
 */
const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
const CONCEPT_TAXONOMY = [
  "race-conditions",
  "async-await",
  "memory-management",
  "type-systems",
  "error-handling",
  "testing",
  "api-design",
  "caching",
  "concurrency",
  "io-operations",
  "pattern-matching",
  "stream-processing",
  "optimization",
  "debugging",
] as const;

/**
 * Tool definitions
 */
const tools: Tool[] = [
  {
    name: "hunt_issues",
    description: `Discover open source issues on GitHub that match your skills and interests.

This tool searches for "good first issue" and "help wanted" labeled issues across repositories.
You can filter by programming language (e.g., Rust, Go, TypeScript), keywords in issue titles,
and minimum repository stars to find quality projects. Use this to explore opportunities before
diving deeper with analyze_repo.

TYPICAL WORKFLOW:
1. hunt_issues {language: "rust", min_stars: 100} → Find beginner Rust issues in established repos
2. analyze_repo {repo: "owner/name"} → Study the codebase you found
3. scaffold_reproduce_environment → Set up reproducible environment
4. scaffold_solution → Generate starter code
5. claim_issue → Let maintainers know you're working on it

PRACTICAL EXAMPLES:
- Find Zig issues: hunt_issues {language: "zig", limit: 5}
- Search for CLI-related work: hunt_issues {keywords: "cli", min_stars: 50}
- Expand search beyond typical labels: hunt_issues {labels: "good-first-issue,help-wanted"}`,
    inputSchema: {
      type: "object",
      properties: {
        language: {
          type: "string",
          description: "Programming language filter (e.g., 'rust', 'go', 'typescript', 'zig', 'python'). Optional: searches all languages if omitted.",
        },
        keywords: {
          type: "string",
          description: "Keywords to match in issue title or body (e.g., 'cli', 'api', 'ui', 'parser'). Optional: searches all issues if omitted.",
        },
        labels: {
          type: "string",
          description: "Comma-separated GitHub labels to filter by. Default: 'good first issue'. Other common values: 'help-wanted', 'beginner-friendly', 'easy'.",
        },
        limit: {
          type: "number",
          description: "Maximum issues to return. Valid range: 1-30 (default: 10). Higher values give more options but take longer.",
        },
        min_stars: {
          type: "number",
          description: "Minimum repository stars (0+, default: 100). Lower values = newer projects; higher values = more established projects.",
        },
      },
      required: [],
    },
  },
  {
    name: "analyze_repo",
    description: `Clone and analyze a repository's structure, build system, and contributing guidelines.

This tool performs a deep dive into a GitHub repository to understand how to contribute.
It clones the repo (or updates existing clone), then provides:
- Project structure and key directories
- Build system and dependencies (detects Cargo.toml, package.json, build.zig, etc.)
- Contributing guidelines and conventions
- Open issues summary
- Code patterns used in the project

TYPICAL WORKFLOW:
1. hunt_issues → Find an interesting issue
2. analyze_repo {repo: "owner/name"} ← You are here
3. scaffold_reproduce_environment → Generate environment templates
4. scaffold_solution → Generate starter implementation
5. claim_issue → Comment on the issue

PRACTICAL EXAMPLES:
- Analyze zigtools/zls: analyze_repo {repo: "zigtools/zls"}
- Analyze and focus on issue #42: analyze_repo {repo: "owner/name", issue_number: 42}

The analysis includes CONTRIBUTING.md content, key file detection, and directory structure.
Cloned repos are cached in ~/Developer/bug-hunter-repos/ for reuse.`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository path in 'owner/repo' format (e.g., 'zigtools/zls'). Required: uses GitHub API to fetch repo info.",
        },
        issue_number: {
          type: "number",
          description: "Optional: specific issue number to fetch and analyze alongside the repo. If provided, shows issue details, description, and recent comments.",
        },
      },
      required: ["repo"],
    },
  },
  {
    name: "scaffold_solution",
    description: `Generate a starter implementation scaffold tailored to the project type.

This tool creates boilerplate code and project structure for solving a specific issue.
Based on project type detection (Rust, Zig, Go, TypeScript, Python, etc.), it generates:
- Skeleton implementation files with proper syntax and conventions
- NOTES.md with issue details, analysis, and implementation checklist
- Test file templates matching project conventions
- TODO list and next steps

TYPICAL WORKFLOW:
1. hunt_issues → Find an issue
2. analyze_repo → Understand the codebase
3. scaffold_reproduce_environment → Set up dev environment
4. scaffold_solution {repo: "owner/name", issue_number: 42} ← You are here
5. Review NOTES.md in the _scaffold_issue_42 directory
6. Study the actual codebase
7. Implement your solution using the scaffold as a starting point

PRACTICAL EXAMPLE:
- Scaffold for Rust project: scaffold_solution {repo: "rust-lang/rust", issue_number: 123}
  Creates: implementation_title.rs, tests, and NOTES.md with TODOs

The scaffold is created in _scaffold_issue_<number>/ directory (or custom output_dir).
Use it as a starting point, then move completed files to appropriate locations in the repo.`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format (e.g., 'rust-lang/rust'). Required: determines which repo to analyze.",
        },
        issue_number: {
          type: "number",
          description: "GitHub issue number to scaffold (1+). Required: fetches issue details and generates relevant starter code.",
        },
        output_dir: {
          type: "string",
          description: "Optional: custom output directory for scaffold files. Default: _scaffold_issue_<number>/ in the cloned repo directory.",
        },
      },
      required: ["repo", "issue_number"],
    },
  },
  {
    name: "scaffold_reproduce_environment",
    description: `Generate reproducible environment templates for bug debugging and testing.

This tool auto-detects the repository's tech stack and generates minimal, reproducible
environments using Docker, docker-compose, or shell scripts. It removes environment setup
friction and lets developers focus on understanding bugs rather than wrestling with dependencies.

SUPPORTED LANGUAGES:
- JavaScript/TypeScript (Node.js, Deno, Bun)
- Python (Django, FastAPI, Flask)
- Go, Rust, Java, C#/.NET
- Auto-detects frameworks and build systems

GENERATED TEMPLATES:
- Dockerfile: Containerized development environment
- docker-compose.yml: Multi-service setup (databases, caches, services)
- setup.sh: Unix/Linux/macOS automated setup script
- setup.bat: Windows automated setup script
- ENVIRONMENT.md: Setup guide with troubleshooting

TYPICAL WORKFLOW:
1. hunt_issues → Find an issue
2. analyze_repo {repo: "owner/name"}
3. scaffold_reproduce_environment {repo: "owner/name"} ← You are here
4. Use generated templates to reproduce the bug locally
5. Implement your fix in the prepared environment

PRACTICAL EXAMPLES:
- Scaffold for Node.js project: scaffold_reproduce_environment {repo: "expressjs/express"}
  Creates: Dockerfile, docker-compose.yml, setup.sh, setup.bat, ENVIRONMENT.md
- Scaffold for Python Django app: scaffold_reproduce_environment {repo: "django/django"}
  Creates templates with PostgreSQL and Redis services

The generated files are placed in the cloned repo directory and are ready to use immediately.`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format (e.g., 'expressjs/express'). Required: determines which repo to analyze and where to output files.",
        },
        output_dir: {
          type: "string",
          description: "Optional: custom output directory for templates. Default: repo root in ~/Developer/bug-hunter-repos/",
        },
      },
      required: ["repo"],
    },
  },
  {
    name: "claim_issue",
    description: `Post a comment on a GitHub issue to let maintainers know you're working on it.

This tool helps you communicate your intent to the maintainers before starting work.
It posts a comment (default or custom) indicating you've analyzed the codebase and are
beginning implementation. This prevents duplicate effort and signals active work.

IMPORTANT: Requires GITHUB_TOKEN environment variable with 'repo' scope permissions.
Get your token at: https://github.com/settings/tokens

TYPICAL WORKFLOW:
1. hunt_issues → Find an issue
2. analyze_repo → Study the codebase
3. scaffold_solution → Generate starter code
4. claim_issue {repo: "owner/name", issue_number: 42} ← You are here
5. Implement your solution
6. Submit a pull request

DEFAULT MESSAGE:
"I'd like to work on this issue! I've analyzed the codebase and am starting on an implementation."

PRACTICAL EXAMPLE:
- Claim with default message: claim_issue {repo: "zigtools/zls", issue_number: 123}
- Claim with custom message: claim_issue {repo: "...", issue_number: 123, message: "I'll work on this using approach X..."}`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format (e.g., 'zigtools/zls'). Required: determines where to post the comment.",
        },
        issue_number: {
          type: "number",
          description: "GitHub issue number to claim (1+). Required: the specific issue comment thread.",
        },
        message: {
          type: "string",
          description: "Optional: custom claim message (up to 5000 chars). Default message indicates you've analyzed the codebase and are starting implementation.",
        },
      },
      required: ["repo", "issue_number"],
    },
  },
  {
    name: "generate_chant_spec",
    description: `Generate a Chant spec from a GitHub issue for spec-driven development.

This tool bridges GitHub issues and Chant's spec-driven workflow. It creates a markdown spec file
that Chant agents can execute. The spec auto-extracts:
- Issue context and acceptance criteria
- Target files likely to need changes
- GitHub labels (converted to Chant labels)
- Issue URL and background

CHANT WORKFLOW (Spec-Driven Development):
1. hunt_issues → Find an issue
2. analyze_repo → Understand the code
3. generate_chant_spec {repo: "owner/name", issue_number: 42} ← You are here
4. Edit the .md spec to refine acceptance criteria
5. Use 'chant split' to break into focused sub-specs
6. Run 'chant work <spec-id>' to have AI agents implement

PRACTICAL EXAMPLE:
- Generate spec: generate_chant_spec {repo: "zig-lang/zig", issue_number: 15000}
- Output: .chant/specs/zig-lang-zig-implement-feature.md
- Edit the spec to improve acceptance criteria
- Split: chant split zig-lang-zig-implement-feature
- Execute: chant work zig-lang-zig-implement-feature.1

RELATED TOOLS:
- research_workflow: Use this instead if you want research phase + implementation phase
- chant_init: Initialize .chant/ in the repo first (if not already done)`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format (e.g., 'zig-lang/zig'). Required: fetches issue and determines project type.",
        },
        issue_number: {
          type: "number",
          description: "GitHub issue number to convert to spec (1+). Required: defines the task and acceptance criteria.",
        },
        spec_id: {
          type: "string",
          description: "Optional: custom spec ID (e.g., 'my-custom-id'). Default: auto-generated from issue title. Must be lowercase alphanumeric + hyphens.",
        },
        output_dir: {
          type: "string",
          description: "Optional: output directory for spec file. Default: .chant/specs/ in the cloned repo. Directory is created if it doesn't exist.",
        },
      },
      required: ["repo", "issue_number"],
    },
  },
  // =========================================================================
  // Chant Tools (https://github.com/lex00/chant)
  // =========================================================================
  {
    name: "chant_init",
    description: `Initialize Chant spec-driven development infrastructure in a repository.

This sets up the .chant/ directory structure with configuration, agent prompts, and
spec templates. Run this once per repository to enable the Chant workflow. It creates:
- .chant/config.yaml - Configuration for agents and execution
- .chant/prompts/ - AI agent system prompts
- .chant/specs/ - Directory for spec files
- .chant/archive/ - Archive for completed specs

TYPICAL WORKFLOW:
1. hunt_issues → Find an issue
2. analyze_repo → Clone the repo (automatically clones if not present)
3. chant_init {repo: "owner/name"} ← You are here
4. generate_chant_spec or research_workflow → Create specs
5. chant_list → See all specs
6. chant work → Execute specs with AI agents

PRACTICAL EXAMPLES:
- Initialize repo: chant_init {repo: "zigtools/zls"}
- Reinitialize (reset config): chant_init {repo: "zigtools/zls", force: true}
- Custom agent: chant_init {repo: "zigtools/zls", agent: "custom"}

NOTE: analyze_repo automatically clones repos. chant_init just sets up the workflow.
CHANT: Specification-driven development - https://github.com/lex00/chant`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format (e.g., 'zigtools/zls'). Required: determines where to set up .chant/.",
        },
        agent: {
          type: "string",
          description: "Agent type to configure (default: 'claude'). Common values: 'claude', 'local', 'custom'. Determines which AI system handles spec execution.",
        },
        force: {
          type: "boolean",
          description: "Optional: force reinitialization even if .chant/ already exists (default: false). Use to reset config to defaults.",
        },
      },
      required: ["repo"],
    },
  },
  {
    name: "chant_list",
    description: `List all Chant specs in a repository with filtering options.

Displays spec IDs, titles, descriptions, and execution status. Use filters to find
specific specs by status (pending, in_progress, completed), type (code, task, driver, research),
or custom labels. This gives you an overview of all work tracked in the repository.

TYPICAL WORKFLOW:
1. chant_init → Set up Chant
2. generate_chant_spec or research_workflow → Create specs
3. chant_list {repo: "owner/name"} ← You are here
4. chant_show → View details of a specific spec
5. chant work → Execute a spec

PRACTICAL EXAMPLES:
- List all specs: chant_list {repo: "zigtools/zls"}
- Show only pending work: chant_list {repo: "zigtools/zls", status: "pending"}
- Filter by type: chant_list {repo: "zigtools/zls", type: "code"}
- Filter by label: chant_list {repo: "zigtools/zls", label: "bug-fix"}
- Combine filters: chant_list {repo: "zigtools/zls", status: "pending", type: "code"}

STATUS VALUES: pending (not started), in_progress (being worked), completed (done), ready (dependencies met), blocked (waiting for other specs)
TYPE VALUES: code (implementation), task (documentation/setup), driver (issue template), research (investigation)

CHANT: https://github.com/lex00/chant`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format (e.g., 'zigtools/zls'). Required: determines which .chant/specs/ to read.",
        },
        status: {
          type: "string",
          description: "Optional: filter by status. Valid values: pending, in_progress, completed, ready, blocked. Shows only specs matching this status.",
        },
        type: {
          type: "string",
          description: "Optional: filter by spec type. Valid values: code (implementation), task (setup/docs), driver (from issue), research (investigation). Shows only matching types.",
        },
        label: {
          type: "string",
          description: "Optional: filter by custom label. Shows only specs tagged with this label. Labels are defined in spec YAML frontmatter.",
        },
      },
      required: ["repo"],
    },
  },
  {
    name: "chant_show",
    description: `Display complete details of a specific Chant spec.

Shows the full spec content including YAML frontmatter, problem statement, acceptance criteria,
target files, and status. Use this to review a spec before executing it, or to understand
what a spec accomplished after completion.

TYPICAL WORKFLOW:
1. chant_list → Find spec IDs
2. chant_show {repo: "owner/name", spec_id: "my-feature-123"} ← You are here
3. Review acceptance criteria and status
4. chant work → Execute the spec if pending

PRACTICAL EXAMPLES:
- View a spec: chant_show {repo: "zigtools/zls", spec_id: "add-hover-support"}
- Check a completed spec: chant_show {repo: "zigtools/zls", spec_id: "fix-parser-bug"}
- Understand dependencies: chant_show {repo: "zigtools/zls", spec_id: "feature-x"} (shows depends_on)

OUTPUT INCLUDES:
- Type: code, task, driver, research, group
- Status: pending, in_progress, completed, ready, blocked
- Acceptance Criteria: checklist of items to complete
- Target Files: which files this spec modifies
- Labels: custom labels for organization
- Full problem description and solution approach

CHANT: https://github.com/lex00/chant`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format (e.g., 'zigtools/zls'). Required: determines which .chant/specs/ to search.",
        },
        spec_id: {
          type: "string",
          description: "Spec identifier to display (e.g., 'add-hover-support'). Required: the specific spec to view. Use chant_list to find spec IDs.",
        },
      },
      required: ["repo", "spec_id"],
    },
  },
  {
    name: "filter_lessons",
    description: `Filter and search LESSONS.md entries by difficulty level and CS concepts.

This tool helps you find learning materials tailored to your skill level and interests.
It parses LESSONS.md to find bug entries tagged with difficulty (easy/medium/hard) and
CS concepts (race-conditions, async-await, memory-management, type-systems, etc.).

TYPICAL WORKFLOW:
1. Find all easy lessons: filter_lessons {difficulty: "easy"}
2. Find lessons on async-await: filter_lessons {concepts: ["async-await"]}
3. Find medium lessons on both concurrency and caching: filter_lessons {difficulty: "medium", concepts: ["concurrency", "caching"]}
4. Get concept statistics: filter_lessons {show_stats: true}

PRACTICAL EXAMPLES:
- Find beginner-friendly lessons: filter_lessons {difficulty: "easy"}
- Learn about type systems: filter_lessons {concepts: ["type-systems"]}
- Hard lessons on memory management: filter_lessons {difficulty: "hard", concepts: ["memory-management"]}
- See all concepts you've mastered: filter_lessons {show_stats: true}

CONCEPT TAXONOMY:
${CONCEPT_TAXONOMY.map(c => `- ${c}`).join("\n")}`,
    inputSchema: {
      type: "object",
      properties: {
        difficulty: {
          type: "string",
          description: "Filter by difficulty level: 'easy', 'medium', or 'hard'. Optional: returns all levels if omitted.",
          enum: ["easy", "medium", "hard"],
        },
        concepts: {
          type: "array",
          items: { type: "string" },
          description: `Filter by CS concepts. Returns entries that have ANY of the specified concepts. Valid concepts: ${CONCEPT_TAXONOMY.join(", ")}`,
        },
        show_stats: {
          type: "boolean",
          description: "Optional: show concept statistics and mastery tracking (default: false). Displays concepts learned, frequency across bugs, and cross-bug patterns.",
        },
        limit: {
          type: "number",
          description: "Maximum entries to return (1-50, default: 10). Higher values show more lessons.",
        },
      },
      required: [],
    },
  },
  {
    name: "research_workflow",
    description: `Execute Chant's two-phase workflow: research then implementation.

This is the enterprise-grade approach for complex issues. It creates two interdependent specs:
1. RESEARCH PHASE: Investigate codebase, document findings, answer research questions
   - Runs first to understand the problem space
   - Creates RESEARCH_<issue_number>.md with findings
   - Identifies files, patterns, and edge cases

2. IMPLEMENTATION PHASE: Execute implementation based on research findings
   - Automatically depends on research phase completing first
   - Uses research findings to guide implementation
   - Follows documented approach and conventions

WORKFLOW:
1. hunt_issues → Find an issue
2. analyze_repo → Quick overview
3. research_workflow {repo: "owner/name", issue_number: 123} ← You are here
4. chant work <research-spec-id> → Answer research questions
5. Review RESEARCH_123.md findings
6. chant work <implementation-spec-id> → Execute implementation
7. Submit PR!

PRACTICAL EXAMPLE:
research_workflow {repo: "zigtools/zls", issue_number: 500, research_questions: ["What modules parse this format?", "What edge cases exist?"]}

This creates:
- <date>-research-500.md spec (research phase)
- <date>-impl-500.md spec (implementation phase, depends on research)

COMPARE TO:
- generate_chant_spec: Single spec, direct implementation
- research_workflow: Two specs, research-informed implementation (recommended for complex issues)

CHANT: https://github.com/lex00/chant`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format (e.g., 'zigtools/zls'). Required: fetches issue and creates specs.",
        },
        issue_number: {
          type: "number",
          description: "GitHub issue number to research and implement (1+). Required: defines the problem for research phase.",
        },
        research_questions: {
          type: "array",
          items: { type: "string" },
          description: "Optional: custom research questions to guide investigation. Default: generic questions about files, patterns, edge cases, and tests. Examples: ['What modules handle this?', 'What edge cases exist?']",
        },
      },
      required: ["repo", "issue_number"],
    },
  },
  {
    name: "get_strategy",
    description: `Retrieve debugging strategies for an issue category.

This tool provides proven debugging strategies paired with recommended tools for different
problem types. Use this when you've identified an issue type and need a systematic approach
to debug it.

TYPICAL WORKFLOW:
1. hunt_issues → Find an issue and identify problem type
2. get_strategy {category: "race-condition"} ← You are here
3. Follow recommended strategies and tools
4. Apply learnings to fix the issue

CATEGORIES:
- race-condition: Multi-threaded/async synchronization issues
- memory-leak: Allocated memory not being freed
- incorrect-logic: Algorithm or business logic errors
- api-incompatibility: Version mismatches or API usage errors
- type-mismatch: Data type incompatibilities
- null-reference: Null/undefined access errors
- performance-bottleneck: CPU/memory/I/O performance issues
- encoding-error: Character encoding mismatches
- deadlock: Circular waits causing hangs
- assertion-error: Broken invariants or preconditions

PRACTICAL EXAMPLES:
- Debug a race condition: get_strategy {category: "race-condition"}
- Find memory leaks: get_strategy {category: "memory-leak"}
- Understand type errors: get_strategy {category: "type-mismatch"}`,
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Issue category ID to get debugging strategies for. Valid categories: race-condition, memory-leak, incorrect-logic, api-incompatibility, type-mismatch, null-reference, performance-bottleneck, encoding-error, deadlock, assertion-error.",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "show_graph",
    description: `Display the CS concept dependency graph showing how concepts relate.

Shows prerequisites and progression paths for learning. Filter by keyword to focus on
specific areas like "concurrency" or "types".

FEATURES:
- ASCII visualization of concept relationships
- Concepts grouped by difficulty (beginner/intermediate/advanced)
- Recommended learning paths
- Keyword filtering for focused exploration

PRACTICAL EXAMPLES:
- Full graph: show_graph {}
- Concurrency concepts: show_graph {filter: "concurrency"}
- Type system path: show_graph {filter: "type"}`,
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "Optional keyword to filter concepts (e.g., 'concurrency', 'type', 'memory')",
        },
      },
    },
  },
  {
    name: "next_bug",
    description: `Get personalized recommendations for which concept to learn next.

Based on your mastered concepts, recommends the next concepts that unlock the most
new learning paths. Shows prerequisite gaps and impact analysis.

PRACTICAL EXAMPLES:
- Fresh start: next_bug {mastered: []}
- After basics: next_bug {mastered: ["variables", "functions", "error-handling"]}`,
    inputSchema: {
      type: "object",
      properties: {
        mastered: {
          type: "array",
          items: { type: "string" },
          description: "List of concept IDs you've mastered (e.g., ['variables', 'functions'])",
        },
      },
      required: ["mastered"],
    },
  },
  {
    name: "new_lesson",
    description: `Generate a new lesson entry following the enhanced template structure.

This tool creates a properly-formatted lesson entry with all four required sections:
1. Learning Outcomes - what you'll learn from this lesson
2. CS Concepts - tagged computer science concepts
3. Transferable Principles - principles that apply beyond this specific bug
4. Gotchas & Edge Cases - tricky parts and edge cases to avoid

The template helps standardize lessons for better retention tracking and quiz generation.

TYPICAL WORKFLOW:
1. Complete a bug fix and debrief
2. new_lesson {title: "Fix X", project: "ProjectName", issue_number: 123, difficulty: "medium"}
3. The tool generates markdown with the template structure
4. Fill in details for each section
5. Add to LESSONS.md

PRACTICAL EXAMPLES:
- Generate template: new_lesson {title: "Race condition in timer", project: "Bun", issue_number: 19952, difficulty: "medium"}
- Include outcomes: new_lesson {title: "...", project: "...", difficulty: "easy", learning_outcomes: ["Understand X", "Apply Y"]}
- Create with full details: new_lesson {title: "...", project: "...", difficulty: "hard", include_template: true}

The generated markdown includes placeholder content for each section that you can customize.`,
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Lesson title describing the bug or concept (e.g., 'Race condition in event handler'). Required: becomes the lesson heading.",
        },
        project: {
          type: "string",
          description: "Project name where the bug was found (e.g., 'Bun', 'Deno', 'TypeScript'). Required: identifies the source.",
        },
        difficulty: {
          type: "string",
          enum: ["easy", "medium", "hard"],
          description: "Difficulty level of the lesson. Required: helps learners choose appropriate challenges.",
        },
        issue_number: {
          type: "number",
          description: "Optional: GitHub issue number for reference (e.g., 19952).",
        },
        outcome: {
          type: "string",
          enum: ["success", "failed", "abandoned", "in-progress"],
          description: "Optional: outcome of the bug fix (default: in-progress). Use 'success' when the fix was merged.",
        },
        learning_outcomes: {
          type: "array",
          items: { type: "string" },
          description: "Optional: list of learning outcomes (e.g., ['Understand stream routing patterns', 'Apply WHATWG standards']). If omitted, generates placeholders.",
        },
        concepts: {
          type: "array",
          items: { type: "string" },
          description: "Optional: list of CS concepts covered (e.g., ['stream-processing', 'type-systems']). If omitted, generates placeholders.",
        },
      },
      required: ["title", "project", "difficulty"],
    },
  },
  {
    name: "validate_lesson",
    description: `Validate a lesson entry against the enhanced template structure.

This tool checks that a lesson follows the template format with all four required sections:
1. Learning Outcomes - measurable learning goals
2. CS Concepts - tagged CS concepts with explanations
3. Transferable Principles - principles applicable beyond this bug
4. Gotchas & Edge Cases - tricky parts and prevention strategies

Returns validation results including any missing or malformed sections.

TYPICAL WORKFLOW:
1. Write a lesson in LESSONS.md
2. validate_lesson {file_path: "./LESSONS.md", lesson_title: "Race condition fix"}
3. Review validation errors and warnings
4. Update lesson to match template structure
5. Revalidate until all errors are resolved

PRACTICAL EXAMPLES:
- Validate by title: validate_lesson {lesson_title: "Fix console.trace output"}
- Validate file section: validate_lesson {file_path: "./LESSONS.md", lesson_title: "..."}
- Show validation details: validate_lesson {lesson_title: "...", verbose: true}

The tool checks:
- All four required sections present and non-empty
- Each section has required fields
- Proper structure for markdown parsing
- Data types and field names match template`,
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Optional: path to LESSONS.md file to read from (default: ./LESSONS.md). Used to locate the lesson to validate.",
        },
        lesson_title: {
          type: "string",
          description: "Lesson title to validate (exact match). Required: identifies which lesson section to validate.",
        },
        lesson_json: {
          type: "object",
          description: "Optional: lesson object to validate directly (as JSON). If provided, file_path and lesson_title are ignored.",
        },
        verbose: {
          type: "boolean",
          description: "Optional: show detailed validation report (default: false). Includes warnings and suggestions for improvements.",
        },
      },
    },
  },
  {
    name: "validate_quiz",
    description: `Validate a quiz has proper structure for the lesson template.

This tool checks that a quiz follows the enhanced template format:
- 1-5 questions (each 1-500 characters)
- Each question has exactly 4 options
- Each option has 4-200 characters of text
- Exactly one option is marked as correct (isCorrect: true)
- All required fields are properly typed

Returns detailed validation errors and warnings if the quiz structure is invalid.

TYPICAL WORKFLOW:
1. Create a quiz in your lesson entry
2. validate_quiz {quiz_json: {quizQuestions: [...]}}
3. Review validation errors and fix any issues
4. The quiz is now ready for use

PRACTICAL EXAMPLES:
- Validate quiz structure: validate_quiz {quiz_json: {...}}
- The tool catches structural issues like:
  - Missing correct answers
  - Too many/few options per question
  - Invalid field types
  - Text length violations`,
    inputSchema: {
      type: "object",
      properties: {
        quiz_json: {
          type: "object",
          description: "Quiz object to validate (with quizQuestions array). Required: the quiz data structure.",
        },
        verbose: {
          type: "boolean",
          description: "Optional: show detailed validation report (default: false). Includes specific error locations.",
        },
      },
      required: ["quiz_json"],
    },
  },
  {
    name: "validate_quiz_answers",
    description: `Check a user's quiz answers and provide detailed feedback.

This tool validates user quiz responses against the answer key and returns:
- Overall score and pass/fail status (pass = ≥80%)
- Per-question feedback showing:
  - Which questions were answered correctly
  - What the user selected vs. the correct answer
  - Explanatory text for each answer
- Detailed attempt record with timestamp

Returns a QuizAttemptResult with comprehensive scoring details.

TYPICAL WORKFLOW:
1. User completes a quiz in LESSONS.md
2. validate_quiz_answers {quiz_questions: [...], user_answers: [{questionIndex: 0, selectedOptionIndex: 2}, ...]}
3. System returns score, pass/fail status, and detailed feedback
4. Results can be recorded with record_quiz_attempt

PRACTICAL EXAMPLES:
- Check user quiz: validate_quiz_answers {quiz_questions: [...], user_answers: [{...}, {...}]}
- The tool returns:
  - Score: 4/5 correct, 80% (pass ✓)
  - For each question: question text, selected answer, correct answer
  - Attempt timestamp for record-keeping`,
    inputSchema: {
      type: "object",
      properties: {
        quiz_questions: {
          type: "array",
          description: "Array of quiz questions (QuizQuestion[] from lesson). Required: the quiz definition.",
        },
        user_answers: {
          type: "array",
          description: "Array of user answers [{questionIndex, selectedOptionIndex}, ...]. Required: what the user selected.",
        },
        quiz_id: {
          type: "string",
          description: "Optional: identifier for this quiz (for logging). Default: 'unknown'.",
        },
      },
      required: ["quiz_questions", "user_answers"],
    },
  },
  {
    name: "record_quiz_attempt",
    description: `Record a user's quiz attempt and update concept retention metrics.

This tool records quiz performance for a specific concept and updates the player's
retention metrics including:
- Quiz attempts count for the concept
- Pass/fail status and score
- Historical attempt record with timestamp
- Updated pass rate percentage

The recorded data feeds into concept retention analytics and achievement unlocking.

TYPICAL WORKFLOW:
1. User completes quiz: validate_quiz_answers {...}
2. Record the attempt: record_quiz_attempt {developer: "alice", concept: "race-conditions", score: 4, total_questions: 5, percentage_correct: 80, passed: true}
3. Metrics updated: Alice's race-conditions concept now has 1 passing attempt
4. Use get_concept_retention to see updated analytics

PRACTICAL EXAMPLES:
- Record passing quiz: record_quiz_attempt {developer: "alice", concept: "async-await", score: 4, total_questions: 5, percentage_correct: 80, passed: true}
- Record failing quiz: record_quiz_attempt {developer: "alice", concept: "memory-management", score: 3, total_questions: 5, percentage_correct: 60, passed: false}`,
    inputSchema: {
      type: "object",
      properties: {
        developer: {
          type: "string",
          description: "Developer ID/username to record the quiz attempt for. Required: identifies whose profile to update.",
        },
        concept: {
          type: "string",
          description: "CS concept being tested (e.g., 'race-conditions', 'async-await'). Required: tags the retention metric.",
        },
        score: {
          type: "number",
          description: "Number of correct answers (0+). Required: combined with total_questions to calculate percentage.",
        },
        total_questions: {
          type: "number",
          description: "Total questions in the quiz (1+). Required: used to calculate percentage correct.",
        },
        percentage_correct: {
          type: "number",
          description: "Percentage of questions answered correctly (0-100). Required: used for pass/fail determination.",
        },
        passed: {
          type: "boolean",
          description: "Whether the user passed (>=80%). Required: affects specialization boost.",
        },
      },
      required: ["developer", "concept", "score", "total_questions", "percentage_correct", "passed"],
    },
  },
  {
    name: "get_concept_retention",
    description: `Analyze concept retention metrics for a developer.

This tool shows quiz performance and retention data for a developer across all tested concepts:
- Total concepts tested
- Average pass rate across all concepts
- Strong concepts (≥80% pass rate)
- Weak concepts (<60% pass rate) flagged for review
- Historical attempts for each concept

Helps identify learning gaps and track mastery progress over time.

TYPICAL WORKFLOW:
1. User completes multiple quizzes over time
2. get_concept_retention {developer: "alice"}
3. See which concepts need more review
4. Recommend re-studying weak concepts
5. Track progress as pass rates improve

PRACTICAL EXAMPLES:
- View retention analytics: get_concept_retention {developer: "alice"}
- See weak concepts needing review: get_concept_retention {developer: "alice"} (shows concepts < 60%)
- The tool returns:
  - Average pass rate across all concepts
  - List of strong concepts (ready to advance)
  - List of weak concepts (need review)
  - Detailed history for each concept`,
    inputSchema: {
      type: "object",
      properties: {
        developer: {
          type: "string",
          description: "Developer ID/username to analyze retention for. Required: identifies whose profile to read.",
        },
        format: {
          type: "string",
          enum: ["text", "json", "markdown"],
          description: "Optional: output format (default: text). Use 'markdown' for GitHub or 'json' for integration.",
        },
        include_history: {
          type: "boolean",
          description: "Optional: include full attempt history for each concept (default: false). Shows each quiz attempt with date and score.",
        },
      },
      required: ["developer"],
    },
  },
  {
    name: "get_player_profile",
    description: `Display a player's achievements and progress in the gamification system.

This tool shows a developer's achievement badges, concept mastery, and progress
toward unlocking additional achievements. Provides a public showcase of
specializations and learning milestones.

The profile includes:
- Achievements unlocked and total available
- Bugs solved and quizzes passed
- Concepts mastered and specialization levels
- Current and longest streak
- Nearly-unlocked achievements (>50% progress)

TYPICAL WORKFLOW:
1. Record a bug fix: record_bug_solved {developer: "alice", language: "rust", concepts: ["concurrency"]}
2. Get profile: get_player_profile {developer: "alice"}
3. Export for sharing: get_player_profile {developer: "alice", format: "markdown"}

PRACTICAL EXAMPLES:
- View your achievements: get_player_profile {developer: "alice"}
- Export as markdown for GitHub: get_player_profile {developer: "alice", format: "markdown"}
- Export as JSON for integration: get_player_profile {developer: "alice", format: "json"}
- List all developers: get_player_profile {list_all: true}`,
    inputSchema: {
      type: "object",
      properties: {
        developer: {
          type: "string",
          description: "Developer ID or username to fetch profile for (e.g., 'alice'). Optional if list_all is true.",
        },
        format: {
          type: "string",
          enum: ["text", "json", "markdown"],
          description: "Optional: output format (default: text). Use 'markdown' for GitHub-ready export or 'json' for integration.",
        },
        list_all: {
          type: "boolean",
          description: "Optional: list all developers with profiles instead of showing one. Default: false.",
        },
        include_nearly_unlocked: {
          type: "boolean",
          description: "Optional: include achievements close to being unlocked (>50% progress). Default: true.",
        },
      },
      required: [],
    },
  },
];

/**
 * Hunt for good first issues
 */
async function huntIssues(params: {
  language?: string;
  keywords?: string;
  labels?: string;
  limit?: number;
  min_stars?: number;
}): Promise<string> {
  // Validate inputs
  const languageValidation = validateLanguage(params.language, false);
  if (!languageValidation.isValid) {
    return `Error: ${languageValidation.error}`;
  }

  const keywordsValidation = validateKeywords(params.keywords, false);
  if (!keywordsValidation.isValid) {
    return `Error: ${keywordsValidation.error}`;
  }

  const labelsValidation = validateLabels(params.labels, false);
  if (!labelsValidation.isValid) {
    return `Error: ${labelsValidation.error}`;
  }

  const limitValidation = validateNumberRange(
    params.limit,
    "Limit",
    1,
    30,
    false
  );
  if (!limitValidation.isValid) {
    return `Error: ${limitValidation.error}`;
  }

  const minStarsValidation = validateNonNegativeNumber(
    params.min_stars,
    "Min stars",
    false
  );
  if (!minStarsValidation.isValid) {
    return `Error: ${minStarsValidation.error}`;
  }

  const {
    language,
    keywords,
    labels = "good first issue",
    limit = 10,
    min_stars = 100,
  } = params;

  // Build search query
  let query = `is:issue is:open label:"${labels}"`;

  if (language) {
    query += ` language:${language}`;
  }

  if (keywords) {
    query += ` ${keywords}`;
  }

  if (min_stars) {
    query += ` stars:>=${min_stars}`;
  }

  try {
    const response = await octokit.search.issuesAndPullRequests({
      q: query,
      sort: "updated",
      order: "desc",
      per_page: Math.min(limit, 30),
    });

    const issues = response.data.items.map((issue) => {
      const repoUrl = issue.repository_url;
      const repoParts = repoUrl.split("/");
      const repo = `${repoParts[repoParts.length - 2]}/${repoParts[repoParts.length - 1]}`;

      return {
        repo,
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        labels: issue.labels.map((l: any) => (typeof l === "string" ? l : l.name)).join(", "),
        comments: issue.comments,
        created: issue.created_at,
        updated: issue.updated_at,
      };
    });

    if (issues.length === 0) {
      return "No issues found matching your criteria. Try broadening your search.";
    }

    let result = `Found ${issues.length} issues:\n\n`;

    for (const issue of issues) {
      result += `## [${issue.repo}#${issue.number}] ${issue.title}\n`;
      result += `URL: ${issue.url}\n`;
      result += `Labels: ${issue.labels}\n`;
      result += `Comments: ${issue.comments} | Updated: ${issue.updated.split("T")[0]}\n`;

      // Suggest issue category based on title
      const suggestedCategory = suggestCategory(issue.title, "");
      if (suggestedCategory) {
        result += `📊 Suggested Category: ${suggestedCategory}\n`;
      }

      result += `\n`;
    }

    result += `\n## Next Steps\n`;
    result += `1. Use \`get_strategy\` to understand debugging approach for any issue\n`;
    result += `2. Use \`analyze_repo\` to study the codebase\n`;
    result += `3. Use \`scaffold_solution\` to create starter code\n`;

    return result;
  } catch (error: any) {
    return `Error searching issues: ${error.message}`;
  }
}

/**
 * Analyze a repository
 */
async function analyzeRepo(params: {
  repo: string;
  issue_number?: number;
}): Promise<string> {
  // Validate inputs
  const repoValidation = validateRepoFormat(params.repo);
  if (!repoValidation.isValid) {
    return `Error: ${repoValidation.error}`;
  }

  const issueNumberValidation = validatePositiveNumber(
    params.issue_number,
    "Issue number",
    false
  );
  if (!issueNumberValidation.isValid) {
    return `Error: ${issueNumberValidation.error}`;
  }

  const { repo, issue_number } = params;
  const [owner, repoName] = repo.split("/");
  const repoDir = path.join(REPOS_DIR, owner, repoName);

  let result = `# Repository Analysis: ${repo}\n\n`;

  try {
    // Clone or update repo
    if (!fs.existsSync(repoDir)) {
      result += `Cloning repository...\n`;
      fs.mkdirSync(path.dirname(repoDir), { recursive: true });
      execSync(`git clone --depth 1 https://github.com/${repo}.git ${repoDir}`, {
        stdio: "pipe",
      });
      result += `Cloned to: ${repoDir}\n\n`;
    } else {
      result += `Using existing clone at: ${repoDir}\n`;
      try {
        execSync(`git -C ${repoDir} pull --ff-only`, { stdio: "pipe" });
        result += `Updated to latest.\n\n`;
      } catch {
        result += `(Could not update, using existing version)\n\n`;
      }
    }

    // Get repo info from GitHub
    const repoInfo = await octokit.repos.get({ owner, repo: repoName });
    result += `## Overview\n`;
    result += `- Stars: ${repoInfo.data.stargazers_count}\n`;
    result += `- Language: ${repoInfo.data.language}\n`;
    result += `- Open Issues: ${repoInfo.data.open_issues_count}\n`;
    result += `- License: ${repoInfo.data.license?.name || "None"}\n\n`;

    // Directory structure
    result += `## Project Structure\n\`\`\`\n`;
    try {
      const tree = execSync(
        `find ${repoDir} -maxdepth 2 -type f -o -type d | grep -v '.git' | head -50`,
        { encoding: "utf-8" }
      );
      result += tree.replace(new RegExp(repoDir, "g"), ".");
    } catch {
      result += "(Could not read directory structure)\n";
    }
    result += `\`\`\`\n\n`;

    // Check for key files
    result += `## Key Files\n`;
    const keyFiles = [
      "README.md",
      "CONTRIBUTING.md",
      "package.json",
      "Cargo.toml",
      "build.zig",
      "go.mod",
      "Makefile",
      ".github/ISSUE_TEMPLATE",
    ];

    for (const file of keyFiles) {
      const filePath = path.join(repoDir, file);
      if (fs.existsSync(filePath)) {
        result += `- ✓ ${file}\n`;
      }
    }
    result += `\n`;

    // Read contributing guidelines if exists
    const contributingPath = path.join(repoDir, "CONTRIBUTING.md");
    if (fs.existsSync(contributingPath)) {
      const contributing = fs.readFileSync(contributingPath, "utf-8");
      result += `## Contributing Guidelines (excerpt)\n`;
      result += contributing.slice(0, 1500);
      if (contributing.length > 1500) result += "\n...(truncated)";
      result += `\n\n`;
    }

    // Fetch specific issue if provided
    if (issue_number) {
      try {
        const issue = await octokit.issues.get({
          owner,
          repo: repoName,
          issue_number,
        });

        result += `## Issue #${issue_number}: ${issue.data.title}\n`;
        result += `State: ${issue.data.state}\n`;
        result += `Labels: ${issue.data.labels.map((l: any) => l.name).join(", ")}\n`;
        result += `URL: ${issue.data.html_url}\n\n`;
        result += `### Description\n${issue.data.body || "(no description)"}\n\n`;

        // Get comments
        const comments = await octokit.issues.listComments({
          owner,
          repo: repoName,
          issue_number,
          per_page: 5,
        });

        if (comments.data.length > 0) {
          result += `### Recent Comments\n`;
          for (const comment of comments.data) {
            result += `**@${comment.user?.login}**: ${comment.body?.slice(0, 300)}...\n\n`;
          }
        }
      } catch (error: any) {
        result += `Could not fetch issue #${issue_number}: ${error.message}\n`;
      }
    }

    return result;
  } catch (error: any) {
    return `Error analyzing repository: ${error.message}`;
  }
}

/**
 * Scaffold a solution for an issue
 */
async function scaffoldSolution(params: {
  repo: string;
  issue_number: number;
  output_dir?: string;
}): Promise<string> {
  // Validate inputs
  const repoValidation = validateRepoFormat(params.repo);
  if (!repoValidation.isValid) {
    return `Error: ${repoValidation.error}`;
  }

  const issueNumberValidation = validatePositiveNumber(
    params.issue_number,
    "Issue number",
    true
  );
  if (!issueNumberValidation.isValid) {
    return `Error: ${issueNumberValidation.error}`;
  }

  const outputDirValidation = validateDirectoryPath(
    params.output_dir,
    "Output directory",
    false
  );
  if (!outputDirValidation.isValid) {
    return `Error: ${outputDirValidation.error}`;
  }

  const { repo, issue_number, output_dir } = params;
  const [owner, repoName] = repo.split("/");
  const repoDir = path.join(REPOS_DIR, owner, repoName);
  const scaffoldDir = output_dir || path.join(repoDir, "_scaffold_issue_" + issue_number);

  let result = `# Scaffold for ${repo}#${issue_number}\n\n`;

  try {
    // Make sure repo is cloned
    if (!fs.existsSync(repoDir)) {
      result += await analyzeRepo({ repo });
    }

    // Fetch issue details
    const issue = await octokit.issues.get({
      owner,
      repo: repoName,
      issue_number,
    });

    const issueTitle = issue.data.title;
    const issueBody = issue.data.body || "";
    const labels = issue.data.labels.map((l: any) => l.name);

    // Create scaffold directory
    fs.mkdirSync(scaffoldDir, { recursive: true });

    // Detect project type
    const projectType = detectProjectType(repoDir);
    result += `Detected project type: ${projectType}\n`;
    result += `Scaffold directory: ${scaffoldDir}\n\n`;

    // Generate implementation notes
    const notesContent = `# Implementation Notes for Issue #${issue_number}

## Issue: ${issueTitle}
URL: ${issue.data.html_url}

## Description
${issueBody}

## Labels
${labels.join(", ")}

## Analysis
- Project type: ${projectType}
- Repository: ${repo}

## TODO
- [ ] Understand the existing codebase
- [ ] Identify files that need modification
- [ ] Write tests first (TDD)
- [ ] Implement the solution
- [ ] Update documentation if needed
- [ ] Submit PR

## Files to Study
(Add relevant files here as you explore)

## Implementation Plan
(Document your approach here)

## Testing
(Document how to test your changes)
`;

    fs.writeFileSync(path.join(scaffoldDir, "NOTES.md"), notesContent);
    result += `Created: NOTES.md\n`;

    // Generate skeleton based on project type
    const skeleton = generateSkeleton(projectType, issueTitle, issueBody);

    for (const [filename, content] of Object.entries(skeleton)) {
      fs.writeFileSync(path.join(scaffoldDir, filename), content);
      result += `Created: ${filename}\n`;
    }

    result += `\n## Next Steps\n`;
    result += `1. cd ${scaffoldDir}\n`;
    result += `2. Review NOTES.md\n`;
    result += `3. Study the codebase in ${repoDir}\n`;
    result += `4. Implement your solution\n`;
    result += `5. Move files to appropriate locations in the repo\n`;

    return result;
  } catch (error: any) {
    return `Error scaffolding solution: ${error.message}`;
  }
}

/**
 * Scaffold a reproducible environment for debugging and testing
 */
async function scaffoldReproduceEnvironment(params: {
  repo: string;
  output_dir?: string;
}): Promise<string> {
  // Validate inputs
  const repoValidation = validateRepoFormat(params.repo);
  if (!repoValidation.isValid) {
    return `Error: ${repoValidation.error}`;
  }

  const outputDirValidation = validateDirectoryPath(
    params.output_dir,
    "Output directory",
    false
  );
  if (!outputDirValidation.isValid) {
    return `Error: ${outputDirValidation.error}`;
  }

  const { repo, output_dir } = params;
  const [owner, repoName] = repo.split("/");
  const repoDir = path.join(REPOS_DIR, owner, repoName);
  const outputDirPath = output_dir || repoDir;

  let result = `# Bug Reproduction Environment Setup\n\n`;
  result += `Repository: ${repo}\n\n`;

  try {
    // Ensure repo is cloned
    if (!fs.existsSync(repoDir)) {
      result += `Cloning repository...\n`;
      fs.mkdirSync(path.dirname(repoDir), { recursive: true });
      execSync(`git clone --depth 1 https://github.com/${repo}.git ${repoDir}`, {
        stdio: "pipe",
      });
      result += `Repository cloned to: ${repoDir}\n\n`;
    }

    // Detect tech stack
    const techStack = detectTechStack(repoDir);
    result += `## Detected Technology Stack\n\n`;
    result += `- Language: ${techStack.language}\n`;
    result += `- Framework: ${techStack.framework}\n`;
    if (techStack.packageManager) {
      result += `- Package Manager: ${techStack.packageManager}\n`;
    }
    if (techStack.buildSystem) {
      result += `- Build System: ${techStack.buildSystem}\n`;
    }
    if (techStack.testFramework) {
      result += `- Test Framework: ${techStack.testFramework}\n`;
    }
    result += `\n`;

    // Generate Dockerfile
    const dockerfile = generateDockerfile(techStack);
    const dockerfilePath = path.join(outputDirPath, "Dockerfile");
    fs.writeFileSync(dockerfilePath, dockerfile);
    result += `✓ Generated: Dockerfile\n`;

    // Generate docker-compose.yml
    const dockerCompose = generateDockerCompose(techStack);
    const dockerComposePath = path.join(outputDirPath, "docker-compose.yml");
    fs.writeFileSync(dockerComposePath, dockerCompose);
    result += `✓ Generated: docker-compose.yml\n`;

    // Generate setup.sh script
    const setupScript = generateSetupScript(techStack);
    const setupScriptPath = path.join(outputDirPath, "setup.sh");
    fs.writeFileSync(setupScriptPath, setupScript);
    // Make executable
    fs.chmodSync(setupScriptPath, 0o755);
    result += `✓ Generated: setup.sh (executable)\n`;

    // Generate setup.bat script
    const batchScript = generateBatchScript(techStack);
    const batchScriptPath = path.join(outputDirPath, "setup.bat");
    fs.writeFileSync(batchScriptPath, batchScript);
    result += `✓ Generated: setup.bat\n`;

    // Generate environment guide
    const envSummary = generateEnvironmentSummary(techStack, repoDir);
    const envSummaryPath = path.join(outputDirPath, "ENVIRONMENT.md");
    fs.writeFileSync(envSummaryPath, envSummary);
    result += `✓ Generated: ENVIRONMENT.md\n`;

    result += `\n## Quick Start\n\n`;
    result += `All templates have been generated in: ${outputDirPath}\n\n`;

    result += `### Option 1: Docker (Recommended)\n`;
    result += `\`\`\`bash\n`;
    result += `docker build -t ${repoName}-repro .\n`;
    result += `docker run -it -v $(pwd):/app ${repoName}-repro\n`;
    result += `\`\`\`\n\n`;

    result += `### Option 2: Docker Compose\n`;
    result += `\`\`\`bash\n`;
    result += `docker-compose up\n`;
    result += `\`\`\`\n\n`;

    result += `### Option 3: Manual Setup\n`;
    result += `\`\`\`bash\n`;
    result += `# Unix/Linux/macOS\n`;
    result += `chmod +x setup.sh\n`;
    result += `./setup.sh\n`;
    result += `\n# Windows\n`;
    result += `setup.bat\n`;
    result += `\`\`\`\n\n`;

    result += `For detailed setup instructions and troubleshooting, see ENVIRONMENT.md\n`;

    return result;
  } catch (error: any) {
    return `Error scaffolding reproduction environment: ${error.message}`;
  }
}

/**
 * Claim an issue by commenting
 */
async function claimIssue(params: {
  repo: string;
  issue_number: number;
  message?: string;
}): Promise<string> {
  // Validate inputs
  const repoValidation = validateRepoFormat(params.repo);
  if (!repoValidation.isValid) {
    return `Error: ${repoValidation.error}`;
  }

  const issueNumberValidation = validatePositiveNumber(
    params.issue_number,
    "Issue number",
    true
  );
  if (!issueNumberValidation.isValid) {
    return `Error: ${issueNumberValidation.error}`;
  }

  const messageValidation = validateMessage(params.message, "Message", 5000);
  if (!messageValidation.isValid) {
    return `Error: ${messageValidation.error}`;
  }

  const { repo, issue_number, message } = params;
  const [owner, repoName] = repo.split("/");

  const defaultMessage = `I'd like to work on this issue! I've analyzed the codebase and am starting on an implementation.`;
  const comment = message || defaultMessage;

  try {
    await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number,
      body: comment,
    });

    return `Successfully commented on ${repo}#${issue_number}:\n\n"${comment}"`;
  } catch (error: any) {
    return `Error claiming issue: ${error.message}\n\nMake sure GITHUB_TOKEN is set with repo permissions.`;
  }
}

/**
 * Generate a Chant driver spec from a GitHub issue
 */
async function generateChantSpec(params: {
  repo: string;
  issue_number: number;
  spec_id?: string;
  output_dir?: string;
}): Promise<string> {
  // Validate inputs
  const repoValidation = validateRepoFormat(params.repo);
  if (!repoValidation.isValid) {
    return `Error: ${repoValidation.error}`;
  }

  const issueNumberValidation = validatePositiveNumber(
    params.issue_number,
    "Issue number",
    true
  );
  if (!issueNumberValidation.isValid) {
    return `Error: ${issueNumberValidation.error}`;
  }

  const specIdValidation = validateSpecId(params.spec_id);
  if (params.spec_id && !specIdValidation.isValid) {
    return `Error: ${specIdValidation.error}`;
  }

  const outputDirValidation = validateDirectoryPath(
    params.output_dir,
    "Output directory",
    false
  );
  if (!outputDirValidation.isValid) {
    return `Error: ${outputDirValidation.error}`;
  }

  const { repo, issue_number, spec_id, output_dir } = params;
  const [owner, repoName] = repo.split("/");
  const repoDir = path.join(REPOS_DIR, owner, repoName);

  let result = `# Chant Spec Generation for ${repo}#${issue_number}\n\n`;

  try {
    // Make sure repo is cloned
    if (!fs.existsSync(repoDir)) {
      result += `Cloning repository first...\n`;
      fs.mkdirSync(path.dirname(repoDir), { recursive: true });
      execSync(`git clone --depth 1 https://github.com/${repo}.git ${repoDir}`, {
        stdio: "pipe",
      });
    }

    // Fetch issue details
    const issue = await octokit.issues.get({
      owner,
      repo: repoName,
      issue_number,
    });

    const issueTitle = issue.data.title;
    const issueBody = issue.data.body || "";
    const labels = issue.data.labels.map((l: any) => l.name);
    const issueUrl = issue.data.html_url;

    // Generate spec ID from issue title if not provided
    const generatedId = spec_id || issueTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);

    // Detect project type for context
    const projectType = detectProjectType(repoDir);

    // Determine output directory
    const specsDir = output_dir || path.join(repoDir, ".chant", "specs");
    fs.mkdirSync(specsDir, { recursive: true });

    // Extract potential acceptance criteria from issue body
    const acceptanceCriteria = extractAcceptanceCriteria(issueBody, issueTitle);

    // Extract potential target files mentioned in the issue
    const targetFiles = extractTargetFiles(issueBody, projectType);

    // Map labels to chant labels
    const chantLabels = labels
      .filter((l: string) => !["good first issue", "help wanted", "bug", "enhancement"].includes(l.toLowerCase()))
      .map((l: string) => l.toLowerCase().replace(/\s+/g, "-"));

    // Determine spec type based on labels
    let specType = "code";
    if (labels.some((l: string) => l.toLowerCase().includes("doc"))) {
      specType = "task";
    }

    // Generate the spec content
    const specContent = `---
type: driver
status: pending
${targetFiles.length > 0 ? `target_files:\n${targetFiles.map(f => `- ${f}`).join("\n")}` : ""}
${chantLabels.length > 0 ? `labels:\n${chantLabels.map(l => `- ${l}`).join("\n")}` : ""}
---
# ${issueTitle}

GitHub Issue: [${repo}#${issue_number}](${issueUrl})

## Background

${issueBody || "See GitHub issue for details."}

## Context

- **Repository**: ${repo}
- **Project Type**: ${projectType}
- **Labels**: ${labels.join(", ") || "none"}

## Acceptance Criteria

${acceptanceCriteria.map(c => `- [ ] ${c}`).join("\n")}

## Notes

This spec was auto-generated from GitHub issue #${issue_number}.
Use \`chant split ${generatedId}\` to break this into focused sub-specs.
Then execute with \`chant work ${generatedId}.1\` etc.
`;

    // Write the spec file
    const specPath = path.join(specsDir, `${generatedId}.md`);
    fs.writeFileSync(specPath, specContent);

    result += `Created spec: ${specPath}\n\n`;
    result += `## Spec Preview\n\n\`\`\`markdown\n${specContent}\`\`\`\n\n`;
    result += `## Next Steps\n\n`;
    result += `1. Review and edit the spec at: ${specPath}\n`;
    result += `2. Initialize chant if not done: \`cd ${repoDir} && chant init\`\n`;
    result += `3. Split into sub-specs: \`chant split ${generatedId}\`\n`;
    result += `4. Execute: \`chant work ${generatedId}.1\`\n`;

    return result;
  } catch (error: any) {
    return `Error generating chant spec: ${error.message}`;
  }
}

/**
 * Extract acceptance criteria from issue body
 */
function extractAcceptanceCriteria(issueBody: string, issueTitle: string): string[] {
  const criteria: string[] = [];

  // Look for existing checkboxes in the issue
  const checkboxMatches = issueBody.match(/- \[[ x]\] .+/g);
  if (checkboxMatches) {
    criteria.push(...checkboxMatches.map(m => m.replace(/- \[[ x]\] /, "")));
  }

  // Look for numbered lists that might be requirements
  const numberedMatches = issueBody.match(/^\d+\.\s+.+$/gm);
  if (numberedMatches && criteria.length === 0) {
    criteria.push(...numberedMatches.map(m => m.replace(/^\d+\.\s+/, "")));
  }

  // If no criteria found, generate generic ones based on the issue
  if (criteria.length === 0) {
    criteria.push(`Implement: ${issueTitle}`);
    criteria.push("All existing tests pass");
    criteria.push("New tests added for the implementation");
    criteria.push("Code follows project conventions");
    criteria.push("No compiler warnings or errors");
  }

  return criteria;
}

/**
 * Extract potential target files from issue body
 */
function extractTargetFiles(issueBody: string, projectType: string): string[] {
  const files: string[] = [];

  // Look for file paths mentioned in the issue
  const extensions: Record<string, string[]> = {
    zig: ["\\.zig"],
    rust: ["\\.rs"],
    go: ["\\.go"],
    node: ["\\.ts", "\\.js", "\\.tsx", "\\.jsx"],
    python: ["\\.py"],
  };

  const exts = extensions[projectType] || ["\\.\\w+"];
  const pattern = new RegExp(`[\\w/.-]+(?:${exts.join("|")})`, "g");
  const matches = issueBody.match(pattern);

  if (matches) {
    files.push(...new Set(matches));
  }

  return files.slice(0, 10); // Limit to 10 files
}

/**
 * Parse LESSONS.md and extract bug entries with metadata
 */
interface LessonEntry {
  id: string;
  title: string;
  difficulty?: string;
  concepts: string[];
  content: string;
  lineStart: number;
  lineEnd: number;
}

function parseLessonsFile(filePath: string): LessonEntry[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const entries: LessonEntry[] = [];

  // Regex to match h3 headers (### Title) which denote bug entries
  const h3Regex = /^### (.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(h3Regex);
    if (match) {
      const title = match[1];
      const lineStart = i;

      // Look for YAML frontmatter in the next few lines
      let difficulty = undefined;
      let concepts: string[] = [];
      let frontmatterEnd = i + 1;

      // Check if the next line starts with ---
      if (lines[i + 1] === "---") {
        frontmatterEnd = i + 2;
        // Parse YAML-like frontmatter
        while (frontmatterEnd < lines.length && lines[frontmatterEnd] !== "---") {
          const line = lines[frontmatterEnd];
          if (line.startsWith("difficulty:")) {
            difficulty = line.replace("difficulty:", "").trim().toLowerCase();
          } else if (line.startsWith("concepts:")) {
            // Start parsing the concepts array
            const conceptsStart = frontmatterEnd;
            frontmatterEnd++;
            while (
              frontmatterEnd < lines.length &&
              lines[frontmatterEnd].startsWith("  - ")
            ) {
              const concept = lines[frontmatterEnd].replace("  - ", "").trim();
              if (concept) concepts.push(concept);
              frontmatterEnd++;
            }
            frontmatterEnd--; // Back up one since the loop will increment
          }
          frontmatterEnd++;
        }
        if (frontmatterEnd < lines.length && lines[frontmatterEnd] === "---") {
          frontmatterEnd++;
        }
      }

      // Find the end of this entry (next h3 or h2, or end of file)
      let lineEnd = lines.length;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^## /) || lines[j].match(/^### /)) {
          lineEnd = j;
          break;
        }
      }

      const entryContent = lines.slice(frontmatterEnd, lineEnd).join("\n");
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      entries.push({
        id,
        title,
        difficulty,
        concepts,
        content: entryContent.trim(),
        lineStart,
        lineEnd,
      });

      i = lineEnd - 1;
    }
  }

  return entries;
}

/**
 * Filter lessons by difficulty and concepts
 */
async function filterLessons(params: {
  difficulty?: string;
  concepts?: string[];
  show_stats?: boolean;
  limit?: number;
}): Promise<string> {
  const limitValidation = validateNumberRange(
    params.limit,
    "Limit",
    1,
    50,
    false
  );
  if (!limitValidation.isValid) {
    return `Error: ${limitValidation.error}`;
  }

  if (params.difficulty) {
    const diffValidation = validateEnum(
      params.difficulty,
      "Difficulty",
      DIFFICULTY_LEVELS as any,
      false
    );
    if (!diffValidation.isValid) {
      return `Error: ${diffValidation.error}`;
    }
  }

  if (params.concepts) {
    const conceptsValidation = validateStringArray(
      params.concepts,
      "Concepts",
      10,
      50
    );
    if (!conceptsValidation.isValid) {
      return `Error: ${conceptsValidation.error}`;
    }

    // Validate each concept
    for (const concept of params.concepts) {
      if (
        !(CONCEPT_TAXONOMY as readonly string[]).includes(
          concept.toLowerCase()
        )
      ) {
        return `Error: Unknown concept '${concept}'. Valid concepts: ${CONCEPT_TAXONOMY.join(
          ", "
        )}`;
      }
    }
  }

  const {
    difficulty,
    concepts = [],
    show_stats = false,
    limit = 10,
  } = params;
  const lessonsPath = path.join(process.cwd(), "LESSONS.md");

  try {
    if (!fs.existsSync(lessonsPath)) {
      return `Error: LESSONS.md not found at ${lessonsPath}`;
    }

    const entries = parseLessonsFile(lessonsPath);

    // Filter entries
    let filtered = entries.filter((entry) => {
      // Filter by difficulty
      if (difficulty && entry.difficulty !== difficulty) {
        return false;
      }

      // Filter by concepts (match if entry has ANY of the specified concepts)
      if (concepts.length > 0) {
        const conceptsLower = concepts.map((c) => c.toLowerCase());
        const hasMatchingConcept = entry.concepts.some((c) =>
          conceptsLower.includes(c.toLowerCase())
        );
        if (!hasMatchingConcept) {
          return false;
        }
      }

      return true;
    });

    // Limit results
    filtered = filtered.slice(0, limit);

    let result = `# Filtered Lessons\n\n`;

    if (params.difficulty) {
      result += `**Difficulty:** ${difficulty}\n`;
    }
    if (concepts.length > 0) {
      result += `**Concepts:** ${concepts.join(", ")}\n`;
    }
    if (params.difficulty || concepts.length > 0) {
      result += `\n`;
    }

    if (filtered.length === 0) {
      result += `No lessons found matching your criteria.\n\n`;
      result += `Available concepts: ${CONCEPT_TAXONOMY.join(", ")}\n`;
      result += `Available difficulties: ${DIFFICULTY_LEVELS.join(", ")}\n`;
      return result;
    }

    result += `Found ${filtered.length} matching lesson(s):\n\n`;

    for (const entry of filtered) {
      result += `## ${entry.title}\n`;
      if (entry.difficulty) {
        result += `- **Difficulty:** ${entry.difficulty}\n`;
      }
      if (entry.concepts.length > 0) {
        result += `- **Concepts:** ${entry.concepts.join(", ")}\n`;
      }
      result += `\n${entry.content.slice(0, 500)}\n`;
      if (entry.content.length > 500) {
        result += `...\n`;
      }
      result += `\n---\n\n`;
    }

    // Show statistics if requested
    if (show_stats) {
      result += `## Statistics\n\n`;

      // Count concepts across all entries
      const conceptFrequency: Record<string, number> = {};
      const allEntries = parseLessonsFile(lessonsPath);
      for (const entry of allEntries) {
        for (const concept of entry.concepts) {
          conceptFrequency[concept] = (conceptFrequency[concept] || 0) + 1;
        }
      }

      // Count by difficulty
      const byDifficulty: Record<string, number> = {};
      for (const entry of allEntries) {
        if (entry.difficulty) {
          byDifficulty[entry.difficulty] =
            (byDifficulty[entry.difficulty] || 0) + 1;
        }
      }

      result += `### Concepts Mastered (Frequency)\n`;
      const sortedConcepts = Object.entries(conceptFrequency).sort(
        (a, b) => b[1] - a[1]
      );
      for (const [concept, count] of sortedConcepts) {
        result += `- **${concept}**: ${count} bug(s)\n`;
      }

      result += `\n### Lessons by Difficulty\n`;
      for (const diff of DIFFICULTY_LEVELS) {
        const count = byDifficulty[diff] || 0;
        result += `- **${diff}**: ${count} lesson(s)\n`;
      }

      result += `\n### Cross-Bug Pattern Detection\n`;
      const patterns = new Map<string, string[]>();
      for (const entry of allEntries) {
        if (entry.concepts.length > 1) {
          const key = entry.concepts.sort().join(" + ");
          if (!patterns.has(key)) {
            patterns.set(key, []);
          }
          patterns.get(key)!.push(entry.title);
        }
      }

      const sortedPatterns = Array.from(patterns.entries()).sort(
        (a, b) => b[1].length - a[1].length
      );
      if (sortedPatterns.length > 0) {
        for (const [pattern, titles] of sortedPatterns.slice(0, 5)) {
          if (titles.length > 1) {
            result += `- **${pattern}**: Found in ${titles.length} lessons\n`;
          }
        }
      } else {
        result += `No patterns found (concepts typically appear in single lessons)\n`;
      }
    }

    return result;
  } catch (error: any) {
    return `Error filtering lessons: ${error.message}`;
  }
}

// =============================================================================
// Chant Tool Implementations (https://github.com/lex00/chant)
// =============================================================================

/**
 * Initialize Chant in a repository
 */
async function chantInit(params: {
  repo: string;
  agent?: string;
  force?: boolean;
}): Promise<string> {
  // Validate inputs
  const repoValidation = validateRepoFormat(params.repo);
  if (!repoValidation.isValid) {
    return `Error: ${repoValidation.error}`;
  }

  const agentValidation = validateAgent(params.agent);
  if (!agentValidation.isValid) {
    return `Error: ${agentValidation.error}`;
  }

  const { repo, agent = "claude", force = false } = params;
  const [owner, repoName] = repo.split("/");
  const repoDir = path.join(REPOS_DIR, owner, repoName);

  let result = `${banner("CHANT INIT")}\n`;
  result += `${kaomoji("magic")} Initializing Chant in ${repo}\n\n`;

  try {
    // Ensure repo is cloned
    if (!fs.existsSync(repoDir)) {
      result += `${kaomoji("thinking")} Repository not found locally. Cloning first...\n`;
      fs.mkdirSync(path.dirname(repoDir), { recursive: true });
      execSync(`git clone --depth 1 https://github.com/${repo}.git ${repoDir}`, {
        stdio: "pipe",
      });
      result += `${kaomoji("success")} Cloned to: ${repoDir}\n\n`;
    }

    // Run chant init
    const forceFlag = force ? "--force" : "";
    const cmd = `cd "${repoDir}" && ${CHANT_BIN} init --agent ${agent} ${forceFlag}`;

    try {
      const output = execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
      result += `${kaomoji("success")} Chant initialized!\n\n`;
      result += output;
    } catch (error: any) {
      if (error.stdout) {
        result += error.stdout;
      }
      if (error.stderr && !error.stderr.includes("already initialized")) {
        result += `\n${kaomoji("error")} ${error.stderr}`;
      }
    }

    result += `\n## Next Steps ${kaomoji("cool")}\n`;
    result += `1. \`cd ${repoDir}\`\n`;
    result += `2. \`chant add "description"\` - Create a spec\n`;
    result += `3. \`chant work <spec-id>\` - Execute a spec\n`;

    return result;
  } catch (error: any) {
    return `${kaomoji("error")} Error initializing chant: ${error.message}`;
  }
}

/**
 * List Chant specs in a repository
 */
async function chantList(params: {
  repo: string;
  status?: string;
  type?: string;
  label?: string;
}): Promise<string> {
  // Validate inputs
  const repoValidation = validateRepoFormat(params.repo);
  if (!repoValidation.isValid) {
    return `Error: ${repoValidation.error}`;
  }

  const statusValidation = validateEnum(
    params.status,
    "Status",
    ["pending", "in_progress", "completed", "ready", "blocked"],
    false
  );
  if (!statusValidation.isValid) {
    return `Error: ${statusValidation.error}`;
  }

  const typeValidation = validateEnum(
    params.type,
    "Type",
    ["code", "task", "driver", "research", "group"],
    false
  );
  if (!typeValidation.isValid) {
    return `Error: ${typeValidation.error}`;
  }

  const labelValidation = validateLabels(params.label, false);
  if (!labelValidation.isValid) {
    return `Error: ${labelValidation.error}`;
  }

  const { repo, status, type, label } = params;
  const [owner, repoName] = repo.split("/");
  const repoDir = path.join(REPOS_DIR, owner, repoName);

  let result = `${banner("CHANT SPECS")}\n`;
  result += `${kaomoji("happy")} Specs in ${repo}\n\n`;

  try {
    if (!fs.existsSync(repoDir)) {
      return `${kaomoji("error")} Repository not cloned. Run analyze_repo or chant_init first.`;
    }

    // Build command with filters
    let cmd = `cd "${repoDir}" && ${CHANT_BIN} list`;
    if (status) cmd += ` --status ${status}`;
    if (type) cmd += ` --type ${type}`;
    if (label) cmd += ` --label ${label}`;

    try {
      const output = execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
      if (output.includes("No specs")) {
        result += `${kaomoji("shrug")} No specs found.\n\n`;
        result += `Create one with: \`chant add "description"\`\n`;
      } else {
        result += output;
      }
    } catch (error: any) {
      if (error.stdout) {
        result += error.stdout;
      } else {
        result += `${kaomoji("error")} ${error.message}`;
      }
    }

    return result;
  } catch (error: any) {
    return `${kaomoji("error")} Error listing specs: ${error.message}`;
  }
}

/**
 * Show details of a Chant spec
 */
async function chantShow(params: {
  repo: string;
  spec_id: string;
}): Promise<string> {
  // Validate inputs
  const repoValidation = validateRepoFormat(params.repo);
  if (!repoValidation.isValid) {
    return `Error: ${repoValidation.error}`;
  }

  const specIdValidation = validateSpecId(params.spec_id);
  if (!specIdValidation.isValid) {
    return `Error: ${specIdValidation.error}`;
  }

  const { repo, spec_id } = params;
  const [owner, repoName] = repo.split("/");
  const repoDir = path.join(REPOS_DIR, owner, repoName);

  let result = `${banner("SPEC")}\n`;

  try {
    if (!fs.existsSync(repoDir)) {
      return `${kaomoji("error")} Repository not cloned. Run analyze_repo or chant_init first.`;
    }

    const cmd = `cd "${repoDir}" && ${CHANT_BIN} show ${spec_id}`;

    try {
      const output = execSync(cmd, { encoding: "utf-8", stdio: "pipe" });
      result += output;
    } catch (error: any) {
      if (error.stdout) {
        result += error.stdout;
      } else {
        result += `${kaomoji("error")} Spec not found: ${spec_id}`;
      }
    }

    return result;
  } catch (error: any) {
    return `${kaomoji("error")} Error showing spec: ${error.message}`;
  }
}

/**
 * Run the full Chant research workflow for an issue
 * https://github.com/lex00/chant/tree/main/docs/guides/enterprise/research-workflow
 */
async function researchWorkflow(params: {
  repo: string;
  issue_number: number;
  research_questions?: string[];
}): Promise<string> {
  // Validate inputs
  const repoValidation = validateRepoFormat(params.repo);
  if (!repoValidation.isValid) {
    return `Error: ${repoValidation.error}`;
  }

  const issueNumberValidation = validatePositiveNumber(
    params.issue_number,
    "Issue number",
    true
  );
  if (!issueNumberValidation.isValid) {
    return `Error: ${issueNumberValidation.error}`;
  }

  const questionsValidation = validateStringArray(
    params.research_questions,
    "Research questions",
    20,
    500
  );
  if (!questionsValidation.isValid) {
    return `Error: ${questionsValidation.error}`;
  }

  const { repo, issue_number, research_questions = [] } = params;
  const [owner, repoName] = repo.split("/");
  const repoDir = path.join(REPOS_DIR, owner, repoName);

  let result = `${banner("RESEARCH WORKFLOW")}\n`;
  result += `${kaomoji("magic")} Starting research workflow for ${repo}#${issue_number}\n\n`;

  try {
    // Ensure repo is cloned and chant initialized
    if (!fs.existsSync(repoDir)) {
      result += `${kaomoji("thinking")} Cloning repository...\n`;
      fs.mkdirSync(path.dirname(repoDir), { recursive: true });
      execSync(`git clone --depth 1 https://github.com/${repo}.git ${repoDir}`, {
        stdio: "pipe",
      });
    }

    // Initialize chant if needed
    const chantDir = path.join(repoDir, ".chant");
    if (!fs.existsSync(chantDir)) {
      result += `${kaomoji("thinking")} Initializing Chant...\n`;
      execSync(`cd "${repoDir}" && ${CHANT_BIN} init --agent claude`, { stdio: "pipe" });
    }

    // Fetch issue details
    const issue = await octokit.issues.get({
      owner,
      repo: repoName,
      issue_number,
    });

    const issueTitle = issue.data.title;
    const issueBody = issue.data.body || "";
    const issueUrl = issue.data.html_url;

    // Generate research spec ID
    const dateStr = new Date().toISOString().split("T")[0];
    const researchId = `${dateStr}-research-${issue_number}`;
    const implId = `${dateStr}-impl-${issue_number}`;

    // Build research questions
    const defaultQuestions = [
      "What files are most relevant to this issue?",
      "What patterns/conventions does the codebase use?",
      "What edge cases need to be handled?",
      "What tests should be added?",
    ];
    const questions = research_questions.length > 0 ? research_questions : defaultQuestions;

    // Create research spec
    const researchSpec = `---
type: research
status: pending
labels:
- issue-${issue_number}
- research
informed_by:
- src/
target_files:
- RESEARCH_${issue_number}.md
---
# Research: ${issueTitle}

GitHub Issue: [${repo}#${issue_number}](${issueUrl})

## Mission ${kaomoji("magic")}

Investigate the codebase to understand how to implement this issue.

## Research Questions

${questions.map(q => `- [ ] ${q}`).join("\n")}

## Issue Context

${issueBody.slice(0, 1500)}${issueBody.length > 1500 ? "\n\n...(truncated)" : ""}

## Methodology

1. Explore relevant directories and files
2. Analyze existing patterns and conventions
3. Document findings in RESEARCH_${issue_number}.md
4. Propose implementation approach

## Acceptance Criteria

- [ ] All research questions answered
- [ ] Relevant files identified and documented
- [ ] Implementation approach proposed
- [ ] Research findings written to RESEARCH_${issue_number}.md
`;

    // Create implementation spec (depends on research)
    const implSpec = `---
type: code
status: pending
depends_on:
- ${researchId}
labels:
- issue-${issue_number}
- implementation
---
# Implement: ${issueTitle}

GitHub Issue: [${repo}#${issue_number}](${issueUrl})

## Background

This spec implements the solution based on research findings in \`${researchId}\`.

## Implementation Plan

(To be filled after research phase completes)

## Acceptance Criteria

- [ ] Implementation complete per research findings
- [ ] All existing tests pass
- [ ] New tests added
- [ ] Code follows project conventions
`;

    // Write specs
    const specsDir = path.join(repoDir, ".chant", "specs");
    fs.mkdirSync(specsDir, { recursive: true });

    const researchPath = path.join(specsDir, `${researchId}.md`);
    const implPath = path.join(specsDir, `${implId}.md`);

    fs.writeFileSync(researchPath, researchSpec);
    fs.writeFileSync(implPath, implSpec);

    result += `${kaomoji("success")} Created research workflow specs!\n\n`;
    result += `## Phase 1: Research ${kaomoji("thinking")}\n`;
    result += `**Spec:** ${researchId}\n`;
    result += `**File:** ${researchPath}\n\n`;
    result += `## Phase 2: Implementation ${kaomoji("cool")}\n`;
    result += `**Spec:** ${implId}\n`;
    result += `**File:** ${implPath}\n`;
    result += `**Depends on:** ${researchId}\n\n`;
    result += `## Next Steps ${kaomoji("celebrate")}\n`;
    result += `1. \`cd ${repoDir}\`\n`;
    result += `2. \`chant work ${researchId}\` - Run research phase\n`;
    result += `3. Review findings in RESEARCH_${issue_number}.md\n`;
    result += `4. \`chant work ${implId}\` - Run implementation phase\n`;
    result += `5. Submit PR!\n`;

    return result;
  } catch (error: any) {
    return `${kaomoji("error")} Error in research workflow: ${error.message}`;
  }
}

/**
 * Detect project type from repo contents
 */
function detectProjectType(repoDir: string): string {
  if (fs.existsSync(path.join(repoDir, "build.zig"))) return "zig";
  if (fs.existsSync(path.join(repoDir, "Cargo.toml"))) return "rust";
  if (fs.existsSync(path.join(repoDir, "go.mod"))) return "go";
  if (fs.existsSync(path.join(repoDir, "package.json"))) return "node";
  if (fs.existsSync(path.join(repoDir, "pyproject.toml"))) return "python";
  if (fs.existsSync(path.join(repoDir, "requirements.txt"))) return "python";
  if (fs.existsSync(path.join(repoDir, "Makefile"))) return "make";
  return "unknown";
}

/**
 * Generate skeleton files based on project type
 */
function generateSkeleton(
  projectType: string,
  issueTitle: string,
  issueBody: string
): Record<string, string> {
  const files: Record<string, string> = {};

  const sanitizedName = issueTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 30);

  switch (projectType) {
    case "zig":
      files[`${sanitizedName}.zig`] = `//! Implementation for: ${issueTitle}
//!
//! Issue: ${issueBody.slice(0, 200)}...

const std = @import("std");

// TODO: Add your implementation here

pub fn main() !void {
    // Entry point for testing
}

test "${sanitizedName}" {
    // TODO: Add tests
}
`;
      break;

    case "rust":
      files[`${sanitizedName}.rs`] = `//! Implementation for: ${issueTitle}
//!
//! Issue: ${issueBody.slice(0, 200)}...

// TODO: Add your implementation here

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_${sanitizedName}() {
        // TODO: Add tests
    }
}
`;
      break;

    case "go":
      files[`${sanitizedName}.go`] = `// Package implements: ${issueTitle}
//
// Issue: ${issueBody.slice(0, 200)}...
package main

// TODO: Add your implementation here
`;
      files[`${sanitizedName}_test.go`] = `package main

import "testing"

func Test${sanitizedName.charAt(0).toUpperCase() + sanitizedName.slice(1)}(t *testing.T) {
    // TODO: Add tests
}
`;
      break;

    case "node":
      files[`${sanitizedName}.ts`] = `/**
 * Implementation for: ${issueTitle}
 *
 * Issue: ${issueBody.slice(0, 200)}...
 */

// TODO: Add your implementation here

export function ${sanitizedName.replace(/_/g, "")}() {
  // Implementation
}
`;
      files[`${sanitizedName}.test.ts`] = `import { describe, it, expect } from 'vitest';
import { ${sanitizedName.replace(/_/g, "")} } from './${sanitizedName}';

describe('${sanitizedName}', () => {
  it('should work', () => {
    // TODO: Add tests
  });
});
`;
      break;

    case "python":
      files[`${sanitizedName}.py`] = `"""
Implementation for: ${issueTitle}

Issue: ${issueBody.slice(0, 200)}...
"""

# TODO: Add your implementation here


def ${sanitizedName}():
    """Main implementation."""
    pass


if __name__ == "__main__":
    ${sanitizedName}()
`;
      files[`test_${sanitizedName}.py`] = `"""Tests for ${sanitizedName}."""

import pytest
from ${sanitizedName} import ${sanitizedName}


def test_${sanitizedName}():
    """TODO: Add tests."""
    pass
`;
      break;

    default:
      files["implementation.txt"] = `Implementation notes for: ${issueTitle}

${issueBody}

TODO:
- [ ] Identify the correct file locations
- [ ] Implement the solution
- [ ] Add tests
`;
  }

  return files;
}

/**
 * Get debugging strategy for an issue category
 */
async function getStrategyForCategory(params: {
  category: string;
}): Promise<string> {
  const { category } = params;

  // Validate category exists
  const validCategories = listCategories();
  if (!validCategories.includes(category)) {
    return `Error: Unknown category '${category}'. Valid categories: ${validCategories.join(
      ", "
    )}`;
  }

  const categoryInfo = getStrategy(category);
  if (!categoryInfo) {
    return `Error: Category not found: ${category}`;
  }

  let result = `# Debugging Strategy: ${categoryInfo.name}\n\n`;
  result += `## Description\n${categoryInfo.description}\n\n`;

  result += `## Keywords\n${categoryInfo.keywords.join(", ")}\n\n`;

  result += `## Debugging Strategies\n\n`;
  for (const strategy of categoryInfo.strategies) {
    result += `### ${strategy.name}\n`;
    result += `${strategy.description}\n\n`;

    result += `**Steps:**\n`;
    for (const step of strategy.steps) {
      result += `- ${step}\n`;
    }

    result += `\n**Recommended Tools:**\n`;
    for (const tool of strategy.tools) {
      result += `- ${tool}\n`;
    }
    result += `\n`;
  }

  result += `## Success Tips\n`;
  for (const tip of categoryInfo.successTips) {
    result += `- ${tip}\n`;
  }

  return result;
}

/**
 * Display the CS concept dependency graph
 */
async function showGraph(params: { filter?: string }): Promise<string> {
  if (params.filter) {
    const matches = searchConcepts(params.filter);
    if (matches.length === 0) {
      return `No concepts matching "${params.filter}". Try: concurrency, type, memory, error, async`;
    }
    let output = `# Concept Graph: "${params.filter}"\n\nFound ${matches.length} matching concept(s):\n\n`;
    for (const concept of matches) {
      output += `## ${concept.name}\n`;
      output += `**Difficulty:** ${concept.difficulty}\n`;
      output += `**Description:** ${concept.description}\n`;
      if (concept.prerequisites.length > 0) {
        output += `**Prerequisites:** ${concept.prerequisites.join(", ")}\n`;
      }
      if (concept.relatedConcepts && concept.relatedConcepts.length > 0) {
        output += `**Related:** ${concept.relatedConcepts.join(", ")}\n`;
      }
      output += "\n";
    }
    return output;
  }
  return generateGraphVisualization();
}

/**
 * Recommend next concepts to learn based on mastered concepts
 */
async function nextBug(params: { mastered: string[] }): Promise<string> {
  const mastered = params.mastered || [];
  const masteredSet = new Set(mastered);
  const allConcepts = listAllConcepts();

  const recommendation = recommendNextConcept(masteredSet);
  let output = `# Next Concept Recommendations\n\n`;
  output += `**Mastered:** ${mastered.length > 0 ? mastered.join(", ") : "none yet"}\n`;
  output += `**Progress:** ${mastered.length}/${allConcepts.length} concepts\n\n`;

  if (!recommendation) {
    output += "You've mastered all available concepts! Impressive.\n";
  } else {
    const concept = allConcepts.find((c) => c.id === recommendation.conceptId);
    if (concept) {
      output += `## Recommended Next: ${concept.name}\n\n`;
      output += `**Difficulty:** ${concept.difficulty}\n`;
      output += `**Why:** ${recommendation.reason}\n`;
      output += `${concept.description}\n\n`;
      if (concept.prerequisites.length > 0) {
        const missing = concept.prerequisites.filter((p) => !masteredSet.has(p));
        if (missing.length > 0) {
          output += `**Missing prerequisites:** ${missing.join(", ")}\n`;
        }
      }
    }
  }

  const masteryStatuses: MasteryStatus[] = allConcepts.map((c) => ({
    conceptId: c.id,
    mastered: masteredSet.has(c.id),
    depth: masteredSet.has(c.id) ? "deep" as const : "surface" as const,
    bugsCompleted: masteredSet.has(c.id) ? 1 : 0,
  }));
  output += "\n" + generateMasteryReport(masteryStatuses);
  return output;
}

/**
 * Generate a new lesson entry following the enhanced template
 */
async function newLesson(params: {
  title: string;
  project: string;
  difficulty: "easy" | "medium" | "hard";
  issue_number?: number;
  outcome?: "success" | "failed" | "abandoned" | "in-progress";
  learning_outcomes?: string[];
  concepts?: string[];
}): Promise<string> {
  const {
    title,
    project,
    difficulty,
    issue_number,
    outcome = "in-progress",
    learning_outcomes = [],
    concepts = [],
  } = params;

  // Validate required parameters
  if (!title || typeof title !== "string") {
    return "Error: 'title' is required and must be a string";
  }
  if (!project || typeof project !== "string") {
    return "Error: 'project' is required and must be a string";
  }
  if (!["easy", "medium", "hard"].includes(difficulty)) {
    return "Error: 'difficulty' must be one of: easy, medium, hard";
  }

  // Create template with provided values
  const lesson = createLessonTemplate({
    title,
    project,
    difficulty,
    outcome,
    issueNumber: issue_number,
    learningOutcomes: learning_outcomes.length > 0
      ? learning_outcomes.map((lo) => ({
          title: lo.split(":")[0].trim(),
          description: lo.includes(":") ? lo.split(":")[1].trim() : "Describe the learning outcome",
        }))
      : undefined,
    csConcepts: concepts.length > 0
      ? concepts.map((c) => ({
          name: c,
          explanation: "Explain how this CS concept applied to the bug",
        }))
      : undefined,
  });

  // Generate markdown
  const markdown = lessonToMarkdown(lesson);

  return markdown;
}

/**
 * Validate a lesson entry against the template structure
 */
async function validateLessonTool(params: {
  file_path?: string;
  lesson_title?: string;
  lesson_json?: any;
  verbose?: boolean;
}): Promise<string> {
  const { file_path = "./LESSONS.md", lesson_title, lesson_json, verbose = false } = params;

  if (lesson_json) {
    // Validate provided JSON directly
    const result = validateLesson(lesson_json);
    return formatValidationResult(result, lesson_json.title || "Provided lesson", verbose);
  }

  if (!lesson_title) {
    return "Error: Either 'lesson_json' or 'lesson_title' is required";
  }

  // Try to read and parse the file
  try {
    if (!fs.existsSync(file_path)) {
      return `Error: File not found: ${file_path}`;
    }

    const content = fs.readFileSync(file_path, "utf-8");

    // Simple regex-based parsing to find the lesson section
    // Look for heading with the lesson title
    const lessonRegex = new RegExp(
      `^#+\\s+${escapeRegex(lesson_title)}\\s*$[\\s\\S]*?(?=^#[^#]|\\Z)`,
      "m"
    );
    const match = content.match(lessonRegex);

    if (!match) {
      return `Error: Lesson '${lesson_title}' not found in ${file_path}`;
    }

    // Parse the frontmatter and content
    // This is a simplified parser - a production version might use a YAML parser
    const lessonContent = match[0];
    const lines = lessonContent.split("\n");

    // Extract basic info from the lesson
    const lesson: any = {
      title: lesson_title,
      date: extractField(lessonContent, "Date"),
      difficulty: extractField(lessonContent, "Difficulty"),
      project: extractField(lessonContent, "Project"),
      outcome: extractField(lessonContent, "Outcome"),
    };

    // Check for required sections
    lesson.learningOutcomes = hasSection(lessonContent, "Learning Outcomes")
      ? [{ title: "Found", description: "Section exists" }]
      : [];
    lesson.csConcepts = hasSection(lessonContent, "CS Concepts")
      ? [{ name: "Found", explanation: "Section exists" }]
      : [];
    lesson.transferablePrinciples = hasSection(lessonContent, "Transferable Principles")
      ? [{ principle: "Found", application: "Section exists" }]
      : [];
    lesson.gotchas = hasSection(lessonContent, "Gotchas")
      ? [{ title: "Found", description: "Section exists", prevention: "Section exists" }]
      : [];

    const result = validateLesson(lesson);
    return formatValidationResult(result, lesson_title, verbose);
  } catch (error: any) {
    return `Error reading file: ${error.message}`;
  }
}

/**
 * Helper: escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Helper: extract field value from lesson content
 */
function extractField(content: string, fieldName: string): string {
  const regex = new RegExp(`^\\*\\*${fieldName}:\\*\\*\\s*(.+)$`, "m");
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * Helper: check if a section exists in the lesson
 */
function hasSection(content: string, sectionName: string): boolean {
  const regex = new RegExp(`^##\\s+${escapeRegex(sectionName)}`, "m");
  return regex.test(content);
}

/**
 * Helper: format validation result for display
 */
function formatValidationResult(
  result: { isValid: boolean; errors: string[]; warnings: string[] },
  lessonTitle: string,
  verbose: boolean
): string {
  let output = `\n# Lesson Validation: ${lessonTitle}\n`;
  output += `Status: ${result.isValid ? "✓ VALID" : "✗ INVALID"}\n\n`;

  if (result.errors.length > 0) {
    output += `## Errors (${result.errors.length})\n`;
    result.errors.forEach((err) => {
      output += `- ✗ ${err}\n`;
    });
    output += "\n";
  }

  if (result.warnings.length > 0) {
    output += `## Warnings (${result.warnings.length})\n`;
    result.warnings.forEach((warn) => {
      output += `- ⚠ ${warn}\n`;
    });
    output += "\n";
  }

  if (result.isValid) {
    output += "All template requirements met! This lesson is ready for quiz generation.\n";
  } else {
    output += "\nFix the errors above to make the lesson compliant with the template.\n";
  }

  if (verbose && result.errors.length === 0) {
    output += "\n## Template Requirements\n";
    output += "✓ Learning Outcomes: Clearly defined learning goals\n";
    output += "✓ CS Concepts: Tagged concepts with explanations\n";
    output += "✓ Transferable Principles: Principles beyond this specific bug\n";
    output += "✓ Gotchas & Edge Cases: Tricky parts with prevention strategies\n";
  }

  return output;
}

/**
 * Validate a quiz structure
 */
async function validateQuizTool(params: {
  quiz_json?: any;
  verbose?: boolean;
}): Promise<string> {
  const { quiz_json, verbose = false } = params;

  if (!quiz_json) {
    return "Error: 'quiz_json' parameter is required";
  }

  const result = validateQuiz(quiz_json);

  let output = "\n# Quiz Validation\n";
  output += `Status: ${result.isValid ? "✓ VALID" : "✗ INVALID"}\n\n`;

  if (result.errors.length > 0) {
    output += `## Errors (${result.errors.length})\n`;
    result.errors.forEach((err) => {
      output += `- ✗ ${err}\n`;
    });
    output += "\n";
  }

  if (result.warnings.length > 0) {
    output += `## Warnings (${result.warnings.length})\n`;
    result.warnings.forEach((warn) => {
      output += `- ⚠ ${warn}\n`;
    });
    output += "\n";
  }

  if (result.isValid) {
    const questionCount = quiz_json.quizQuestions?.length || 0;
    output += `✓ Quiz is valid with ${questionCount} question${questionCount !== 1 ? "s" : ""}\n`;
    output += "This quiz is ready for use in lessons.\n";
  } else {
    output += "\nFix the errors above to make the quiz valid.\n";
  }

  if (verbose && result.isValid) {
    output += "\n## Quiz Structure Requirements\n";
    output += "✓ 1-5 questions per quiz\n";
    output += "✓ Exactly 4 options per question\n";
    output += "✓ Exactly one correct answer per question\n";
    output += "✓ All text fields non-empty and within character limits\n";
  }

  return output;
}

/**
 * Check quiz answers and return detailed results
 */
async function validateQuizAnswersTool(params: {
  quiz_questions?: any[];
  user_answers?: any[];
  quiz_id?: string;
}): Promise<string> {
  const { quiz_questions, user_answers, quiz_id = "unknown" } = params;

  if (!quiz_questions || !Array.isArray(quiz_questions)) {
    return "Error: 'quiz_questions' must be a non-empty array";
  }

  if (!user_answers || !Array.isArray(user_answers)) {
    return "Error: 'user_answers' must be a non-empty array";
  }

  if (quiz_questions.length === 0) {
    return "Error: Quiz must have at least one question";
  }

  if (user_answers.length !== quiz_questions.length) {
    return `Error: Expected ${quiz_questions.length} answers, got ${user_answers.length}`;
  }

  try {
    const result = checkQuizAnswers(quiz_questions, user_answers, quiz_id);

    let output = "\n# Quiz Results\n";
    output += `Quiz ID: ${result.quizId}\n`;
    output += `Score: **${result.score}/${result.totalQuestions}** (${result.percentageCorrect}%)\n`;
    output += `Status: ${result.passed ? "✓ PASS" : "✗ FAIL"}\n\n`;

    output += "## Answer Breakdown\n\n";
    result.answers.forEach((answer, idx) => {
      const status = answer.isCorrect ? "✓" : "✗";
      output += `### Q${idx + 1}: ${status}\n`;
      output += `**Question:** ${answer.question}\n`;
      output += `**Your answer:** ${answer.selectedText}\n`;
      output += `**Correct answer:** ${answer.correctText}\n\n`;
    });

    output += "## Feedback\n";
    if (result.passed) {
      output += "Excellent! You've mastered this concept.\n";
    } else {
      const wrongCount = result.totalQuestions - result.score;
      output += `You got ${wrongCount} question${wrongCount !== 1 ? "s" : ""} wrong. Review the explanations above and try again.\n`;
    }

    output += `\nAttempt recorded at: ${result.attemptDate}\n`;

    return output;
  } catch (error: any) {
    return `Error checking quiz answers: ${error.message}`;
  }
}

/**
 * Record a quiz attempt for a developer
 */
async function recordQuizAttemptTool(params: {
  developer?: string;
  concept?: string;
  score?: number;
  total_questions?: number;
  percentage_correct?: number;
  passed?: boolean;
}): Promise<string> {
  const { developer, concept, score, total_questions, percentage_correct, passed } = params;

  // Validate required fields
  if (!developer) {
    return "Error: 'developer' is required";
  }
  if (!concept) {
    return "Error: 'concept' is required";
  }
  if (score === undefined || total_questions === undefined || percentage_correct === undefined || passed === undefined) {
    return "Error: 'score', 'total_questions', 'percentage_correct', and 'passed' are all required";
  }

  try {
    const profile = recordQuizAttempt(developer, {
      concept,
      score,
      totalQuestions: total_questions,
      percentageCorrect: percentage_correct,
      passed,
    });

    let output = "\n# Quiz Attempt Recorded\n";
    output += `Developer: ${developer}\n`;
    output += `Concept: ${concept}\n`;
    output += `Score: ${score}/${total_questions} (${percentage_correct}%)\n`;
    output += `Status: ${passed ? "✓ PASS" : "✗ FAIL"}\n\n`;

    // Get updated retention metrics
    const metrics = profile.conceptRetention?.[concept];
    if (metrics) {
      output += "## Updated Metrics\n";
      output += `Total Attempts: ${metrics.quizAttempts}\n`;
      output += `Passed: ${metrics.quizzesPassed}\n`;
      output += `Pass Rate: ${metrics.passRate}%\n`;
      output += `Last Attempt: ${metrics.lastAttemptDate}\n`;
    }

    output += `\nTotal Quizzes Passed: ${profile.totalQuizzesPassed}\n`;

    return output;
  } catch (error: any) {
    return `Error recording quiz attempt: ${error.message}`;
  }
}

/**
 * Get concept retention analytics for a developer
 */
async function getConceptRetentionTool(params: {
  developer?: string;
  format?: "text" | "json" | "markdown";
  include_history?: boolean;
}): Promise<string> {
  const { developer, format = "text", include_history = false } = params;

  if (!developer) {
    return "Error: 'developer' is required";
  }

  try {
    const analytics = getConceptRetentionAnalytics(developer);

    if (format === "json") {
      return JSON.stringify(analytics, null, 2);
    }

    let output = "\n# Concept Retention Analytics\n";
    output += `Developer: ${developer}\n\n`;

    if (analytics.totalConcepts === 0) {
      output += "No quiz attempts recorded yet. Complete some quizzes to see retention metrics.\n";
      return output;
    }

    output += "## Overview\n";
    output += `- Concepts Tested: **${analytics.totalConcepts}**\n`;
    output += `- Average Pass Rate: **${analytics.averagePassRate}%**\n\n`;

    if (analytics.strongConcepts.length > 0) {
      output += "## 💪 Strong Concepts (≥80%)\n\n";
      analytics.strongConcepts.forEach(([concept, rate]) => {
        output += `- **${concept}**: ${rate}% pass rate ✓\n`;
      });
      output += "\n";
    }

    if (analytics.weakConcepts.length > 0) {
      output += "## 📚 Areas for Review (<60%)\n\n";
      analytics.weakConcepts.forEach(([concept, rate]) => {
        output += `- **${concept}**: ${rate}% pass rate - Needs review\n`;
      });
      output += "\n";
    }

    if (include_history) {
      output += "## Detailed History\n\n";
      analytics.allMetrics.forEach((metric) => {
        output += `### ${metric.concept}\n`;
        output += `- Attempts: ${metric.quizAttempts}\n`;
        output += `- Passed: ${metric.quizzesPassed}\n`;
        output += `- Pass Rate: ${metric.passRate}%\n`;
        output += `- Last Attempt: ${metric.lastAttemptDate || "Never"}\n\n`;

        if (metric.attemptHistory.length > 0) {
          output += `  **Recent Attempts:**\n`;
          metric.attemptHistory.slice(-3).forEach((attempt) => {
            output += `  - ${new Date(attempt.date).toLocaleDateString()}: ${attempt.score}/${attempt.totalQuestions} (${attempt.percentageCorrect}%) ${attempt.passed ? "✓" : "✗"}\n`;
          });
          output += "\n";
        }
      });
    }

    if (format === "markdown") {
      output = output.replace(/\*\*/g, "**"); // Ensure markdown formatting
    }

    return output;
  } catch (error: any) {
    return `Error getting concept retention: ${error.message}`;
  }
}

/**
 * Main server setup
 */
const server = new Server(
  {
    name: "bug-hunter-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Get player profile with achievements and progress
 */
async function getPlayerProfile(params: {
  developer?: string;
  format?: "text" | "json" | "markdown";
  list_all?: boolean;
  include_nearly_unlocked?: boolean;
}): Promise<string> {
  const { developer, format = "text", list_all = false, include_nearly_unlocked = true } = params;

  if (list_all) {
    const developers = listProfiles();
    if (developers.length === 0) {
      return "No developer profiles found. Use record_bug_solved or record_quiz_passed to create profiles.";
    }

    const summaries = developers.map(dev => getPublicProfileSummary(dev));
    const output = summaries
      .map(
        s => `👤 ${s.developer}\n` +
          `   Bugs: ${s.stats.totalBugsSolved} | Quizzes: ${s.stats.totalQuizzesPassed} | ` +
          `Concepts: ${s.stats.conceptsMastered} | Streak: ${s.stats.longestStreak}\n` +
          `   Achievements: ${s.achievements.unlocked}/${s.achievements.total} (${s.achievements.percentage.toFixed(0)}%)`
      )
      .join("\n");

    return `📊 All Developer Profiles\n\n${output}`;
  }

  if (!developer) {
    return "Error: 'developer' parameter required. Use list_all: true to see all profiles.";
  }

  const profile = loadProfile(developer);
  const stats = getAchievementStats(profile);
  const unlockedAchievements = getUnlockedAchievements(profile);
  const nearlyUnlocked = include_nearly_unlocked ? getNearlyUnlockedAchievements(profile) : [];

  if (format === "json") {
    return exportProfileJSON(developer);
  }

  if (format === "markdown") {
    return exportProfileMarkdown(developer);
  }

  // Text format (default)
  let output = `🏆 ${developer}'s Bug Hunter Profile\n\n`;

  output += `📈 Stats\n`;
  output += `   Bugs Solved: ${profile.totalBugsSolved}\n`;
  output += `   Quizzes Passed: ${profile.totalQuizzesPassed}\n`;
  output += `   Concepts Mastered: ${profile.conceptsMastered.length}\n`;
  output += `   Current Streak: ${profile.currentStreak} days\n`;
  output += `   Longest Streak: ${profile.longestStreak} days\n\n`;

  output += `🎖️ Achievements\n`;
  output += `   Unlocked: ${stats.totalUnlocked}/${stats.totalAvailable} (${stats.percentComplete.toFixed(1)}%)\n\n`;

  if (unlockedAchievements.length > 0) {
    output += `✅ Unlocked (${unlockedAchievements.length}):\n`;
    unlockedAchievements.forEach(a => {
      output += `   ${a.icon} ${a.name} (${a.rarity})\n`;
    });
    output += "\n";
  }

  if (nearlyUnlocked.length > 0) {
    output += `⏳ Nearly Unlocked:\n`;
    nearlyUnlocked.forEach(({ achievement, progress }) => {
      const pct = progress.percentage.toFixed(0);
      output += `   ${achievement.icon} ${achievement.name} - ${progress.current}/${progress.target} (${pct}%)\n`;
    });
    output += "\n";
  }

  if (Object.keys(profile.specializations).length > 0) {
    const topSpecializations = Object.entries(profile.specializations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    output += `⭐ Top Specializations:\n`;
    topSpecializations.forEach(([concept, level]) => {
      output += `   ${concept}: Level ${level.toFixed(1)}\n`;
    });
  }

  return output;
}

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case "hunt_issues":
        result = await huntIssues(args as any);
        break;
      case "analyze_repo":
        result = await analyzeRepo(args as any);
        break;
      case "scaffold_solution":
        result = await scaffoldSolution(args as any);
        break;
      case "scaffold_reproduce_environment":
        result = await scaffoldReproduceEnvironment(args as any);
        break;
      case "claim_issue":
        result = await claimIssue(args as any);
        break;
      case "generate_chant_spec":
        result = await generateChantSpec(args as any);
        break;
      // Chant Tools (https://github.com/lex00/chant)
      case "chant_init":
        result = await chantInit(args as any);
        break;
      case "chant_list":
        result = await chantList(args as any);
        break;
      case "chant_show":
        result = await chantShow(args as any);
        break;
      case "research_workflow":
        result = await researchWorkflow(args as any);
        break;
      case "filter_lessons":
        result = await filterLessons(args as any);
        break;
      case "get_strategy":
        result = await getStrategyForCategory(args as any);
        break;
      case "show_graph":
        result = await showGraph(args as any);
        break;
      case "next_bug":
        result = await nextBug(args as any);
        break;
      case "new_lesson":
        result = await newLesson(args as any);
        break;
      case "validate_lesson":
        result = await validateLessonTool(args as any);
        break;
      case "validate_quiz":
        result = await validateQuizTool(args as any);
        break;
      case "validate_quiz_answers":
        result = await validateQuizAnswersTool(args as any);
        break;
      case "record_quiz_attempt":
        result = await recordQuizAttemptTool(args as any);
        break;
      case "get_concept_retention":
        result = await getConceptRetentionTool(args as any);
        break;
      case "get_player_profile":
        result = await getPlayerProfile(args as any);
        break;
      default:
        result = `Unknown tool: ${name}`;
    }

    return {
      content: [{ type: "text", text: result }],
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bug Hunter MCP server running on stdio");
}

main().catch(console.error);
