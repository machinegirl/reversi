import { Component, OnInit} from '@angular/core';
import {WebsocketService} from './websocket.service';
import {ReversiService} from './reversi.service';
import {Header} from './header';
import {Player} from './player';

declare var Pusher: any;

@Component({
  selector: 'Play',
  template: require('./play.html'),
  providers: [],
  directives: [Header, Player]
})
export class Play implements OnInit {

  pubnub: any;

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
	  console.log('invalid move: you must click on an empty tile');
	  return;
	}
	// check if it's your turn
	if (!this.reversiService.checkTurn()) {
		// console.log('not your turn');
		return;
	}
	// console.log('its your turn!');

	let moveCheck = this.reversiService.checkMove(clickedRow, clickedColumn);
  let game = this.reversiService.game;
  if (moveCheck) {
    console.log('valid move');
    game.board[clickedRow][clickedColumn] = game.player_turn + 1;
    game.pieces[game.player_turn] = game.pieces[game.player_turn] - 1;
    game.player_turn = (game.player_turn + 1) % 2;

    // this.reversiService.drawGameBoard(this.reversiService.game.board);
    let sendMsgIntHandle =  window.setInterval((function() {
      let idToken = localStorage.getItem('google_id_token');
      if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined' && this.websocketService.sock.readyState === 1) {
        this.websocketService.sock.send(JSON.stringify({
          'cmd': 'check_move',
          'id_token': idToken,
          'id': 'azx',
          'game': this.reversiService.game
        }));

        window.clearInterval(sendMsgIntHandle);
       } else {
         //do nothing
       }
     }).bind(this), 500);

  } else {
    console.log('invalid move');
  }
  }

  // A Pusher example.
  pusherHello() {

    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true;

    var pusher = new Pusher('5b8ecce2b0bba5818f9d', {
      encrypted: true
    });

    var channel = pusher.subscribe('private-channel');
    channel.bind('pusher:subscription_succeeded', function() {
      var triggered = channel.trigger('client-hello', {some: {data: true}});
    });
  }
}
