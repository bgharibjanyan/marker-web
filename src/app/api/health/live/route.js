import {withApiObservability} from "@/server/http/api-handler";

async function GETHandler() {
    return Response.json({
        status: "ok",
        service: process.env.SERVICE_NAME || "marker-web",
        timestamp: new Date().toISOString(),
    });
}

export const GET = withApiObservability(GETHandler, {
    route: "/api/health/live",
    method: "GET",
});
