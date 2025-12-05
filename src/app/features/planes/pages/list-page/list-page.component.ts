import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-plan-list-page',
  templateUrl: './list-page.component.html',
  styleUrls: ['./list-page.component.css']
})
export class PlanListPageComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  onView(id: number): void {
    this.router.navigate(['/planes', 'detail', id]);
  }

  onEdit(id: number): void {
    this.router.navigate(['/planes', 'edit', id]);
  }

  onCreate(): void {
    this.router.navigate(['/planes', 'create']);
  }
}

