import {Component, OnInit} from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import * as Highcharts from 'highcharts';
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import { MultiDataSet, SingleDataSet, Label, monkeyPatchChartJsLegend, monkeyPatchChartJsTooltip, Color } from 'ng2-charts';

declare var $;
declare var moment: any;
@Component({
  selector: 'app-dash-board',
  templateUrl: './dash-board.component.html',
  styleUrls: ['./dash-board.component.scss']
})
export class DashBoardComponent implements OnInit {

  pin:string = '';

  start = moment().subtract(29, "days");
  end = moment();
  
  data:any;
  summary: any;
  loading: boolean = true;
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
  
  //dashboard chart option
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
      name: 'Sale',
      data: []
  },{
      name: 'Profit',
      data: []
  }]
  };

  //piecharts
  piechartOption1:any = {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    title: {
        text: 'Customer Wise Sales'
    },
  
    plotOptions: {
        pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
                enabled: false
            },
            showInLegend: false
        }
    },
    series: [{
        name: 'Customer',
        colorByPoint: true,
        data:  []
    }]
  }
  piechartOption2:any = {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    title: {
        text: 'Supplier Wise Purchase'
    },
  
    plotOptions: {
        pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
                enabled: false
            },
            showInLegend: false
        }
    },
    series: [{
        name: 'Supplier',
        colorByPoint: true,
        data:  []
    }]
  }


  //balance chartoption
  balanceChartOption:any={
    chart: {
      type: 'line'
    },
    title: {
        text: 'Company Balance Chart'
    },
    subtitle: {
        text: ''
    },
    xAxis: {
        categories: [],
        crosshair: true
    },
    yAxis: {
        title: {
            text: 'Amount (Rs.)'
        },
        plotLines: [{
            value: 0,
            color: '#17CDD6',
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
        name: 'Balance',
        data: [],
        color: '#17CDD6'
    }]
  }
  



 
 

  constructor(private apiService: ApiService) {
 
  }

  ngOnInit() {
    this.daterange.start = moment().subtract(29, "days");
    this.daterange.end = moment();
  
  $('#company_link').on('click', function (e) {
    $("#content").css('display', 'none');
    $("#balance-part").css('display', 'block');
  });
  
  this.apiService.get('summary').subscribe((res:any)=>{
    this.summary = res;
    console.log(this.summary);
    this.loading = false;
  });
  this.loadDashboard();
  this.loadBalance();
  
  }
  goForDashboard(){
    $("#hideCont").css('display', 'none');  
    $("#content").css('display', 'block');
    // let user = JSON.parse(localStorage.getItem('user'));
    // if(user.Pin == this.pin){
    //   $("#hideCont").css('display', 'none');  
    //   $("#content").css('display', 'block');
    // }    
  }
  public selectedDate(value: any, datepicker?: any) {
    datepicker.start = value.start;
    datepicker.end = value.end;
    this.daterange.start = value.start;
    this.daterange.end = value.end;
    this.daterange.label = value.label;
    this.start = value.start;
    this.end = value.end;  
  }

  loadDashboard(){
    this.apiService.get(`dashboard/${this.start.format('YYYY-MM-DD')}/${this.end.format('YYYY-MM-DD')}`).subscribe((res:any)=>{
      console.log(res);
      this.data = res;
      const accounts = JSON.parse(localStorage.getItem('accounts'));
     
  
      this.chartOption.title.text = 'Day Wise Sales & Profit Chart';
      this.chartOption.subtitle.text = `Total Sale: ${res.chartSummary.Total} , Total Profit: ${res.chartSummary.Amount} | Avg Sale: ${res.chartSummary.AvgTotal} , Avg Profit: ${res.chartSummary.AvgAmount}`;
      
      this.chartOption.yAxis.plotLines[0].value = res.chartSummary.AvgTotal;
      this.chartOption.yAxis.plotLines[1].value = res.chartSummary.AvgAmount;
      this.chartOption.xAxis.categories = res.chartSummary.ChartValues.map(x=>x.Key);
      this.chartOption.series[0].data = res.chartSummary.ChartValues.map(x=>x.Total);
      this.chartOption.series[1].data = res.chartSummary.ChartValues.map(x=>x.Amount);
      Highcharts.chart('chart_dashboard', this.chartOption);
      
      let chartValues1 = [];
      res.customerPieChart.forEach((x:any)=>{
        let t = {
          name: accounts.find(y=>y.AccountId == x.Key).Name,
          y: x.Total
        }
        chartValues1.push(t);
      });
  
      let chartValues2 = [];
      res.supplierPieChart.forEach((x:any)=>{
        let t = {
          name: accounts.find(y=>y.AccountId == x.Key).Name,
          y: x.Total
        }
        chartValues2.push(t);
      });
  
      
      this.piechartOption1.series[0].data = chartValues1;
      Highcharts.chart('chart_customer', this.piechartOption1);
  
      this.piechartOption2.series[0].data = chartValues2;
      Highcharts.chart('chart_supplier', this.piechartOption2);
  
    });
  }
  loadBalance(){
    this.apiService.get(`balancechart/${this.start.format('YYYY-MM-DD')}/${this.end.format('YYYY-MM-DD')}`).subscribe((res:any)=>{
      console.log(res);
      this.balanceChartOption.xAxis.categories = res.map(x=>moment(x.Date).format('DD MMM YY'));
      this.balanceChartOption.series[0].data = res.map(x=>x.Total);
      Highcharts.chart('chart_company', this.balanceChartOption);
    });
  }

}
