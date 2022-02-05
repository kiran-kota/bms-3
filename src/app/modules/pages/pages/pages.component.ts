import {Component, OnInit} from '@angular/core';

declare var $;

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss']
})
export class PagesComponent implements OnInit {
  user:any = JSON.parse(localStorage.getItem('user'));
  tabs:any = JSON.parse(JSON.parse(localStorage.getItem('user')).Tabs);
  constructor() {
  }

  ngOnInit() {
    window.dispatchEvent(new Event('resize'));
    $('body').addClass('hold-transition skin-blue sidebar-mini');
  }
  check(){
    let u = localStorage.getItem('url-link');
    return this.user.Role == 'Owner' || this.user.Role == 'Admin' || this.tabs.indexOf(u) > -1;
  }
}
