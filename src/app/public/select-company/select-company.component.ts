import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginCompany } from '../../core/types/user.types';
import { CnpjPipe } from '../../core/pipes/cnpj.pipe';

@Component({
  selector: 'app-select-company',
  standalone: true,
  imports: [CommonModule, CnpjPipe],
  templateUrl: './select-company.component.html',
})
export class SelectCompanyComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  companiesList = computed(() => this.currentUser()?.companies || []);


  ngOnInit() {
    const user = this.currentUser();
    if (!user || !user?.companies || user?.companies.length <= 1) {
      this.router.navigate(['/auth/login']);
      return;
    }
  }

  handleSelect(company: LoginCompany) {
    this.authService.selectCompany(company);
    this.router.navigate(['/dashboard']);
    console.log('Selected company:', company);
  }

  handleLogout() {
    this.authService.logout().subscribe();
  }
}
