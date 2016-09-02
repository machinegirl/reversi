import { Component, OnInit, Input} from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import {Header} from './header';


@Component({
  selector: 'App',
  template: require('./main.html'),
  providers: [],
  directives: [Header]
})
export class Main implements OnInit {

  @Input() public main: Main;

  constructor(private http: Http) {
	  // this.websocketService = websocketService;
	//   reversiService.gameBoard = gameBoard;
	  console.log('main controller started');
  }

	ngOnInit() {
        (<any>window).onSignIn = (function(googleUser) {
    		let profile = googleUser.getBasicProfile();
            console.log('Name: ' + profile.getName());
			let idToken = googleUser.getAuthResponse().id_token;
			localStorage.setItem('google_id_token', idToken);

            // Send idToken to login route on backend
            let body = JSON.stringify({ 'idToken': idToken });
            let headers = new Headers({ 'X-Api-Key': '6Tairgv32oa3OCOpcY0dP6YgyGKt2Fge2TTDPOP5'});
            let options = new RequestOptions({ headers: headers });

            let response = this.http.post('https://w0jk0atq5l.execute-api.us-east-1.amazonaws.com/prod/login', body, options)
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
                message => {
                    if (message.success) {
                        window.location.assign('/dashboard');
                    }
                },
                err => console.log(err)
            );
       }).bind(this);

    }

}
