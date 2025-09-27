import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-verify-email-silent',
  template: `` // no UI
})
export class VerifyEmailSilentComponent implements OnInit {
  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';
    if (token) {
      // fire-and-forget; even if request finishes after navigation, user_active is set when it completes
      this.auth.verifyEmail(token).subscribe({ next: () => {}, error: () => {} });
    }
    this.router.navigateByUrl('/auth/login');
  }
}
