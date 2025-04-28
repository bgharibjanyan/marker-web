import { NextResponse } from 'next/server';

export class AuthenticatedHandler {
    constructor(req) {
        this.req = req;
    }

    async authenticate() {
        const authHeader = this.req.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Unauthorized');
        }

        const token = authHeader.split(' ')[1];

        if (token !== 'expected_token_value') {
            throw new Error('Unauthorized');
        }

        this.user = { id: 1, name: 'Test User' };
    }
}
