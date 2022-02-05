import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";
import { ApiService } from 'src/app/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { ExcelService } from 'src/app/services/excel.service';
import { Transfer } from 'src/app/models/Transfer';
import { AngularFirestore } from '@angular/fire/firestore';
declare var $;
declare var moment: any;
@Component({
  selector: 'app-transfers',
  templateUrl: './transfers.component.html',
  styleUrls: ['./transfers.component.scss']
})
export class TransfersComponent implements OnDestroy, AfterViewInit, OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: any = new Subject();

  status: string = "true";
  data: any = [];
  filtered: any = [];
  loading: boolean = true;

  userId: any = 0;
  toUserId: any = 0;
  users:any = [];
  user:any;
  transfer: Transfer = new Transfer();
  notifications: any = [];
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

  constructor(private apiService: ApiService, private toastr: ToastrService, private excelService: ExcelService) {

   }
  load(){
    this.loading = true;
    $("#myDatatable").DataTable().clear().draw();
    $(".dataTables_empty").text("Loading...");
    this.apiService.get(`transfers/${this.start.format('YYYY-MM-DD')}/${this.end.format('YYYY-MM-DD')}`).subscribe((res:any)=>{
      this.data = res.filter(r=>this.user.Role == 'Employee' ? (r.UserId == this.user.UserId || r.ToUser == this.user.UserId) : true);;
      this.loading = false;
      this.fetch();
    });
  }

  fetch() {
    const s = this.status == "true" ? true : false;
    const t = Number(this.toUserId);
    const f = Number(this.userId);
    this.filtered =  this.data.filter(x=>(t == 0 ? true : x.ToUser== t) && (f == 0 ? true : x.UserId == f));
    //this.dtTrigger.next();
    this.rerender();
  }
  ngOnInit() {
    localStorage.setItem('url-link', 'Transfers');
    this.user = JSON.parse(localStorage.getItem('user'));
    this.users = JSON.parse(localStorage.getItem('users')).filter(x=>x.Deleted == false && x.UserName != 'Admin');
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
  confirm(u:any){
    if(window.confirm('Are you sure to accept?')){
      this.transfer = u;
      this.transfer.Status = true;
      this.loading = true;
      this.apiService.put('transfers/' + this.transfer.TransferId, this.transfer).subscribe((res:any)=>{
        console.log(res);

        this.loading = false;
        this.toastr.success('Transfer Updated Successfully', 'Done!');
        this.load();
      }, (err)=> {
        this.loading = false;
        this.toastr.error('Something went wrong. Try again.', 'Error!');
      });
    }
  }

  add(){
    this.transfer = new Transfer();
    this.transfer.TransferId = 0;
    this.transfer.Date = moment();
    this.transfer.UserId = JSON.parse(localStorage.getItem('user')).UserId;
    $('#myModal').modal('toggle');
  }

  edit(u:any){
    this.apiService.get('transfers/' + u).subscribe((res:any)=>{
      this.transfer = res;
      $('#myModal').modal('toggle');
    });
  }
  delete(u:any){
    if(window.confirm('Do you want to delete?')){
      $('#myModal').modal('toggle');
      this.apiService.delete('transfers/' + u).subscribe((res:any)=>{
        this.toastr.success('Transfer Deleted Successfully', 'Done!');
        this.load();
      })
    }
  }
  save(){
    this.transfer.ToUser = Number(this.transfer.ToUser);
    console.log(this.transfer);
    this.loading = true;
    if(this.transfer.TransferId > 0){
      this.apiService.put('transfers/' + this.transfer.TransferId, this.transfer).subscribe((res:any)=>{
        console.log(res);
        this.toastr.success('Transfer Updated Successfully', 'Done!');
        $('#myModal').modal('toggle');
        this.loading = false;
        this.load();
      }, (err)=> {
        this.loading = false;
        this.toastr.error('Something went wrong. Try again.', 'Error!');
      });
    }else{
      this.apiService.post('transfers', this.transfer).subscribe((res:any)=>{
        console.log(res);
        this.loading = false;
        this.load();
        this.toastr.success('New Transfer Created Successfully', 'Done!');
        $('#myModal').modal('toggle');
      }, (err)=> {
        this.loading = false;
        this.toastr.error('Something went wrong. Try again.', 'Error!');
      });
    }
  }
  getUserName(id:number){
    return JSON.parse(localStorage.getItem('users')).find(x=>x.UserId == id).UserName;
  }
  download(){
    const header = ['Date', 'Description', 'Amount', 'From User', 'To User', 'Status'];
    const data = this.filtered.map(x=>[moment(x.Date).format('DD/MM/YYYY hh:mm:ss A'), x.Description, x.Payment, JSON.parse(localStorage.getItem('users')).find(r=>r.UserId == x.UserId).UserName, JSON.parse(localStorage.getItem('users')).find(r=>r.UserId == x.ToUser).UserName, x.Status == true ? 'Accepted': 'Pending']);
    this.excelService.generateExcel(header, data, 'transfers');
  }

  validate(){
    let error = false;

    if(this.transfer.Payment == undefined || this.transfer.Payment.toString() == ''){
      error = true;
    }

    if(this.transfer.Description == undefined || this.transfer.Description == ''){
      error = true;
    }

    if(this.transfer.ToUser == undefined || this.transfer.ToUser.toString() == ''){
      error = true;
    }
    return error;
    }

}
