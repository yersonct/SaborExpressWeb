import { proxyStagingApiRequest } from "@/server/staging-api-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  return proxyStagingApiRequest(request, []);
}

export const GET = handle;
export const HEAD = handle;
export const OPTIONS = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
