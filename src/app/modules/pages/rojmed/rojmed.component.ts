import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";
import { ApiService } from 'src/app/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { ExcelService } from 'src/app/services/excel.service';
declare var $;
declare var moment: any;
@Component({
  selector: 'app-rojmed',
  templateUrl: './rojmed.component.html',
  styleUrls: ['./rojmed.component.scss']
})
export class RojmedComponent implements OnInit {
  loading: boolean = false;
  rojmeds:any = [];
  users:any = [];
  accounts:any = [];
  categories:any = [];
  role: String = 'Employee';
  startDate: String = moment().subtract(29, "days").format('YYYY-MM-DD');;
  endDate: String = moment().format('YYYY-MM-DD');


  sales:any = [];
  purchases:any = [];
  receives:any = [];
  transfers:any = [];
  expenses:any = [];
  title:string = '';

  start = moment().subtract(29, "days");
  end = moment();
  date: Date = moment();
  public daterange: any = {};
  public options: any = {
    locale: { format: "DD/MM/YYYY" },
    alwaysShowCalendars: false,
    startDate: moment().subtract(29, "days"),
    endDate: moment(),
    minDate: moment().subtract(29, "days"),
    maxDate: moment(),
    ranges: {
      Today: [moment(), moment()],
      Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
      "Last 7 Days": [moment().subtract(6, "days"), moment()],
      "Last 30 Days": [moment().subtract(29, "days"), moment()],
      "This Month": [moment().startOf("month"), moment().endOf("month")],
      "Last Month": [
        moment()
          .subtract(1, "month")
          .startOf("month"),
        moment()
          .subtract(1, "month")
          .endOf("month")
      ]
    }
  };

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    localStorage.setItem('url-link', 'Rojmeds');
    this.apiService.get('users').subscribe((res:any)=>{
      localStorage.setItem('users', JSON.stringify(res));
    });
    const user = JSON.parse(localStorage.getItem('user'));
    this.role = user.Role;
    this.users = JSON.parse(localStorage.getItem('users')).filter(x=>x.Deleted == false && x.UserName != 'Admin' && (user.Role == 'Employee' ? x.UserId == user.UserId : true));
    this.accounts = JSON.parse(localStorage.getItem('accounts'));
    this.categories = JSON.parse(localStorage.getItem('categories'));
    this.daterange.start = moment().subtract(29, "days");
    this.daterange.end = moment();

    this.getData();
  }

  getData(){
    this.loading = true;
    const date = moment(this.date).format('YYYY-MM-DD');
    this.apiService.get('rojmeds/' + date).subscribe((res:any)=>{
      this.rojmeds = res;
      console.log(res);
      this.loading = false;
    }, (err)=>this.loading = false);
  }
  getUser(id:number){
    return this.rojmeds.find(x=>x.UserId == id);
  }
  getUserName(id:number){
    return this.users.find(x=>x.UserId == id).UserName;
  }
  previous(){
    this.date = moment(this.date).subtract(1, "days");
    this.getData();
  }
  next(){
    this.date = moment(this.date).add(1, "days");
    this.getData();
  }
  search(){
    let date = $('#date').val();
    console.log(date);
    this.date = moment(date);
    this.getData();
  }
  getAvailable(id:number){
    if(this.rojmeds.length == 0){
      return 0;
    }
    var user = this.rojmeds.find(x=>x.UserId == id);
    return user.Balance + user.PastSale + user.PastReceived - user.PastPurchase - user.PastTransfered - user.PastExpense;
  }
  getBalance(id:number){
    if(this.rojmeds.length == 0){
      return 0;
    }
    var user = this.rojmeds.find(x=>x.UserId == id);
    return this.getAvailable(id) + user.Sale + user.Received - user.Purchase - user.Transfered - user.Expense;
  }
  getAccount(id:number){
    return this.accounts.find(x=>x.AccountId == id).Name;
  }
  getCategory(id:number){
    return this.categories.find(x=>x.CategoryId == id).Code;
  }
  public selectedDate(value: any, datepicker?: any) {
    datepicker.start = value.start;
    datepicker.end = value.end;
    this.daterange.start = value.start;
    this.daterange.end = value.end;
    this.daterange.label = value.label;
    this.start = value.start;
    this.end = value.end;

    this.startDate = this.start.format('YYYY-MM-DD');
    this.endDate = this.end.format('YYYY-MM-DD');

  }

  salesModal(id:number){
    this.sales = this.rojmeds.find(x=>x.UserId == id).Sales;
    this.title = 'Sale info of ' + this.users.find(x=>x.UserId == id).UserName;
    if(this.sales.length > 0){
      $('#salesModal').modal('toggle');
    }
  }
  purchasesModal(id:number){
    this.purchases = this.rojmeds.find(x=>x.UserId == id).Purchases;
    this.title = 'Purchase info of ' + this.users.find(x=>x.UserId == id).UserName;
    if(this.purchases.length > 0){
      $('#purchasesModal').modal('toggle');
    }
  }
  receivesModal(id:number){
    this.receives = this.rojmeds.find(x=>x.UserId == id).Receives;
    this.title = 'Received info of ' + this.users.find(x=>x.UserId == id).UserName;
    if(this.receives.length > 0){
      $('#receivesModal').modal('toggle');
    }
  }
  transfersModal(id:number){
    this.transfers = this.rojmeds.find(x=>x.UserId == id).Transfers;
    this.title = 'Transfered info of ' + this.users.find(x=>x.UserId == id).UserName;
    if(this.transfers.length > 0){
      $('#transfersModal').modal('toggle');
    }
  }
  expensesModal(id:number){
    this.expenses = this.rojmeds.find(x=>x.UserId == id).Expenses;
    this.title = 'Expenses info of ' + this.users.find(x=>x.UserId == id).UserName;
    if(this.expenses.length > 0){
      $('#expensesModal').modal('toggle');
    }
  }
}
