import { Component, OnInit} from '@angular/core';

@Component({
  selector: 'App',
  template: require('./main.html'),
  providers: [],
})
export class Main implements OnInit {

  constructor() {
	//   reversiService.gameBoard = gameBoard;
	  console.log('main controller started');
  }

  ngOnInit() {

  }
}
