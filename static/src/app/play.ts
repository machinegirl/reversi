import { Component, OnInit} from '@angular/core';
import { Http, Response, Headers, RequestMethod, RequestOptions } from '@angular/http';
import {Location} from '@angular/common';
// import {WebsocketService} from './websocket.service';
import {ReversiService} from './reversi.service';
import {Header} from './header';
import {Player} from './player';
import { Observable } from 'rxjs/Observable';

declare var PubNub: any;

@Component({
  selector: 'Play',
  template: require('./play.html'),
  providers: [Location],
  directives: [Header, Player]
})
export class Play implements OnInit {

  pubnub: any;
  pubnub2: any;
  subscribedPubnubSystem: boolean;
  subscribedPubnubSystem2: boolean;
  opponentEmail: string;
  status: any;

  constructor(private reversiService: ReversiService, private http: Http, private location: Location) {
	  this.reversiService = reversiService;
	//   reversiService.gameBoard = gameBoard;
	  console.log('play controller started');
  }

  ngOnInit() {
      this.reversiService.init(() => {
          this.play();
      });
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
          let idToken = localStorage.getItem('google_id_token');

          // Send { 'cmd': 'check_move', 'id_token': idToken, 'id': 'azx', 'game': this.reversiService.game} to backend

          // let sendMsgIntHandle =  window.setInterval((function() {
          //   if (typeof this.websocketService !== 'undefined' && typeof this.websocketService.sock !== 'undefined' && this.websocketService.sock.readyState === 1) {
          //     this.websocketService.sock.send(JSON.stringify({
          //       'cmd': 'check_move',
          //       'id_token': idToken,
          //       'id': 'azx',
          //       'game': this.reversiService.game
          //     }));
          //
          //     window.clearInterval(sendMsgIntHandle);
          //    } else {
          //      //do nothing
          //    }
          //  }).bind(this), 500);

        } else {
          console.log('invalid move');
        }
  }

  play() {
      let accessToken = localStorage.getItem('reversiAccessToken');
      if (typeof accessToken === 'undefined' || accessToken === null) {
          window.location.assign('/');
          return;
      }

      this.reversiService.loggedIn(accessToken, (loggedIn) => {
          if (!loggedIn) {
              window.location.assign('/');
              return;
          }

          this.pubnub = new PubNub({
              subscribeKey: this.reversiService.pubnubSubscribeKey
          });

          this.pubnub.addListener({
              status: (function(statusEvent) {
                  if (statusEvent.category === 'PNConnectedCategory') {

                  }
              }).bind(this),
              message: (function(message) {
                  console.log('New Message!!', message);
              }).bind(this),
              presence: (function(presenceEvent) {

              }).bind(this)
          });


          let game = this.reversiService.getParameterByName('game', false);
          let endpoint = (game == null) ? '/game' : '/game?game=' + game;

          this.reversiService.apiReq(RequestMethod.Get, endpoint, accessToken, null, null, (res, err) => {
              if (err != null) {
                  console.log('API Request Error:');
                  console.log(err);
                  return;
              }
            //   this.reversiService.loadGame(game);
              let id = res.id;
              this.location.replaceState('/play', 'game='+id);
              let c = <HTMLCanvasElement> document.getElementById('gameBoard');
              if (typeof c !== 'undefined') {
                  let ctx = <CanvasRenderingContext2D> c.getContext('2d');
                  // console.log(ctx);
                  ctx.fillStyle = '#0f8f2f';
                  ctx.fillRect(0, 0, 400, 400);

                  if ('game' in res) {
                      this.status = res.game.status;
                      console.log(res.game);
                      switch (res.game.status) {
                        case 0:
                            // display message on game board: Invite someone to play
                            break;
                        case 1:
                            // hide send invite form
                            // show cancel invite button
                            // display message on game board: Waiting for invitation to be accepted
                            break;
                        case 2:
                            // build game oject from results
                            // draw game board
                            break;
                        default:
                            console.log('error: game: ' + res.id + ': status: ' + res.game.status + ' not recognized');
                      }
                  } else {
                      this.status = 0;
                  }
              }
          });
      });
  }

  invite() {
      let accessToken = localStorage.getItem('reversiAccessToken');
      let game = this.reversiService.getParameterByName('game', false);

      this.reversiService.apiReq(RequestMethod.Post, '/invite', accessToken, null, {email: this.opponentEmail, game: game}, (res, err) => {
          if (err != null) {
              console.log('API Request Error:');
              console.log(err);
              return;
          }

          console.log(res);
        //   this.reversiService.loadGame(game);
      });
    }

    cancelInvite() {
        let accessToken = localStorage.getItem('reversiAccessToken');
        let game = this.reversiService.getParameterByName('game', false);
        let endpoint = '/invite?game="' + game + '"';

        this.reversiService.apiReq(RequestMethod.Delete, endpoint, accessToken, null, null, (res, err) => {
            if (err != null) {
                console.log('API Request Error:');
                console.log(err);
                return;
            }
            // this.reversiService.loadGame(game);
        });
    }
}
