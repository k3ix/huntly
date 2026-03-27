import { z } from "zod";

export const CONTRACT_TYPES = ["b2b", "uop", "contractor"] as const;

export const contractTypeSchema = z.enum(CONTRACT_TYPES);

export type ContractType = z.infer<typeof contractTypeSchema>;
