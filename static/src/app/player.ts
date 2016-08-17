import {Component, OnInit} from '@angular/core';
import {WebsocketService} from './websocket.service';

@Component({
  selector: 'Player',
  template: require('./player.html'),
  providers: []
})
export class Player implements OnInit {

	public path: string;

	constructor(private websocketService: WebsocketService) {
		this.websocketService = websocketService;
	}

	ngOnInit() {
		this.path = window.location.pathname;
		if (this.path === '/play') {
			return;
		}
		let sendMsgIntHandle =  window.setInterval((function() {
			let idToken = localStorage.getItem('google_id_token');
			if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined' && this.websocketService.sock.readyState === 1) {
				this.websocketService.sock.send(JSON.stringify({
					'cmd': 'get_ongoing_games',
					'id_token': idToken
				}));

				window.clearInterval(sendMsgIntHandle);
		   } else {
			   //do nothing
		   }
	   }).bind(this), 500);

	}

	newGame() {
		let sendMsgIntHandle =  window.setInterval((function() {
			let idToken = localStorage.getItem('google_id_token');
			if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined' && this.websocketService.sock.readyState === 1) {
				this.websocketService.sock.send(JSON.stringify({
					'cmd': 'new_game',
					'id_token': idToken
				}));

				window.clearInterval(sendMsgIntHandle);
		   } else {
			   //do nothing
		   }
	   }).bind(this), 500);
	}
}
