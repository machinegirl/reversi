import { Component, OnInit, Input} from '@angular/core';

@Component({
  selector: 'App',
  template: require('./main.html'),
  providers: [],
})
export class Main implements OnInit {

  @Input() public main: Main;

  constructor() {
	//   reversiService.gameBoard = gameBoard;
	  console.log('main controller started');
  }

	ngOnInit() {
		(<any>window).onSignIn = function(googleUser) {
			let profile = googleUser.getBasicProfile();
			console.log('Name: ' + profile.getName());
			// TODO: send googleUser.getAuthResponse().id_token to backend over websocket
		  };
	}
}
