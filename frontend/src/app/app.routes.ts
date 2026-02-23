import { Routes } from "@angular/router";
import { AdminTableComponent } from "./pages/admin-table/admin-table.component";
import { FundDetailComponent } from "./pages/fund-detail/fund-detail.component";
import { FundEditComponent } from "./pages/fund-edit/fund-edit.component";

export const routes: Routes = [
  // Default route
  { path: "", redirectTo: "admin", pathMatch: "full" },

  { path: "admin", component: AdminTableComponent },
  { path: "fund/:id", component: FundDetailComponent },
  { path: "admin/edit/:id", component: FundEditComponent },

  { path: "index", redirectTo: "admin" },

  { path: "**", redirectTo: "admin" },
];