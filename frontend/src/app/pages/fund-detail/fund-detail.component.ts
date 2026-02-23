import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, ActivatedRoute } from "@angular/router";
import { FundsService, Fund } from "../../services/funds.service";

@Component({
  selector: "app-fund-detail",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./fund-detail.component.html",
  styleUrl: "./fund-detail.component.scss",
})
export class FundDetailComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  fund = signal<Fund | null>(null);

  constructor(private route: ActivatedRoute, private api: FundsService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) {
      this.error.set("Missing fund id.");
      this.loading.set(false);
      return;
    }

    this.api.get(id).subscribe({
      next: (f) => {
        this.fund.set(f);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? "Fund not found.");
        this.loading.set(false);
      },
    });
  }
}