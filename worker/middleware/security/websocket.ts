import { getCORSConfig } from '../../config/security';
import { createLogger } from '../../logger';
import { Context } from 'hono';

const logger = createLogger('WebSocketSecurity');

export function validateWebSocketOrigin(request: Request, env: Env): boolean {
    const origin = request.headers.get('Origin');

    // In some browsers/workers upgrades, Origin may be omitted for same-origin ws; allow if Host matches
    if (!origin) {
        try {
            const url = new URL(request.url);
            const inferredOrigin = `${url.protocol.replace('ws', 'http')}//${url.host}`;
            const corsConfig = getCORSConfig(env);
            const allowedOrigins = corsConfig.origin;
            if (typeof allowedOrigins === 'string') return inferredOrigin === allowedOrigins;
            if (Array.isArray(allowedOrigins)) return allowedOrigins.includes(inferredOrigin);
        } catch {
			logger.warn('WebSocket connection attempt without Origin header');
			return false;
		}
        logger.warn('WebSocket connection attempt without Origin header');
        return false;
    }

    const corsConfig = getCORSConfig(env);
    const allowedOrigins = corsConfig.origin;

    // Handle different origin config types
    if (typeof allowedOrigins === 'string') {
        return origin === allowedOrigins;
    } else if (Array.isArray(allowedOrigins)) {
        return allowedOrigins.includes(origin);
    } else if (typeof allowedOrigins === 'function') {
        // Create a minimal context for validation
        const context = {} as Context;
        const result = allowedOrigins(origin, context);
        return result === origin;
    }

    logger.warn('WebSocket connection rejected from unauthorized origin', { origin });
    return false;
}

export function getWebSocketSecurityHeaders(): Record<string, string> {
    return {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block'
    };
}
