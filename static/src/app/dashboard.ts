import { Component, OnInit, Input} from '@angular/core';
import {WebsocketService} from './websocket.service';
import {Header} from './header';
import {Player} from './player';



@Component({
  selector: 'Dashboard',
  template: require('./dashboard.html'),
  providers: [WebsocketService],
  directives: [Header, Player]
})
export class Dashboard implements OnInit {

	@Input() public dashboard: Dashboard;

	// public wsStatus;

	constructor(private websocketService: WebsocketService) {
		this.websocketService = websocketService;
	}

	ngOnInit() {
		this.websocketService.init();

		let sendMsgIntHandle =  window.setInterval((function() {
			let idToken = localStorage.getItem('google_id_token');
			if (typeof idToken === 'undefined' || idToken === null) {
				window.location.assign('/');
				return;
			}
			if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined' && this.websocketService.sock.readyState === 1) {
				this.websocketService.sock.send(JSON.stringify({
					'cmd': 'logged_in',
					'id_token': idToken
				}));

				window.clearInterval(sendMsgIntHandle);
		   } else {
			   //do nothing
		   }
	   }).bind(this), 500);

		console.log('dashboard loaded');
	}

	signOut() {
		console.log('signing out');
		(<any>window).gapi.load('client:auth2', this.authInit.bind(this));
		// localStorage.removeItem('google_id_token');
	}

	authInit() {
		(<any>window).gapi.auth2.init({
			client_id: '402658185741-ai8prq9pem5vloivipl8o99ul5uuafvm.apps.googleusercontent.com',
			scopes: 'profile'
		});
		(<any>window).gapi.auth2.getAuthInstance().then(this.authCallback.bind(this));
	}

	authCallback(googleAuth) {
		googleAuth.signOut();
		window.location.assign('/');
	}

}
