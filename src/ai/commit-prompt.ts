interface CommitPromptOptions {
    diff: string;
    commitHistory: string;
    summaryLength: number;
    issueId?: string;
}

export function buildCommitPrompt(options: CommitPromptOptions): string {
    const { diff, commitHistory, summaryLength, issueId } = options;

    let prompt = `Generate a conventional commit message for the git diff below.

CRITICAL: Return ONLY the commit message. Do not include ANY explanations, analysis, commentary, or additional text. Do not describe what you see in the diff. Just output the commit message and nothing else.

Requirements:
- Summary line MUST NOT exceed ${summaryLength} characters
- Use conventional commit format (type(scope): description)
- Only add body if absolutely necessary for complex changes
- NO explanations, NO analysis, NO commentary

Output format: Just the commit message, nothing more.`;

    if (commitHistory) {
        prompt += `

Previous commits in this feature branch (most recent first):
\`\`\`
${commitHistory}
\`\`\`
Ensure consistency with these commits. Adhere to the ${summaryLength}-character summary rule.`;
    }

    prompt += `

Changes to commit:
\`\`\`
${diff}
\`\`\``;

    if (issueId) {
        prompt += `

Please prefix the summary line with the following issue ID: ${issueId}

Example: ${issueId} feat: some new feature`;
    }

    return prompt;
}
