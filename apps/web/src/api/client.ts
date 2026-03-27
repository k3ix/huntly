import { treaty } from "@elysiajs/eden";
import type { app } from "../../../server/src/app";

export const client = treaty<typeof app>(window.location.origin);
