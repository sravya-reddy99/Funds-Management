import { ListQuery, Fund } from "./types";

function toNumber(v: any): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseListQuery(q: any): ListQuery {
  return {
    name: q.name ? String(q.name) : undefined,
    currency: q.currency ? String(q.currency) : undefined,
    description: q.description ? String(q.description) : undefined,

    strategy: q.strategy ? String(q.strategy) : undefined,
    geography: q.geography ? String(q.geography) : undefined,
    manager: q.manager ? String(q.manager) : undefined,

    fundSizeMin: toNumber(q.fundSizeMin),
    fundSizeMax: toNumber(q.fundSizeMax),
    vintageMin: toNumber(q.vintageMin),
    vintageMax: toNumber(q.vintageMax),

    sortBy: q.sortBy ? (String(q.sortBy) as keyof Fund) : undefined,
    sortDir: q.sortDir === "desc" ? "desc" : q.sortDir === "asc" ? "asc" : undefined,
  };
}