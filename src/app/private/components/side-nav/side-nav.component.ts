import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule, ZapIcon, MenuIcon, LogOutIcon } from 'lucide-angular';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SideNavService } from '../../../core/services/side-nav.service';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss'
})
export class SideNavComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private sideNavService = inject(SideNavService);
  private router = inject(Router);
  
  readonly ZapIcon = ZapIcon;
  readonly MenuIcon = MenuIcon;
  readonly LogOutIcon = LogOutIcon;
  sidebarExpanded = signal(true);
  isMobile = signal(false);
  activeSection = signal('overview');

  currentUser = this.authService.currentUser;
  
  userName = computed(() => this.currentUser()?.name || 'Usuário');
  userEmail = computed(() => this.currentUser()?.email || '');
  userInitials = computed(() => {
    const name = this.userName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });

  // Navigation items are now reactive and filtered based on permissions
  navigationItems = this.sideNavService.visibleMenuItems;

  private routerSub!: Subscription;
  private resizeListener!: () => void;

  ngOnInit() {
    this.checkScreenSize();
    this.resizeListener = () => this.checkScreenSize();
    window.addEventListener('resize', this.resizeListener);

    this.checkActiveRoute(this.router.url);
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkActiveRoute(event.urlAfterRedirects);
    });
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
    if (this.resizeListener) window.removeEventListener('resize', this.resizeListener);
  }

  private checkScreenSize() {
    const isMobile = window.innerWidth < 768;
    this.isMobile.set(isMobile);
    if (isMobile) {
      this.sidebarExpanded.set(false);
    }
  }

  private checkActiveRoute(url: string) {
    if (url.includes('/dashboard')) this.activeSection.set('overview');
    else if (url.includes('/stores')) this.activeSection.set('stores');
    else if (url.includes('/products')) this.activeSection.set('products');
    else if (url.includes('/marketplaces')) this.activeSection.set('marketplaces');
    else if (url.includes('/users')) this.activeSection.set('users');
    else if (url.includes('/analytics')) this.activeSection.set('analytics');
    else if (url.includes('/settings')) this.activeSection.set('settings');
  }

  toggleSidebar() {
    this.sidebarExpanded.update(v => !v);
  }

  handleLogout() {
    this.authService.logout().subscribe();
  }
}
