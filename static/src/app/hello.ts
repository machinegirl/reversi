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
	let interval;
	let onopen = function(evt) {
		// window.clearInterval(interval);
		sock.send("client socket opened");
		sock.send(evt);

	};

	let onmessage = function(evt) {
		console.log('!!');
		console.log(evt);
	};

	let onerror = function(err) {
		console.log("ERROR: " + err);
	};

	let onclose = function(evt) {
		// sock.onclose = undefined;
		console.log('connection closed');
		console.log(evt);
		interval = window.setTimeout(function() {
			try {
				sock = new WebSocket("ws://127.0.0.1:8055", "rust-websocket");
				sock.onclose = onclose;
				sock.onopen = onopen;
				sock.onmessage = onmessage;
				sock.onerror = onerror;
			} catch(err) {
				console.log(err);
				return;
			}
		}, 5000);
	};

	try{
		sock = new WebSocket("ws://127.0.0.1:8055", "rust-websocket");
	} catch(err) {
		console.log(err);
		return;
	}

	sock.onclose = onclose;
	sock.onopen = onopen;
	sock.onmessage = onmessage;
	sock.onerror = onerror;

  }
}
