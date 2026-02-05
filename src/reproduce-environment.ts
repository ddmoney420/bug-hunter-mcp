/**
 * Bug Reproduction Environment Templates
 *
 * Provides utilities to auto-detect repository tech stacks and generate
 * minimal reproducible environments using Docker, docker-compose, or shell scripts.
 */

import * as fs from "fs";
import * as path from "path";

export type Language =
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "rust"
  | "java"
  | "csharp"
  | "ruby"
  | "php"
  | "unknown";

export type Framework =
  | "node"
  | "deno"
  | "bun"
  | "fastapi"
  | "django"
  | "flask"
  | "spring"
  | "rails"
  | "laravel"
  | "dotnet"
  | "cargo"
  | "unknown";

export interface TechStack {
  language: Language;
  framework: Framework;
  packageManager?: string;
  buildSystem?: string;
  nodeVersion?: string;
  pythonVersion?: string;
  goVersion?: string;
  rustEdition?: string;
  hasTests: boolean;
  testFramework?: string;
  hasDocker: boolean;
  detectedFiles: string[];
}

/**
 * Detect the technology stack of a repository
 */
export function detectTechStack(repoDir: string): TechStack {
  const detectedFiles: string[] = [];
  let language: Language = "unknown";
  let framework: Framework = "unknown";
  let packageManager: string | undefined;
  let buildSystem: string | undefined;
  let nodeVersion: string | undefined;
  let pythonVersion: string | undefined;
  let goVersion: string | undefined;
  let rustEdition: string | undefined;
  let hasTests = false;
  let testFramework: string | undefined;
  let hasDocker = false;

  // Check for Node.js/JavaScript/TypeScript
  if (fs.existsSync(path.join(repoDir, "package.json"))) {
    detectedFiles.push("package.json");
    language = "typescript"; // Default to TypeScript for modern Node projects
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(repoDir, "package.json"), "utf-8")
    );

    // Detect framework
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    if (deps.express || deps.fastify || deps.koa) {
      framework = "node";
    } else if (deps.deno) {
      framework = "deno";
      language = "typescript";
    } else if (deps.bun) {
      framework = "bun";
    }

    packageManager = "npm";
    if (fs.existsSync(path.join(repoDir, "yarn.lock"))) {
      packageManager = "yarn";
    } else if (fs.existsSync(path.join(repoDir, "pnpm-lock.yaml"))) {
      packageManager = "pnpm";
    }

    // Detect if it has .ts files
    if (!fs.existsSync(path.join(repoDir, "tsconfig.json"))) {
      language = "javascript";
    }

    // Check for test frameworks
    if (deps.jest || deps.vitest || deps.mocha) {
      hasTests = true;
      if (deps.jest) testFramework = "jest";
      else if (deps.vitest) testFramework = "vitest";
      else if (deps.mocha) testFramework = "mocha";
    }

    nodeVersion = packageJson.engines?.node || "18";
  }

  // Check for Python
  if (
    fs.existsSync(path.join(repoDir, "requirements.txt")) ||
    fs.existsSync(path.join(repoDir, "pyproject.toml")) ||
    fs.existsSync(path.join(repoDir, "setup.py")) ||
    fs.existsSync(path.join(repoDir, "Pipfile"))
  ) {
    language = "python";

    if (fs.existsSync(path.join(repoDir, "requirements.txt"))) {
      detectedFiles.push("requirements.txt");
    }
    if (fs.existsSync(path.join(repoDir, "pyproject.toml"))) {
      detectedFiles.push("pyproject.toml");
    }
    if (fs.existsSync(path.join(repoDir, "setup.py"))) {
      detectedFiles.push("setup.py");
    }
    if (fs.existsSync(path.join(repoDir, "Pipfile"))) {
      detectedFiles.push("Pipfile");
      packageManager = "pipenv";
    }

    // Detect framework
    const requirementsPath = path.join(repoDir, "requirements.txt");
    if (fs.existsSync(requirementsPath)) {
      const content = fs.readFileSync(requirementsPath, "utf-8");
      if (content.includes("fastapi")) framework = "fastapi";
      else if (content.includes("django")) framework = "django";
      else if (content.includes("flask")) framework = "flask";
    }

    pythonVersion = "3.11";
  }

  // Check for Rust
  if (fs.existsSync(path.join(repoDir, "Cargo.toml"))) {
    detectedFiles.push("Cargo.toml");
    language = "rust";
    framework = "cargo";
    buildSystem = "cargo";
    rustEdition = "2021";

    const cargoToml = fs.readFileSync(path.join(repoDir, "Cargo.toml"), "utf-8");
    if (cargoToml.includes('edition = "2024"')) rustEdition = "2024";
    else if (cargoToml.includes('edition = "2015"')) rustEdition = "2015";

    hasTests = cargoToml.includes("#[test]") || cargoToml.includes("#[cfg(test)]");
    if (cargoToml.includes("cargo-test") || cargoToml.includes("[dev-dependencies]")) {
      testFramework = "cargo test";
    }
  }

  // Check for Go
  if (fs.existsSync(path.join(repoDir, "go.mod"))) {
    detectedFiles.push("go.mod");
    language = "go";
    framework = "unknown";
    buildSystem = "go build";
    goVersion = "1.22";
    hasTests = fs.existsSync(path.join(repoDir, "*_test.go"));
    if (hasTests) testFramework = "go test";
  }

  // Check for Java
  if (
    fs.existsSync(path.join(repoDir, "pom.xml")) ||
    fs.existsSync(path.join(repoDir, "build.gradle"))
  ) {
    language = "java";
    if (fs.existsSync(path.join(repoDir, "pom.xml"))) {
      detectedFiles.push("pom.xml");
      buildSystem = "maven";
    }
    if (fs.existsSync(path.join(repoDir, "build.gradle"))) {
      detectedFiles.push("build.gradle");
      buildSystem = "gradle";
    }
    if (fs.existsSync(path.join(repoDir, "src/main/java"))) {
      framework = "spring";
    }
    hasTests = fs.existsSync(path.join(repoDir, "src/test"));
    testFramework = "junit";
  }

  // Check for .NET
  if (fs.existsSync(path.join(repoDir, "*.csproj"))) {
    language = "csharp";
    framework = "dotnet";
    buildSystem = "dotnet build";
    testFramework = "xunit";
  }

  // Check for Dockerfile
  if (fs.existsSync(path.join(repoDir, "Dockerfile"))) {
    detectedFiles.push("Dockerfile");
    hasDocker = true;
  }

  // Check for docker-compose
  if (
    fs.existsSync(path.join(repoDir, "docker-compose.yml")) ||
    fs.existsSync(path.join(repoDir, "docker-compose.yaml"))
  ) {
    detectedFiles.push("docker-compose.yml");
    hasDocker = true;
  }

  return {
    language,
    framework,
    packageManager,
    buildSystem,
    nodeVersion,
    pythonVersion,
    goVersion,
    rustEdition,
    hasTests,
    testFramework,
    hasDocker,
    detectedFiles,
  };
}

/**
 * Generate a Dockerfile for the detected tech stack
 */
export function generateDockerfile(stack: TechStack): string {
  if (stack.language === "javascript" || stack.language === "typescript") {
    const nodeVer = stack.nodeVersion || "18";
    return `FROM node:${nodeVer}-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ${stack.packageManager === "yarn" ? "yarn.lock" : "package-lock.json"} ./

# Install dependencies
RUN ${stack.packageManager || "npm"} ci

# Copy source
COPY . .

# Build if needed
RUN ${stack.packageManager || "npm"} run build --if-present

# Run tests or app
CMD ["${stack.packageManager || "npm"}", "test"]
`;
  }

  if (stack.language === "python") {
    const pythonVer = stack.pythonVersion || "3.11";
    return `FROM python:${pythonVer}-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Run tests
CMD ["python", "-m", "pytest"]
`;
  }

  if (stack.language === "go") {
    const goVer = stack.goVersion || "1.22";
    return `FROM golang:${goVer}-alpine

WORKDIR /app

# Install build tools
RUN apk add --no-cache gcc musl-dev

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source
COPY . .

# Run tests
CMD ["go", "test", "./..."]
`;
  }

  if (stack.language === "rust") {
    const edition = stack.rustEdition || "2021";
    return `FROM rust:${edition}-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    && rm -rf /var/lib/apt/lists/*

# Copy cargo files
COPY Cargo.toml Cargo.lock ./

# Copy source
COPY src ./src

# Run tests
CMD ["cargo", "test"]
`;
  }

  if (stack.language === "java") {
    return `FROM openjdk:21-jdk-slim

WORKDIR /app

COPY . .

${stack.buildSystem === "maven" ? "RUN apt-get update && apt-get install -y maven && mvn clean test" : "RUN apt-get update && apt-get install -y gradle && gradle test"}
`;
  }

  // Default fallback
  return `FROM ubuntu:22.04

WORKDIR /app

COPY . .

CMD ["bash"]
`;
}

/**
 * Generate docker-compose.yml for multi-service setups
 */
export function generateDockerCompose(
  stack: TechStack,
  serviceName: string = "app"
): string {
  const services: Record<string, any> = {
    [serviceName]: {
      build: ".",
      volumes: [".:/app"],
      environment: [],
    },
  };

  // Add database services if detected
  if (stack.framework === "django" || stack.framework === "spring") {
    services.postgres = {
      image: "postgres:15-alpine",
      environment: [
        "POSTGRES_USER=dev",
        "POSTGRES_PASSWORD=dev",
        "POSTGRES_DB=app_db",
      ],
      volumes: ["postgres_data:/var/lib/postgresql/data"],
      ports: ["5432:5432"],
    };
    services[serviceName].depends_on = ["postgres"];
    services[serviceName].environment.push("DATABASE_URL=postgres://dev:dev@postgres:5432/app_db");
  }

  // Add Redis for caching
  if (
    stack.framework === "fastapi" ||
    stack.framework === "flask" ||
    stack.framework === "django"
  ) {
    services.redis = {
      image: "redis:7-alpine",
      ports: ["6379:6379"],
    };
  }

  const volumes = stack.framework === "django" || stack.framework === "spring" ? { postgres_data: {} } : undefined;

  const compose: any = {
    version: "3.8",
    services,
  };

  if (volumes) {
    compose.volumes = volumes;
  }

  return JSON.stringify(compose, null, 2).replace(/"/g, '"').split('\n').map((line: string) => line).join('\n').replace(/^{/, 'version: "3.8"\n\nservices:').replace(/}$/, '');

  // Better YAML generation
  return `version: "3.8"

services:
  ${serviceName}:
    build: .
    volumes:
      - .:/app
    environment: ${services[serviceName].environment.length > 0 ? "" : "[]"}
${services[serviceName].environment.map((e: string) => `      - ${e}`).join("\n")}
${services[serviceName].depends_on ? `    depends_on:\n${Object.keys(services[serviceName].depends_on || {}).map((s: string) => `      - ${s}`).join("\n")}` : ""}
${
  services.postgres
    ? `
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=dev
      - POSTGRES_PASSWORD=dev
      - POSTGRES_DB=app_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
`
    : ""
}
${
  services.redis
    ? `
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
`
    : ""
}
${services.postgres ? "volumes:\n  postgres_data:" : ""}
`;
}

/**
 * Generate shell setup script for Unix-like systems
 */
export function generateSetupScript(stack: TechStack): string {
  let script = `#!/bin/bash

# Bug Reproduction Environment Setup Script
# Auto-generated for ${stack.language} (${stack.framework})
# This script sets up all necessary dependencies for local development

set -e  # Exit on error

echo "Setting up ${stack.language} development environment..."

`;

  if (stack.language === "javascript" || stack.language === "typescript") {
    script += `# Node.js/npm setup
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -sL https://deb.nodesource.com/setup_${stack.nodeVersion?.split(".")[0] || "18"}.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Installing dependencies..."
${stack.packageManager || "npm"} ci

if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo "Running tests..."
    ${stack.packageManager || "npm"} test
fi
`;
  }

  if (stack.language === "python") {
    script += `# Python setup
if ! command -v python3 &> /dev/null; then
    echo "Installing Python..."
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv
fi

echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo "Installing dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
elif [ -f "pyproject.toml" ]; then
    pip install -e .
fi

if [ -f "pytest.ini" ] || [ -f "setup.cfg" ] || [ -f "pyproject.toml" ]; then
    echo "Running tests..."
    python -m pytest
fi
`;
  }

  if (stack.language === "go") {
    script += `# Go setup
if ! command -v go &> /dev/null; then
    echo "Installing Go..."
    curl -L https://golang.org/dl/go${stack.goVersion || "1.22"}.linux-amd64.tar.gz | sudo tar -C /usr/local -xz
    export PATH=$PATH:/usr/local/go/bin
fi

echo "Installing dependencies..."
go mod download

echo "Running tests..."
go test ./...
`;
  }

  if (stack.language === "rust") {
    script += `# Rust setup
if ! command -v cargo &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

echo "Building project..."
cargo build

echo "Running tests..."
cargo test
`;
  }

  if (stack.language === "java") {
    script += `# Java setup
if ! command -v java &> /dev/null; then
    echo "Installing Java..."
    sudo apt-get update
    sudo apt-get install -y openjdk-21-jdk
fi

${
  stack.buildSystem === "maven"
    ? `echo "Installing Maven..."
if ! command -v mvn &> /dev/null; then
    sudo apt-get install -y maven
fi

echo "Running tests..."
mvn clean test
`
    : `echo "Setting up Gradle..."
chmod +x gradlew

echo "Running tests..."
./gradlew test
`
}
`;
  }

  script += `
echo "✓ Environment setup complete!"
echo "Run your project's tests or start command to verify the setup."
`;

  return script;
}

/**
 * Generate Windows batch setup script
 */
export function generateBatchScript(stack: TechStack): string {
  let script = `@echo off
REM Bug Reproduction Environment Setup Script
REM Auto-generated for ${stack.language} (${stack.framework})

echo Setting up ${stack.language} development environment...

`;

  if (stack.language === "javascript" || stack.language === "typescript") {
    script += `REM Node.js/npm setup
if not exist "node_modules" (
    echo Installing dependencies...
    call ${stack.packageManager || "npm"} ci
)

if exist "package.json" (
    echo Running tests...
    call ${stack.packageManager || "npm"} test
)
`;
  }

  if (stack.language === "python") {
    script += `REM Python setup
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\\Scripts\\activate.bat

if exist "requirements.txt" (
    echo Installing dependencies...
    pip install -r requirements.txt
)

if exist "pytest.ini" (
    echo Running tests...
    python -m pytest
)
`;
  }

  if (stack.language === "rust") {
    script += `REM Rust setup
echo Building project...
cargo build

echo Running tests...
cargo test
`;
  }

  script += `
echo Environment setup complete!
pause
`;

  return script;
}

/**
 * Generate a comprehensive environment setup summary
 */
export function generateEnvironmentSummary(
  stack: TechStack,
  repoDir: string
): string {
  let summary = `# Bug Reproduction Environment Setup Guide\n\n`;
  summary += `## Detected Tech Stack\n\n`;
  summary += `- **Language**: ${stack.language}\n`;
  summary += `- **Framework**: ${stack.framework}\n`;

  if (stack.packageManager) {
    summary += `- **Package Manager**: ${stack.packageManager}\n`;
  }
  if (stack.buildSystem) {
    summary += `- **Build System**: ${stack.buildSystem}\n`;
  }
  if (stack.nodeVersion) {
    summary += `- **Node Version**: ${stack.nodeVersion}\n`;
  }
  if (stack.pythonVersion) {
    summary += `- **Python Version**: ${stack.pythonVersion}\n`;
  }
  if (stack.goVersion) {
    summary += `- **Go Version**: ${stack.goVersion}\n`;
  }
  if (stack.testFramework) {
    summary += `- **Test Framework**: ${stack.testFramework}\n`;
  }

  summary += `\n## Detected Files\n\n`;
  if (stack.detectedFiles.length > 0) {
    summary += stack.detectedFiles.map((f) => `- ${f}`).join("\n");
  } else {
    summary += "No recognized configuration files found.";
  }

  summary += `\n\n## Generated Templates\n\n`;
  summary += `The following setup templates have been generated:\n\n`;
  summary += `1. **Dockerfile** - Containerized environment\n`;
  summary += `2. **docker-compose.yml** - Multi-service setup (if applicable)\n`;
  summary += `3. **setup.sh** - Unix/Linux/macOS setup script\n`;
  summary += `4. **setup.bat** - Windows setup script\n`;

  summary += `\n## Quick Start\n\n`;
  summary += `### Option 1: Using Docker\n`;
  summary += `\`\`\`bash\n`;
  summary += `docker build -t bug-repro .\n`;
  summary += `docker run -it bug-repro\n`;
  summary += `\`\`\`\n\n`;

  if (stack.hasDocker) {
    summary += `### Option 2: Using docker-compose\n`;
    summary += `\`\`\`bash\n`;
    summary += `docker-compose up\n`;
    summary += `\`\`\`\n\n`;
  }

  summary += `### Option 3: Manual Setup\n`;
  summary += `\`\`\`bash\n`;
  summary += `chmod +x setup.sh\n`;
  summary += `./setup.sh\n`;
  summary += `\`\`\`\n\n`;

  summary += `## Environment Variables\n\n`;
  summary += `Consider setting the following if needed:\n\n`;
  if (stack.language === "python") {
    summary += `- \`PYTHONUNBUFFERED=1\` - Disable Python output buffering\n`;
    summary += `- \`PYTHONDONTWRITEBYTECODE=1\` - Don't create .pyc files\n`;
  }
  if (stack.language === "go") {
    summary += `- \`GO111MODULE=on\` - Enable Go modules\n`;
  }
  if (stack.language === "rust") {
    summary += `- \`RUST_LOG=debug\` - Set logging level\n`;
  }

  summary += `\n## Troubleshooting\n\n`;
  summary += `If you encounter issues:\n\n`;
  summary += `1. Ensure ${stack.language} is installed\n`;
  summary += `2. Check that all dependencies are installed\n`;
  summary += `3. Verify network access for downloading dependencies\n`;
  summary += `4. Check file permissions for executable scripts\n`;

  return summary;
}
