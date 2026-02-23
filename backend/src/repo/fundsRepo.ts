import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { Fund, ListQuery } from "./types";

const DATA_FILE = path.resolve(__dirname, "../../data/funds_data.json");

type RawFund = Omit<Fund, "id"> & Partial<Pick<Fund, "id">>;

function normalizeString(s: any): string {
  return String(s ?? "").trim();
}

function safeArray(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => normalizeString(x)).filter(Boolean);
  if (typeof v === "string") {
    return v.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function ensureFundShape(raw: any): RawFund {
  return {
    id: raw?.id ? String(raw.id) : undefined,
    name: normalizeString(raw?.name),
    strategies: safeArray(raw?.strategies),
    geographies: safeArray(raw?.geographies),
    currency: normalizeString(raw?.currency),
    fundSize: Number(raw?.fundSize ?? 0),
    vintage: Number(raw?.vintage ?? 0),
    managers: safeArray(raw?.managers),
    description: normalizeString(raw?.description),
  };
}

function createId(): string {
  return crypto.randomUUID();
}

export class FundsRepo {
  private async readRaw(): Promise<RawFund[]> {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) throw new Error("funds_data.json must be an array");
    return parsed.map(ensureFundShape);
  }

  private async writeRaw(items: RawFund[]): Promise<void> {
    await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
  }

  async ensureIds(): Promise<void> {
    const raw = await this.readRaw();
    let changed = false;
    const withIds = raw.map((f) => {
      if (!f.id) {
        changed = true;
        return { ...f, id: createId() };
      }
      return f;
    });
    if (changed) await this.writeRaw(withIds);
  }

  private matchesQuery(f: Fund, q: ListQuery): boolean {
    const includesCI = (hay: string, needle?: string) => {
      if (!needle) return true;
      return hay.toLowerCase().includes(needle.toLowerCase());
    };

    if (q.name && !includesCI(f.name, q.name)) return false;
    if (q.currency && f.currency !== q.currency) return false;
    if (q.description && !includesCI(f.description, q.description)) return false;

    if (q.strategy && !f.strategies.some((s) => s === q.strategy)) return false;
    if (q.geography && !f.geographies.some((g) => g === q.geography)) return false;
    if (q.manager && !f.managers.some((m) => m === q.manager)) return false;

    if (q.fundSizeMin !== undefined && f.fundSize < q.fundSizeMin) return false;
    if (q.fundSizeMax !== undefined && f.fundSize > q.fundSizeMax) return false;

    if (q.vintageMin !== undefined && f.vintage < q.vintageMin) return false;
    if (q.vintageMax !== undefined && f.vintage > q.vintageMax) return false;

    return true;
  }

  private sortItems(items: Fund[], q: ListQuery): Fund[] {
    if (!q.sortBy) return items;

    const dir = q.sortDir ?? "asc";
    const factor = dir === "desc" ? -1 : 1;
    const key = q.sortBy;

    return [...items].sort((a, b) => {
      const av: any = (a as any)[key];
      const bv: any = (b as any)[key];

      // Arrays
      if (Array.isArray(av) && Array.isArray(bv)) {
        return (av.length - bv.length) * factor;
      }

      // Numbers
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * factor;
      }

      // Strings
      return String(av ?? "")
        .localeCompare(String(bv ?? ""), undefined, { sensitivity: "base" }) * factor;
    });
  }

  async list(q: ListQuery): Promise<Fund[]> {
    await this.ensureIds();
    const raw = await this.readRaw();
    const funds: Fund[] = raw.map((r) => ({ ...(r as Fund), id: String(r.id) }));
    const filtered = funds.filter((f) => this.matchesQuery(f, q));
    return this.sortItems(filtered, q);
  }

  async getById(id: string): Promise<Fund | null> {
    await this.ensureIds();
    const raw = await this.readRaw();
    const found = raw.find((x) => String(x.id) === id);
    if (!found) return null;
    return { ...(found as Fund), id: String(found.id) };
  }

  async update(id: string, patch: Partial<Fund>): Promise<Fund | null> {
    await this.ensureIds();
    const raw = await this.readRaw();
    const idx = raw.findIndex((x) => String(x.id) === id);
    if (idx === -1) return null;

    const current = ensureFundShape(raw[idx]);

    const next: RawFund = {
      ...current,
      name: patch.name !== undefined ? normalizeString(patch.name) : current.name,
      currency: patch.currency !== undefined ? normalizeString(patch.currency) : current.currency,
      description: patch.description !== undefined ? normalizeString(patch.description) : current.description,

      fundSize: patch.fundSize !== undefined ? Number(patch.fundSize) : current.fundSize,
      vintage: patch.vintage !== undefined ? Number(patch.vintage) : current.vintage,

      strategies: patch.strategies !== undefined ? safeArray(patch.strategies) : current.strategies,
      geographies: patch.geographies !== undefined ? safeArray(patch.geographies) : current.geographies,
      managers: patch.managers !== undefined ? safeArray(patch.managers) : current.managers,

      id: String(current.id),
    };

    if (!next.name) throw new Error("name is required");
    if (!next.currency) throw new Error("currency is required");
    if (!Number.isFinite(next.fundSize)) throw new Error("fundSize must be a number");
    if (!Number.isFinite(next.vintage)) throw new Error("vintage must be a number");

    raw[idx] = next;
    await this.writeRaw(raw);

    return { ...(next as Fund), id: String(next.id) };
  }

  async remove(id: string): Promise<boolean> {
    await this.ensureIds();
    const raw = await this.readRaw();
    const next = raw.filter((x) => String(x.id) !== id);
    if (next.length === raw.length) return false;
    await this.writeRaw(next);
    return true;
  }
}