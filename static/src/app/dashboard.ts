import { Component, OnInit, Input} from '@angular/core';
import {WebsocketService} from './websocket.service';
import {Header} from './header';



@Component({
  selector: 'Dashboard',
  template: require('./dashboard.html'),
  providers: [WebsocketService],
  directives: [Header]
})

export class Dashboard implements OnInit {

	@Input() public dashboard: Dashboard;

	constructor(private websocketService: WebsocketService) {
		this.websocketService = websocketService;
	}

	ngOnInit() {
		this.websocketService.init();

		let sendMsgIntHandle =  window.setInterval((function() {
			let idToken = localStorage.getItem('google_id_token');
			if (typeof idToken === 'undefined' || idToken === null) {
				window.location.assign('/');
			}
			if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined' && this.websocketService.sock.readyState === 1) {
				this.websocketService.sock.send(JSON.stringify({
					'cmd': 'logged_in',
					'id_token': idToken
				}));

				window.clearInterval(sendMsgIntHandle);
		   } else {
			   console.log('trying again...');
		   }
	   }).bind(this), 500);


		console.log('dashboard loaded');
	}

	signOut() {
		console.log('signing out');
	}

}
