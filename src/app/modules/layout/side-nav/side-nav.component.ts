import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { ApiService } from 'src/app/services/api.service';

declare var $;

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnInit {
  notifications: any;
  user:any = JSON.parse(localStorage.getItem('user'));
  tabs:any = JSON.parse(JSON.parse(localStorage.getItem('user')).Tabs);
  constructor(private router: Router, private apiService: ApiService) {
    
  }

  ngOnInit() {
    this.apiService.get('notifications/' + this.user.UserId).subscribe((res:any)=>{
      this.notifications = res;
    });
    
    $(document).ready(() => {
     
    });
  }

  check(u:any){
    return this.user.Role == 'Owner' || this.user.Role == 'Admin' || this.tabs.indexOf(u) > -1;
  }
 

}
