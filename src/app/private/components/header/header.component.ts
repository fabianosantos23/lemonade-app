import { Component, input, inject, signal, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { LucideAngularModule, SearchIcon, BellIcon, Building2Icon, UserXIcon, ChevronLeftIcon } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private sub = new Subscription();

  readonly SearchIcon = SearchIcon
  readonly BellIcon = BellIcon
  readonly Building2Icon = Building2Icon
  readonly UserXIcon = UserXIcon
  readonly ChevronLeftIcon = ChevronLeftIcon

  title = signal('');
  subtitle = signal('');
  showBack = signal(false);
  
  // Using output function as per best practices
  stopImpersonation = output<void>();

  currentCompany = this.authService.currentCompany;
  
  // Placeholder for impersonation logic - in a real app this would come from AuthService
  isImpersonating = signal(false);

  ngOnInit() {
    this.updateHeaderFromRoute();

    this.sub.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.updateHeaderFromRoute();
      })
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private updateHeaderFromRoute() {
    let route = this.activatedRoute.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const data = route.snapshot.data;
    if (data['title']) {
      this.title.set(data['title'] as string);
    }
    if (data['subtitle']) {
      this.subtitle.set(data['subtitle'] as string);
    }
    this.showBack.set(!!data['showBack']);
  }

  handleBack() {
    window.history.back();
  }

  handleStopImpersonating() {
    this.stopImpersonation.emit();
  }
}
