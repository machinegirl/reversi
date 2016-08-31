import { Component, OnInit, Input} from '@angular/core';
// import {WebsocketService} from './websocket.service';
import {Header} from './header';


@Component({
  selector: 'App',
  template: require('./main.html'),
  providers: [],
  directives: [Header]
})
export class Main implements OnInit {

  @Input() public main: Main;

  constructor() {
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

      // Send { 'cmd': 'login', 'id_token': idToken } to backend

			// let sendMsgIntHandle =  window.setInterval((function() {
      //       	if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined') {
      //           	this.websocketService.sock.send(JSON.stringify({
      //              		'cmd': 'login',
      //                   'id_token': idToken
      //               }));
      //
      //          		window.clearInterval(sendMsgIntHandle);
      //          } else {
      //              console.log('trying again...');
      //          }
      //      }).bind(this), 500);
      //
       }).bind(this);

    }

}
