import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

  constructor(private router: Router,
              private authService: AuthService) { 
  }

  ngOnInit() {
    this.authService.logout();

    // Slow-down the logout process to avoid errors with updating UI elements
    setTimeout(() => {this.router.navigate(['auth', 'login']);}, 1000);    
  }

}
