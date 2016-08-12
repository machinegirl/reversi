import { Component, OnInit, Input} from '@angular/core';
import {WebsocketService} from './websocket.service';

@Component({
  selector: 'App',
  template: require('./main.html'),
  providers: [WebsocketService],
})
export class Main implements OnInit {

  @Input() public main: Main;

  // public websocketService: WebsocketService;

  constructor(private websocketService: WebsocketService) {
	//   reversiService.gameBoard = gameBoard;
	this.websocketService = websocketService;
	  console.log('main controller started');

  }

	ngOnInit() {
		this.websocketService.init();
		(<any>window).onSignIn = (function(googleUser) {
			let profile = googleUser.getBasicProfile();
			console.log('Name: ' + profile.getName());
			console.log('Token: ' + googleUser.getAuthResponse().id_token);

			// TODO: send googleUser.getAuthResponse().id_token to backend over websocket

			let sendMsgIntHandle = 	window.setInterval((function() {
				if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined') {
					this.websocketService.sock.send(JSON.stringify({
						'cmd': 'login',
						'id_token': googleUser.getAuthResponse().id_token
					}));

					window.clearInterval(sendMsgIntHandle);
				} else {
					console.log('trying again...')
				}
			}).bind(this), 5000);

		}).bind(this);


	}

}
