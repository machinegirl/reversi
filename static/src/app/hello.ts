import {Component} from '@angular/core';

@Component({
  selector: 'App',
  template: require('./hello.html')
})
export class Hello {
  public hello: string;

  constructor() {
    this.hello = 'Hello World!';

	let sock;
	let sock2;
	let sock3;

	let onopen = function(evt) {
		if (sock && sock.readyState === 1) {

			if (sock3 && (sock3.readyState === 0 || sock3.readyState === 1)) {
				sock3.onclose = undefined;
				sock3.close();
				sock3 = undefined;
			}

			sock.send('client socket opened');
			sock.send(JSON.stringify(evt));
		}

		if (sock2 && sock2.readyState === 1) {

			if (sock3 && (sock3.readyState === 0 || sock3.readyState === 1)) {
				sock3.onclose = undefined;
				sock3.close();
				sock3 = undefined;
			}

			sock2.send('client socket opened');
			sock2.send(JSON.stringify(evt));
		}

		if (sock3 && sock3.readyState === 1) {
			sock3.send('client socket opened');
			sock3.send(JSON.stringify(evt));
		}
	};

	let onmessage = function(evt) {
		console.log('!!');
		console.log(evt);
	};

	let onerror = function(err) {
		console.log('ERROR');
		console.log(err);
	};

	let onclose1 = function(evt) {
		console.log('connection closed');
		console.log(evt);
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
				window.setTimeout(function() {
					if (sock3 && (sock3.readyState === 2 || sock3.readyState === 3)) {
						sock3 = new WebSocket('ws://104.196.159.79:8055', 'rust-websocket');
						if (sock3) {
							sock3.onclose = onclose3;
							sock3.onopen = onopen;
							sock3.onmessage = onmessage;
							sock3.onerror = onerror;
						}
					}
				}, 0);
			} catch (err) {
				console.log(err);
				return;
			}
		}, 2500);
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
				window.setTimeout(function() {
					if (sock3 && (sock3.readyState === 2 || sock3.readyState === 3)) {
						sock3 = new WebSocket('ws://104.196.159.79:8055', 'rust-websocket');
						if (sock3) {
							sock3.onclose = onclose3;
							sock3.onopen = onopen;
							sock3.onmessage = onmessage;
							sock3.onerror = onerror;
						}
					}
				}, 0);
			} catch (err) {
				console.log(err);
				return;
			}
		}, 2500);
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
				window.setTimeout(function() {
					if (sock && (sock.readyState === 2 || sock.readyState === 3)) {
						sock = new WebSocket('ws://127.0.0.1:8055', 'rust-websocket');
						if (sock) {
							sock.onclose = onclose1;
							sock.onopen = onopen;
							sock.onmessage = onmessage;
							sock.onerror = onerror;
						}
					}
				}, 0);
				window.setTimeout(function() {
					if (sock2 && (sock2.readyState === 2 || sock2.readyState === 3)) {
						sock2 = new WebSocket('ws://172.17.0.2:8055', 'rust-websocket');
						if (sock2) {
							sock2.onclose = onclose2;
							sock2.onopen = onopen;
							sock2.onmessage = onmessage;
							sock2.onerror = onerror;
						}
					}
				}, 0);
			} catch (err) {
				console.log(err);
				return;
			}
		}, 2500);
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
  }
}
