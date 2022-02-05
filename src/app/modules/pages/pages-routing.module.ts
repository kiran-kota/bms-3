import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {PagesComponent} from './pages/pages.component';
import {DashBoardComponent} from './dash-board/dash-board.component';
import {ItemsComponent} from './items/items.component';
import { CustomersComponent } from './customers/customers.component';
import { SalesComponent } from './sales/sales.component';
import { SuppliersComponent } from './suppliers/suppliers.component';
import { PurchasesComponent } from './purchases/purchases.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { TransfersComponent } from './transfers/transfers.component';
import { UsersComponent } from './users/users.component';
import { AuthGuard } from 'src/app/guards/auth.guard';
import { HistoryComponent } from './history/history.component';
import { RojmedComponent } from './rojmed/rojmed.component';
import { AnalysisComponent } from './analysis/analysis.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { LeadsComponent } from './leads/leads.component';
import { QuotationsComponent } from './quotations/quotations.component';
import { QuotationComponent } from './quotation/quotation.component';


const routes: Routes = [
  {
    path: '', component: PagesComponent, children: [
      {path: 'dashboard', component: DashBoardComponent, canActivate: [AuthGuard]},
      {path: 'items', component: ItemsComponent, canActivate: [AuthGuard]},
      {path: 'customers', component: CustomersComponent, canActivate: [AuthGuard]},
      {path: 'sales', component: SalesComponent, canActivate: [AuthGuard]},
      {path: 'invoice/:cid/:id', component: InvoiceComponent, canActivate: [AuthGuard]},
      {path: 'suppliers', component: SuppliersComponent, canActivate: [AuthGuard]},
      {path: 'quotations', component: QuotationsComponent, canActivate: [AuthGuard]},
      {path: 'quotation/:tid/:id', component: QuotationComponent, canActivate: [AuthGuard]},
      {path: 'purchases', component: PurchasesComponent, canActivate: [AuthGuard]},
      {path: 'expenses', component: ExpensesComponent, canActivate: [AuthGuard]},
      {path: 'leads', component: LeadsComponent, canActivate: [AuthGuard]},
      {path: 'rojmed', component: RojmedComponent, canActivate: [AuthGuard]},
      {path: 'analysis', component: AnalysisComponent, canActivate: [AuthGuard]},
      {path: 'transfers', component: TransfersComponent, canActivate: [AuthGuard]},
      {path: 'users', component: UsersComponent, canActivate: [AuthGuard]},
      {path: 'history', component: HistoryComponent, canActivate: [AuthGuard]},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule {
}
