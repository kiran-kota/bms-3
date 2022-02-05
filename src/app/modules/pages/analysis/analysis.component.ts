import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";
import { ApiService } from 'src/app/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { ExcelService } from 'src/app/services/excel.service';
import * as Highcharts from 'highcharts';
import { concat } from 'lodash';

declare var $;
declare var moment: any;
@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.scss']
})
export class AnalysisComponent implements OnDestroy, AfterViewInit, OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: any = new Subject();

  status: string = "true";
  smartdata: any = [];
  loading: boolean = true;

  role: string = JSON.parse(localStorage.getItem('user')).Role;
  categories: any = [];
  suppliers:any = [];
  items:any = [];
  customers:any= [];
  analysisFilters:any = [];

  chartdata:any = {};

  start = moment().subtract(29, "days");
  end = moment();

  public daterange: any = {
    'profit': {
      start: moment().subtract(29, "days"),
      end: moment()
    },
    'sale': {
      start: moment().subtract(29, "days"),
      end: moment()
    },
    'purchase': {
      start: moment().subtract(29, "days"),
      end: moment()
    }    
  };
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

  chartOption: any = {   
      chart: {
        type: "column"
      },
      title: {
        text: ""
      },
      subtitle:{
        text: ""
      },
      xAxis:{
        categories:[],
        crosshair: true
      },
      yAxis: {  
        title:{
            text:"Amount (Rs.)"
          },
          plotLines: [{
            value: 0,
            color: '#17CDD6',
            dashStyle: 'shortdash',
            width: 2,
            label: {
                text: ''
            }
        }, {
            value: 0,
            color: '#4BD617',
            dashStyle: 'shortdash',
            width: 2,
            label: {
                text: ''
            }
        }] 
      },
      plotOptions: {
        column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
      series: [{
        name: 'Total',
        data: []
    },{
        name: 'Qty',
        data: []
    }]
    };
   //barchart  
    chartOptions: any = {
      'profit': this.chartOption,
      'sale': this.chartOption,
      'purchase': this.chartOption
    }



  constructor(private apiService: ApiService, private toastr: ToastrService, private excelService: ExcelService) { }
 
  load(url){
    this.loading = true;
    $("#myDatatable").DataTable().clear().draw();
    $(".dataTables_empty").text("Loading...");
    this.apiService.get(url).subscribe((res:any)=>{
      this.smartdata = res;
      console.log(res);
      this.loading = false;
      this.rerender();
    });
  }
  
 
  ngOnInit() {


    const start = moment().subtract(29, 'days').format('YYYY-MM-DD');
    const end = moment().format('YYYY-MM-DD');

    this.categories = JSON.parse(localStorage.getItem('categories')).filter(x=>x.Role == 'Item');    
    this.items = JSON.parse(localStorage.getItem('items')).filter(x=>x.Status == true);    
    this.suppliers = JSON.parse(localStorage.getItem('accounts')).filter(x=>x.Role == 'Supplier');    
    this.customers = JSON.parse(localStorage.getItem('accounts')).filter(x=>x.Role == 'Customer');  

    this.apiService.get('analysis-filters').subscribe((res:any)=>{
      localStorage.setItem('analysis-filters', JSON.stringify(res));
    });



    this.daterange.start = moment().subtract(29, "days");
    this.daterange.end = moment();
    this.load(`smartdata/20/30/50/7/[]`);
  
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      processing: true,
      order: [1, 'asc']
    };

 

    this.loadChart('profit', this.start, this.end, [], []);
    this.loadChart('sale', this.start, this.end, [], []);
    this.loadChart('purchase', this.start, this.end, [], []);


    $('.categories').change(function (e) {
      var cat = $(this).val();
      var tg = $(this).attr('data-value');
      var sel = [];
      var sups = [];

      cat.forEach((ele:any) => {
        this.analysisFilters = JSON.parse(localStorage.getItem('analysis-filters'));
        var suppliers = JSON.parse(localStorage.getItem('accounts')).filter(x=>x.Role == 'Supplier');   
        var items = this.analysisFilters.filter(x=>x.CategoryId == Number(ele));
        items.forEach((v:any)=>{
          sel.push({ label: v.Code, title: v.Code, value: v.ItemId, selected: true });
          $.map(v.Accounts, function (x) {
              var k = sups.filter(y => y.value == x).length;
              if (k == 0) {
                var sup = suppliers.find(r=>r.AccountId == x);
                if(sup != undefined){
                  sups.push({ label: sup.Name, title: sup.Name, value: x, selected: true });
                }
              }
          })
        });        
      });

      $('#' + tg +' .suppliers').multiselect('dataprovider', sups);
      $('#' + tg +' .suppliers').multiselect('refresh');
      $('#' + tg +' .items').multiselect('dataprovider', sel);
      $('#' + tg +' .items').multiselect('refresh');  
    });

    $('.suppliers').change(function (e) {
      var sups = $(this).val();
      var tg = $(this).attr('data-value');
      var suppliers = JSON.parse(localStorage.getItem('accounts')).filter(x=>x.Role == 'Supplier'); 
      var items = JSON.parse(localStorage.getItem('items')).filter(x=>x.Status == true);
      var sel = [];
      sups.forEach((ele:any) => { 
        const v = suppliers.find(x=>x.AccountId == Number(ele));
        $.map(v.Items, function (x) {
          var k = sel.filter(y => y.value == x).length;
          if (k == 0) {
            var item = items.find(r=>r.ItemId == x);
            if(item != undefined){
              sel.push({ label: item.Code, title: item.Code, value: x, selected: true });
            }
          }
      });
      });

      $('#' + tg +' .items').multiselect('dataprovider', sel);
      $('#' + tg +' .items').multiselect('refresh');
    });
    
   
  

  }
  public selectedDate(value: any, i: string) {
    // datepicker.start = value.start;
    // datepicker.end = value.end;
    this.daterange[i].start = value.start;
    this.daterange[i].end = value.end;
    this.start = value.start;
    this.end = value.end;  
    console.log('i', i);
  }
  ngOnDestroy(): void {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }
  ngAfterViewInit(): void {
    this.dtTrigger.next();
    $('.multiselect.categories').multiselect({
      allSelectedText: 'All Categories',
      maxHeight: 200,
      includeSelectAllOption: true
    }).multiselect('selectAll', false).multiselect('updateButtonText');
    $('.multiselect.suppliers').multiselect({
      allSelectedText: 'All Suppliers',
      maxHeight: 200,
      includeSelectAllOption: true
    }).multiselect('selectAll', false).multiselect('updateButtonText');
    $('.multiselect.items').multiselect({
      allSelectedText: 'All Items',
      maxHeight: 200,
      includeSelectAllOption: true
    }).multiselect('selectAll', false).multiselect('updateButtonText');
    $('.multiselect.customers').multiselect({
      allSelectedText: 'All Customers',
      maxHeight: 200,
      includeSelectAllOption: true
    }).multiselect('selectAll', false).multiselect('updateButtonText');
    $('.btn-toggle').click(function () {
      $(this).find('.btn').toggleClass('active');

      if ($(this).find('.btn-primary').length > 0) {
          $(this).find('.btn').toggleClass('btn-primary');
      }
      if ($(this).find('.btn-danger').length > 0) {
          $(this).find('.btn').toggleClass('btn-danger');
      }
      if ($(this).find('.btn-success').length > 0) {
          $(this).find('.btn').toggleClass('btn-success');
      }
      if ($(this).find('.btn-info').length > 0) {
          $(this).find('.btn').toggleClass('btn-info');
      }

      $(this).find('.btn').toggleClass('btn-default');
      console.log($(this).attr('data-value'), $(this).find('.btn.active').attr('data-value'));
      // this.chartOptions.chart.type = $(this).find('.btn.active').attr('data-value');
      // Highcharts.chart('chart_profit', this.chartOptions);
    });


 

  }
  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next();
    });
  }
  

  getSmartData(){
    var p1 = parseFloat($('#lastOne').val());
    var p2 = parseFloat($('#lastTwo').val());
    var p3 = parseFloat($('#lastThree').val());
    var p = parseFloat($('#future').val());
    if ((p1 + p2 + p3) != 100) {
        $('#lastOne').css("border-color", "Red");
        $('#lastTwo').css("border-color", "Red");
        $('#lastThree').css("border-color", "Red");
    } else {
        $('#lastOne').css("border-color", "");
        $('#lastTwo').css("border-color", "");
        $('#lastThree').css("border-color", "");

        var items = [];
        $.map($('#spt .items').val(), function (x) {
            items.push(parseInt(x));
        });
        var url = `smartdata/${p1}/${p2}/${p3}/${p}/${JSON.stringify(items)}`; 
        console.log(url);
        // this.apiService.get(url).subscribe((res:any)=>console.log(res));
        this.load(url);
    }
  }

  loadChart(type: string, start:any, end:any, items:any, accounts:any){
    this.loading = true;
    const data = {
      'chart': type,
      'start': start.format('YYYY-MM-DD'),
      'end': end.format('YYYY-MM-DD'),
      'items': items,
      'accounts': accounts
    }

    this.apiService.post(`chartdata`, data).subscribe((res:any)=>{
      this.loading = false;
      console.log(res);
      var p = 'Profit';
      var t = data['chart'];
      // var chart = $('#chart_profit').highcharts();
      if(t == 'sale'){
        p = 'Sale';
      }
      if(t == 'purchase'){
        p = 'Purchase';
      }

      this.chartdata[type] = res;

      var days = res.ChartValues.map(x=>x.Key);
      var total = res.ChartValues.map(x=>x.Total);
      var amount = res.ChartValues.map(x=>x.Amount);
      this.chartOptions[t].title.text = p + ' Chart';
      this.chartOptions[type].subtitle.text = `Total ${p == 'Profit' ? 'Sale' : p}: ${res.Total} , Total ${p == 'Profit' ? 'Profit' : 'Qty'}: ${res.Amount} | Avg ${p == 'Profit' ? 'Sale' : p}: ${res.AvgTotal} , Avg ${p == 'Profit' ? 'Profit' : 'Qty'}: ${res.AvgAmount}`;

      this.chartOptions[t].yAxis.plotLines[0].value = res.AvgTotal;
      this.chartOptions[t].yAxis.plotLines[1].value = res.AvgAmount;
      this.chartOptions[t].xAxis.categories = days;
      this.chartOptions[type].series[0].name = p == 'Profit'? 'Sale' : p;
      this.chartOptions[type].series[1].name = p == 'Profit'? 'Profit': 'Qty';
      this.chartOptions[t].series[0].data = total;
      this.chartOptions[t].series[1].data = amount;
      Highcharts.chart('chart_' + t, this.chartOptions[t]);

    })
  }

  submit(type: string){
    var t = type == "purchase" ? (type + ' .suppliers') : (type + ' .customers');
    var items = [];
    var accounts = [];
    $.map($('#' + type + ' .items').val(), function (x) {
        items.push(parseInt(x));
    });
    $.map($('#' + t).val(), function (x) {
        accounts.push(parseInt(x));
    });
    console.log(items, accounts, this.daterange[type]);
    this.loadChart(type, this.daterange[type].start, this.daterange[type].end, items, accounts);
  }

  donwloadSmartData(){
    const header = ['Code', 'Name', 'Last 30 Days', 'Last 15 Days', 'Last 7 Days', 'Target', 'Actual Stock', 'Percent', 'Stock Required'];
    const data = this.smartdata.map(x=>[x.Code, x.Name, x.LastOne, x.LastTwo, x.LastThree, x.Prediction, x.Available, x.Required, (x.Available - x.Prediction)]);
    this.excelService.generateExcel(header, data, 'smartdata');
  }

  download(type: string){
    
    var headers = ['Code'];
    var days = this.chartdata[type].ChartValues.map(x=>x.Key);
    headers = headers.concat(days);
    
    var data = [];
    var qtys = [];
    var amounts = [];

    var items = $('#' + type + ' .items').val();
    items.map(x=>{
      var qtyList = [this.items.find(r=>r.ItemId == Number(x)).Code];
      var amtList = [this.items.find(r=>r.ItemId == Number(x)).Code];
      days.forEach((day:any) => {
        var item = this.chartdata[type].ItemValues.find(r=>r.Date == day && r.ItemId == Number(x));
        var qty = item == undefined ? 0 :  (type == 'profit' ? item.Total : item.Qty);;
        var amt = item == undefined ? 0 : (type == 'profit' ? item.Profit : item.Total);

        qtyList = qtyList.concat(qty);
        amtList = amtList.concat(amt);

      });
      qtys.push(qtyList);
      amounts.push(amtList);
      
    });
    console.log(qtys, amounts);
    

    this.excelService.generateAnalysisExcel(headers, qtys, amounts, type);
  }

  changeChart(r:String, type:string){
    console.log(r, this.chartdata[type]);
    var p = 'Profit';
    if(type == 'sale'){
      p = 'Sale';
    }
    if(type == 'purchase'){
      p = 'Purchase';
    }

    var days = this.chartdata[type].ChartValues.map(x=>x.Key);
    var total = this.chartdata[type].ChartValues.map(x=>x.Total);
    var amount = this.chartdata[type].ChartValues.map(x=>x.Amount);
    this.chartOptions[type].chart.type = r;
    this.chartOptions[type].title.text = p + ' Chart';
    this.chartOptions[type].subtitle.text = `Total ${p == 'Profit' ? 'Sale' : p}: ${this.chartdata[type].Total} , Total ${p == 'Profit' ? 'Profit' : 'Qty'}: ${this.chartdata[type].Amount} | Avg ${p == 'Profit' ? 'Sale' : p}: ${this.chartdata[type].AvgTotal} , Avg ${p == 'Profit' ? 'Profit' : 'Qty'}: ${this.chartdata[type].AvgAmount}`;
    
    this.chartOptions[type].yAxis.plotLines[0].value = this.chartdata[type].AvgTotal;
    this.chartOptions[type].yAxis.plotLines[1].value = this.chartdata[type].AvgAmount;
    this.chartOptions[type].xAxis.categories = days;
    this.chartOptions[type].series[0].name = p == 'Profit'? 'Sale' : p;
    this.chartOptions[type].series[1].name = p == 'Profit'? 'Profit': 'Qty';
    this.chartOptions[type].series[0].data = total;
    this.chartOptions[type].series[1].data = amount;
    Highcharts.chart('chart_' + type, this.chartOptions[type]);
      
  }


}
