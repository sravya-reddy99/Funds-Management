import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { Subject, Subscription, debounceTime } from "rxjs";
import { FundsService, Fund } from "../../services/funds.service";

function toCommaString(arr: string[]): string {
  return (arr ?? []).join(", ");
}

function toStringArray(csv: string): string[] {
  return (csv ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

@Component({
  selector: "app-fund-edit",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./fund-edit.component.html",
  styleUrl: "./fund-edit.component.scss",
})
export class FundEditComponent implements OnInit, OnDestroy {
  loading = signal(true);
  error = signal<string | null>(null);

  saving = signal(false);
  savedAt = signal<string | null>(null);

  fund = signal<Fund | null>(null);

  name = "";
  currency = "";
  description = "";
  fundSize: number | null = null;
  vintage: number | null = null;

  strategiesCsv = "";
  geographiesCsv = "";
  managersCsv = "";

  private save$ = new Subject<void>();
  private sub?: Subscription;
  private id = "";

  constructor(
    private route: ActivatedRoute,
    private api: FundsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.error.set("Missing fund id.");
      this.loading.set(false);
      return;
    }
    this.id = id;

    this.sub = this.save$.pipe(debounceTime(650)).subscribe(() => {
      this.doSave();
    });

    this.api.get(id).subscribe({
      next: (f) => {
        this.fund.set(f);

        this.name = f.name;
        this.currency = f.currency;
        this.description = f.description;
        this.fundSize = f.fundSize;
        this.vintage = f.vintage;

        this.strategiesCsv = toCommaString(f.strategies);
        this.geographiesCsv = toCommaString(f.geographies);
        this.managersCsv = toCommaString(f.managers);

        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? "Fund not found.");
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  markDirty(): void {
    // Trigger autosave after user changes
    this.savedAt.set(null);
    this.save$.next();
  }

  onBlur(): void {
    this.save$.next();
  }

  private doSave(): void {
    if (this.loading() || this.saving()) return;

    // Validation
    if (!this.name.trim() || !this.currency.trim()) {
      this.error.set("Name and currency are required.");
      return;
    }

    if (this.fundSize === null || this.vintage === null) {
      this.error.set("Fund size and vintage are required.");
      return;
    }

    this.error.set(null);
    this.saving.set(true);

    const patch: Partial<Fund> = {
      name: this.name.trim(),
      currency: this.currency.trim(),
      description: this.description.trim(),
      fundSize: Number(this.fundSize),
      vintage: Number(this.vintage),
      strategies: toStringArray(this.strategiesCsv),
      geographies: toStringArray(this.geographiesCsv),
      managers: toStringArray(this.managersCsv),
    };

    this.api.update(this.id, patch).subscribe({
      next: (updated) => {
        this.fund.set(updated);
        this.saving.set(false);
        this.savedAt.set(new Date().toLocaleTimeString());
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ?? "Failed to save changes.");
      },
    });
  }

  saveNow(): void {
    this.save$.next();
  }

  deleteFund(): void {
    const ok = confirm("Delete this fund? This cannot be undone.");
    if (!ok) return;

    this.saving.set(true);
    this.api.remove(this.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigateByUrl("/admin");
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.message ?? "Failed to delete fund.");
      },
    });
  }
}