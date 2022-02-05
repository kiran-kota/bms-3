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
@Component({
  selector: 'app-quotations',
  templateUrl: './quotations.component.html',
  styleUrls: ['./quotations.component.scss']
})
export class QuotationsComponent implements OnDestroy, AfterViewInit, OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: any = new Subject();
  seletedAccountId: number;
  status: string = "true";
  data: any = [];
  filtered: any = [];
  loading: boolean = true;
  accounts:any = JSON.parse(localStorage.getItem('accounts')).filter(x=>x.Role == 'Customer');
  tiers: any = JSON.parse(localStorage.getItem('tiers'));
  tierId: any = '0';
  user:any = JSON.parse(localStorage.getItem('user'));
  userId: number = JSON.parse(localStorage.getItem('user')).UserId;
  users:any = [];
  start = moment().subtract(29, "days");
  end = moment();
  selected:any = [];
  uid: String;
  PUSH_CHARS:String = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";

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
  
  constructor(private apiService: ApiService, private toastr: ToastrService, private excelService: ExcelService, private router: Router, private firestore: AngularFirestore) { 
 
  }

  load(){
    this.loading = true;
    $("#myDatatable").DataTable().clear().draw();
    $(".dataTables_empty").text("Loading...");

    this.firestore.collection('quotations').snapshotChanges().subscribe((res:any)=>{
    
      this.data = res.map(e => {
        console.log(e.payload);
        return { id: e.payload.doc.id, data: e.payload.doc.data()};        
      });     
      this.loading = false;
      console.log('quotations', this.data);
      this.fetch();
    });
   
   
    
  }
  
  fetch() {
    const s = this.status == "true" ? true : false;
    const d = Number(this.tierId);
    this.filtered =  this.data.filter(x=>x.data.Status == s && (d == 0 ? true : x.data.AccountId == d));
    //this.dtTrigger.next();
    this.rerender();
  }
  ngOnInit() {
    this.userId == JSON.parse(localStorage.getItem('user')).UserId;
    this.users = JSON.parse(localStorage.getItem('users'));
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
  getTierCode(id:number){
    return this.tiers.find(x=>x.TierId == id).Code;
  }
  getUserName(id:number){
    return this.users.find(x=>x.UserId == id).UserName;
  }
  add(){
    this.router.navigate(['/quotation/' + this.tierId + '/0']);
  }

  edit(u:any){
    this.router.navigate(['/quotation/' + u.data.AccountId + '/' + u.id]);
  }
  delete(u:any){
    if(window.confirm('Are you sure to delete this quotation?')){
      this.firestore.collection('quotations').doc(u.id).delete();
    }
  }
  print(u:any, i:any){
    window.open('/order/' + i.toString() + '/' + u.id);
  }
  confirm(u:any){
    this.uid = u.id;
    this.apiService.get('accounts').subscribe((res:any)=>{
      localStorage.setItem('accounts', JSON.stringify(res));
      this.selected = res.filter(x=>x.TierId == u.data.AccountId);
      $('#customersTable').modal('toggle');
    

    });
  }

 decode(id:string) {
  id = id.substring(0,8);
  var timestamp = 0;
  for (var i=0; i < id.length; i++) {
    var c = id.charAt(i);
    timestamp = timestamp * 64 + this.PUSH_CHARS.indexOf(c);
  }
  return timestamp;
}
  export(){
    $('#customersTable').modal('toggle');
    const id = Number(this.seletedAccountId);
    console.log(id);
    this.router.navigate(['/invoice/' + id + '/0'], { queryParams: { uid: this.uid} });
  }
  
}


