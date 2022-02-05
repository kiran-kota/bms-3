import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { Tier } from 'src/app/models/Tier';

import { DataTablesModule, DataTableDirective } from "angular-datatables";
import { Subject } from "rxjs";

declare var $;

@Component({
  selector: 'app-tiers',
  templateUrl: './tiers.component.html',
  styleUrls: ['./tiers.component.scss']
})
export class TiersComponent implements OnDestroy, AfterViewInit, OnInit {
  @ViewChild(DataTableDirective, { static: false }) dtElement: DataTableDirective;
  tier:Tier = new Tier();
  data: any = [];
  filtered: any = [];

  dtOptions: DataTables.Settings = {};
  dtTrigger: any = new Subject();
  constructor(private apiService: ApiService, private toastr: ToastrService) { }
  

  load(){
    $("#myDatatable").DataTable().clear().draw();
    $(".dataTables_empty").text("Loading...");
    this.apiService.get('tiers').subscribe((res:any)=>{
      this.data = res;
      localStorage.setItem('tiers', JSON.stringify(res));
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
    this.load();  
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      processing: true,
      order: [0, 'asc']
    };
    this.tier = new Tier();
    this.tier.TierId = 0;
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
    this.tier = u;    
  }
  save(){
    if(this.tier.TierId > 0){
      this.apiService.put('tiers/' + this.tier.TierId, this.tier).subscribe((res:any)=>{
        this.toastr.success("Tier Updated Succesfully", "Done!");        
        this.tier = new Tier();
        this.tier.TierId = 0;
        this.load();
      }, (err)=>this.toastr.error('Somthing went wrong. Please try again.', "Error!"));
    }else{
      this.apiService.post('tiers', this.tier).subscribe((res:any)=>{
        this.toastr.success("New Tier Added Succesfully", "Done!");
        this.tier = new Tier();
        this.tier.TierId = 0;
        this.load();
      }, (err)=>this.toastr.error('Somthing went wrong. Please try again.', "Error!"));
    }
  }
  delete(u:any){
    if(window.confirm('Are you sure to delete this tier?')){
      this.apiService.delete('tiers/' + u.TierId).subscribe((res:any)=>{
        this.toastr.success("Tier Deleted Succesfully", "Done!");          
        this.load();
      }, (err)=>this.toastr.error('Somthing went wrong. Please try again.', "Error!"));
    }
  }

}
