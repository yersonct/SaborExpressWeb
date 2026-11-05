import { proxyStagingNotificationHubRequest } from "@/server/staging-api-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handle = (request: Request) => proxyStagingNotificationHubRequest(request, []);

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
