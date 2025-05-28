import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2
} from '@angular/core';
import {
  Router,
  RouterModule,
  RouterOutlet,
} from '@angular/router';

import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'my-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatIconModule,
    RouterModule,
    MatButtonModule,
    HeaderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer!: MatDrawer;

  constructor(
  ) { }

  router = inject(Router);


  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  isLoginRoute(): boolean {
    return this.router.url.includes('/login');
  }
}
