import {ReversiService} from './reversi.service';
import { Component, OnInit} from '@angular/core';

@Component({
  selector: 'Play',
  template: require('./play.html'),
  providers: [ReversiService],
})
export class Play implements OnInit {

  constructor(private reversiService: ReversiService) {
	//   reversiService.gameBoard = gameBoard;
	  console.log('play controller started');
  }

  ngOnInit() {
	  this.reversiService.init();
  }
}
