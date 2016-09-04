import {Component, OnInit} from '@angular/core';
import {ReversiService} from './reversi.service';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';



@Component({
  selector: 'Header',
  template: require('./header.html'),
  providers: []
})
export class Header implements OnInit {

	constructor(private reversiService: ReversiService, private http: Http) {
		// this.websocketService = websocketService;
	}

	ngOnInit() {
		this.reversiService.init();
        window.setInterval((function() {
            let accessToken = localStorage.getItem('reversiAccessToken');
            if (typeof accessToken === 'undefined' || accessToken === null) {
                window.location.assign('/');
                return;
            }
            let headers = new Headers({
                'X-Api-Key': '6Tairgv32oa3OCOpcY0dP6YgyGKt2Fge2TTDPOP5',
                'Authorization': 'Bearer ' + accessToken,
            });
            let options = new RequestOptions({ headers: headers });

            let response = this.http.post('https://w0jk0atq5l.execute-api.us-east-1.amazonaws.com/prod/refresh_login', options)
            .map(function(res: Response) {
              let body = res.json();
              return body || { };
            })
            .catch(function(error: any) {
              let errMsg = (error.message) ? error.message :
              error.status ? `${error.status} - ${error.statusText}` : 'Server error';
              console.log('!!error!!');
              console.log(errMsg); // log to console instead
              return Observable.throw(errMsg);
            });

            response.subscribe(
                success => {
                    console.log('refresh token success: ' + success);
                },
                err => console.log(err)
            );
        }).bind(this), 1000 * 60 * 20);
	}
}
