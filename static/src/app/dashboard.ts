import { Component, OnInit, Input} 	from '@angular/core';
import { Http} 	from '@angular/http';
// import {WebsocketService} from './websocket.service';
import {Header} from './header';
import {Player} from './player';
import {Popup} from './popup';
// import { Observable } from 'rxjs/Rx';



@Component({
  selector: 'Dashboard',
  template: require('./dashboard.html'),
  providers: [],
  directives: [Header, Player, Popup]
})
export class Dashboard implements OnInit {

	@Input() public dashboard: Dashboard;

	constructor(private http: Http) {
		// this.websocketService = websocketService;
		this.http = http;
	}

	ngOnInit() {

		// let sendMsgIntHandle =  window.setInterval((function() {
		// 	let idToken = localStorage.getItem('google_id_token');
		// 	if (typeof idToken === 'undefined' || idToken === null) {
		// 		window.location.assign('/');
		// 		return;
		// 	}
		// 	if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined' && this.websocketService.sock.readyState === 1) {
		// 		this.websocketService.sock.send(JSON.stringify({
		// 			'cmd': 'logged_in',
		// 			'id_token': idToken
		// 		}));
    //
		// 		window.clearInterval(sendMsgIntHandle);
		//    } else {
		// 	   //do nothing
		//    }
	  //  }).bind(this), 500);

  // TODO: Re-enable this.
	// let idToken = localStorage.getItem('google_id_token');
	// if (typeof idToken === 'undefined' || idToken === null) {
	// 	window.location.assign('/');
	// 	return;
	// }

  // Send	{ 'cmd': 'logged_in',	'id_token': idToken	} to backend

		console.log('dashboard loaded');
	}

	signOut() {
		console.log('signing out');
		(<any>window).gapi.load('client:auth2', this.authInit.bind(this));
	}

	authInit() {
		(<any>window).gapi.auth2.init({
			client_id: '402658185741-ai8prq9pem5vloivipl8o99ul5uuafvm.apps.googleusercontent.com',
			scopes: 'profile'
		});
		(<any>window).gapi.auth2.getAuthInstance().then(this.authCallback.bind(this));
	}

	authCallback(googleAuth) {
		localStorage.removeItem('google_id_token');
		googleAuth.signOut();
		window.location.assign('/');
	}

}
