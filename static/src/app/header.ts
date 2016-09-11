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
        // window.setInterval((function() {
        //     let accessToken = localStorage.getItem('reversiAccessToken');
        //     if (typeof accessToken === 'undefined' || accessToken === null) {
        //         window.location.assign('/');
        //         return;
        //     }
        //     let headers = new Headers({
        //         'X-Api-Key': this.reversiService.xApiKey,
        //         'X-Reversi-Auth': 'Bearer ' + accessToken,
        //     });
        //     let options = new RequestOptions({ headers: headers });
        //
        //     let response = this.http.put('https://bi5371ceb2.execute-api.us-east-1.amazonaws.com/dev/refresh_login', null, options)
        //     .map(function(res: Response) {
        //       let body = res.json();
        //       return body || { };
        //     })
        //     .catch(function(error: any) {
        //       let errMsg = (error.message) ? error.message :
        //       error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        //       console.log('!!error!!');
        //       console.log(errMsg); // log to console instead
        //       return Observable.throw(errMsg);
        //     });
        //
        //     response.subscribe(
        //         message => {
        //             console.log('refresh token success: ' + message.success);
        //             console.log('new access token: ' + message.accessToken);
        //             localStorage.setItem('reversiAccessToken', message.accessToken);
        //         },
        //         err => console.log(err)
        //     );
        // }).bind(this), 1000 * 30);



        // window.setInterval((function() {

        // }).bind(this), 1000 * 30);

	}
}
