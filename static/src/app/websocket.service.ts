import { Injectable } from '@angular/core';

@Injectable()
export class WebsocketService {

  init() {
	let sock;
	let sock2;
	let sock3;

	let onopen = function(evt) {
		if (sock && sock.readyState === 1) {

			if (sock2 && (sock2.readyState === 1)) {
				sock2.onclose = undefined;
				sock2.close();
				sock2 = undefined;
			}

			if (sock3 && (sock3.readyState === 1)) {
				sock3.onclose = undefined;
				sock3.close();
				sock3 = undefined;
			}

			sock.send('client socket opened');
			sock.send(JSON.stringify(evt));
		}

		if (sock2 && sock2.readyState === 1) {

			if (sock && (sock.readyState === 1)) {
				sock.onclose = undefined;
				sock.close();
				sock = undefined;
			}

			if (sock3 && (sock3.readyState === 1)) {
				sock3.onclose = undefined;
				sock3.close();
				sock3 = undefined;
			}

			sock2.send('client socket opened');
			sock2.send(JSON.stringify(evt));
		}

		if (sock3 && sock3.readyState === 1) {

			if (sock && (sock.readyState === 1)) {
				sock.onclose = undefined;
				sock.close();
				sock = undefined;
			}

			if (sock2 && (sock2.readyState === 1)) {
				sock2.onclose = undefined;
				sock2.close();
				sock2 = undefined;
			}

			sock3.send('client socket opened');
			sock3.send(JSON.stringify(evt));
		}
	};

	let onmessage = function(evt) {
		console.log('websocket msg');
		console.log(evt);
	};

	let onerror = function(err) {
		console.log('Error');
		console.log(err);
	};

	let onclose1 = function() {
		window.setTimeout(function() {
			try {
				window.setTimeout(function() {
					sock = new WebSocket('ws://127.0.0.1:8055', 'rust-websocket');
					if (sock) {
						sock.onclose = onclose1;
						sock.onopen = onopen;
						sock.onmessage = onmessage;
						sock.onerror = onerror;
					}
				}, 0);
			} catch (err) {
				console.log(err);
				return;
			}
		}, 5000);
	};

	let onclose2 = function(evt) {
		window.setTimeout(function() {
			try {
				window.setTimeout(function() {
					sock2 = new WebSocket('ws://172.17.0.2:8055', 'rust-websocket');
					if (sock2) {
						sock2.onclose = onclose2;
						sock2.onopen = onopen;
						sock2.onmessage = onmessage;
						sock2.onerror = onerror;
					}
				}, 0);
			} catch (err) {
				console.log(err);
				return;
			}
		}, 5000);
	};

	let onclose3 = function(evt) {
		window.setTimeout(function() {
			try {
				window.setTimeout(function() {
					sock3 = new WebSocket('ws://104.196.159.79:8055', 'rust-websocket');
					if (sock3) {
						sock3.onclose = onclose3;
						sock3.onopen = onopen;
						sock3.onmessage = onmessage;
						sock3.onerror = onerror;
					}
				}, 0);
			} catch (err) {
				console.log(err);
				return;
			}
		}, 5000);
	};

	try {
		window.setTimeout(function() {
			sock = new WebSocket('ws://127.0.0.1:8055', 'rust-websocket');
			if (sock) {
				sock.onclose = onclose1;
				sock.onopen = onopen;
				sock.onmessage = onmessage;
				sock.onerror = onerror;
			}
		}, 0);
		window.setTimeout(function() {
			sock2 = new WebSocket('ws://172.17.0.2:8055', 'rust-websocket');
			if (sock2) {
				sock2.onclose = onclose2;
				sock2.onopen = onopen;
				sock2.onmessage = onmessage;
				sock2.onerror = onerror;
			}
		}, 0);
		window.setTimeout(function() {

			if (sock.readyState === 1 || sock2.readyState === 1) {
				return;
			}

			sock3 = new WebSocket('ws://104.196.159.79:8055', 'rust-websocket');
			if (sock3) {
				sock3.onclose = onclose3;
				sock3.onopen = onopen;
				sock3.onmessage = onmessage;
				sock3.onerror = onerror;
			}

		}, 0);
	} catch (err) {
		console.log(err);
		return;
	}

	window.setInterval(function() {
		if (sock && sock.readyState === 1) {
			if (sock2 && sock2.readyState === 1) {
				console.log('local websocket server detected, disconnecting from docker websocket server');
				sock2.onclose = undefined;
				sock2.close();
				sock2 = undefined;
			}
			if (sock3 && sock3.readyState === 1) {
				console.log('local websocket server detected, disconnecting from app engine websocket server');
				sock3.onclose = undefined;
				sock3.close();
				sock3 = undefined;
			}
		}
		if (sock2 && sock2.readyState === 1) {
			if (sock && sock.readyState === 1) {
				console.log('docker websocket server detected, disconnecting from local websocket server');
				sock.onclose = undefined;
				sock.close();
				sock = undefined;
			}
			if (sock3 && sock3.readyState === 1) {
				console.log('docker websocket server detected, disconnecting from app engine websocket server');
				sock3.onclose = undefined;
				sock3.close();
				sock3 = undefined;
			}
		}
	}, 5000);
  }
}
