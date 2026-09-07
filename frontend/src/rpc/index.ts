import { createORPCClient, isDefinedError, ORPCError } from "@orpc/client";
import { type RouterContractClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { contract } from "./bindings";
export { consumeAsyncIterator, getEventMeta } from "@orpc/client";

const link = new OpenAPILink(contract, {
  origin: "http://localhost:3001",
  url: "/rpc",
});

export const client: RouterContractClient<typeof contract> =
  createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);

export { isDefinedError, ORPCError };