import { Injectable } from '@angular/core';
import {ReversiService} from './reversi.service';

@Injectable()
export class WebsocketService {

  public sock: any;

  init() {

	  let address = document.location.host.split(':')[0];
	  let sockAddr;

	  let tryConnecting = (function() {
		  if (address === 'localhost') {
			  sockAddr = 'ws://127.0.0.1:8055';
		  } else {
			  sockAddr = 'ws://104.196.159.79:8055';
		  }

		  console.log('connecting to ' + sockAddr + ' ...');

		  this.sock = new WebSocket(sockAddr, 'rust-websocket');

		  this.sock.onopen = (function(evt) {
	  		if (this.sock.readyState === 1) {
				console.log('connected to ' + sockAddr);
	  			this.sock.send(JSON.stringify({'cmd': 'msg', 'msg': 'client socket opened'}));
				// 		ReversiService.startGame(sock);
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
