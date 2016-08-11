import { Component, OnInit, Input} from '@angular/core';

declare var gapi: any;

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

  onSignIn(googleUser) {
	  let profile = googleUser.getBasicProfile();
	  console.log('Name: ' + profile.getName);
  }

  ngOnInit() {

    }
}
