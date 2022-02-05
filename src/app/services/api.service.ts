import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: "root"
})
export class ApiService {
  url: string =  environment.url;
  apiKey = "TrRpNvhdSw9982ysAuUfe7aB2DCWmNDPsT5RXBGUf2";
  
  constructor(private httpClient: HttpClient) {}
  get(link) {
    let httpOptions = {
      headers: new HttpHeaders({       
        "Content-Type": "application/json; charset=utf-8",
        "APIKey": this.apiKey
      })
    };
    return this.httpClient.get(`${this.url}${link}`, httpOptions);
  }
  post(link, data) {
    let httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json; charset=utf-8",
        "APIKey": this.apiKey
      })
    };
    return this.httpClient.post(`${this.url}${link}`, data, httpOptions);
  }
  put(link, data) {
    let httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json; charset=utf-8",
        "APIKey": this.apiKey
      })
    };
    return this.httpClient.put(`${this.url}${link}`, data, httpOptions);
  }
  delete(link){
    let httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json; charset=utf-8",
        "APIKey": this.apiKey
      })
    };
    return this.httpClient.delete(`${this.url}${link}`, httpOptions)
  }
}
