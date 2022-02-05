import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import {HttpClientModule} from '@angular/common/http';

import {PagesRoutingModule} from './pages-routing.module';
import {PagesComponent} from './pages/pages.component';
import {DashBoardComponent} from './dash-board/dash-board.component';
import {LayoutModule} from '../layout/layout.module';
import { ItemsComponent } from './items/items.component';
import { CustomersComponent } from './customers/customers.component';
import { SalesComponent } from './sales/sales.component';
import { SuppliersComponent } from './suppliers/suppliers.component';
import { PurchasesComponent } from './purchases/purchases.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { TransfersComponent } from './transfers/transfers.component';
import { UsersComponent } from './users/users.component';
import { Daterangepicker } from 'ng2-daterangepicker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HistoryComponent } from './history/history.component';
import { RojmedComponent } from './rojmed/rojmed.component';
import { AnalysisComponent } from './analysis/analysis.component';
import { TiersComponent } from './tiers/tiers.component';
import { CategoriesComponent } from './categories/categories.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { ChartsModule } from 'ng2-charts';
import { LeadsComponent } from './leads/leads.component';
import { QuotationsComponent } from './quotations/quotations.component';
import { QuotationComponent } from './quotation/quotation.component';
@NgModule({
  declarations: [PagesComponent, DashBoardComponent, ItemsComponent, CustomersComponent, SalesComponent, SuppliersComponent, PurchasesComponent, ExpensesComponent, TransfersComponent, UsersComponent, HistoryComponent, RojmedComponent, AnalysisComponent, TiersComponent, CategoriesComponent, InvoiceComponent, LeadsComponent, QuotationsComponent, QuotationComponent],
  imports: [
    CommonModule,
    PagesRoutingModule,
    LayoutModule,
    DataTablesModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    Daterangepicker,
    ChartsModule
  ]
})
export class PagesModule {
}
