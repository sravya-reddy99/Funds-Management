import { Component, OnInit, computed, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { FundsService, Fund } from "../../services/funds.service";

type SortDir = "asc" | "desc";
type SortBy = "name" | "currency" | "fundSize" | "vintage";

@Component({
  selector: "app-admin-table",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./admin-table.component.html",
  styleUrl: "./admin-table.component.scss",
})
export class AdminTableComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);

  funds = signal<Fund[]>([]);

  // Filters
  fName = "";
  fCurrency = "";
  fDescription = "";

  fStrategy = "";
  fGeography = "";
  fManager = "";

  fundSizeMin?: number;
  fundSizeMax?: number;
  vintageMin?: number;
  vintageMax?: number;

  sortBy = signal<SortBy>("name");
  sortDir = signal<SortDir>("asc");

  // Pagination
  page = signal(1);
  pageSize = signal(10);
  pageSizeOptions = [5, 10, 20, 50];

  currencies = computed(() => Array.from(new Set(this.funds().map((x) => x.currency))).sort());
  strategies = computed(() => Array.from(new Set(this.funds().flatMap((x) => x.strategies))).sort());
  geographies = computed(() => Array.from(new Set(this.funds().flatMap((x) => x.geographies))).sort());
  managers = computed(() => Array.from(new Set(this.funds().flatMap((x) => x.managers))).sort());

  filteredSorted = computed(() => {
    const name = this.fName.trim().toLowerCase();
    const currency = this.fCurrency;
    const desc = this.fDescription.trim().toLowerCase();

    const strategy = this.fStrategy;
    const geography = this.fGeography;
    const manager = this.fManager;

    const minSize = this.fundSizeMin;
    const maxSize = this.fundSizeMax;
    const minVintage = this.vintageMin;
    const maxVintage = this.vintageMax;

    let rows = this.funds().filter((f) => {
      if (name && !f.name.toLowerCase().includes(name)) return false;
      if (currency && f.currency !== currency) return false;
      if (desc && !f.description.toLowerCase().includes(desc)) return false;

      if (strategy && !f.strategies.includes(strategy)) return false;
      if (geography && !f.geographies.includes(geography)) return false;
      if (manager && !f.managers.includes(manager)) return false;

      if (minSize !== undefined && f.fundSize < minSize) return false;
      if (maxSize !== undefined && f.fundSize > maxSize) return false;

      if (minVintage !== undefined && f.vintage < minVintage) return false;
      if (maxVintage !== undefined && f.vintage > maxVintage) return false;

      return true;
    });

    const sb = this.sortBy();
    const sd = this.sortDir();
    const factor = sd === "desc" ? -1 : 1;

    rows = [...rows].sort((a, b) => {
      if (sb === "fundSize") return (a.fundSize - b.fundSize) * factor;
      if (sb === "vintage") return (a.vintage - b.vintage) * factor;

      const av = String((a as any)[sb] ?? "");
      const bv = String((b as any)[sb] ?? "");
      return av.localeCompare(bv, undefined, { sensitivity: "base" }) * factor;
    });

    return rows;
  });

  totalItems = computed(() => this.filteredSorted().length);

  totalPages = computed(() => {
    const size = this.pageSize();
    const total = this.totalItems();
    return Math.max(1, Math.ceil(total / size));
  });

  pageItems = computed(() => {
    const p = Math.min(Math.max(1, this.page()), this.totalPages());
    if (p !== this.page()) this.page.set(p);

    const size = this.pageSize();
    const start = (p - 1) * size;
    return this.filteredSorted().slice(start, start + size);
  });

  pageRange = computed(() => {
  const total = this.totalPages();
  const current = this.page();
  const delta = 2;

  const range: number[] = [];

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }

  return range;
});

  constructor(private fundsApi: FundsService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);

    this.fundsApi.list().subscribe({
      next: (items) => {
        this.funds.set(items);
        this.loading.set(false);
        this.page.set(1);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? "Failed to load funds.");
        this.loading.set(false);
      },
    });
  }

  setSort(col: SortBy): void {
    if (this.sortBy() === col) {
      this.sortDir.set(this.sortDir() === "asc" ? "desc" : "asc");
    } else {
      this.sortBy.set(col);
      this.sortDir.set("asc");
    }
    this.page.set(1);
  }

  clearFilters(): void {
    this.fName = "";
    this.fCurrency = "";
    this.fDescription = "";
    this.fStrategy = "";
    this.fGeography = "";
    this.fManager = "";
    this.fundSizeMin = undefined;
    this.fundSizeMax = undefined;
    this.vintageMin = undefined;
    this.vintageMax = undefined;
    this.page.set(1);
  }

  onFilterChanged(): void {
    this.page.set(1);
  }

  setPage(p: number): void {
    this.page.set(Math.min(Math.max(1, p), this.totalPages()));
  }

  prevPage(): void {
    this.setPage(this.page() - 1);
  }

  nextPage(): void {
    this.setPage(this.page() + 1);
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }
}