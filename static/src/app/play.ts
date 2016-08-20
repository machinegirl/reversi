import { Component, OnInit} from '@angular/core';
import {WebsocketService} from './websocket.service';
import {ReversiService} from './reversi.service';
import {Header} from './header';
import {Player} from './player';

@Component({
  selector: 'Play',
  template: require('./play.html'),
  providers: [],
  directives: [Header, Player]
})
export class Play implements OnInit {


  constructor(private websocketService: WebsocketService, private reversiService: ReversiService) {
	  this.websocketService = websocketService;
	  this.reversiService = reversiService;
	//   reversiService.gameBoard = gameBoard;
	  console.log('play controller started');
  }

  ngOnInit() {
	  let id = window.location.search;
	  let idLength: number = id.length;
	  id = id.substring(4, idLength);
	  let intHandle = window.setInterval((function() {
		  if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined' && this.websocketService.sock.readyState === 1) {
			  this.reversiService.loadGame(id);

			  window.clearInterval(intHandle);
		  }
	  }).bind(this), 500);
	//   this.reversiService.drawGameBoard(this.reversiService.gameBoard);
  }

  move(e) {
	//   console.log(e);
	let gameBoardLength: number = this.reversiService.game.board.length;
	let tileW = e.srcElement.clientWidth / gameBoardLength;
	let clickedRow = Math.floor(e.offsetY / tileW);
	let clickedColumn = Math.floor(e.offsetX / tileW);
	let clickedTile = this.reversiService.game.board[clickedRow][clickedColumn];
	if (clickedTile !== 0) {
	  console.log('invalid move');
	  return;
	}
	// check if it's your turn
	if (!this.reversiService.checkTurn()) {
		console.log('not your turn');
		return;
	}
	console.log('its your turn!');

	// support for opening moves
	this.reversiService.doOpeningMove();


  }
}
