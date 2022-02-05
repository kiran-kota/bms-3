import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrintComponent } from './modules/layout/print/print.component';
import { ReportComponent } from './modules/layout/report/report.component';
import { OrderComponent } from './modules/layout/order/order.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {path: '', redirectTo: '/', pathMatch: 'full'},
  {path: 'login', loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)},
  {path: '',  canActivate: [AuthGuard], loadChildren: () => import('./modules/pages/pages.module').then(m => m.PagesModule)},
  {path: 'print/:id', component: PrintComponent},
  {path: 'order/:t/:id', component: OrderComponent},
  {path: 'report/:start/:end', component: ReportComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
