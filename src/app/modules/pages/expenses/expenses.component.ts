import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";
import { ApiService } from 'src/app/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { ExcelService } from 'src/app/services/excel.service';
import { Expense } from 'src/app/models/Expense';
import { AngularFirestore } from '@angular/fire/firestore';
declare var $;
declare var moment: any;
@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnDestroy, AfterViewInit, OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: any = new Subject();

  status: string = "true";
  data: any = [];
  filtered: any = [];
  loading: boolean = true;
  categories: any = [];

  userId: number = 0;
  categoryId: any = 0;
  cashId: any = 0;
  users:any = [];
  user:any;
  expense: Expense = new Expense();

  start = moment().subtract(29, "days");
  end = moment();

  notifications: any;

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
    this.apiService.get(`expenses/${this.start.format('YYYY-MM-DD')}/${this.end.format('YYYY-MM-DD')}`).subscribe((res:any)=>{
      this.data = res.filter(r=>this.user.Role == 'Employee' ? r.UserId == this.user.UserId : true);
      console.log(res);
      this.loading = false;
      this.fetch();
    });
  }

  fetch() {
    const s = this.status == "true" ? true : false;
    const t = Number(this.categoryId);
    const c = Number(this.cashId);
    const u = Number(this.userId);
    this.filtered =  this.data.filter(r=>(c == 0 ? true : (c == 1 ? r.Payment > 0 : r.Payment < 0)) && (u == 0 ? true : r.UserId == u) && (t == 0 ? true : r.CategoryId == t));
    //this.dtTrigger.next();
    this.rerender();
  }
  ngOnInit() {
    localStorage.setItem('url-link', 'Expenses');
    $('#toggle-event').bootstrapToggle();
    this.user = JSON.parse(localStorage.getItem('user'));
    localStorage.setItem('category_role', 'Expense');
    this.categories = JSON.parse(localStorage.getItem('categories')).filter(x=>x.Role == 'Expense');
    this.users = JSON.parse(localStorage.getItem('users')).filter(r=>r.Deleted == false && r.UserName != 'Admin');
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


  add(){
    this.expense = new Expense();
    this.expense.Date = moment();
    this.expense.UserId = this.user.UserId;
    this.expense.ExpenseId = 0;
    $('#myModal').modal('toggle');
  }
  show(){
    $('#categoriesTable').modal('toggle');
  }
  edit(u:any){
    this.apiService.get('expenses/' + u).subscribe((res:any)=>{
      this.expense = res;
      if(this.expense.Payment > 0){
        $('#toggle-event').bootstrapToggle('on');
      }else{
        $('#toggle-event').bootstrapToggle('off');
        this.expense.Payment = this.expense.Payment * -1;
      }
      $('#myModal').modal('toggle');
    });
  }

  confirmation(u:any){
    var confirmations = u.VerifiedBy == null ? [] : JSON.parse(u.VerifiedBy);
    if(this.user.Role == 'Owner' && u.UserId != this.user.UserId && confirmations.indexOf(this.user.UserId) == -1){
      return 'pending';
    }
    if(u.Status == true){
      return 'approved';
    }else{
      return 'waiting';
    }
  }

  confirm(u:any){
    if(window.confirm('Are you sure to accept?')){
      this.expense = u;
      this.expense.Status = true;
      var confirmations = this.expense.VerifiedBy == null ? [] : JSON.parse(this.expense.VerifiedBy);
      confirmations.push(this.user.UserId);
      this.expense.VerifiedBy = JSON.stringify(confirmations);
      console.log(this.expense);
      this.loading = true;
      this.apiService.put('expenses/' + this.expense.ExpenseId, this.expense).subscribe((res:any)=>{
        console.log(res);
        this.loading = false;
        this.toastr.success('Expense Updated Successfully', 'Done!');
        this.load();
      }, (err)=> {
        this.loading = false;
        this.toastr.error('Something went wrong. Try again.', 'Error!');
      });
    }
  }
  delete(u:any){
    if(window.confirm('Do you want to delete?')){
      $('#myModal').modal('toggle');
      this.apiService.delete('expenses/' + u).subscribe((res:any)=>{
        this.toastr.success('Expense Deleted Successfully', 'Done!');
        this.load();
      })
    }
  }
  save(){
    let m = $('#toggle-event').prop('checked') == true ? 1 : -1;
    this.expense.Payment = Number(this.expense.Payment) * m;
    this.expense.CategoryId = Number(this.expense.CategoryId);
    console.log(this.expense);
    this.loading = true;
    if(this.expense.ExpenseId > 0){
      this.apiService.put('expenses/' + this.expense.ExpenseId, this.expense).subscribe((res:any)=>{
        console.log(res);
        this.loading = false;
        this.toastr.success('Expense Updated Successfully', 'Done!');
        $('#myModal').modal('toggle');
        this.load();
      }, (err)=> {
        this.loading = false;
        this.toastr.error('Something went wrong. Try again.', 'Error!');
      });
    }else{
      this.apiService.post('expenses', this.expense).subscribe((res:any)=>{
        console.log(res);
        this.loading = false;

        this.load();
        this.toastr.success('New Expense Created Successfully', 'Done!');
        $('#myModal').modal('toggle');
      },  (err)=> {
        this.loading = false;
        this.toastr.error('Something went wrong. Try again.', 'Error!');
      });
    }
  }

  getUserName(id:number){
    return JSON.parse(localStorage.getItem('users')).find(x=>x.UserId == id).UserName;
  }
  getCategoryName(id:number){
    return this.categories.find(x=>x.CategoryId == id).Name;
  }
  download(){
    const header = ['Id', 'Date', 'Description', 'Amount', 'Category', 'User', 'Status'];
    const data = this.filtered.map(x=>[x.ExpenseId, moment(x.Date).format('DD/MM/YYYY hh:mm:ss A'), x.Description, x.Payment * -1, this.categories.find(r=>r.CategoryId == x.CategoryId).Code, this.users.find(r=>r.UserId == x.UserId).UserName, x.Status == true ? 'Accepted': 'Pending']);
    this.excelService.generateExcel(header, data, 'expenses');
  }

  validate(){
    let error = false;

    if(this.expense.Payment == undefined || this.expense.Payment.toString() == ''){
      error = true;
    }

    if(this.expense.Description == undefined || this.expense.Description == ''){
      error = true;
    }

    if(this.expense.CategoryId == undefined || this.expense.CategoryId.toString() == ''){
      error = true;
    }
    return error;
    }

}
