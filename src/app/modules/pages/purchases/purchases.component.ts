import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

import { ApiService } from 'src/app/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";

import { ExcelService } from 'src/app/services/excel.service';
import { Router } from '@angular/router';
import { Bill } from 'src/app/models/Bill';
import { AngularFirestore } from '@angular/fire/firestore';
declare var $;
declare var moment: any;
import * as _ from "lodash";
@Component({
  selector: 'app-purchases',
  templateUrl: './purchases.component.html',
  styleUrls: ['./purchases.component.scss']
})
export class PurchasesComponent implements OnDestroy, AfterViewInit, OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: any = new Subject();

  status: string = "true";
  data: any = [];
  filtered: any = [];
  loading: boolean = true;
  usrId: number = 0;

  accounts: any = [];
  accountId: any = '0';
  userId: number = JSON.parse(localStorage.getItem('user')).UserId;
  user:any = JSON.parse(localStorage.getItem('user'));
  role: string =  JSON.parse(localStorage.getItem('user')).Role;
  users:any = [];
  start = moment().subtract(29, "days");
  end = moment();

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
  notifications: any;

  constructor(private apiService: ApiService, private toastr: ToastrService, private excelService: ExcelService, private router: Router) {

  }

  load(){
    this.loading = true;
    $("#myDatatable").DataTable().clear().draw();
    $(".dataTables_empty").text("Loading...");
    this.apiService.get(`bills/Purchase/${this.start.format('YYYY-MM-DD')}/${this.end.format('YYYY-MM-DD')}`).subscribe((res:any)=>{
      this.data = _.orderBy(res, ['InvoiceNo'], ['desc']);
      console.log(res);
      this.loading = false;
      this.fetch();
      this.apiService.get('accounts').subscribe((accs:any)=>{
        localStorage.setItem('accounts', JSON.stringify(accs));
      });
      this.apiService.get('items').subscribe((tms:any)=>{
        localStorage.setItem('items', JSON.stringify(tms));
      });
    });

  }

  fetch() {
    const s = this.status == "true" ? true : false;
    const d = Number(this.accountId);
    const t = Number(this.usrId);
    this.filtered =  this.data.filter(x=>x.Status == s && (d == 0 ? true : x.AccountId == d) && (t == 0 ? true : x.UserId == t));
    //this.dtTrigger.next();
    this.rerender();
  }
  ngOnInit() {
    this.userId = JSON.parse(localStorage.getItem('user')).UserId;
    this.role = JSON.parse(localStorage.getItem('user')).Role;
    this.accounts = JSON.parse(localStorage.getItem('accounts')).filter(x=>x.Deleted == false && x.Role == 'Supplier');
    this.users = JSON.parse(localStorage.getItem('users')).filter(x=>x.Deleted == false);
    this.daterange.start = moment().subtract(29, "days");
    this.daterange.end = moment();
    this.load();
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      processing: true,
      order: [0, 'desc']
    };
  }
  public selectedDate(value: any, datepicker?: any) {
    datepicker.start = value.start;
    datepicker.end = value.end;
    this.daterange.start = value.start;
    this.daterange.end = value.end;
    this.daterange.label = value.label;
    this.start = value.start;
    this.end = value.end;
    this.load();
  }
  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }
  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }
  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next();
    });
  }
  getAccountName(id:number){
    return JSON.parse(localStorage.getItem('users')).find(x=>x.AccountId == id).Name;
  }
  getUserName(id:number){

    return JSON.parse(localStorage.getItem('users')).find(x=>x.UserId == id).UserName;
  }
  add(){
    this.router.navigate(['/invoice/' + this.accountId + '/0']);
  }


  download(){
    const header = ['Invoice No', 'Token No', 'Date', 'Company', 'Item', 'Qty', 'Price', 'Amount', 'Total', 'Past Due', 'Grand Total', 'Payment', 'Total Due',  'Remarks', 'User Name'];
    let data = [];
    let items = JSON.parse(localStorage.getItem('items'));
    _.orderBy(this.filtered, ['InvoiceNo'], ['asc']).forEach((ele:Bill) => {
      var billItems = ele.BillItemsList == null ? [] : JSON.parse(ele.BillItemsList);

      if(billItems.length == 0){
        data.push([
          ele.InvoiceNo,
          ele.Token,
          moment(ele.Date).format('DD/MM/YYYY hh:mm:ss A'),
          this.accounts.find(r=>r.AccountId == ele.AccountId).Name,
          '',
          '',
          '',
          '',
          ele.Total,
          ele.PastDue,
          ele.GrandTotal,
          ele.Payment,
          ele.TotalDue,
          ele.Remarks,
          JSON.parse(localStorage.getItem('users')).find(x=>x.UserId == ele.UserId).UserName
        ]);
      }else{
        for(var i=0;i<billItems.length;i++){
          if(i == 0){
            data.push([
              ele.InvoiceNo,
              ele.Token,
              moment(ele.Date).format('DD/MM/YYYY hh:mm:ss A'),
              this.accounts.find(r=>r.AccountId == ele.AccountId).Name,
              items.find(r=>r.ItemId == billItems[i].ItemId).Code,
              billItems[i].Qty,
              billItems[i].Price,
              billItems[i].Amount,
              ele.Total,
              ele.PastDue,
              ele.GrandTotal,
              ele.Payment,
              ele.TotalDue,
              ele.Remarks,
              JSON.parse(localStorage.getItem('users')).find(x=>x.UserId == ele.UserId).UserName
            ]);
          }else{
            data.push([
              '',
              '',
              '',
              '',
              items.find(r=>r.ItemId == billItems[i].ItemId).Code,
              billItems[i].Qty,
              billItems[i].Price,
              billItems[i].Amount,
              '',
              '',
              '',
              '',
              '',
              '',
              ''
            ]);
          }
        }
      }
    });
    console.log(data);
    this.excelService.generateExcel(header, data, 'Purchases');
  }

  confirmation(u:any){
    var confirmations = u.VerifiedBy == null ? [] : JSON.parse(u.VerifiedBy);

    if(this.user.Role == 'Owner' && u.UserId != this.user.UserId && confirmations.indexOf(this.user.UserId) == -1){
      return 'pending';
    }

    if(this.user.Role == 'Owner' && u.UserId != this.user.UserId && confirmations.indexOf(this.user.UserId) != -1){
      return 'approved';
    }

    if(u.UserId == this.user.UserId && confirmations.length > 0){
      return 'approved';
    }

    if(this.user.Role != 'Owner' && confirmations.length > 0){
      return 'approved';
    }

    return 'waiting';

  }

  checkNegative(u:any){
    var billItems = u.BillItemsList == null ? [] : JSON.parse(u.BillItemsList);
    return billItems.filter(x=>x.Qty < 0).length > 0 ? true : false;
  }

  confirm(u:any){
    if(window.confirm('Are you sure to accept?')){
      this.loading = true;
      this.apiService.get('bills/'+ u).subscribe((data:any)=>{

        var confirmations = data.VerifiedBy == null ? [] : JSON.parse(data.VerifiedBy);
        confirmations.push(this.user.UserId);
        data.VerifiedBy = JSON.stringify(confirmations);

        this.apiService.put('bills/' + data.BillId, data).subscribe((res:any)=>{
          this.loading = false;



          this.toastr.success('Bill Updated Successfully', 'Done!');
          this.load();
        }, (err)=> {
          this.loading = false;
          this.toastr.error('Something went wrong. Try again.', 'Error!');
        });

      });
    }
  }

  delete(id:number){
    console.log(id);
    this.apiService.get('bills/' + id).subscribe((res:any)=>{
      let bill = res;
      var reason = window.prompt('Please enter your reason to delete', '');
      if(reason == null || reason == ''){
        //user cancelled
      }else{
        bill.Note = reason;
        bill.CancelledDate = moment();
        this.loading = true;
        this.apiService.put('bills/' + id, bill).subscribe((r:any)=>{
          this.apiService.delete('bills/'+id).subscribe((t:any)=>{
            this.loading = false;
            this.toastr.success('Bill Deleted Successfully', 'Done!');
            this.load();
          }, (err)=> {
            this.toastr.error('Something went wrong. Try again.', 'Error!');
            this.loading = false;
          });
        });

      }
    })
  }
  edit(u:any){
    this.router.navigate(['/invoice/' + u.AccountId + '/' + u.BillId]);
  }


  getDifference(u:any){
    var date = moment(u.Date).format('YYYY-MM-DD');
    var days = moment(date).diff(moment(), 'days');
    return days == 0 ? true : false;
  }

}


