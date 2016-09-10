import { Component, OnInit} from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
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

  constructor(private reversiService: ReversiService, private http: Http, private location: Location) {
	  this.reversiService = reversiService;
	//   reversiService.gameBoard = gameBoard;
	  console.log('play controller started');
  }

  ngOnInit() {
      this.play();
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
                  subscribeKey : 'sub-c-ee9c502c-6e51-11e6-92a0-02ee2ddab7fe'
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

                let headers = new Headers({
                    'X-Api-Key': this.reversiService.xApiKey,
                    'X-Reversi-Auth': 'Bearer ' + localStorage.getItem('reversiAccessToken')
                });
                let options = new RequestOptions({ headers: headers });

                let playUrl = 'https://ztmyo899de.execute-api.us-east-1.amazonaws.com/dev/game';
                let id = this.reversiService.getParameterByName('game', false);

                if (id != null) {   // If we want to load an ongoing game.
                    playUrl += '?game=' + id;
                }

                let response = this.http.get(playUrl, options)
                  .map(function(res: Response) {
                    let body = res.json();
                    return body || { };
                  })
                  .catch(function(error: any) {
                    let errMsg = (error.message) ? error.message :
                    error.status ? `${error.status} - ${error.statusText}` : 'Server error';
                    console.log('!!error!!');
                    console.log(errMsg); // log to console instead
                    return Observable.throw(errMsg);
                  });

                response.subscribe(
                  message => {
                      console.log(message);
                    //   let id = window.location.search;

                      if (id == null) {
                          id = message.id;
                          this.location.replaceState('/play', 'game='+id);
                      } else {
                        //   let idLength: number = id.length;
                        //   id = id.substring(4, idLength);
                      }

                      console.log('Subscribing to PubNub channel: game-' + id);
                      this.pubnub.subscribe({
                          channels: ['game-'+id]
                      });

                      this.reversiService.loadGame(id);     // TODO: This currently does nothing.
                  },
                  err => console.log(err)
                );

          });
      }

      invite() {
          let inviteUrl = 'https://ztmyo899de.execute-api.us-east-1.amazonaws.com/dev/invite';

          console.log(this.opponentEmail);
          console.log(this.reversiService.getParameterByName('game', false));

          let body = JSON.stringify({
              email: this.opponentEmail,
              game: this.reversiService.getParameterByName('game', false)
          });
          let headers = new Headers({
              'Content-Type': 'application/json',
              'X-Api-Key': this.reversiService.xApiKey,
              'X-Reversi-Auth': 'Bearer ' + localStorage.getItem('reversiAccessToken')
          });
          let options = new RequestOptions({ headers: headers });

          let response = this.http.post(inviteUrl, body, options)
            .map(function(res: Response) {
              let body = res.json();
              return body || { };
            })
            .catch(function(error: any) {
              let errMsg = (error.message) ? error.message :
              error.status ? `${error.status} - ${error.statusText}` : 'Server error';
              console.log('!!error!!');
              console.log(errMsg); // log to console instead
              return Observable.throw(errMsg);
            });

          response.subscribe(
            message => {
                console.log(message);
                let id = window.location.search;
                 let idLength: number = id.length;
                 id = id.substring(4, idLength);
                this.reversiService.loadGame(id);
            },
            err => console.log(err)
          );
      }
}
