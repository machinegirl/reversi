extern crate iron;
extern crate staticfile;
extern crate mount;
extern crate router;
extern crate websocket;

use iron::status;
use iron::{Iron, Request, Response, IronResult};
use staticfile::Static;
use mount::Mount;
use router::Router;
use std::process::Command;
use std::net::SocketAddrV4;
use std::net::Ipv4Addr;
use std::path::Path;
use std::str;
use websocket::{Server, Message, Sender, Receiver};
use websocket::message::Type;
use websocket::header::WebSocketProtocol;
use std::thread;

fn say_hello(req: &mut Request) -> IronResult<Response> {
	println!("Running say_hello handler, URL path: {}", req.url.path().join("/"));
	Ok(Response::with((status::Ok, "This request was routed!")))
}

fn main() {
	let webserver_thread = thread::spawn(|| {
		let host_port = 8080; //Note: port must be 8080 for GAE
		let hostname_cmd = Command::new("hostname").arg("-I").output();
		let host_addr: SocketAddrV4 = match hostname_cmd {
			Ok(res) => {
				let addr = str::from_utf8(res.stdout.as_slice())
					.map_err(|err| err.to_string())
					.and_then(|ip_str| ip_str.trim()
						.parse::<Ipv4Addr>()
						.map_err(|err| err.to_string()))
					.map(|ip| SocketAddrV4::new(ip, host_port));
				match addr {
					Ok(addr) => addr,
					Err(_) => {
						let ip = Ipv4Addr::new(127, 0, 0, 1);
						SocketAddrV4::new(ip, host_port)
					}
				}
			},
			Err(_) => {
				let ip = Ipv4Addr::new(127, 0, 0, 1);
				SocketAddrV4::new(ip, host_port)
			}
		};
		println!("Web server listening at http://{}", host_addr);

		// API routes
		let mut router = Router::new();
		router.get("/hello", say_hello);

		let mut mount = Mount::new();
		mount
			.mount("/api", router)
			.mount("/", Static::new(Path::new("static/dist/")));

		Iron::new(mount).http(host_addr).unwrap();
	});

	thread::spawn(|| {
		let websocket_host = "127.0.0.1:8055";
		let server = Server::bind(websocket_host).unwrap();
		println!("WebSocket server listening at ws://{}", websocket_host);

		for connection in server {
			thread::spawn(|| {
				let request = connection.unwrap().read_request().unwrap(); // Get the request
				let headers = request.headers.clone(); // Keep the headers so we can check them
				request.validate().unwrap(); // Validate the request
				let mut response = request.accept(); // Form a response

				if let Some(&WebSocketProtocol(ref protocols)) = headers.get() {
					if protocols.contains(&("rust-websocket".to_string())) {
						response.headers.set(WebSocketProtocol(vec!["rust-websocket".to_string()])); // We have a protocol we want to use
					}
				}

				let mut client = response.send().unwrap(); // Send the response

				let ip = client.get_mut_sender()
					.get_mut()
					.peer_addr()
					.unwrap();

				println!("Connection from {}", ip);

				let message: Message = Message::text("Hello".to_string());
				client.send_message(&message).unwrap();

				let (mut sender, mut receiver) = client.split();

				for message in receiver.incoming_messages() {
					let message: Message = message.unwrap();

					println!("WebSocket msg: {:?}", message);

					match message.opcode {
						Type::Close => {
							let message = Message::close();
							sender.send_message(&message).unwrap();
							println!("Client {} disconnected", ip);
							return;
						},
						Type::Ping => {
							let message = Message::pong(message.payload);
							sender.send_message(&message).unwrap();
						}
						_ => sender.send_message(&message).unwrap(),
					}
				}
			});
		}
	});

	webserver_thread.join().unwrap();
}
