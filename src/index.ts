#!/usr/bin/env node

/**
 * Bug Hunter MCP Server
 *
 * An MCP server that helps you find and solve open source issues.
 *
 * Tools:
 * - hunt_issues: Find good first issues matching your skills
 * - analyze_repo: Clone and analyze a repository structure
 * - scaffold_solution: Generate starter implementation for an issue
 * - claim_issue: Comment on an issue to claim it
 * - generate_chant_spec: Generate a Chant driver spec from an issue
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

const execAsync = promisify(exec);

// Initialize GitHub client (uses GITHUB_TOKEN env var if available)
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Base directory for cloned repos
const REPOS_DIR = path.join(process.env.HOME || "~", "Developer", "bug-hunter-repos");

// Ensure repos directory exists
if (!fs.existsSync(REPOS_DIR)) {
  fs.mkdirSync(REPOS_DIR, { recursive: true });
}

/**
 * Tool definitions
 */
const tools: Tool[] = [
  {
    name: "hunt_issues",
    description: `Search GitHub for good first issues matching specified criteria.

Searches across popular repositories for issues labeled "good first issue",
"help wanted", "beginner friendly", etc. Can filter by language and keywords.

Returns a list of issues with repo, title, URL, labels, and comment count.`,
    inputSchema: {
      type: "object",
      properties: {
        language: {
          type: "string",
          description: "Programming language to filter by (e.g., 'zig', 'go', 'typescript', 'rust')",
        },
        keywords: {
          type: "string",
          description: "Keywords to search for in issue titles/body (e.g., 'cli', 'api', 'ui')",
        },
        labels: {
          type: "string",
          description: "Comma-separated labels to filter by (default: 'good first issue')",
        },
        limit: {
          type: "number",
          description: "Maximum number of issues to return (default: 10, max: 30)",
        },
        min_stars: {
          type: "number",
          description: "Minimum repository stars (default: 100)",
        },
      },
      required: [],
    },
  },
  {
    name: "analyze_repo",
    description: `Clone a repository and analyze its structure for contribution.

Clones the repo (or uses existing clone), then analyzes:
- Project structure and key directories
- Build system and dependencies
- Contributing guidelines
- Open issues summary
- Code patterns and conventions

Returns a comprehensive analysis to help you understand the codebase.`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format (e.g., 'zigtools/zls')",
        },
        issue_number: {
          type: "number",
          description: "Optional: specific issue number to focus analysis on",
        },
      },
      required: ["repo"],
    },
  },
  {
    name: "scaffold_solution",
    description: `Generate a starter implementation scaffold for a GitHub issue.

Analyzes the issue description and codebase to generate:
- Skeleton code files in the appropriate location
- Implementation notes and TODOs
- Test file templates
- Integration instructions

The scaffold gives you a head start on solving the issue.`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format",
        },
        issue_number: {
          type: "number",
          description: "Issue number to scaffold a solution for",
        },
        output_dir: {
          type: "string",
          description: "Optional: custom output directory for scaffold files",
        },
      },
      required: ["repo", "issue_number"],
    },
  },
  {
    name: "claim_issue",
    description: `Comment on a GitHub issue to claim it for work.

Posts a comment indicating you're working on the issue.
Requires GITHUB_TOKEN environment variable to be set.`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format",
        },
        issue_number: {
          type: "number",
          description: "Issue number to claim",
        },
        message: {
          type: "string",
          description: "Optional: custom claim message",
        },
      },
      required: ["repo", "issue_number"],
    },
  },
  {
    name: "generate_chant_spec",
    description: `Generate a Chant driver spec from a GitHub issue.

Creates a markdown spec file that can be executed by Chant's AI agents.
The spec includes:
- Issue context and background
- Acceptance criteria derived from the issue
- Target files if identifiable
- Labels for organization

Use with 'chant split' to break into focused sub-specs, then 'chant work' to execute.`,
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "Repository in 'owner/repo' format",
        },
        issue_number: {
          type: "number",
          description: "Issue number to create a spec for",
        },
        spec_id: {
          type: "string",
          description: "Optional: custom spec ID (default: auto-generated from issue)",
        },
        output_dir: {
          type: "string",
          description: "Optional: output directory for the spec (default: .chant/specs in repo)",
        },
      },
      required: ["repo", "issue_number"],
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
      result += `Comments: ${issue.comments} | Updated: ${issue.updated.split("T")[0]}\n\n`;
    }

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
 * Claim an issue by commenting
 */
async function claimIssue(params: {
  repo: string;
  issue_number: number;
  message?: string;
}): Promise<string> {
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
      case "claim_issue":
        result = await claimIssue(args as any);
        break;
      case "generate_chant_spec":
        result = await generateChantSpec(args as any);
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
