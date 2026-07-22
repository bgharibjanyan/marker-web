import createMiddleware from 'next-intl/middleware';
import {NextResponse} from 'next/server';
import {routing} from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const requestHeaders = new Headers(request.headers);
        const suppliedRequestId = requestHeaders.get('x-request-id') || '';
        const requestId = /^[a-zA-Z0-9._-]{8,128}$/.test(suppliedRequestId)
            ? suppliedRequestId
            : crypto.randomUUID();
        requestHeaders.set('x-request-id', requestId);

        const response = NextResponse.next({request: {headers: requestHeaders}});
        response.headers.set('x-request-id', requestId);
        response.headers.set('x-content-type-options', 'nosniff');
        response.headers.set('referrer-policy', 'no-referrer');
        return response;
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: ['/', '/api/:path*', '/(ru|en|arm)/:path*']
};