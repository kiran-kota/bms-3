import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

import { ApiService } from 'src/app/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MustUnique } from './../../../helpers/must-unique.validator';
import { User } from 'src/app/models/User';
import { AngularFirestore } from '@angular/fire/firestore';
declare var $;
declare var moment: any;

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnDestroy, AfterViewInit, OnInit {
@ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;


user: User = new User();
roles = ['Dashboard', 'CDF', 'Customers', 'Items', 'Sales', 'Quotation', 'Suppliers', 'Purchases', 'Expenses', 'Transfers', 'Analysis', 'Rojmeds', 'Users', 'History'];
data: any = [];
filtered: any = [];
status:string="true";
loading:boolean = false;
dtOptions: DataTables.Settings = {};
dtTrigger: any = new Subject();
role: string = JSON.parse(localStorage.getItem('user')).Role;
userId: number = JSON.parse(localStorage.getItem('user')).UserId;

search:string = '';
searchBy: string = '';

constructor(private apiService: ApiService, private toastr: ToastrService, private formBuilder: FormBuilder, private firestore: AngularFirestore) { }

load(){
  $("#myDatatable").DataTable().clear().draw();
  $(".dataTables_empty").text("Loading...");
  this.apiService.get('users').subscribe((res:any)=>{
    this.data = res.filter(x=>x.Deleted == false && (this.role == 'Admin' ? true : x['Role'] != "Admin"));
    this.fetch();
  });
}
fetch() {
  const s = this.status == "true" ? true : false;
  this.filtered = this.role == 'Employee' ?  this.data.filter(x=>x.Status == s && x.UserId == this.userId) : this.data.filter(x=>x.Status == s);


  if(this.search == 'Mobile'){
    this.filtered = this.filtered.filter(x=>x.Mobile == this.searchBy);
  }
  if(this.search == 'Email'){
    this.filtered = this.filtered.filter(x=>x.Email == this.searchBy);
  }


  //this.dtTrigger.next();
  this.rerender();
}
getTotalDue(u:any){
  return u.Sale - u.Purchase + u.Received - u.Transfered + u.Expense + u.Balance;
}

ngOnInit() {
  this.role = JSON.parse(localStorage.getItem('user')).Role;
  this.userId = JSON.parse(localStorage.getItem('user')).UserId;
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
  $('.multiselect.permissions').multiselect({
    allSelectedText: 'All Permissions',
    maxHeight: 200,
    includeSelectAllOption: true
  }).multiselect('selectAll', false).multiselect('updateButtonText');
}
rerender(): void {
  this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
    dtInstance.destroy();
    this.dtTrigger.next();
  });
}

add(){
  this.user = new User();
  this.user.UserId = 0;
  this.user.Status = true;

  var sel = [];
  $.map(this.roles, function (x) {
    sel.push({ label: x, title: x, value: x, selected: false });
  });

  $('.permissions').multiselect('dataprovider', sel);
  $('.permissions').multiselect('refresh');
  $('#myModal').modal('toggle');
}

edit(u:any){

  this.apiService.get('users/' + u).subscribe((res:any)=>{
    this.user = res;
    console.log(this.user);
    if(this.user.Role == 'Employee'){
      var data = JSON.parse(this.user.Tabs);

      var sel = [];
      $.map(this.roles, function (x) {
          var k = data.filter(y => y == x).length;
          if (k == 0) {
            sel.push({ label: x, title: x, value: x, selected: false });
          }else{
            sel.push({ label: x, title: x, value: x, selected: true });
          }
      });

      $('.permissions').multiselect('dataprovider', sel);
      $('.permissions').multiselect('refresh');
    }
    $('#myModal').modal('toggle');
  })

}
delete(u:any){
  this.apiService.get('users/' + u).subscribe((res:any)=>{
    this.user = res;
    if(window.confirm('Are you sure to delete user?')){
      this.user.Status = !this.user.Status;
      this.apiService.put('users/' + this.user.UserId, this.user).subscribe((res:any)=>{
        console.log(res);
        this.toastr.success('User Updated Successfully', 'Done!');
        this.load();
      }, (err)=> this.toastr.error('Something went wrong. Try again.', 'Error!'));
    }
  });
}
save(){
  this.loading = true;
  this.user.Tabs = (this.role == 'Owner' || this.role == 'Admin') ? JSON.stringify($('.permissions').val()) : this.user.Tabs;
  if(this.user.UserId > 0){
    this.apiService.put('users/' + this.user.UserId, this.user).subscribe((res:any)=>{
      console.log(res);
      this.loading = false;
      this.toastr.success('User Updated Successfully', 'Done!');
      $('#myModal').modal('toggle');

      this.load();
    }, (err)=>{
      this.loading = false;
      this.toastr.error('Something went wrong. Try again.', 'Error!');
    });
  }else{
    this.apiService.post('users', this.user).subscribe((res:any)=>{
      console.log(res);
      this.loading = false;
      $('#myModal').modal('toggle');

      this.load();
      this.toastr.success('New User Created Successfully', 'Done!');
    }, (err)=>{
      this.loading = false;
      this.toastr.error('Something went wrong. Try again.', 'Error!');
    });
  }
}

validate(){
  let error = false;
  if(this.user.UserName == undefined || this.user.UserName == ''){
    error = true;
  }
  if(this.user.Password == undefined || this.user.Password == ''){
    error = true;
  }
  if(this.user.Role == undefined || this.user.Role == ''){
    error = true;
  }
  if(this.user.Email == undefined || this.user.Email == ''){
    error = true;
  }
  if(this.user.Mobile == undefined || this.user.Mobile == ''){
    error = true;
  }
  if(this.user.Balance == undefined || this.user.Balance.toString() == ''){
    error = true;
  }

  return error;

}




}
