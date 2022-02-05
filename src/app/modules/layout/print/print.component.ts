import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ActivatedRoute } from '@angular/router';
declare var $;
import * as _ from "lodash";
@Component({
  selector: 'app-print',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.scss']
})
export class PrintComponent implements OnInit {
  users:any = [];
  accounts:any = [];
  data: any;
  items: any = [];
  list:any = [];
  tiers:any = [];

  constructor(private apiService: ApiService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.list = JSON.parse(localStorage.getItem('items'));
    this.tiers = JSON.parse(localStorage.getItem('tiers'));
    $('body').css('background', 'white');
    const id = Number(this.route.snapshot.paramMap.get("id"));
    this.users = JSON.parse(localStorage.getItem('users'));
    this.accounts = JSON.parse(localStorage.getItem('accounts'));
    this.apiService.get('bills/' + id).subscribe((res:any)=>{
      console.log(res);
      this.data = res;  
      this.items = res.BillItemsList == null ? [] : _.orderBy(JSON.parse(res.BillItemsList).map(x=>{
        return {
          'ItemId': x.ItemId,
          'Price': x.Price,
          'Rate': x.Rate,
          'Qty': x.Qty,
          'Amount': x.Amount,
          'Profit': x.Profit,
          'Code': JSON.parse(localStorage.getItem('items')).find(r=>r.ItemId == x.ItemId).Name
        }
      }), ['Code'],['asc']);  
      setTimeout(()=>this.onLoad(), 2000);
       
    });
  }
  onLoad(){
    window.print();
    setTimeout(window.close, 200);
  }
  getName(id:number){
    return JSON.parse(localStorage.getItem('users')).find(x=>x.UserId == id).UserName;
  }
  getCompany(id:number){
    let account = JSON.parse(localStorage.getItem('accounts')).find(x=>x.AccountId == id);
    return account == null ? "" : account.Name;
  }
  getItem(id:number){
    return JSON.parse(localStorage.getItem('items')).find(x=>x.ItemId == id).Code;
  }
  getTier(id:number){
    if(id != null){
      let tierId = this.accounts.find(x=>x.AccountId == id).TierId;
      return this.tiers.find(x=>x.TierId == tierId).Code;
    }
    return null;    
  }
  getUser(id:number){
    return this.users.find(x=>x.UserId == id).UserName;
  }
  check(i:number){
    if(i == 0){
      return false;
    }
    let code1 = this.items[i].Code;
    let code2 = this.items[i-1].Code;
    return code1.substring(0,2) != code2.substring(0,2);
  }

}
