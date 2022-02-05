import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";
import { ApiService } from 'src/app/services/api.service';
import { Account } from 'src/app/models/Account';
import { ToastrService } from 'ngx-toastr';
import { ExcelService } from 'src/app/services/excel.service';
declare var $;
declare var moment: any;
@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.scss']
})
export class SuppliersComponent implements OnDestroy, AfterViewInit, OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: any = new Subject();

  status: string = "true";
  data: any = [];
  filtered: any = [];
  loading: boolean = true;
  account: Account = new Account();
  search:string = '';
  searchBy: string = '';
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
  constructor(private apiService: ApiService, private toastr: ToastrService, private excelService: ExcelService) { }
  load(){
    this.loading = true;
    $("#myDatatable").DataTable().clear().draw();
    $(".dataTables_empty").text("Loading...");
    this.apiService.get(`accsummary/${this.start.format('YYYY-MM-DD')}/${this.end.format('YYYY-MM-DD')}`).subscribe((res:any)=>{
      console.log(res);
      this.data = res.filter(x=>x.Role == 'Supplier');
      this.loading = false;
      localStorage.setItem('accounts', JSON.stringify(res));
      this.fetch();
    });
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
  fetch() {
    const s = this.status == "true" ? true : false;
    this.filtered =  this.data.filter(x=>x.Status == s);
    if(this.search == 'FirstName'){
      this.filtered = this.filtered.filter(x=>x.FirstName == this.searchBy);
    }
    if(this.search == 'LastName'){
      this.filtered = this.filtered.filter(x=>x.LastName == this.searchBy);
    }
    if(this.search == 'Company'){
      this.filtered = this.filtered.filter(x=>x.Name == this.searchBy);
    }
    if(this.search == 'Mobile'){
      this.filtered = this.filtered.filter(x=>x.Mobile == this.searchBy);
    }
    if(this.search == 'Email'){
      this.filtered = this.filtered.filter(x=>x.Email == this.searchBy);
    }
    //this.dtTrigger.next();
    this.rerender();
  }
  ngOnInit() {
    localStorage.setItem('url-link', 'Suppliers');
    this.daterange.start = moment().subtract(29, "days");
    this.daterange.end = moment();

    this.load();

    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      processing: true,
      order: [0, 'asc']
    };
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


  add(){
    this.account = new Account();
    this.account.AccountId = 0;
    this.account.Role = "Supplier";
    this.account.Status = true;
    this.account.UserId = JSON.parse(localStorage.getItem('user')).UserId;
    $('#myModal').modal('toggle');
  }
  show(){
    $('#tiersTable').modal('toggle');
  }

  edit(u:any){
    this.apiService.get('accounts/' + u).subscribe((res:any)=>{
      this.account = res;
      $('#myModal').modal('toggle');
    })
  }
  remove(u:any){
    this.apiService.get('accounts/' + u).subscribe((res:any)=>{
      this.account = res;
      if(window.confirm('Are you sure to delete perminantly this supplier?')){
        this.account.Deleted = true;
        this.apiService.put('accounts/' + this.account.AccountId, this.account).subscribe((res:any)=>{
          console.log(res);
          this.toastr.success('Updated Successfully', 'Done!');
          this.load();
        }, (err)=> this.toastr.error('Something went wrong. Try again.', 'Error!'));
      }
    });
  }

  delete(u:any){
    this.apiService.get('accounts/' + u).subscribe((res:any)=>{
      this.account = res;
      if(window.confirm('Are you sure to delete supplier?')){
        this.account.Status = !this.account.Status;
        this.apiService.delete('accounts/' + this.account.AccountId).subscribe((res:any)=>{
          console.log(res);
          this.toastr.success('Supplier Updated Successfully', 'Done!');
          this.load();
        }, (err)=> this.toastr.error('Something went wrong. Try again.', 'Error!'));
      }
    })


  }

  save(){
    this.loading = true;
    console.log(this.account);
    this.account.TierId = Number(this.account.TierId);
    if(this.account.AccountId > 0){
      this.apiService.put('accounts/' + this.account.AccountId, this.account).subscribe((res:any)=>{
        console.log(res);
        this.loading = false;
        this.toastr.success('Account Updated Successfully', 'Done!');
        $('#myModal').modal('toggle');
        this.load();
      }, (err)=> {
        this.loading = false;
        this.toastr.error('Something went wrong. Try again.', 'Error!');
      });
    }else{
      this.apiService.post('accounts', this.account).subscribe((res:any)=>{
        console.log(res);
        this.loading = false;
        this.load();
        this.toastr.success('New Account Created Successfully', 'Done!');
        $('#myModal').modal('toggle');
      }, (err)=> {
        this.loading = false;
        this.toastr.error('Something went wrong. Try again.', 'Error!');
      });
    }
  }



  download(){
  //  const header = ['Company', 'First Name', 'Last Name', 'Address', 'Email Id', 'Mobile No', 'Due Limit', 'Balance', 'Other', 'Status'];
  //  const data = this.filtered.map((x:any)=>[x.Name, x.FirstName, x.LastName, x.Address, x.Email, x.Mobile, x.DueLimit, x.TotalDue, x.Other, x.Status == true ? "Active" : "Inactive"]);
   const header = ['Company', 'Due Limit', 'Amount', 'Payment', 'Balance', 'Other', 'Status'];
   const data = this.filtered.map((x:any)=>[x.Name, x.DueLimit, x.Amount, x.Payment, x.TotalDue, x.Other, x.Status == true ? "Active" : "Inactive"]);
   this.excelService.generateExcel(header, data, 'suppliers');
  }
  upload(){
    $('#fileUpload').click();
  }
  onFileChange(ev) {
    const file = ev.target.files[0];
    let accounts = [];
    this.loading = true;
    this.excelService.convertExcelToJson(file).then((res:any)=>{
      console.log(res);
      res.forEach((ele:any) => {
        let account = new Account();
        let found = this.data.find(x=>x.Name == ele['Company']);
        account.AccountId = found == undefined ? 0 : found.AccountId;
        account.Name = ele['Company'];
        // account.FirstName = ele['First Name'];
        // account.LastName = ele['Last Name'];
        // account.Address = ele['Address'];
        // account.Email = ele['Email Id'];
        // account.Mobile = ele['Mobile No'] == null ? '' : ele['Mobile No'].toString();
        account.DueLimit = ele['Due Limit'];
        account.Balance = found == undefined ? ele['Balance'] : found.Balance;
        account.Other = ele['Other'];
        account.Status = ele['Status'] == 'Active' ? true : false;
        account.Role = 'Supplier';
        accounts.push(account);

      });
      console.log(accounts);


      this.apiService.post('imports/accounts', accounts).subscribe((data:any)=>{
        this.toastr.success( data + ' Suppliers Updated', 'Done!');
        this.loading = false;
        this.load();

      }, (err)=> {
        this.toastr.error('Something went wrong. Try again.', 'Error!');
        this.loading = false;
      });

    })

  }

  validate(){
    let error = false;
    if(this.account.Name == undefined || this.account.Name == ''){
      error = true;
    }
    if(this.account.DueLimit == undefined || this.account.DueLimit.toString() == ''){
      error = true;
    }
    if(this.account.Balance == undefined || this.account.Balance.toString() == ''){
      error = true;
    }

    return error;
  }


}

