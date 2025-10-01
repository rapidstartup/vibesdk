export const getProtocolForHost = (host: string): string => {
    if (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0') || host.startsWith('::1')) {
        return 'http';
    } else {
        return 'https';
    }
}
function stripScheme(domain: string): string {
    if (!domain) return domain;
    return domain.replace(/^https?:\/\//i, '');
}
export function getPreviewDomain(env: Env): string {
    const configured = (env.CUSTOM_PREVIEW_DOMAIN && env.CUSTOM_PREVIEW_DOMAIN.trim() !== '')
        ? env.CUSTOM_PREVIEW_DOMAIN
        : env.CUSTOM_DOMAIN;
    return stripScheme(configured);
}

export function buildUserWorkerUrl(env: Env, deploymentId: string): string {
    const domain = getPreviewDomain(env);
    const protocol = getProtocolForHost(domain);
    return `${protocol}://${deploymentId}.${domain}`;
}
