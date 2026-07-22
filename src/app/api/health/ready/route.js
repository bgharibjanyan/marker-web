import clientPromise from "@/app/lib/mongodb";
import {withApiObservability} from "@/server/http/api-handler";
import {logger} from "@/server/observability/logger";
import {
    getHealthcheckTimeoutMs,
    getRuntimeConfigurationProblems,
} from "@/server/config/runtime-config";

async function GETHandler() {
    const configurationProblems = getRuntimeConfigurationProblems();
    if (configurationProblems.length) {
        logger.warn("health.readiness.configuration_failed", {
            problems: configurationProblems,
        });
        return Response.json({
            status: "not_ready",
            checks: {configuration: "failed", database: "unknown"},
        }, {status: 503});
    }

    try {
        const client = await clientPromise;
        await client.db("marker").command(
            {ping: 1},
            {maxTimeMS: getHealthcheckTimeoutMs()},
        );
        return Response.json({
            status: "ready",
            checks: {configuration: "ok", database: "ok"},
            timestamp: new Date().toISOString(),
        });
    } catch {
        return Response.json({
            status: "not_ready",
            checks: {configuration: "ok", database: "failed"},
        }, {status: 503});
    }
}

export const GET = withApiObservability(GETHandler, {
    route: "/api/health/ready",
    method: "GET",
});
