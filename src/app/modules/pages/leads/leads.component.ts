import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";
import { ApiService } from 'src/app/services/api.service';
import { Account } from 'src/app/models/Account';
import { ToastrService } from 'ngx-toastr';
import { ExcelService } from 'src/app/services/excel.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Details } from 'src/app/models/Details';
declare var $;
declare var moment: any;
@Component({
  selector: 'app-leads',
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.scss']
})
export class LeadsComponent implements OnDestroy, AfterViewInit, OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: any = new Subject();

  status: string = "true";
  data: any = [];
  filtered: any = [];
  loading: boolean = true;
  account: Account = new Account();
  tiers: any = [];
  role:string = JSON.parse(localStorage.getItem('user')).Role;
  search:string = '';
  searchBy: string = '';
  details: Details = new Details();
  list:any = [];
  t: number = -1;
  constructor(private apiService: ApiService, private toastr: ToastrService, private excelService: ExcelService, private firestore: AngularFirestore) { }
  load(){
    this.loading = true;
    $("#myDatatable").DataTable().clear().draw();
    $(".dataTables_empty").text("Loading...");
    this.firestore.collection('users').snapshotChanges().subscribe((res:any)=>{
      this.data = res.map(e => {
        return e.payload.doc.data();
      });
      this.loading = false;
      this.fetch(-1);
    });

  }

  fetch(i:number) {

    this.t = i;
    const s = this.status == "true" ? true : false;

    if(i == -1){
      this.filtered =  this.data.filter(x=>x.verified == false);
    }
    if(i == 1){
      this.filtered =  this.data.filter(x=>x.status == true && x.verified == true);
    }

    if(i == 0){
      this.filtered =  this.data.filter(x=>x.status == false);
    }


    console.log(this.filtered, this.search, this.searchBy);

    if(this.search == 'brand'){
      this.filtered = this.filtered.filter(x=>x.brands.indexOf(this.searchBy) > -1);
    }

    if(this.search == 'displayname'){
      this.filtered = this.filtered.filter(x=>x.displaynames.indexOf(this.searchBy) > -1);
    }

    if(this.search == 'mobile'){
      this.filtered = this.filtered.filter(x=>x.mobile.indexOf(this.searchBy) > -1);
    }



    //this.dtTrigger.next();
    this.rerender();
  }
  ngOnInit() {
    localStorage.setItem('url-link', 'CDF');
    this.role = JSON.parse(localStorage.getItem('user')).Role;
    this.tiers = JSON.parse(localStorage.getItem('tiers'));
    this.load();

    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      processing: true,
      order: [0, 'desc']
    };

    $('.multiselect.sites').multiselect({
      allSelectedText: 'All Online Sites',
      maxHeight: 200,
      minWidth: 170,
      includeSelectAllOption: true
    }).multiselect('selectAll', false).multiselect('updateButtonText');
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
    this.details = new Details();
    $('#cdfModal').modal('toggle');
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

  approve(u:any){
    var found = this.data.find(r=>r.uid == u);
    console.log(found);
    if(found != null){
      this.account = new Account();
      this.account.AccountId = 0;
      this.account.Name = found.company;
      this.account.FirstName = found.name;
      this.account.Address = found.address;
      this.account.Email = found.email;
      this.account.Mobile = found.mobile;
      this.account.Role = 'Customer';
      this.account.Status = true;
      this.account.UserId = JSON.parse(localStorage.getItem('user')).UserId;
      $('#myModal').modal('toggle');
    }
  }

  delete(u:any){
    var found = this.data.find(r=>r.uid == u);
    if(window.confirm('Are you sure?')){
      found.status = !found.status;
      this.firestore.doc('users/' + found.uid).update(found);
      this.toastr.success('Status updated', 'Done!');
     // this.load();
    }
  }
  remove(u:any){
    var found = this.data.find(r=>r.uid == u);
    if(window.confirm('Are you sure to delete it?')){
      this.firestore.doc('users/' + found.uid).delete();
      this.toastr.success('Deleted from CDF', 'Done!');
     // this.load();
    }
  }

  save(){
    this.loading = true;
    console.log(this.account);
    this.account.TierId = Number(this.account.TierId);
    this.apiService.post('accounts', this.account).subscribe((res:any)=>{
      console.log(res);
      this.loading = false;
      this.toastr.success('New Customer Approved Successfully', 'Done!');
      $('#myModal').modal('toggle');
      var found = this.data.find(r=>r.uid == this.account.Email);
      found.verified = true;

      this.firestore.doc('users/' + found.uid).update(found);
    }, (err)=> {
      this.loading = false;
      this.toastr.error('Something went wrong. Try again.', 'Error!');
    });
  }

  getTier(id:number){
    return this.tiers.find(x=>x.TierId == id).Code;
  }
  getTierId(code: string){
    return this.tiers.find(x=>x.Code == code).TierId;
  }

  download(){
   const header = ['Company', 'Name', 'Email', 'Reference', 'Reference Person', 'Brands', 'Platforms', 'Address', 'Mobile', 'Verfied', 'Status'];
   const data = this.filtered.map((x:any)=>
   [
    x.company,
    x.name,
    x.email,
    // x.date.seconds != null ? moment(x.date.seconds * 1000).format('DD/MM/YYYY') : moment(x.date).format('DD/MM/YYYY'),
    x.reference,
    x.refperson,
    x.brands,
    x.sites.join(', '),
    x.address,
    x.mobile,
    x.verified == true ? 'Verified' : 'Pending',
    x.status == true ? 'Active' : 'Inactive'
   ]);
   this.excelService.generateExcel(header, data, 'cdf');
  }


  validate(){
    if(this.account.Name == undefined || this.account.Name == ''){
      return true;
    }
    if(this.account.DueLimit == undefined || this.account.DueLimit.toString() == ''){
      return true;
    }
    if(this.account.Balance == undefined || this.account.Balance.toString() == ''){
      return true;
    }
    if(this.account.TierId == undefined){
      return true;
    }
    return false;
  }
  validateForm(){
    if(this.details.name == undefined || this.details.name == ''){
      return true;
    }
    if(this.details.email == undefined || this.details.email == ''){
      return true;
    }
    if(this.details.mobile == undefined || this.details.mobile == ''){
      return true;
    }

    if(this.details.email != undefined && this.details.email != ''){
      let count = this.data.filter(x=>x.email.toLowerCase() == this.details.email.toLowerCase()).length;
      return count == 0 ? false : true;
    }
    if(this.details.company != undefined && this.details.company != ''){
      let count = this.data.filter(x=>x.company.toLowerCase() == this.details.company.toLowerCase()).length;
      return count == 0 ? false : true;
    }
    if(this.details.mobile != undefined && this.details.mobile != ''){
      let count = this.data.filter(x=>x.mobile.toLowerCase() == this.details.mobile.toLowerCase()).length;
      return count == 0 ? false : true;
    }
    return false;
  }

  submit(){
    console.log(this.details);
    this.details.verified = false;
    this.details.status = true;
    this.details.sites = $('.sites').val();
    this.details.uid = this.details.email;
    let str = JSON.stringify(this.details);
    $('#cdfModal').modal('toggle');
    this.firestore.collection('users').doc(this.details.email).set(JSON.parse(str));
  }

}
