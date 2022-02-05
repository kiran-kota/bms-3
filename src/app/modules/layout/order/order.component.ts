import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
declare var $;
import * as _ from "lodash";
@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  users:any = [];
  accounts:any = [];
  data: any;
  items: any = [];
  list:any = [];
  tiers:any = [];
  token: string = '';
  constructor(private route: ActivatedRoute, private firestore: AngularFirestore) { }

  ngOnInit() {
    this.list = JSON.parse(localStorage.getItem('items'));
    this.tiers = JSON.parse(localStorage.getItem('tiers'));
    $('body').css('background', 'white');
    const id = this.route.snapshot.paramMap.get("id");
    this.token = this.route.snapshot.paramMap.get("t");
    this.firestore.doc('quotations/' + id).valueChanges().subscribe((res:any)=>{
      this.data = res;  
      this.items = res.BillItemsList == null ? [] : _.orderBy(JSON.parse(res.BillItemsList).map(x=>{
        return {
          'ItemId': x.ItemId,
          'Price': x.Price,
          'Rate': x.Rate,
          'Qty': x.Qty,
          'Amount': x.Amount,
          'Profit': x.Profit,
          'Code': JSON.parse(localStorage.getItem('items')).find(r=>r.ItemId == x.ItemId).Code
        }
      }), ['Code'],['asc']);  
      
      setTimeout(window.print, 2000);
    });
  }
  check(i:number){
    if(i == 0){
      return false;
    }
    let code1 = this.items[i].Code;
    let code2 = this.items[i-1].Code;
    return code1.substring(0,2) != code2.substring(0,2);
  }
  getName(id:number){
    return this.users.find(x=>x.UserId == id).UserName;
  }
  getCompany(id:number){
    let account = this.accounts.find(x=>x.AccountId == id);
    return account == null ? "" : account.Name;
  }
  getItem(id:number){
    return this.list.find(x=>x.ItemId == id).Code;
  }
  getTier(id:number){
    if(id != null){
      let tierId = this.accounts.find(x=>x.AccountId == id).TierId;
      return this.tiers.find(x=>x.TierId == tierId).Code;
    }
    return null;    
  }
  getUser(id:number){
    return this.users.find(x=>x.UserId).UserName;
  }

}
