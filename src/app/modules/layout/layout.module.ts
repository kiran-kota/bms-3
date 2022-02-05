import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { RouterModule } from '@angular/router';
import {HeaderComponent} from './header/header.component';
import {SideNavComponent} from './side-nav/side-nav.component';
import { PrintComponent } from './print/print.component';
import { ReportComponent } from './report/report.component';
import { OrderComponent } from './order/order.component';

@NgModule({
  declarations: [
    HeaderComponent,    
    SideNavComponent, 
    PrintComponent, 
    ReportComponent, 
    OrderComponent,
  ],
  imports: [
    RouterModule,
    CommonModule
  ],
  exports: [
    HeaderComponent,
    SideNavComponent,
  ]
})
export class LayoutModule {
}
