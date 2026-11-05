import { proxyStagingNotificationHubRequest } from "@/server/staging-api-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyStagingNotificationHubRequest(request, path);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
