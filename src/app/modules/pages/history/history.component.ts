import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";
import { ApiService } from 'src/app/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { ExcelService } from 'src/app/services/excel.service';
import { Expense } from 'src/app/models/Expense';
declare var $;
declare var moment: any;
@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: any = new Subject();

  status: string = "true";
  data: any = [];
  filtered: any = [];
  loading: boolean = true;
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

  constructor(private apiService: ApiService, private toastr: ToastrService, private excelService: ExcelService) { }
  load(){
    this.loading = true;
    $("#myDatatable").DataTable().clear().draw();
    $(".dataTables_empty").text("Loading...");
    this.apiService.get(`histories/${this.start.format('YYYY-MM-DD')}/${this.end.format('YYYY-MM-DD')}`).subscribe((res:any)=>{
      this.data = res;
      this.loading = false;
      this.fetch();
    });
  }
  
  fetch() {
    this.filtered =  this.data;
    //this.dtTrigger.next();
    this.rerender();
  }
  ngOnInit() {
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
  download(){
    
    const header = ['Date', 'Details', 'User'];
    const data = this.filtered.map(x=>[moment(x.Date).format('DD/MM/YYYY hh:mm:ss A'), x.Description, this.users.find(r=>r.UserId == x.UserId).UserName]);
    this.excelService.generateExcel(header, data, 'history');
  }
  getUser(id:number){
    return this.users.find(r=>r.UserId == id).UserName;
  }

}
