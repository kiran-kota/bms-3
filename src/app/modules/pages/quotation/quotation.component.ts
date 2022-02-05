import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { BillItem } from 'src/app/models/BillItem';
import { Bill } from 'src/app/models/Bill';
import * as _ from "lodash";
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ExcelService } from 'src/app/services/excel.service';
import { AngularFirestore } from '@angular/fire/firestore';
declare var $;
declare var moment: any;
@Component({
  selector: 'app-quotation',
  templateUrl: './quotation.component.html',
  styleUrls: ['./quotation.component.scss']
})
export class QuotationComponent implements OnInit {
  items:any = [];
  codes: any = [];

  billItem: BillItem = new BillItem();
  billItems:any = [];
  id: any = '';
  bill:Bill = new Bill();
  tierId: number = 0;
  tiers: any = JSON.parse(localStorage.getItem('tiers'));
  loading: boolean = false;
  checkPayment: boolean = false;
  m:number = 1;

  user:any = JSON.parse(localStorage.getItem('user'));

  constructor(private apiService: ApiService, private router: Router, private route: ActivatedRoute, private toastr: ToastrService, private excelService: ExcelService, private firestore: AngularFirestore) {
  
   }

  ngOnInit() {
    this.tierId = Number(this.route.snapshot.paramMap.get("tid"));
    this.id = this.route.snapshot.paramMap.get("id")
    $('#toggle-event').bootstrapToggle();
    $('#op-event').bootstrapToggle();
    this.apiService.get('items').subscribe((res:any)=>{
      console.log(res);

      this.items = res.filter(x=>x.Status == true);
      this.items.map(x=>{
        this.codes = this.codes.concat(x.Code);
      });
      localStorage.setItem('codes', JSON.stringify(this.codes));
      $("#code").autocomplete({
        source: function (request, response) {
            let codes = JSON.parse(localStorage.getItem('codes'));
            var req = codes.filter(x => x.toLowerCase().includes(request.term.toLowerCase()));
            response($.map(req, function (data) {
              //console.log(data);
                return { label: data, value: data };
            }))
        },
        minLength: 1
     });
    }); 

    if(this.id != '0')
    {
      this.firestore.doc('quotations/' + this.id).valueChanges().subscribe((res:any)=>{
        this.bill = res;
        this.checkPayment = this.bill.OtherPayment != 0 ? true : false;
        this.billItems = JSON.parse(res.BillItemsList);
      });

          
    }else{
      this.bill.BillId = 0;

      this.bill.InvoiceNo = 0;
      this.bill.Token = 0;
      this.bill.Date = moment();
  
      this.bill.AccountId = this.tierId; 
      this.bill.LastBillId = 0;
      this.bill.LastBillNo = 0;
      this.bill.Qty = 0;
      this.bill.Total = 0;
      this.bill.PastDue = 0;
      this.bill.GrandTotal = 0;
      this.bill.Payment = 0;
      this.bill.OtherPayment = 0;
      this.bill.TotalDue = 0;
  
      this.bill.Status = true;
      this.bill.UserId = this.user.UserId;
      this.bill.Edit = true;
      this.bill.Type = 'Sale';  
    }

  }
  find($event){
    //console.log($event.target.value);
  }
  onChangePayment(){
    console.log(this.checkPayment);
    if(!this.checkPayment){
      this.bill.OtherPayment = 0;
    }
    this.summarize();
  }

  getTierCode(id:number){
    return this.tiers.find(x=>x.TierId == id).Code;
  }
  check($event){
    var name = $event.target.value;
    let found = this.items.find(x=>x.Code.toString().toLowerCase() == name.toString().toLocaleLowerCase());
    if(found != null){ 
      let tiers = JSON.parse(found.TiersList);
      let rates = JSON.parse(found.AccountsList);
      
      console.log(found);
      this.billItem = new BillItem();
      this.billItem.ItemId = found.ItemId;
      this.billItem.Price =  tiers.find(x=>x.TierId == this.tierId).Price;
      this.billItem.Rate = this.bill.Type == 'Sale' ?  (rates.length > 0 ? _.maxBy(rates, 'Rate')['Rate'] : 0) : this.billItem.Price; 
      $('#avail').val(found.Purchased + found.Stock - found.Sold);
      $('#price').val(found.Price);
      $('#qty').prop('disabled', false);
      $('#qty').focus();
      $('#code').val(found.Code);    
      console.log(this.billItem);
    }else{
      $('#code').val('');
    }
  }
  calculate(){
    var qty = Number(this.billItem.Qty);
    if(qty != 0){
      var amount = qty * this.billItem.Price;
      var profit = qty * (this.billItem.Price - this.billItem.Rate);
      // console.log(amount, this.billItem);
      // $('#amount').val(amount);
      this.billItem.Amount = amount;
      this.billItem.Profit = profit;
    }else{
      this.billItem.Amount = null;      
    }
  }

  addItem(){
    console.log(this.billItem.ItemId);
    if((this.billItem.Qty > parseFloat($('#avail').val())) && this.bill.Type == 'Sale' && !window.confirm('No more qty. Do want to continue?')){
      return false;
    } 

    if( $('#toggle-event').prop('checked') == false){
      this.billItem.Qty = -1 * this.billItem.Qty;
      this.billItem.Amount = -1 * this.billItem.Amount;
      this.billItem.Profit = -1 * this.billItem.Profit;
    }

    if($('#add').text() == 'Add'){
      let i = this.billItems.findIndex(x=>x.ItemId == this.billItem.ItemId);   
      if(i > -1){
        this.billItems[i].Qty += this.billItem.Qty;
        this.billItems[i].Amount += this.billItem.Amount;
        this.billItems[i].Profit += this.billItem.Profit;
      }else{
        this.billItems = this.billItems.filter(x=>x.ItemId != this.billItem.ItemId);
        this.billItems.push(this.billItem);
      }      
    }else{
      this.billItems = this.billItems.filter(x=>x.ItemId != this.billItem.ItemId);
      this.billItems.push(this.billItem);
    }
    
    this.billItem = new BillItem();
    $('#qty').prop('disabled', true);
    $('#code').prop('disabled', false);
    $('#add').text('Add')
    $('#avail').val('');
    $('#code').val('');
    $('#code').focus();
    this.summarize();
  }
  editItem(t:any){
    let i = this.billItems.findIndex(x=>x.ItemId == t);
    this.billItem = this.billItems[i];  
    if( $('#toggle-event').prop('checked') == false){
      this.billItem.Qty = -1 * this.billItem.Qty;
      this.billItem.Amount = -1 * this.billItem.Amount;
      this.billItem.Profit = -1 * this.billItem.Profit;
    }
    $('#qty').prop('disabled', false);
    $('#code').prop('disabled', true);
    $('#add').text('Update');
    $('#code').val(this.getCode(t));  
  }
  deleteItem(t:any){
    this.billItems = this.billItems.filter(x=>x.ItemId != t);
    this.billItem = new BillItem();
    $('#qty').prop('disabled', true);
    $('#avail').val('');
    $('#code').val('');
    $('#code').focus();
    this.summarize();
  }
  getCode(id:number){
    let items = JSON.parse(localStorage.getItem('items'));
    return items.find(x=>x.ItemId == id).Code;
  }
  getTier(id:number){
    return this.tiers.find(x=>x.TierId == id).Code;
  }

  summarize(){
    this.bill.Qty = _.sumBy(this.billItems, 'Qty');
    this.bill.Total = _.sumBy(this.billItems, 'Amount');
    this.bill.GrandTotal = _.sumBy(this.billItems, 'Amount');
    var shipping = Number(this.bill.Payment);
    var gst = Number(this.bill.OtherPayment);
    this.bill.TotalDue = this.bill.GrandTotal + shipping + gst;
  }
  addPayment(){
    var shipping = Number(this.bill.Payment);
    var gst = Number(this.bill.OtherPayment);
    this.bill.TotalDue = this.bill.GrandTotal + shipping + gst;
  }

  
 
  save(p:boolean){
    this.loading = true;
    this.bill.BillItemsList = JSON.stringify(this.billItems);
    this.bill.Profit = _.sumBy(this.billItems, 'Profit');
    console.log(this.bill, this.billItems);
    
    if(this.id != '0'){
      var str = JSON.stringify(this.bill)
      this.firestore.collection('quotations').doc(this.id).set(
        JSON.parse(str)
      ).then((res:any)=>{
        console.log(res);
        this.toastr.success('Quotation Updated Successfully', 'Done!');  
        this.loading = false;      
        this.router.navigate(['/quotations']);
      },(err)=> {
        this.toastr.error('Something went wrong. Try again.', 'Error!');
        this.loading = false;
      });
    }else{
      var str = JSON.stringify(this.bill)
      this.firestore.collection('quotations').add(
        JSON.parse(str)
      ).then((res:any)=>{
        console.log(res);
        this.toastr.success('New Quotation Created Successfully', 'Done!');  
        this.loading = false;      
        this.router.navigate(['/quotations']);
      },(err)=> {
        this.toastr.error('Something went wrong. Try again.', 'Error!');
        this.loading = false;
      });
    }    
  }

  download(){
    const header = ['Code', 'Qty'];
    const data = this.items.map(x=>[x.Code, 0]);
    this.excelService.generateExcel(header, data, 'sheet');
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
        console.log(ele);      
        const found = this.items.find(r=>r.Code == ele.Code);
        if(found != undefined){
          const qty = ele.Qty;
          if(qty != 0){
            let tiers = JSON.parse(found.TiersList);
            let rates = JSON.parse(found.AccountsList);          
            let billItem = new BillItem();
            billItem.ItemId = found.ItemId;
            billItem.Qty = ele.Qty;
            billItem.Price = tiers.find(x=>x.TierId == this.tierId).Price;
            billItem.Rate = this.bill.Type == 'Sale' ? (rates.length > 0 ? _.maxBy(rates, 'Rate')['Rate'] : 0) : billItem.Price;  
            var amount = qty * billItem.Price;
            var profit = qty * (billItem.Price - billItem.Rate);         
            billItem.Amount = amount;
            billItem.Profit = profit;
            let i = this.billItems.findIndex(x=>x.ItemId == billItem.ItemId);   
            if(i > -1){
              this.billItems[i].Qty += billItem.Qty;
              this.billItems[i].Amount += billItem.Amount;
              this.billItems[i].Profit += billItem.Profit;
            }else{
              this.billItems = this.billItems.filter(x=>x.ItemId != billItem.ItemId);
              this.billItems.push(billItem);
            }
            this.summarize();  

          }         
        }
      });
      console.log(accounts);
      this.loading = false;
    })
    
  }

}
