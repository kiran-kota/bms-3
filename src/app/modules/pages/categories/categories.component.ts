import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { Category } from 'src/app/models/Category';

import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";

declare var $;

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnDestroy, AfterViewInit, OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;
  category:Category = new Category();
  data: any = [];
  filtered: any = [];

  dtOptions: DataTables.Settings = {};
  dtTrigger: any = new Subject();
  constructor(private apiService: ApiService, private toastr: ToastrService) { }
  

  load(){
    $("#myDatatable").DataTable().clear().draw();
    $(".dataTables_empty").text("Loading...");
    this.apiService.get('categories').subscribe((res:any)=>{
      this.data = res.filter(x=>x.Role == localStorage.getItem('category_role'));
      localStorage.setItem('categories', JSON.stringify(res));
      this.fetch();
    });
  }
  fetch() {
    // const s = this.status == "true" ? true : false;
    // this.filtered =  this.data.filter(x=>x.Status == s);
    this.filtered = this.data;
    //this.dtTrigger.next();
    this.rerender();
  }
  
    
  ngOnInit() {  
    this.category = new Category();
    this.category.CategoryId = 0;
    this.category.Role = localStorage.getItem('category_role');
    this.load();  
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      processing: true,
      order: [0, 'asc']
    };
    this.category = new Category();
    this.category.CategoryId = 0;
    this.category.Role = localStorage.getItem('category_role');
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

  edit(u:any){
    this.category = u;    
  }
  save(){
    console.log(this.category);
    if(this.category.CategoryId > 0){
      this.apiService.put('categories/' + this.category.CategoryId, this.category).subscribe((res:any)=>{
        this.toastr.success("Category Updated Succesfully", "Done!");        
        this.category = new Category();
        this.category.CategoryId = 0;
        this.category.Role = localStorage.getItem('category_role');
        this.load();
      }, (err)=>this.toastr.error('Somthing went wrong. Please try again.', "Error!"));
    }else{
      this.apiService.post('categories', this.category).subscribe((res:any)=>{
        this.toastr.success("New Category Added Succesfully", "Done!");
        this.category = new Category();
        this.category.CategoryId = 0;
        this.category.Role = localStorage.getItem('category_role');
        this.load();
      }, (err)=>this.toastr.error('Somthing went wrong. Please try again.', "Error!"));
    }
  }
  delete(u:any){
    if(window.confirm('Are you sure to delete this category?')){
      this.apiService.delete('categories/' + u.CategoryId).subscribe((res:any)=>{
        this.toastr.success("Category Deleted Succesfully", "Done!");          
        this.load();
      }, (err)=>this.toastr.error('Somthing went wrong. Please try again.', "Error!"));
    }
  }

}
