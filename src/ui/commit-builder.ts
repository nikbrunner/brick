export interface CommitParts {
    type: string;
    scope: string;
    breaking: boolean;
    subject: string;
    body: string;
    footer: string;
}

export function buildCommitMessage(parts: CommitParts): string {
    const { type, scope, breaking, subject, body, footer } = parts;

    const scopePart = scope ? `(${scope})` : "";
    const breakingPart = breaking ? "!" : "";
    let message = `${type}${scopePart}${breakingPart}: ${subject}`;

    if (body) message += `\n\n${body}`;
    if (footer) message += `\n\n${footer}`;

    return message;
}
