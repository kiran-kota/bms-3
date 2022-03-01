import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

import { ApiService } from 'src/app/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";

import { ExcelService } from 'src/app/services/excel.service';
import { Item } from 'src/app/models/Item';
import { ItemAccount } from 'src/app/models/ItemAccount';
import { ItemTier } from 'src/app/models/ItemTier';
declare var $;
declare var moment: any;
import * as _ from "lodash";

@Component({
  selector: 'app-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss']
})
export class ItemsComponent implements OnDestroy, AfterViewInit, OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: any = new Subject();

  status: string = "true";
  data: any = [];
  filtered: any = [];
  loading: boolean = true;
  item: Item = new Item();
  tiers: any = [];
  categories: any = [];
  accounts: any = [];

  categoryId: any = 0;
  accountId: any = 0;

  itemSupplier: ItemAccount = new ItemAccount();
  itemSuppliers: any = [];
  itemTiers: any = [];
  codes: any = [];
  code: string = '';

  role: string = JSON.parse(localStorage.getItem('user')).Role;
  report:any = [];
  title:string = "";
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
    this.apiService.get(`itemsbydate/${this.start.format('YYYY-MM-DD')}/${this.end.format('YYYY-MM-DD')}`).subscribe((res:any)=>{
      this.data = res;
      console.log(res);
      this.loading = false;
      localStorage.setItem('items', JSON.stringify(res));
      this.fetch();
    });
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
  fetch() {
    const s = this.status == "true" ? true : false;
    const c = Number(this.categoryId);
    const d = Number(this.accountId);
    this.filtered=  this.data.filter(x=>x.Status == s && ( c == 0 ? true : x.CategoryId == c) && (d == 0 ? true : x.Accounts.indexOf(d) > -1));
    //this.dtTrigger.next();
    this.rerender();
  }
  ngOnInit() {
    localStorage.setItem('url-link', 'Items');
    this.daterange.start = moment().subtract(29, "days");
    this.daterange.end = moment();

    localStorage.setItem('category_role', 'Item');
    this.tiers = JSON.parse(localStorage.getItem('tiers'));
    this.categories = JSON.parse(localStorage.getItem('categories')).filter(x=>x.Role == 'Item');
    this.accounts = JSON.parse(localStorage.getItem('accounts')).filter(x=>x.Deleted == false && x.Role == 'Supplier');
    this.load();

    this.role = JSON.parse(localStorage.getItem('user')).Role;
    console.log(this.role);
    this.accounts.map(x=>{
      this.codes = this.codes.concat(x.Name);
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



    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      processing: true,
      order: [1, 'asc']
    };
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


  getSupplierName(id:number){
    return JSON.parse(localStorage.getItem('accounts')).find(x=>x.AccountId == id).Name;
  }
  getTierCode(id:number){
    return this.tiers.find(x=>x.TierId == id).Code;
  }
  getStock(u:any){
    return (u.Purchased + u.Stock - u.Sold) == 0 && (this.role == 'Owner') && u.Status == false;
  }

  find($event){
    //console.log($event.target.value);
  }
  check($event){
    var name = $event.target.value;
    let found = this.accounts.find(x=>x.Name.toString().toLowerCase() == name.toString().toLocaleLowerCase());
    if(found != null){
      this.itemSupplier.AccountId = found.AccountId;
      this.itemSupplier.Qty = 0;
      $('#code').val(found.Name);
    }else{
      $('#code').val('');
      this.itemSupplier = new ItemAccount();
    }
  }

  addItemSupplier(){
    if(this.itemSupplier.AccountId > 0 && this.itemSupplier.Rate > 0){
      this.itemSupplier.Qty = 0;
      this.itemSuppliers = this.itemSuppliers.filter(x=>x.AccountId != this.itemSupplier.AccountId);
      this.itemSuppliers.push(this.itemSupplier);
      this.itemSupplier = new ItemAccount();
      $('#code').val('');
      $('#code').focus();
    }
  }
  editItemSupplier(s:any){
    console.log(s);
    this.itemSupplier = s;
    let found = this.accounts.find(x=>x.AccountId == s.AccountId);
    $('#code').val(found.Name);
  }
  deleteItemSupplier(s:any){
    this.itemSuppliers = this.itemSuppliers.filter(x=>x.AccountId != s.AccountId);
  }

  add(){
    this.item = new Item();
    this.item.ItemId = 0;
    this.item.Status = true;

    this.itemTiers = [];
    this.tiers.forEach((ele:any) => {
      console.log(ele);
      var m = new ItemTier();
      m.TierId = ele.TierId;
      this.itemTiers.push(m);
    });
    this.itemSupplier = new ItemAccount();
    this.itemSuppliers = [];

    $('#myModal').modal('toggle');
  }
  show(){
    $('#categoriesTable').modal('toggle');
  }

  edit(u:any){
    this.apiService.get('items/' + u).subscribe((res:any)=>{
      console.log(res);
      this.item = res;
      this.itemSuppliers = JSON.parse(res.ItemAccountsList);
      this.itemTiers = JSON.parse(res.ItemTiersList);
      $('#myModal').modal('toggle');
    })
  }

  delete(u:any){
    this.apiService.get('items/' + u).subscribe((res:any)=>{
      this.item = res;
      if(window.confirm('Are you sure to make changes in status of this item?')){
        this.item.Status = !this.item.Status;
        this.apiService.put('items/' + this.item.ItemId, this.item).subscribe((res:any)=>{
          console.log(res);
          this.toastr.success('Item Updated Successfully', 'Done!');
          this.load();
        }, (err)=> this.toastr.error('Something went wrong. Try again.', 'Error!'));
      }
    });
  }
  remove(u:any){
    this.apiService.get('items/' + u).subscribe((res:any)=>{
      this.item = res;
      if(window.confirm('Are you sure to delete this item perminantly?')){
        this.item.Deleted = true;
        this.apiService.put('items/' + this.item.ItemId, this.item).subscribe((res:any)=>{
          console.log(res);
          this.toastr.success('Item Updated Successfully', 'Done!');
          this.load();
        }, (err)=> this.toastr.error('Something went wrong. Try again.', 'Error!'));
      }
    });
  }

  save(){
    this.tiers.forEach((ele:any)=>{
      let p = $(`#${ele.TierId}_Price`).val();
      let i = this.itemTiers.findIndex(x=>x.TierId == ele.TierId);
      this.itemTiers[i].Price = Number(p);
    })

    this.item.CategoryId = Number(this.item.CategoryId);
    this.item.ItemTiersList = JSON.stringify(this.itemTiers);
    this.item.ItemAccountsList = JSON.stringify(this.itemSuppliers);
    console.log(this.item, this.itemSuppliers, this.itemTiers);

    this.loading = true;
    if(this.item.ItemId > 0){
      this.apiService.put('items/' + this.item.ItemId, this.item).subscribe((res:any)=>{
        this.loading = false;
        this.toastr.success('Item Updated Successfully', 'Done!');
        $('#myModal').modal('toggle');
        this.load();
      }, (err)=> {
        this.toastr.error('Something went wrong. Try again.', 'Error!');
        this.loading = false;
      });
    }else{
      this.apiService.post('items', this.item).subscribe((res:any)=>{
        this.loading = false;
        this.load();
        this.toastr.success('New Item Created Successfully', 'Done!');
        $('#myModal').modal('toggle');
      }, (err)=> {
        this.toastr.error('Something went wrong. Try again.', 'Error!');
        this.loading = false;
      });
    }
  }

  getTier(id:number){
    return this.tiers.find(x=>x.TierId == id).Code;
  }
  getTierId(code: string){
    return this.tiers.find(x=>x.Code == code).TierId;
  }

  download(){
    const data = this.filtered.map((x:any)=>[x.Code, x.Name, this.categories.find(r=>r.CategoryId == x.CategoryId).Code, (x.Purchased + x.Stock - x.Sold)]);
    const header = ['Code', 'Name', 'Category', 'Available'];
    this.excelService.generateExcel(header, data, 'items');
  }

  finalsheet(){
    let data = [];

    let header = ['Code', 'Name', 'Category', 'Qty'];

    let tiers = this.tiers.map(x=>x.Code);
    header = header.concat(tiers);

    header = header.concat(['Comment', 'Item Status']);

    let suppliers = this.accounts.map(x=>x.Name);
    header = header.concat(suppliers);


    this.data.forEach((ele:any)=>{
      console.log(ele);
      let accountRates = ele.AccountsList == null ? [] : JSON.parse(ele.AccountsList);
      let tierPrices = JSON.parse(ele.TiersList);

      let str = [
        ele.Code,
        ele.Name,
        this.categories.find(r=>r.CategoryId == ele.CategoryId).Code,
        ele.Qty, //ele.Purchased + ele.Stock - ele.Sold
      ];
      this.tiers.forEach((t:any) => {
        let f = tierPrices.find(x=>x.TierId == t.TierId);
        if(f == null){
          str = str.concat(0);
        }else{
          str = str.concat(f.Price);
        }
      });
      str = str.concat([ele.Comment, ele.Status == true ? 'Active' : 'Inactive']);

      this.accounts.forEach((t:any) => {
        let f = accountRates.find(x=>x.AccountId == t.AccountId);
        if(f == null){
          str = str.concat(0);
        }else{
          str = str.concat(f.Rate);
        }
      });
      data.push(str);

      // if(accounts.length > 0){
      //   accounts.forEach((s:any) => {
      //     let str = [
      //       ele.Code,
      //       ele.Name,
      //       this.categories.find(r=>r.CategoryId == ele.CategoryId).Code,
      //       this.accounts.find(r=>r.AccountId == s.AccountId).Name,
      //       s.Rate,
      //       s.Qty
      //     ];
      //     str = str.concat(tierPrices);
      //     str = str.concat(['Active', ele.Comment, ele.Status == true ? 'Active': 'Inactive']);
      //     data.push(str);
      //   });
      // }

    });

    console.log(data);
    this.excelService.generateExcel(header, data, 'finalsheet');

  }

  upload(){
    $('#fileUpload').click();
  }
  onFileChange(ev) {
    const file = ev.target.files[0];
    this.loading = true;
    let items = [];
    this.excelService.convertExcelToJson(file).then((res:any)=>{
      console.log(res);

      res.forEach((ele:any) => {
        let item:Item = new Item();
        const found = this.data.find(x=>x.Code == ele.Code.trim());
        item.ItemId = found == undefined ? 0 : found.ItemId;
        item.Code = ele.Code;
        item.Name = ele.Name;
        item.CategoryId = this.categories.find(x=>x.Code == ele.Category).CategoryId;
        item.Comment = ele.Comment;
        item.Status = ele['Item Status'] == 'Active' ? true : false;
        item.Qty = ele.Qty;//found == undefined ? ele.Qty : found.Stock;

        let itemTiers = [];
        this.tiers.forEach((t:any)=>{
          if(ele[t.Code] != undefined && ele[t.Code] > 0){
            let itemTier: ItemTier = new ItemTier();
            itemTier.TierId = t.TierId;
            itemTier.Price = ele[t.Code];
            itemTiers.push(itemTier);
          }
        });

        let itemAcccounts = [];
        this.accounts.forEach((t:any)=>{
          if(ele[t.Name] != undefined && ele[t.Name] > 0){
            let itemAccount: ItemAccount = new ItemAccount();
            itemAccount.AccountId = t.AccountId;
            itemAccount.Qty = 0;
            itemAccount.Rate = ele[t.Name];
            itemAcccounts.push(itemAccount);
          }
        });

        item.ItemTiersList = JSON.stringify(itemTiers);
        item.ItemAccountsList = JSON.stringify(itemAcccounts);
        items.push(item);
      });

      console.log(items);

      this.apiService.post('imports/items', items).subscribe((data:any)=>{
          this.toastr.success( data + ' Items Updated', 'Done!');
          this.loading = false;
          this.load();

      }, (err)=> {
        this.toastr.error('Something went wrong. Try again.', 'Error!');
        this.loading = false;
      });



    });
  }

  validate(){
    let error = false;
    if(this.item.Code == undefined || this.item.Code == ''){
      error = true;
    }
    if(this.item.Name == undefined || this.item.Name == ''){
      error = true;
    }
    if(this.item.CategoryId == undefined){
      error = true;
    }
    this.tiers.forEach((ele:any) => {
      if($(`#${ele.TierId}_Price`).val() == ''){
        error = true;
      }
    });
    if(this.itemSuppliers.length == 0){
      error = true;
    }
    return error;
  }
  showMore(d:any, t:string){
    this.loading = true;

    this.apiService.get(`itemdetailsbydate/${d.ItemId}/${this.start.format('YYYY-MM-DD')}/${this.end.format('YYYY-MM-DD')}`).subscribe((res:any)=>{
      this.loading = false;
      let u = res[0];
      console.log(u, '')
      this.report = t == 'Sale' ? _.orderBy(u.BillItemSold, ['InvoiceNo'], ['desc']) : _.orderBy(u.BillItemPurchased, ['InvoiceNo'], ['desc']);
      this.title = `${t=="Sale" ? "Sale" : "Purchase"} Report of ${u.Code} `;
      $('#reportModal').modal('toggle');
    });
  }

}

