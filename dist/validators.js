/**
 * Input Validation Module for Bug Hunter MCP
 *
 * Provides reusable validation functions for all MCP tools.
 * Returns helpful error messages when validation fails.
 */
/**
 * Validate that a string is not empty or whitespace-only
 */
export function validateNonEmptyString(value, fieldName, isRequired = true) {
    if (!value) {
        if (isRequired) {
            return {
                isValid: false,
                error: `${fieldName} cannot be empty`,
            };
        }
        return { isValid: true };
    }
    if (typeof value !== "string") {
        return {
            isValid: false,
            error: `${fieldName} must be a string, got ${typeof value}`,
        };
    }
    if (value.trim().length === 0) {
        return {
            isValid: false,
            error: `${fieldName} cannot contain only whitespace`,
        };
    }
    return { isValid: true };
}
/**
 * Validate repository format (owner/repo)
 */
export function validateRepoFormat(repo) {
    const nonEmptyCheck = validateNonEmptyString(repo, "Repo", true);
    if (!nonEmptyCheck.isValid) {
        return nonEmptyCheck;
    }
    if (!repo || !repo.includes("/")) {
        return {
            isValid: false,
            error: `Repo must be in format 'owner/repo' (e.g., 'zigtools/zls'), got '${repo}'`,
        };
    }
    const parts = repo.split("/");
    if (parts.length !== 2) {
        return {
            isValid: false,
            error: `Repo must be in format 'owner/repo' with exactly one '/', got '${repo}'`,
        };
    }
    const [owner, repoName] = parts;
    if (!owner || owner.trim().length === 0) {
        return {
            isValid: false,
            error: `Repo owner cannot be empty in '${repo}'`,
        };
    }
    if (!repoName || repoName.trim().length === 0) {
        return {
            isValid: false,
            error: `Repo name cannot be empty in '${repo}'`,
        };
    }
    // Check for special characters that might break shell commands
    if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repoName)) {
        return {
            isValid: false,
            error: `Repo owner and name must contain only alphanumeric characters, dots, dashes, and underscores. Got '${repo}'`,
        };
    }
    return { isValid: true };
}
/**
 * Validate that a number is positive (> 0)
 */
export function validatePositiveNumber(value, fieldName, isRequired = true) {
    if (value === undefined || value === null) {
        if (isRequired) {
            return {
                isValid: false,
                error: `${fieldName} is required`,
            };
        }
        return { isValid: true };
    }
    if (typeof value !== "number") {
        return {
            isValid: false,
            error: `${fieldName} must be a number, got ${typeof value}`,
        };
    }
    if (!Number.isInteger(value)) {
        return {
            isValid: false,
            error: `${fieldName} must be an integer, got ${value}`,
        };
    }
    if (value <= 0) {
        return {
            isValid: false,
            error: `${fieldName} must be positive (> 0), got ${value}`,
        };
    }
    return { isValid: true };
}
/**
 * Validate that a number is non-negative (>= 0)
 */
export function validateNonNegativeNumber(value, fieldName, isRequired = false) {
    if (value === undefined || value === null) {
        if (isRequired) {
            return {
                isValid: false,
                error: `${fieldName} is required`,
            };
        }
        return { isValid: true };
    }
    if (typeof value !== "number") {
        return {
            isValid: false,
            error: `${fieldName} must be a number, got ${typeof value}`,
        };
    }
    if (!Number.isInteger(value)) {
        return {
            isValid: false,
            error: `${fieldName} must be an integer, got ${value}`,
        };
    }
    if (value < 0) {
        return {
            isValid: false,
            error: `${fieldName} must be non-negative (>= 0), got ${value}`,
        };
    }
    return { isValid: true };
}
/**
 * Validate that a number is within a range (inclusive)
 */
export function validateNumberRange(value, fieldName, min, max, isRequired = false) {
    if (value === undefined || value === null) {
        if (isRequired) {
            return {
                isValid: false,
                error: `${fieldName} is required`,
            };
        }
        return { isValid: true };
    }
    if (typeof value !== "number") {
        return {
            isValid: false,
            error: `${fieldName} must be a number, got ${typeof value}`,
        };
    }
    if (!Number.isInteger(value)) {
        return {
            isValid: false,
            error: `${fieldName} must be an integer, got ${value}`,
        };
    }
    if (value < min || value > max) {
        return {
            isValid: false,
            error: `${fieldName} must be between ${min} and ${max}, got ${value}`,
        };
    }
    return { isValid: true };
}
/**
 * Validate that a value is one of allowed enum values
 */
export function validateEnum(value, fieldName, allowedValues, isRequired = false) {
    if (!value) {
        if (isRequired) {
            return {
                isValid: false,
                error: `${fieldName} is required. Allowed values: ${allowedValues.join(", ")}`,
            };
        }
        return { isValid: true };
    }
    if (typeof value !== "string") {
        return {
            isValid: false,
            error: `${fieldName} must be a string, got ${typeof value}`,
        };
    }
    if (!allowedValues.includes(value)) {
        return {
            isValid: false,
            error: `${fieldName} must be one of: ${allowedValues.join(", ")}. Got '${value}'`,
        };
    }
    return { isValid: true };
}
/**
 * Validate spec ID format (basic check)
 */
export function validateSpecId(specId) {
    const nonEmptyCheck = validateNonEmptyString(specId, "Spec ID", true);
    if (!nonEmptyCheck.isValid) {
        return nonEmptyCheck;
    }
    if (!specId) {
        return {
            isValid: false,
            error: "Spec ID cannot be empty",
        };
    }
    // Spec IDs typically contain alphanumeric characters, dashes, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(specId)) {
        return {
            isValid: false,
            error: `Spec ID must contain only alphanumeric characters, dashes, and underscores. Got '${specId}'`,
        };
    }
    return { isValid: true };
}
/**
 * Validate programming language
 */
export function validateLanguage(language, isRequired = false) {
    if (!language) {
        if (isRequired) {
            return {
                isValid: false,
                error: "Language is required",
            };
        }
        return { isValid: true };
    }
    const nonEmptyCheck = validateNonEmptyString(language, "Language", false);
    if (!nonEmptyCheck.isValid) {
        return nonEmptyCheck;
    }
    // Allow common languages, but don't restrict strictly
    // since users might use languages we don't have in our list
    if (!/^[a-z0-9\s\+#\-\.]+$/i.test(language)) {
        return {
            isValid: false,
            error: `Language contains invalid characters. Got '${language}'`,
        };
    }
    return { isValid: true };
}
/**
 * Validate keywords string
 */
export function validateKeywords(keywords, isRequired = false) {
    if (!keywords) {
        if (isRequired) {
            return {
                isValid: false,
                error: "Keywords are required",
            };
        }
        return { isValid: true };
    }
    return validateNonEmptyString(keywords, "Keywords", false);
}
/**
 * Validate labels string (comma-separated)
 */
export function validateLabels(labels, isRequired = false) {
    if (!labels) {
        if (isRequired) {
            return {
                isValid: false,
                error: "Labels are required",
            };
        }
        return { isValid: true };
    }
    return validateNonEmptyString(labels, "Labels", false);
}
/**
 * Validate agent name (for chant_init)
 */
export function validateAgent(agent) {
    if (!agent) {
        return { isValid: true }; // Optional, defaults to "claude"
    }
    const nonEmptyCheck = validateNonEmptyString(agent, "Agent", false);
    if (!nonEmptyCheck.isValid) {
        return nonEmptyCheck;
    }
    if (!/^[a-zA-Z0-9-]+$/.test(agent)) {
        return {
            isValid: false,
            error: `Agent name must contain only alphanumeric characters and dashes. Got '${agent}'`,
        };
    }
    return { isValid: true };
}
/**
 * Validate optional directory path
 */
export function validateDirectoryPath(dirPath, fieldName = "Directory path", isRequired = false) {
    if (!dirPath) {
        if (isRequired) {
            return {
                isValid: false,
                error: `${fieldName} is required`,
            };
        }
        return { isValid: true };
    }
    const nonEmptyCheck = validateNonEmptyString(dirPath, fieldName, false);
    if (!nonEmptyCheck.isValid) {
        return nonEmptyCheck;
    }
    // Basic validation - should not contain null bytes or be excessively long
    if (dirPath.includes("\0")) {
        return {
            isValid: false,
            error: `${fieldName} contains invalid characters`,
        };
    }
    if (dirPath.length > 500) {
        return {
            isValid: false,
            error: `${fieldName} is too long (max 500 characters)`,
        };
    }
    return { isValid: true };
}
/**
 * Validate optional message string
 */
export function validateMessage(message, fieldName = "Message", maxLength = 5000) {
    if (!message) {
        return { isValid: true }; // Optional
    }
    if (typeof message !== "string") {
        return {
            isValid: false,
            error: `${fieldName} must be a string, got ${typeof message}`,
        };
    }
    if (message.length > maxLength) {
        return {
            isValid: false,
            error: `${fieldName} is too long (max ${maxLength} characters)`,
        };
    }
    return { isValid: true };
}
/**
 * Validate array of strings (research_questions)
 */
export function validateStringArray(arr, fieldName = "Array", maxItems = 100, maxItemLength = 500) {
    if (!arr) {
        return { isValid: true }; // Optional
    }
    if (!Array.isArray(arr)) {
        return {
            isValid: false,
            error: `${fieldName} must be an array`,
        };
    }
    if (arr.length > maxItems) {
        return {
            isValid: false,
            error: `${fieldName} has too many items (max ${maxItems})`,
        };
    }
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (typeof item !== "string") {
            return {
                isValid: false,
                error: `${fieldName}[${i}] must be a string, got ${typeof item}`,
            };
        }
        if (item.length > maxItemLength) {
            return {
                isValid: false,
                error: `${fieldName}[${i}] is too long (max ${maxItemLength} characters)`,
            };
        }
    }
    return { isValid: true };
}
