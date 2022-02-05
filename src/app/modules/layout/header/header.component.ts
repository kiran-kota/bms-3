import {Component, OnInit, HostListener, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import { WindowRef } from 'src/app/services/window-ref.service';
import { ApiService } from 'src/app/services/api.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { CountdownComponent, CountdownConfig, CountdownEvent } from 'ngx-countdown';

declare let Razorpay: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {


  user:any;
  loading: boolean = false;
  userId: number;
  notification:any;
  timeout: number = 5000;
  seconds: number = 15*60;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.seconds = 15*60;
  }

  @HostListener('document:click', ['$event'])
  public documentClick(event: Event): void {
    this.seconds = 15*60;
  }

  constructor(private router: Router, private winRef: WindowRef, private apiService: ApiService) {}
  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user'));
    this.userId = this.user.UserId;
    this.load();
    this.startCountdown();

  }
  startCountdown() {
    const interval = setInterval(() => {
      //console.log(this.seconds);
      this.seconds--;
      if (this.seconds < 0 ) {
        clearInterval(interval);
        console.log('Ding!');
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    }, 1000);
  }


  logout(){
    localStorage.clear();
    this.router.navigate(['/login']);
  }
  load(){
    this.loading = true;
    this.apiService.get('users').subscribe((res:any)=>{
     this.user = res.find(x=>x.UserId == this.userId);
     this.loading = false;
    });
  }
  getTotal(){
    if(this.user == undefined){
      return 0;
    }
    return this.user.Sale + this.user.Received - this.user.Transfered - this.user.Purchase - this.user.Expense + this.user.Balance;
  }
  payWithRazor(){
    let options:any = {
        "key": "rzp_test_sha6Yfb9BoDsIw",
        "amount": 100,
        "name": "Company Name",
        "description": "dummy data",
        "image": "./assets/images/logo.png",
        "modal": {
          "escape": false
        },

        "theme": {
          "color": "#6fbc29"
        }
      };
      options.handler = ((response) => {
          options['payment_response_id'] = response.razorpay_payment_id;
          let razorpay = new Razorpay(options)
          razorpay.open();
      });
      options.modal.ondismiss = (() => {
          console.log('user cancelled');
      });
      let rzp = new this.winRef.nativeWindow.Razorpay(options);
      rzp.open();
  }



}
