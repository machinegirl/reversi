import { Injectable} from '@angular/core';
import {JwtHelper} from 'angular2-jwt';
import { Http, Response, Headers, RequestMethod, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class ReversiService {

	// public gameBoard: Array<Array<number>>;
	public sockHandle: any;
	public game: any;
	public numPieces0: number;
	public numPieces1: number;
	jwtHelper: JwtHelper = new JwtHelper();
	xApiKey: string;					// NOTE: The following 3 vars are loaded from /assets/conf/api.conf
	apiPrefix: string;
	apiStage: string;
	pubnubSubscribeKey: string;			// NOTE: This is loaded from /assets/conf/pubnub.conf
	googleIdentityPlatformKey: string;	// NOTE: This is loaded from /assets/conf/googleIdentityPlatform.key
	apiConfLoaded: boolean;
	pubnubConfLoaded: boolean;
	googleIdentityPlatformKeyLoaded: boolean;

	constructor(public http: Http) {

	}

	init(callback: any) {
		console.log('reversi service started');


		this.loadApiConf(() => {			// Load api.conf
			this.loadPubnubConf(() => {		// Load pubnub.conf
				this.loadGoogleIdentityPlatformKey(() => {
					// this.gameBoard = [
					// 	[0, 0, 0, 0, 0, 0, 0, 0],
					// 	[0, 0, 0, 0, 0, 0, 0, 0],
					// 	[0, 0, 0, 0, 0, 0, 0, 0],
					// 	[0, 0, 0, 0, 0, 0, 0, 0],
					// 	[0, 0, 0, 0, 0, 0, 0, 0],
					// 	[0, 0, 0, 0, 0, 0, 0, 0],
					// 	[0, 0, 0, 0, 0, 0, 0, 0],
					// 	[0, 0, 0, 0, 0, 0, 0, 0]
					// ];

					// TODO: Move this somewhere else so init() can be idempotent.
					if (window.location.pathname === '/play') {
						let c = <HTMLCanvasElement> document.getElementById('gameBoard');
						if (typeof c !== 'undefined') {
							let ctx = <CanvasRenderingContext2D> c.getContext('2d');
							// console.log(ctx);
							ctx.fillStyle = '#0f8f2f';
							ctx.fillRect(0, 0, 400, 400);

							// this.drawGameBoard(gameBoard);
						} else {
							// console.log('c: ' + c);
						}
					}

					callback();
				});
			});
		});
	}

	loadApiConf(callback: any) {

		if (this.apiConfLoaded) {
			callback();
			return;
		}

		this.apiConfLoaded = true;

		let confPath = '/assets/conf/api.conf';

		let headers = new Headers({
			'Content-Type': 'application/json'
		});
		let options = new RequestOptions({ headers: headers });

		let response = this.http.get(confPath, options)
		.map(function(res: Response) {
		  let body = res.json();
		  return body || { };
		})
		.catch(function(error: any) {
		  let errMsg = (error.message) ? error.message :
		  error.status ? `${error.status} - ${error.statusText}` : 'Server error';
		  console.log('!!error!!');
		  console.log(errMsg);
		  return Observable.throw(errMsg);
		});

		response.subscribe(
			body => {
				this.xApiKey = body.x_api_key;
				this.apiPrefix = body.api_prefix;
				this.apiStage = body.api_stage;
				callback();
			},
			err => console.log(err)
		);
	}

	loadPubnubConf(callback: any) {

		if (this.pubnubConfLoaded) {
			callback();
			return;
		}

		this.pubnubConfLoaded = true;

		let confPath = '/assets/conf/pubnub.conf';

		let headers = new Headers({
			'Content-Type': 'application/json'
		});
		let options = new RequestOptions({ headers: headers });

		let response = this.http.get(confPath, options)
		.map(function(res: Response) {
		  let body = res.json();
		  return body || { };
		})
		.catch(function(error: any) {
		  let errMsg = (error.message) ? error.message :
		  error.status ? `${error.status} - ${error.statusText}` : 'Server error';
		  console.log('!!error!!');
		  console.log(errMsg);
		  return Observable.throw(errMsg);
		});

		response.subscribe(
			body => {
				this.pubnubSubscribeKey = body.subscribe_key;
				callback();
			},
			err => console.log(err)
		);
	}

	loadGoogleIdentityPlatformKey(callback: any) {

		if (this.googleIdentityPlatformKeyLoaded) {
			callback();
			return;
		}

		this.googleIdentityPlatformKeyLoaded = true;

		let confPath = '/assets/conf/googleIdentityPlatform.key';

		let headers = new Headers({
			'Content-Type': 'application/json'
		});
		let options = new RequestOptions({ headers: headers });

		let response = this.http.get(confPath, options)
		.map(function(res: Response) {
		  let body = res.json();
		  return body || { };
		})
		.catch(function(error: any) {
		  let errMsg = (error.message) ? error.message :
		  error.status ? `${error.status} - ${error.statusText}` : 'Server error';
		  console.log('!!error!!');
		  console.log(errMsg);
		  return Observable.throw(errMsg);
		});

		response.subscribe(
			body => {
				this.googleIdentityPlatformKey = body;
				callback();
			},
			err => console.log(err)
		);
	}

	getParameterByName(name, url) {
	    if (!url) url = window.location.href;
	    name = name.replace(/[\[\]]/g, "\\$&");
	    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	        results = regex.exec(url);
	    if (!results) return null;
	    if (!results[2]) return '';
	    return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	drawGameBoard(gameBoard) {
		let c = <HTMLCanvasElement> document.getElementById('gameBoard');
		let ctx = <CanvasRenderingContext2D> c.getContext('2d');
		let h = c.height;
		ctx.fillStyle = '#0f8f2f';
		ctx.fillRect(0, 0, h, h);
		let tileH = h / 8;
		let startX = 0;
		let startY = 0;
		ctx.strokeStyle = '#000000';
		for (let i = 0; i < gameBoard.length; i++) {
			for (let j = 0; j < gameBoard[i].length; j++) {
				ctx.beginPath();
				ctx.moveTo(startX, startY);
				ctx.lineTo(startX + tileH, startY);
				ctx.lineTo(startX + tileH, startY + tileH);
				ctx.lineTo(startX, startY + tileH);
				ctx.lineTo(startX, startY);
				ctx.stroke();
				if (gameBoard[i][j] !== 0) {
					ctx.beginPath();
					ctx.arc(startX + (tileH / 2), startY + (tileH / 2), tileH / 2.2, 0, 2 * Math.PI);

					if (gameBoard[i][j] === 1) {
						ctx.fillStyle = '#FFFFFF';
					} else {
						ctx.fillStyle = '#000000';
					}
					ctx.fill();
				}

				startX += tileH;

			}
			startY += tileH;
			startX = 0;
		}
	}

	// newGame() {
	// 	let gameBoard = [];
	// 	for (let i = 0; i < 8; i++) {
	// 		let row = [];
	// 		for (let j = 0; j < 8; j++) {
	// 			row.push(0);
	// 		}
	// 		gameBoard.push(row);
	// 	}
	// 	this.gamed = gameBoard;
	// }

	loadGame(id) {
		// TODO: Do we need this?
	}

	setupGame(game) {
		this.game = game;
		this.drawGameBoard(this.game.board);

	}

	checkTurn() {
		let idToken = this.jwtHelper.decodeToken(localStorage.getItem('google_id_token')).sub;
		let playerTurn = this.game.player_turn;
		if (this.game.players[playerTurn] !== idToken) {
		  return false;
		} else {
		  return true;
	  }
	}

	checkMove(row, column) {
		let validMoves = [];
		// let idToken = this.jwtHelper.decodeToken(localStorage.getItem('google_id_token')).sub;
		if (this.game.pieces[this.game.player_turn] > 30) {
			console.log('player ' + this.game.player_turn + ': do opening move');
			if (this.game.player_turn === 0) {
				validMoves = [[3, 3], [4, 4]];
			} else if (this.game.player_turn === 1) {
				validMoves = [[4, 3], [3, 4]];
			}
		} else {
			console.log('make a real move');
			validMoves = this.validMoves();
		}
		for (let i = 0; i < <number>validMoves.length; i++) {
			if (validMoves[i][0] === row && validMoves[i][1] === column) {
				return true;
			}
		}

		return false;

	}

	validMoves() {
		let validMoves = [];
		let gameBoardLength: number = this.game.board.length;

		for (let i = 0; i < gameBoardLength; i++) {

		}

		return validMoves;
	}

	login(idToken, callback) {

		this.apiReq(RequestMethod.Post, '/login', null, null, {idToken: idToken}, (res, err) => {
			if (err != null) {
				console.log('API Request Error:');
				console.log(err);
				return;
			}
			callback(res);
		});

		// let endpoint = '/login';
		//
		// let body = JSON.stringify({ 'idToken': idToken });
		// let headers = new Headers({ 'X-Api-Key': this.xApiKey});
		// let options = new RequestOptions({ headers: headers });
		//
		// let response = this.http.post(this.apiPrefix + this.apiStage + endpoint, body, options)
		// .map(function(res: Response) {
		//   let body = res.json();
		//   return body || { };
		// })
		// .catch(function(error: any) {
		//   let errMsg = (error.message) ? error.message :
		//   error.status ? `${error.status} - ${error.statusText}` : 'Server error';
		//   console.log('!!error!!');
		//   console.log(errMsg); // log to console instead
		//   return Observable.throw(errMsg);
		// });
		//
		// response.subscribe(
		// 	message => {
		// 		callback(message);	// Send back the result
		// 	},
		// 	err => console.log(err)
		// );
	}

	refreshLogin() {

		let endpoint = '/refresh_login';

		let accessToken = localStorage.getItem('reversiAccessToken');
		if (typeof accessToken === 'undefined' || accessToken === null) {
			window.location.assign('/');
			return;
		}
		let decoded = this.jwtHelper.decodeToken(accessToken);
		let now = Math.floor(Date.now()/1000);
		let timeout = ((decoded.exp - now) * 1000) - (1000 * 60 * 5);
		timeout = timeout < 0 ? 0 : timeout;
		let refresh = () => {

			let headers = new Headers({
				'X-Api-Key': this.xApiKey,
				'X-Reversi-Auth': 'Bearer ' + accessToken,
			});
			let options = new RequestOptions({ headers: headers });

			let response = this.http.put(this.apiPrefix + this.apiStage + endpoint, null, options)
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
					console.log('refresh token success: ' + message.success);
					console.log('new access token: ' + message.accessToken);
					if (!message.success) {
						localStorage.removeItem('reversiAccessToken');
						window.location.assign('/');
						return;
					}
					window.setTimeout(refresh, 1000 * 60 * 55);
					localStorage.setItem('reversiAccessToken', message.accessToken);
				},
				err => console.log(err)
			);
		};

		window.setTimeout(refresh, timeout);
	};

	loggedIn(accessToken, callback) {

		let endpoint = '/logged_in';

		let headers = new Headers({
			'Content-Type': 'application/json',
			'X-Api-Key': this.xApiKey,
			'X-Reversi-Auth': 'Bearer ' + accessToken,
		});
		let options = new RequestOptions({ headers: headers });

		let response = this.http.get(this.apiPrefix + this.apiStage + endpoint, options)
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
			loggedIn => {
				this.refreshLogin();
				callback(loggedIn);	// Send back the result
			},
			err => console.log(err)
		);
	}

	logout(accessToken, callback) {

		let endpoint = '/logout';

		let headers = new Headers({
			'X-Api-Key': this.xApiKey,
			'X-Reversi-Auth': 'Bearer ' + accessToken,
		});
		let options = new RequestOptions({ headers: headers });

		let response = this.http.put(this.apiPrefix + this.apiStage + endpoint, null, options)
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
			logout => {
				callback(logout);	// Send back the result
			},
			err => console.log(err)
		);


	}

	deleteUser(accessToken, callback) {
		let endpoint = '/user';
		let headers = new Headers({
			'X-Api-Key': this.xApiKey,
			'X-Reversi-Auth': 'Bearer ' + accessToken,
		});
		let options = new RequestOptions({ headers: headers });

		let response = this.http.delete(this.apiPrefix + this.apiStage + endpoint, options)
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
			body => {
				callback(body);
			},
			err => console.log(err)
		);
	}

	acceptInvite(idToken, inviteCode, callback) {
		let endpoint = '/invite';

		let headers = new Headers({
			'X-Api-Key': this.xApiKey,
		});

		let body = JSON.stringify({'inviteCode': inviteCode, 'idToken': idToken});
		let options = new RequestOptions({ headers: headers });

		let response = this.http.put(this.apiPrefix + this.apiStage + endpoint, body, options)
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
			body => {
				callback(body);
			},
			err => console.log(err)
		);
	}

	// Get your profile info.
	getUser(accessToken, callback) {
		this.apiReq(RequestMethod.Get, '/user', accessToken, null, null, (res, err) => {
			if (err != null) {
				console.log('API Request error:');
				console.log(err);
				return;
			}
			callback(res);
		});
	}

	// Make an API request
	apiReq(method, endpoint, accessToken, headers, body, callback) {

		let h = {
			'Content-Type': 'application/json',
			'X-Api-Key': 	this.xApiKey
		};

		if (accessToken != null) {
			h['X-Reversi-Auth'] = 'Bearer ' + accessToken;
		}

		if (headers != null) {
			for (let key in headers) {
				h[key] = headers[key];
			}
		}

		this.http.request(this.apiPrefix + this.apiStage + endpoint, {
			method: method,
			headers: new Headers(h),
			body: JSON.stringify(body)
		})
		.map((res: Response) => {	// TODO: Are .map() and .catch() really necessary?
			return res;
		})
		.catch((err: any) => {
			return err;
		})
		.subscribe(
			(res) => {
				callback(res, null);
			},
			(err) => {
				callback(null, err);
			}
		);
	}
}
