import { proxyStagingHealthRequest } from "@/server/staging-api-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (request: Request) => proxyStagingHealthRequest(request);
export const HEAD = (request: Request) => proxyStagingHealthRequest(request);
