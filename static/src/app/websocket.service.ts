import { Injectable } from '@angular/core';
import {ReversiService} from './reversi.service';

@Injectable()
export class WebsocketService {

  public wsStatus: string;

  public sock: any;

  init() {

	  this.wsStatus = 'not connected';

	  let address = document.location.host.split(':')[0];
	  let sockAddr;

	  let tryConnecting = (function() {
		  this.wsStatus = 'connecting...';
		  if (address === 'localhost') {
			  sockAddr = 'ws://127.0.0.1:8055';
		  } else {
			  sockAddr = 'wss://104.196.159.79:8056';
		  }

		  console.log('connecting to ' + sockAddr + ' ...');

		  this.sock = new WebSocket(sockAddr, 'rust-websocket');

		  this.sock.onopen = (function(evt) {
	  		if (this.sock.readyState === 1) {
				this.wsStatus = 'connected';
				console.log('connected to ' + sockAddr);
	  			this.sock.send(JSON.stringify({'cmd': 'msg', 'msg': 'client socket opened'}));
				// 		ReversiService.startGame(sock);
	  		}
	  	}).bind(this);

		this.sock.onmessage = (function(e) {
			console.log('websocket server msg:');
			console.log(e);

			let msg = JSON.parse(e.data);

			switch (msg.cmd) {
			case 'login':

				if (!msg.success) {
					console.log('backend login failed');
					return;
				}

				console.log('backend login succeeded');
				window.location.assign('/dashboard');

				break;

			case 'logged_in':

				if (!msg.status) {
					console.log('not logged in');
					window.location.assign('/');
					return;
				}

				console.log('logged in!');
				break;


			default:
				console.log('websocket server msg not understood');
			}

	  }).bind(this);

		this.sock.onclose = (function() {
			console.log('connection to ' + sockAddr + ' closed');
			window.setTimeout(tryConnecting.bind(this), 5000);
		}).bind(this);

	}).bind(this);

	window.setTimeout(tryConnecting.bind(this), 5000);

  }
}
