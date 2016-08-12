import { Component, OnInit, Input} from '@angular/core';
import { WebsocketService} from './websocket.service';

@Component({
  selector: 'App',
  template: require('./main.html'),
  providers: [WebsocketService],
})
export class Main implements OnInit {

  @Input() public main: Main;

  constructor(private websocketService: WebsocketService) {
	  this.websocketService = websocketService;
	//   reversiService.gameBoard = gameBoard;
	  console.log('main controller started');
  }

	ngOnInit() {
		this.websocketService.init();
        (<any>window).onSignIn = (function(googleUser) {
    		let profile = googleUser.getBasicProfile();
            console.log('Name: ' + profile.getName());

			let sendMsgIntHandle =  window.setInterval((function() {
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
