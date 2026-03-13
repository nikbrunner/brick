interface BranchPromptOptions {
    description: string;
}

export function buildBranchPrompt(options: BranchPromptOptions): string {
    return `Generate a git branch name for: "${options.description}"

CRITICAL: Return ONLY the branch name. No explanations, no analysis, no additional text. Just the branch name and nothing else.

Requirements:
- The branch name must be in english and lowercase letters, numbers, hyphens only
- Lowercase letters, numbers, hyphens only
- Under 50 characters
- Include issue numbers (DEV-1234) as prefix if present
- Replace spaces with hyphens

Examples:
- "Fix login bug" -> "fix-login-bug"
- "DEV-1234 add dashboard" -> "dev-1234-add-dashboard"

Output: Just the branch name, nothing more.`;
}
