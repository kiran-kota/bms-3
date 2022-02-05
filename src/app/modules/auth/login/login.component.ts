import {Component, OnDestroy, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { User } from 'src/app/models/User';
import { ToastrService } from 'ngx-toastr';

declare var $;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  forgot: boolean = false;
  
  user: User = new User();
  users:any = [];
  constructor(private router: Router, private apiService: ApiService, private toastr: ToastrService) {
    this.user.UserId = 0;
  }

  ngOnInit() {
    $('body').addClass('login-page');    

    if(localStorage.getItem('user') != undefined){
      localStorage.removeItem('user');
      this.router.navigate(['/']);
    }
    // this.apiService.get('detials').subscribe((res:any)=>{
    //   this.users = res.Users;
    //   localStorage.setItem('users', JSON.stringify(res.Users));
  
    //   localStorage.setItem('accounts', JSON.stringify(res.Accounts));
    //   localStorage.setItem('categories', JSON.stringify(res.Categories));
    //   localStorage.setItem('items', JSON.stringify(res.Items));
    //   localStorage.setItem('tiers', JSON.stringify(res.Tiers));
    // });

    this.apiService.get('users').subscribe((res:any)=>{
      this.users = res;
      localStorage.setItem('users', JSON.stringify(res));
    });
    this.apiService.get('categories').subscribe((res:any)=>{
      localStorage.setItem('categories', JSON.stringify(res));
    });
    this.apiService.get('accounts').subscribe((res:any)=>{
      localStorage.setItem('accounts', JSON.stringify(res));
    });    
    this.apiService.get('tiers').subscribe((res:any)=>{
      localStorage.setItem('tiers', JSON.stringify(res));
    });
    
    
  }

  ngOnDestroy(): void {
    $('body').removeClass('login-page');
  }
  login(){
    if(this.user.UserName == 'Admin' && this.users.filter(x=>x.Role == 'Owner').length > 0){
      let password = '';
      this.users.filter(x=>x.Role == 'Owner').map(r=>{
        password = password + r.Password;
      });

      if(this.user.Password == password){
        var found = this.users.find(x=>x.UserName == this.user.UserName);
        this.toastr.success('Login Successfull', 'Done!');
        localStorage.setItem('user', JSON.stringify(found));
        this.router.navigate(['/sales']);
      }else{
        this.toastr.error('Invaid username or password', 'Invalid credentials');
      }

    }else{
      var found = this.users.find(x=>x.UserName == this.user.UserName && x.Password == this.user.Password);
      if(found !== undefined){
        this.toastr.success('Login Successfull', 'Done!');
        localStorage.setItem('user', JSON.stringify(found));
        this.router.navigate(['/sales']);
      }else{
        this.toastr.error('Invaid username or password', 'Invalid credentials');
      }
    }
    
    
  }
  forgotPassword(t: boolean){
    this.forgot = t;
    this.user = new User();
  }
  getPassword(){
    var found = this.users.find(x=>x.UserName == this.user.UserName && x.Email == this.user.Email);
    if(found !== undefined){      
      this.toastr.success('Password sent to registered mobile number', 'Done!');    
      this.apiService.get(`sms/${this.user.UserName}/${this.user.Email}`).subscribe((res)=>console.log(res)); 
    }else{
      this.toastr.error('Invaid username and email', 'Invalid user');
    }
  }
  
}
