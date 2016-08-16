#![allow(unused_assignments)]
#![feature(custom_derive, plugin)]
#![plugin(serde_macros)]
extern crate iron;
extern crate staticfile;
extern crate mount;
extern crate router;
extern crate websocket;
extern crate openssl;
extern crate serde;
extern crate serde_json;
extern crate curl;
extern crate jwt;
extern crate rustc_serialize;
extern crate inth_oauth2;

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
use curl::easy::Easy;
use std::io::{stdout, Write};
use jwt::{Header, Token};
use openssl::ssl::{SslContext, SslMethod};
use openssl::x509::X509FileType;
// use inth_oauth2::Client;
// use inth_oauth2::provider::google::Web;
// use std::io;
use std::env;
use std::fs::File;
use std::io::Read;

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

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct MsgLogin {
	cmd: String,
	id_token: String,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct MsgLoggedIn {
	cmd: String,
	id_token: String,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct MsgNewGame {
	cmd: String,
	id_token: String,
}

#[derive(RustcDecodable, RustcEncodable)]
struct GoogleSignInJwt {
    hd:				String,
	name: 			String,
	given_name: 	String,
	family_name:	String,
	email:			String,
	picture:		String,
	aud:			String,
	sub:			String,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct GoogleDefaultServiceAccountCreds {
	project_id: 					String,
	private_key_id:					String,
	private_key:					String,
	client_email:					String,
	client_id:						String,
	auth_uri:						String,
	token_uri:						String,
	auth_provider_x509_cert_url:	String,
	client_x509_cert_url:			String,
}

fn say_hello(req: &mut Request) -> IronResult<Response> {
	println!("Running say_hello handler, URL path: {}", req.url.path().join("/"));
	Ok(Response::with((status::Ok, "This request was routed!")))
}

const GOOGLE_API_KEY: &'static str = "402658185741-ai8prq9pem5vloivipl8o99ul5uuafvm.apps.googleusercontent.com";

fn main() {

	let host_port = 8080; //Note: port must be 8080 for GAE
	let websocket_port = 8055;
	let websocket_secure_port = 8056;

	let ip = Ipv4Addr::new(127, 0, 0, 1);
	let host_addr = Arc::new(Mutex::new(SocketAddrV4::new(ip, host_port)));
	let host_addr1 = host_addr.clone();

	let webserver_thread = thread::spawn(move || {
		let mut host_addr3 = SocketAddrV4::new(ip, host_port);
		{
			let mut host_addr = host_addr1.lock().unwrap();
			let hostname_cmd = Command::new("hostname").arg("-i").output();
			*host_addr = match hostname_cmd {
				Ok(res) => {
					let addr = str::from_utf8(res.stdout.as_slice())
						.map_err(|err| err.to_string())
						.and_then(|ip_str| ip_str.trim()
							.parse::<Ipv4Addr>()
							.map_err(|err| err.to_string()))
						.map(|ip| SocketAddrV4::new(ip, host_port));
					match addr {
						Ok(addr) => {

							if addr.ip().octets()[0] == 192 {
								let ip = Ipv4Addr::new(127, 0, 0, 1);
								SocketAddrV4::new(ip, host_port)
							} else {
								addr
							}
						},
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
				let mut context = SslContext::new(SslMethod::Tlsv1).unwrap();
				let _ = context.set_certificate_file(&(Path::new("keys/cert.pem")), X509FileType::PEM);
				let _ = context.set_private_key_file(&(Path::new("keys/key.pem")), X509FileType::PEM);
				match Server::bind_secure(&format!("{}:{}", host_addr.ip(), websocket_secure_port)[..], &context) {
					Ok(server) => {
						println!("WebSocket server listening at wss://{}:{}", host_addr.ip(), websocket_secure_port);
						ws_handler(server);
					},
					Err(err) => {
						println!("Error: {:?}", err);
					}
				}
			});

			thread::spawn(move || {
				let host_addr = host_addr3;
				match Server::bind(SocketAddrV4::from_str(&format!("{}:{}", host_addr.ip(), websocket_port)[..]).unwrap()) {
					Ok(server) => {
						println!("WebSocket server listening at ws://{}:{}", host_addr.ip(), websocket_port);
						ws_handler(server);
					},
					Err(err) => {
						println!("Error: {:?}", err);
					}
				}
			});
		}

		// API routes
		let mut router = Router::new();
		router.get("/hello", say_hello);

		let mut mount = Mount::new();
		mount
			.mount("/api", router)
			.mount("/dashboard", Static::new(Path::new("static/dist/")))
			.mount("/play", Static::new(Path::new("static/dist/")))
			.mount("/", Static::new(Path::new("static/dist/")));

		Iron::new(mount).http(host_addr3).unwrap();
	});

	webserver_thread.join().unwrap();
}

fn ws_handler(server: Server) {

	for connection in server {
		thread::spawn(move|| {
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
											"login" => {
												match serde_json::from_str::<MsgLogin>(&String::from_utf8_lossy(&*message.payload)) {
													Ok(msg) => {
														println!("logging into backend with id token: {}", msg.id_token);

														let ver_url = "https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=";
														let mut easy = Easy::new();
														easy.url(&format!("{}{}", ver_url, msg.id_token)[..]).unwrap();
														easy.write_function(|data| {
															Ok(stdout().write(data).unwrap())
														}).unwrap();
														easy.perform().unwrap();

														let res_code = easy.response_code().unwrap();
														if res_code != 200 {
															println!("Error: backend login failed");
															let message: Message = Message::text("{\"cmd\": \"login\", \"success\": false}".to_string());
															sender.send_message(&message).unwrap();
															continue;
														}

														// Check JWT claims
														// TODO: do this check for logged_in route also.
														let token = Token::<Header, GoogleSignInJwt>::parse(&msg.id_token).unwrap();
														if token.claims.aud != GOOGLE_API_KEY {	// If API credentials are incorrect
															println!("Error: backend login failed: Incorrect aud claim");
															let message: Message = Message::text("{\"cmd\": \"login\", \"success\": false}".to_string());
															sender.send_message(&message).unwrap();
															continue;
														}

														println!("backend login succeeded");

														let message: Message = Message::text("{\"cmd\": \"login\", \"success\": true}".to_string());
														sender.send_message(&message).unwrap();
													},
													Err(e) => {
														println!("Error: {:?}", e);
													}
												}
											},
											"logged_in" => {
												match serde_json::from_str::<MsgLoggedIn>(&String::from_utf8_lossy(&*message.payload)) {
													Ok(msg) => {

														println!("checking login");

														let ver_url = "https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=";
														let mut easy = Easy::new();
														easy.url(&format!("{}{}", ver_url, msg.id_token)[..]).unwrap();
														easy.write_function(|data| {
															Ok(stdout().write(data).unwrap())
														}).unwrap();
														easy.perform().unwrap();

														let res_code = easy.response_code().unwrap();
														if res_code != 200 {
															println!("not logged in");
															let message: Message = Message::text("{\"cmd\": \"logged_in\", \"status\": false}".to_string());
															sender.send_message(&message).unwrap();
															continue;
														}

														// Check JWT claims
														// TODO: do this check for logged_in route also.
														let token = Token::<Header, GoogleSignInJwt>::parse(&msg.id_token).unwrap();
														if token.claims.aud != GOOGLE_API_KEY {	// If API credentials are incorrect
															println!("Error: backend login check failed: Incorrect aud claim");
															let message: Message = Message::text("{\"cmd\": \"logged_in\", \"status\": false}".to_string());
															sender.send_message(&message).unwrap();
															continue;
														}

														println!("login valid");

														let message: Message = Message::text("{\"cmd\": \"logged_in\", \"status\": true}".to_string());
														sender.send_message(&message).unwrap();
													},
													Err(e) => {
														println!("Error: {:?}", e);
													}
												}
											},
											"new_game" => {
												match serde_json::from_str::<MsgNewGame>(&String::from_utf8_lossy(&*message.payload)) {
													Ok(_) => {

														// let key = "GOOGLE_APPLICATION_CREDENTIALS";
														let key_file = "keys/Reversi-fa2adfa97673.json";
														let gcloud_key_file = &format!("{}/.config/gcloud/application_default_credentials.json", env::home_dir().unwrap().to_str().unwrap())[..];

														match File::open(key_file) {
															Ok(mut f) => {
																let mut s = String::new();
																f.read_to_string(&mut s).unwrap();
																println!("Getting app engine creds from {}", key_file);
																println!("{}", s);
																new_game(s);
															},
															Err(_) => {
																println!("Getting app engine creds from {}", gcloud_key_file);
																match File::open(gcloud_key_file) {
																	Ok(mut f) => {
																		let mut s = String::new();
																		f.read_to_string(&mut s).unwrap();
																		println!("{}", s);
																		new_game(s);
																	},
																	Err(e) => {
																		println!("Error: Failed getting app engine creds from {}: {}", gcloud_key_file, e);
																	}
																}
															}
														}



														// match env::var_os(key) {
														// 	Some(val) => {

															// },
															// None => {

														// 	}
														// }


														// let client = Client::<Web>::new(
													    //     String::from(GOOGLE_API_KEY),
													    //     String::from(GOOGLE_API_SECRET),
													    //     Some(String::from("http://localhost:3000")),
														// );
														//
														// let auth_uri = client.auth_uri(Some("https://www.googleapis.com/auth/userinfo.email"), None).unwrap();
													    // println!("{}", auth_uri);
														//
													    // let mut code = String::new();
													    // io::stdin().read_line(&mut code).unwrap();
														//
													    // let token = client.request_token(&Default::default(), code.trim()).unwrap();
														// println!("{:?}", token);



														// println!("logging into backend with id token: {}", msg.id_token);
														//
														// let ver_url = "https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=";
														// let mut easy = Easy::new();
														// easy.url(&format!("{}{}", ver_url, msg.id_token)[..]).unwrap();
														// easy.write_function(|data| {
														// 	Ok(stdout().write(data).unwrap())
														// }).unwrap();
														// easy.perform().unwrap();
														//
														// let res_code = easy.response_code().unwrap();
														// if res_code != 200 {
														// 	println!("Error: backend login failed");
														// 	let message: Message = Message::text("{\"cmd\": \"login\", \"success\": false}".to_string());
														// 	sender.send_message(&message).unwrap();
														// 	continue;
														// }
														//
														// // Check JWT claims
														// // TODO: do this check for logged_in route also.
														// let token = Token::<Header, GoogleSignInJwt>::parse(&msg.id_token).unwrap();
														// if token.claims.aud != GOOGLE_API_KEY {	// If API credentials are incorrect
														// 	println!("Error: backend login failed: Incorrect aud claim");
														// 	let message: Message = Message::text("{\"cmd\": \"login\", \"success\": false}".to_string());
														// 	sender.send_message(&message).unwrap();
														// 	continue;
														// }
														//
														// println!("backend login succeeded");
														//
														// let message: Message = Message::text("{\"cmd\": \"login\", \"success\": true}".to_string());
														// sender.send_message(&message).unwrap();
													},
													Err(e) => {
														println!("Error: {:?}", e);
													}
												}
											},
											"get_ongoing_games" => {

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
}

fn new_game(creds_str: String) {
	match serde_json::from_str::<GoogleDefaultServiceAccountCreds>(&creds_str) {
		Ok(creds) => {
			println!("!!! {:?}", creds);
		},
		Err(e) => {
			println!("Error: {:?}", e);
		}
	}
}
