import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
// import * as html2pdf from 'html2pdf.js';
import * as jsPDF from 'jspdf';
declare var $;
declare var moment: any;
@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  @ViewChild('pdfTable', {static: false}) pdfTable: ElementRef;

  loading: boolean = false;
  rojmeds:any = [];
  users:any = [];
  date: Date = moment();
  start = moment().subtract(29, "days").format('YYYY-MM-DD');
  end = moment().format('YYYY-MM-DD');
  
  constructor(private route: ActivatedRoute, private apiService: ApiService) { }

  ngOnInit() {
    this.users = JSON.parse(localStorage.getItem('users')).filter(x=>x.UserName != 'Admin');
    $('body').css('background', 'white');
    const start = this.route.snapshot.paramMap.get("start");
    const end = this.route.snapshot.paramMap.get("end");
    this.getReport(start, end);
    //this.getData();
  }
  getReport(start:String, end: String){
    this.loading = true;
    this.apiService.get(`report/${start}/${end}`).subscribe((res:any)=>{
      console.log(res);
      this.rojmeds = res;
      this.loading = false;
    }, (err)=>{
      this.loading = false;
      console.log(err);
    });
  }
  
  getUser(id:number, i:number){
    return this.rojmeds[i].find(x=>x.UserId == id);
  }
  getAvailable(id:number, i:number){
    if(this.rojmeds[i].length == 0){
      return 0;
    }
    var user = this.rojmeds[i].find(x=>x.UserId == id);
    return user.Balance + user.PastSale + user.PastReceived - user.PastPurchase - user.PastTransfered - user.PastExpense;
  }
  getBalance(id:number, i:number){
    if(this.rojmeds[i].length == 0){
      return 0;
    }
    var user = this.rojmeds[i].find(x=>x.UserId == id);
    return this.getAvailable(id, i) + user.Sale + user.Received - user.Purchase - user.Transfered - user.Expense;
  }

  public downloadAsPDF() {
    const doc = new jsPDF('p', 'mm', 'a4');

    const specialElementHandlers = {
      '#editor': function (element, renderer) {
        return true;
      }
    };

    const pdfTable = this.pdfTable.nativeElement;

    doc.fromHTML(pdfTable.innerHTML);

    doc.save('tableToPdf.pdf');
  }

  // onExport(){
  //   const options = {
  //     filename: 'rojemed.pdf',
  //     'image': {type: 'jpeg'},
  //     'html2convas': {},
  //     jsPDF: {orientation: 'portrait'}
  //   };

  //   const content: Element = document.getElementById('element-to-export');
  //   html2pdf().from(content).set(options).save();

  // }
}
