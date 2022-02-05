import { Component, OnInit, OnDestroy } from '@angular/core';
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
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.scss']
})
export class InvoiceComponent implements OnInit, OnDestroy {
  items:any = [];
  codes: any = [];

  billItem: BillItem = new BillItem();
  billItems:any = [];

  bill:Bill = new Bill();
  account:any;
  tiers: any = JSON.parse(localStorage.getItem('tiers'));
  loading: boolean = false;
  checkPayment: boolean = false;
  m:number = 1;
  uid:string;
  notifications:any = [];
  user:any = JSON.parse(localStorage.getItem('user'));

  constructor(private apiService: ApiService, private router: Router,  private route: ActivatedRoute, private toastr: ToastrService, private excelService: ExcelService, private firestore: AngularFirestore) {
   
   }
  ngOnDestroy(): void {
    $('#' + this.bill.Type + '_tab').removeClass('active');
    this.firestore.collection('accounts').doc(this.account.AccountId.toString()).delete();
  }

  ngOnInit() {``
    const cid = Number(this.route.snapshot.paramMap.get("cid"));
    const id = Number(this.route.snapshot.paramMap.get("id"));
    this.user =  JSON.parse(localStorage.getItem('user'));
    const accounts = JSON.parse(localStorage.getItem('accounts'));
    this.account = accounts.find(x=>x.AccountId == cid);
    this.firestore.collection('accounts').doc(this.account.AccountId.toString()).set({'UserName': this.user.UserName, 'UserId': this.user.UserId, 'Name': this.account.Name, 'uid': this.account.AccountId.toString()});
    this.items = this.account.Role == 'Supplier' ? JSON.parse(localStorage.getItem('items')).filter(x=>x.Status == true && x.ItemAccountsList.indexOf(this.account.AccountId) > -1) : JSON.parse(localStorage.getItem('items')).filter(x=>x.Status == true);
    this.codes = [];
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
    $('#toggle-event').bootstrapToggle();
    $('#op-event').bootstrapToggle();
    this.apiService.get('items').subscribe((res:any)=>{
      console.log(res);
      localStorage.setItem('items', JSON.stringify(res));
      this.items = this.account.Role == 'Supplier' ? res.filter(x=>x.Status == true && x.ItemAccountsList.indexOf(this.account.AccountId) > -1) : res.filter(x=>x.Status == true);
      this.codes = [];
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

    if(id != 0)
    {
      this.apiService.get('bills/' + id).subscribe((res:any)=>{
        this.bill = res;
        this.checkPayment = this.bill.OtherPayment != 0 ? true : false;
        this.billItems = JSON.parse(res.BillItemsList);
      });      
    }else{

      this.route.queryParams.subscribe(params => {
        if(params['uid'] != undefined)  {
          this.uid = params['uid'];
          this.firestore.doc('quotations/' + this.uid).valueChanges().subscribe((res:any)=>{
            this.bill = res;
            console.log('bill', this.bill);
            this.bill.OtherPayment = this.bill.Payment + this.bill.OtherPayment;
            this.bill.Payment = 0;
            this.bill.AccountId = cid;
            this.bill.LastBillId = this.account.LastBillId;
            this.bill.LastBillNo = this.account.LastBillNo;
            this.bill.PastDue = this.account.TotalDue;
          
            this.checkPayment = this.bill.OtherPayment != 0 ? true : false;
            this.billItems = JSON.parse(res.BillItemsList);
            this.summarize();
          });
        }else{
          this.bill.BillId = 0;

          this.bill.InvoiceNo = 0;
          this.bill.Token = 0;
          this.bill.Date = moment();
      
          this.bill.AccountId = cid; 
          this.bill.LastBillId = this.account.LastBillId;
          this.bill.LastBillNo = this.account.LastBillNo;
      
          this.bill.Qty = 0;
          this.bill.Total = 0;
          this.bill.PastDue = this.account.TotalDue;
          this.bill.GrandTotal = this.account.TotalDue;
          this.bill.Payment = 0;
          this.bill.OtherPayment = 0;
          this.bill.TotalDue = this.account.TotalDue;
      
          this.bill.Status = true;
          this.bill.UserId = this.user.UserId;
          this.bill.Edit = true;
          this.bill.Type = this.account.Role == 'Customer' ? 'Sale': 'Purchase'; 
        }  
      });

      $('#' + this.bill.Type + '_tab').addClass('active');
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
  }

  check($event){
    var name = $event.target.value;
    let found = this.items.find(x=>x.Code.toString().toLowerCase() == name.toString().toLocaleLowerCase());
    if(found != null){ 
      let tiers = JSON.parse(found.ItemTiersList);
      let rates = JSON.parse(found.ItemAccountsList);
      
      console.log(found);
      this.billItem = new BillItem();
      this.billItem.ItemId = found.ItemId;
      this.billItem.Price = this.account.TierId == null ? rates.find(x=>x.AccountId == this.account.AccountId).Rate : tiers.find(x=>x.TierId == this.account.TierId).Price;
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
    if(this.billItem.Qty == null || this.bill.Qty.toString() == '' || this.bill.Qty == undefined){
      return false;
    }
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

    if(this.billItem.Qty == null || this.bill.Qty.toString() == '' || this.bill.Qty == undefined){
      return false;
    }

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
    this.bill.GrandTotal = this.bill.Total + this.bill.PastDue;
    var payment = Number(this.bill.Payment);
    this.bill.TotalDue = this.bill.GrandTotal - payment;
  }
  addPayment(){
    var payment = Number(this.bill.Payment);

    this.bill.TotalDue = this.bill.GrandTotal - payment;
  }
 
  save(p:boolean){

    if((this.bill.TotalDue > this.account.DueLimit) && !window.confirm('Duelimit exceeded. Do you want to continue?')){
     return false;
    }

    this.loading = true;
    this.bill.BillItemsList = JSON.stringify(this.billItems);
    this.bill.Profit = _.sumBy(this.billItems, 'Profit');
    console.log(this.bill, this.billItems);
    if(this.bill.BillId > 0){
      this.apiService.put('bills/' + this.bill.BillId, this.bill).subscribe((res:any)=>{
        this.firestore.collection('accounts').doc(this.account.AccountId.toString()).delete();

        console.log(res);
        this.loading = false;
        this.toastr.success(this.bill.Type + ' Updated Successfully', 'Done!');  
        if(p == true){
          window.open('/print/' + this.bill.BillId);
        }
        let url = this.bill.Type.toLowerCase() + 's';
        this.router.navigate([url]);
      }, (err)=> {
        this.toastr.error('Something went wrong. Try again.', 'Error!');
        this.loading = false;


      });
    }else{
      this.apiService.post('bills', this.bill).subscribe((res:any)=>{
        console.log(res);
        this.loading = false;
        this.firestore.collection('accounts').doc(this.account.AccountId.toString()).delete();

        this.toastr.success(this.bill.Type + ' Created Successfully', 'Done!');  
        if(this.uid != undefined){

          this.firestore.collection('quotations').doc(this.uid).delete();
        }
        if(p == true){
          window.open('/print/' + res);
        }
        let url = this.bill.Type.toLowerCase() + 's';
        this.router.navigate([url]);
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
            billItem.Price = this.account.TierId == null ? rates.find(x=>x.AccountId == this.account.AccountId).Rate : tiers.find(x=>x.TierId == this.account.TierId).Price;
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
