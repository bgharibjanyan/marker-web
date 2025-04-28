import {NextResponse} from 'next/server';
import {AuthenticatedHandler} from "@/app/lib/api/service/AuthenticatedHandler";

class ProtectedEndpoint extends AuthenticatedHandler {
    constructor(req) {
        super(req);
    }

    async getData() {
        await this.authenticate();

        return NextResponse.json({message: 'Protected data', user: this.user});
    }
}