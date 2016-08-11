#![allow(unused_assignments)]
#![feature(custom_derive, plugin)]
#![plugin(serde_macros)]
extern crate iron;
extern crate staticfile;
extern crate mount;
extern crate router;
extern crate websocket;
extern crate serde;
extern crate serde_json;
// extern crate hyper;

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
use std::str::FromStr;
use std::sync::{Arc, Mutex};
// use std::io::Read;
// use hyper::Client;
// use hyper::header::Connection;

#[derive(Debug)]
struct Game<'a> {
	board:		[[u8; 8]; 8],
	players:	[Player<'a>; 2],
}

impl<'a> Game<'a> {
	fn new() -> Game<'a> {
		let gb = Game{
			board: [[0u8; 8]; 8],
			players: [Player{
				auto_pilot: true,
				name: ""
			}; 2]
		};
		return gb;
	}
}

#[derive(Debug, Copy, Clone)]
struct Player<'a> {
	auto_pilot:	bool,
	name:		&'a str,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct Msg {
	cmd: Option<String>,
	is_trusted: Option<bool>,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct MsgStartGame {
	cmd:	String,
	id:		Option<String>,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct MsgMsg {
	cmd: String,
	msg: String,
}

fn say_hello(req: &mut Request) -> IronResult<Response> {
	println!("Running say_hello handler, URL path: {}", req.url.path().join("/"));
	Ok(Response::with((status::Ok, "This request was routed!")))
}

fn main() {

	let ip = Ipv4Addr::new(127, 0, 0, 1);
	let host_port = 8080; //Note: port must be 8080 for GAE
	let host_addr = Arc::new(Mutex::new(SocketAddrV4::new(ip, host_port)));
	let host_addr1 = host_addr.clone();

	let webserver_thread = thread::spawn(move || {
		let mut host_addr3 = SocketAddrV4::new(ip, host_port);
		{
			let mut host_addr = host_addr1.lock().unwrap();
			let hostname_cmd = Command::new("hostname").arg("-I").output();
			*host_addr = match hostname_cmd {
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
			println!("Web server listening at http://{}", *host_addr);
			host_addr3 = *host_addr;

			thread::spawn(move || {
				let host_addr = host_addr3;
				let websocket_port = 8055;

				match Server::bind(SocketAddrV4::from_str(&format!("{}:{}", host_addr.ip(), websocket_port)[..]).unwrap()) {
					Ok(server) => {
						println!("WebSocket server listening at ws://{}:{}", host_addr.ip(), websocket_port);
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

									println!("WebSocket msg: {}", String::from_utf8_lossy(&message.payload.clone().into_owned()));

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
										},
										_ => {
											match serde_json::from_str::<Msg>(&String::from_utf8_lossy(&*message.payload)) {
												Ok(msg) => {
													match msg.cmd {
														Some(cmd) => {
															match &cmd[..] {
																"start_game" => {

																	// unmarshal to more specific data Type

																	match serde_json::from_str::<MsgStartGame>(&String::from_utf8_lossy(&*message.payload)) {
																		Ok(msg) => {
																			match msg.id {
																				Some(id) => {
																					// Load existing game by id
																					if id == "" {
																						// Start new game
																						println!("!!! starting new game !!!");
																						let game = Game::new();
																						println!("game: {:?}", game);

																					} else {
																						println!("!!! loading game {} !!!", id);
																					}
																				},
																				None => {
																					// Start new game
																					println!("!!! starting new game !!!");
																					let game = Game::new();
																					println!("game: {:?}", game);
																				}
																			}
																		},
																		Err(e) => {
																			println!("Error: {:?}", e);
																		}
																	}


																},
																"msg" => {

																	match serde_json::from_str::<MsgMsg>(&String::from_utf8_lossy(&*message.payload)) {
																		Ok(msg) => {
																			println!("msg from websocket client: {}", msg.msg);
																		},
																		Err(e) => {
																			println!("Error: {:?}", e);
																		}
																	}
																},
																_ => {
																	println!("Error: Cmd not understood");
																}
															}
														},
														None => {
														}
													}
												},
												Err(e) => {
													println!("Error: {:?}", e);
												}
											}
										}
									}
								}
							});
						}
					},
					Err(err) => {
						println!("Error: {:?}", err);
					}
				};
			});
		}

		// API routes
		let mut router = Router::new();
		router.get("/hello", say_hello);

		let mut mount = Mount::new();
		mount
			.mount("/api", router)
			.mount("/", Static::new(Path::new("static/dist/")));

		Iron::new(mount).http(host_addr3).unwrap();
	});

	webserver_thread.join().unwrap();
}
