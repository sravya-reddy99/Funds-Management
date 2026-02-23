import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-index",
  imports: [RouterModule],
  templateUrl: "./index.component.html",
  styleUrl: "./index.component.scss",
  standalone: true,
})
export class IndexComponent {}