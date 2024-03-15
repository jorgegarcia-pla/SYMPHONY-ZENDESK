/* Importar librerias necesarias */
//import WebSocketClient from './symphonychat.js'

/* Global variables */
var variableGlobal = "soy una variable global";
let activeCall = null;
let incomingCallIndex = 0;
//const incomingSound = new Audio('sounds/Classic.mp3');
const incomingSound = new Audio(
	"https://webrtcphone.mcm.net.mx/sounds/Classic.mp3"
);
const RingbackSound = new Audio(
	"https://webrtcphone.mcm.net.mx/sounds/Ringback.mp3"
);
var phone = null;
let floatNotification = null;
let phoneConfig = DefaultPhoneConfig;
let serverConfig = DefaultServerConfig;
let audioPlayer = new AudioPlayer2();
var intentsLogin = 0;
var lastActive;
var flagConference = false;

var userConfig = {
	number: "",
	displayName: "",
	password: "",
	authUser: "",
};

var user_info = "";
var user_id_enterprise = "";
//Primera palabra en cada mensaje en messages
var words = "";

var userIdSymp = "";
var passwordSymp = "";

//Nombre de enterprise de cliente
var enterprise = "";

//status de agente de mycc o broadsoft
var statusAgente = "";
//codigos de unavailable en broadsoft
var codigoStatusAgente = "";
//codigos de campañas
var dnisAgente = "";
//lista de estados extras
var listaStatus;

//Bandera Callcenter
var hasCC = 0;
var statusAgentMyCC = "";

//Bandera mensajeria
var hasMessages = 0;
var hasSMS = 0;
var hasWhats = 0;

//Bandera interfaz
var hasInterface = 0;

//tipo de whatsapp
//0 meta
//1 mycc
var typeWhatsapp = 0;

//Bandera tipo callcenter
//0 Broadsoft
//1 MyCC
var StatusAgentFlag = 0;

//numero temporal de sms, debe ser el did y se toma así //var acDID = authUsrName.substring(2,authUsrName.length);
var acDID = "5590207223";
// numero temporal de whatsapp business debe leerse de extra data del signin
let salesNUmber = "5215553500100";

//numero de mensaje saliente whatsapp mycc
var whatsappUserMyccZendesk = "0";
//numero de mensaje saliente whatsapp business
var whatsappUserSalesforce = "0";
//bandera de mensaje enviado
//0 sms
// whatsapp
var flagSendMessage;

//id usado para SMS, revisar de nuevo con giovany
var typeId = "2";
var typeId2 = 2;
var CCInterval;

//websockets
/* Web Socket Symphony Chat */
var chatSocket = null;
var smsSocket = null;
var whatsSocket = null;
var keepaliveSMS = null;
var smsNumber = null;
var whatsAppDID = null;
var intervalId;
var intervalId2;
var intervalChat;

let lines = [null, null, null, null]; // For the example used 4 lines
let selected = 0; // Selected line index
let lastIndexSelected = 0;
var addCallFlag = false; //Button add call selected
var dialpadFlag = true; //Button dialpad selected

var client = ZAFClient.init();
var autoManage;

var endpoint = "https://voiceapi.mcm.net.mx/v1";
var zendeskEndUserCaller = {};
var zendeskAgentId = null;

var currentCreateTicketUserId,
	currentCreateTicketCallId,
	currentCreateTicketPhone;
var countSeconds = 0;
var timerC;
var allServiceNames = [];
var counterVal;

var arrayContacts = [];
var arrayConversations = [];
var arrayMessages = [];

var dialpadButtonFlag = false; //Bandera para no dejar llamar si no es por AddCall
var Nomessages = "";

$(function onDocReady() {
	hideElements();
	checkSize();
	//Filling settings fields
	$("#urlInput").val(localStorage.getItem("urlIntegrations"));
	if (localStorage.getItem("flagBasicAuth") == "true") {
		$("#authForIntegrations").prop("checked", true);
		$("#basicUsername").val(atob(localStorage.getItem("userIntegrations")));
		$("#basicPassword").val(atob(localStorage.getItem("passIntegrations")));
		$("#filedsBasicAuth").show();
	} else {
		$("#authForIntegrations").prop("checked", false);
		$("#filedsBasicAuth").hide();
	}

	getBrowserFingerprint((fingerprint) => {
		console.log("Identificador único del navegador:", fingerprint);

		sessionStorage.setItem("browserFingerprint", fingerprint);
	});
	$("#chromeVersionDiv").html(`Chrome version ${getChromeVersion()}`);

	audioPlayer.init(ac_log);
	// Check devices: microphone must exist, camera is optional
	checkAvailableDevices()
		.then((camera) => {
			let str = "microphone is found";
			if (camera) str = "microphone and camera are found";
			//console.log(str)
		})
		.catch((e) => {
			alert(e);
		});

	//Se verifica que el navegador es Chrome
	if (!!window.chrome && window.navigator.vendor == "Google Inc.") {
	} else {
		$("#textErrorAlert").html(
			"WebRTC not supported, please use Chrome or Edge"
		);
		$("#autoCloseAlert").fadeIn();
		setTimeout(function () {
			$("#autoCloseAlert").fadeOut();
		}, 3000);
	}

	if (Notification.permission === "default") Notification.requestPermission();

	userIdSymp = sessionStorage.getItem("accSymphony");
	passwordSymp = sessionStorage.getItem("passSymphony");

	if (userIdSymp !== null) {
		let uniqueID = createUDID(userIdSymp);
		var configUser = askLoginData(userIdSymp, passwordSymp, uniqueID);
		if (configUser === null) {
		} else {
			getDirectory(userIdSymp, passwordSymp);
			getAutoManage(userIdSymp);

			get_user_info(userIdSymp).then((respuesta) => {
		        // Guardamos la respuesta en una variable
		        user_id_enterprise = respuesta.idEnterprise;		        
		        
		        // Hacemos algo con la información del usuario guardada
		        console.log('La información del usuario es:', user_id_enterprise);
		    })
		    .catch((error) => {
		        // Manejamos cualquier error que pueda ocurrir durante la ejecución de la promesa
		        console.error('Ocurrió un error al obtener la información del usuario:', error);
		    });

			var fields = configUser.split(",");
			phone = new AudioCodesUA();
			let numberSymphony = fields[0];
			let passwordSymphony = fields[1];
			let authUsrName = fields[2];
			let displayName = fields[3];
			zendeskAgentId = fields[4];

			if (hasCC === 1) {
				startCallCenterOptions();
			}

			if (hasMessages === 1) {
				startMessagesOptions();
			}

			phone = new AudioCodesUA();
			sessionStorage.setItem("accSymphony", userIdSymp);
			sessionStorage.setItem("passSymphony", passwordSymp);
			sessionStorage.setItem("DIDSymphony", acDID);

			$("#displayNameDiv").html(displayName);
			$("#numberSymphonyDiv").html(authUsrName);
			showElements();

			userConfig.number = numberSymphony;
			userConfig.displayName = displayName;
			userConfig.password = passwordSymphony;

			phone.setServerConfig(
				serverConfig.addresses,
				serverConfig.domain,
				serverConfig.iceServers
			);
			phone.setAccount(
				numberSymphony,
				displayName,
				passwordSymphony,
				authUsrName
			);

			// Setting phone options
			phone.setReconnectIntervals(
				phoneConfig.reconnectIntervalMin,
				phoneConfig.reconnectIntervalMax
			);
			phone.setRegisterExpires(phoneConfig.registerExpires);
			phone.setUseSessionTimer(phoneConfig.useSessionTimer);
			phone.setBrowsersConstraints(phoneConfig.constraints);
			phone.setWebSocketKeepAlive(phoneConfig.pingInterval, phoneConfig.pongTimeout, phoneConfig.timerThrottlingBestEffort, phoneConfig.pongReport, phoneConfig.pongDist);
			phone.setDtmfOptions(
				phoneConfig.dtmfUseWebRTC,
				phoneConfig.dtmfDuration,
				phoneConfig.dtmfInterToneGap
			);
			phone.setEnableAddVideo(phoneConfig.enableAddVideo);

			phone.setListeners({
				loginStateChanged: function (isLogin, cause) {
					console.log("isLogin: " + isLogin, "cause: " + cause);

					switch (cause) {
						case "login":
							//ac_log('phone>>> loginStateChanged: login');
							//guiInfo('SBC server: "' + phone.getAccount().user + '" is logged in');
							let restoreData = localStorage.getItem("phoneRestoreCall");
							if (restoreData !== null) {
								localStorage.removeItem("phoneRestoreCall");
							}
							if (activeCall !== null && activeCall.isEstablished()) {
								//ac_log('Re-login done, active call exists (SBC might have switched over to secondary)');
								//guiShowPanel('call_established_panel');
							} else if (restoreData !== null) {
							} else {
								//guiShowPanel('dialer_panel');
							}
							$("#displayNameTitle").text(userConfig.displayName);
							$("#loginModal").modal("hide");
							break;
						case "connected":
							ac_log("phone>>> loginStateChanged: connected");
							break;
						case "disconnected":
							ac_log("phone>>> loginStateChanged: disconnected");
							break;
						case "login failed":
							ac_log("phone>>> loginStateChanged: login failed");
							break;
						case "logout":
							ac_log("phone>>> loginStateChanged: logout");
							break;
					}
				},
				outgoingCallProgress: function (call, response) {
					let lineIndex = getLineIndex(call);
					call["outgoing_call_progress"] = true;
					//Lamada saliente
					RingbackSound.play();
					$("#callButton").removeClass("btn-success");
					$("#callButton").addClass("btn-danger");
					$("#callButton").val("Hang up");
					$("#estadoLabel").html("Calling");
					$("#holdButton").show();
					$("#callMenuDiv").show();
					//ocultamos teclado
					$("#divDialPad").hide();
					dialpadFlag = false;
				},
				callTerminated: function (call, message, cause) {
					console.log(`Causa del termino de llamada: ${cause}`);
					if (checkIncomingCallsActive() == true && cause === "Rejected") {
						$("#textErrorAlert").html(
							"La llamada que estas intentado contestar o colgar ya no esta disponible o no existe."
						);
						$("#autoCloseAlert").fadeIn();
						setTimeout(function () {
							$("#autoCloseAlert").fadeOut();
						}, 3000);
					}
					if (cause === "Busy") {
						$("#textErrorAlert").html(
							"El número que marcaste no esta disponible o no existe."
						);
						$("#autoCloseAlert").fadeIn();
						setTimeout(function () {
							$("#autoCloseAlert").fadeOut();
						}, 3000);
						let counter = countCalls();
						if (counter >= 1) {
							$("#callButton").val("Hang up");
						}
					}

					incomingSound.pause();
					RingbackSound.pause();
					const music = new Audio(
						"https://webrtcphone.mcm.net.mx/sounds/HangUp.mp3"
					);
					music.play();
					$("#incomingCallModal").modal("hide");

					if (cause == "User Denied Media Access") {
						$("#textErrorAlert").html(
							"User Denied Media Access: No se detecto un micrófono o dispositivo de sonido"
						);
						$("#autoCloseAlert").fadeIn();
						setTimeout(function () {
							$("#autoCloseAlert").fadeOut();
						}, 3000);
						incomingSound.pause();
						RingbackSound.pause();
						$("#estadoLabel").html("");
						clearInterval(timerC);
						let lineIndex = getLineIndex(call);
						lines[lineIndex] = null;
						hideLineButton(lineIndex);
						return;
					} else {
						//showError('Call terminated', `Causa del termino de llamada: ${cause}`);
					}

					let lineIndex = getLineIndex(call);

					let urlIntegrations = localStorage.getItem("urlIntegrations");

					if (urlIntegrations != "" && urlIntegrations != undefined) {
						sendEvent("callTerminated", $(`#line_${lineIndex}`).text());
					}

					if (lines[lineIndex] == null) {
						ac_log("terminated no active call");
						return;
					}

					lines[lineIndex] = null;
					hideLineButton(lineIndex);

					let activeLine = getFirstActiveLine();
					let counter = countCalls();
					if (counter <= 1) {
						flagConference = false;
					}

					if (counter == 0) {
						clearCallControlButtons(lineIndex);
						clearInterval(timerC);
						$("#estadoLabel").html("");
						$("#divDialPad").show();
					}
					if (activeLine != -1) {
						showLineButton(activeLine);
						setOneLineActive(activeLine);
					} else {
						$("#callButton").addClass("btn-success");
						$("#callButton").removeClass("btn-danger");
						$("#callButton").val("Call");
						$("#holdButton").hide();
						$("#callTo").val("");
						$("#estadoLabel").html("");
						$("#callMenuDiv").hide();
						$("#incomingCallModal").modal("hide");
						$("#callMenuDiv").hide();
						activeCall = null;
						localStorage.removeItem("phoneRestoreCall");
					}
					if (StatusAgentFlag === 1) {
						asyncChangeStatus(5000);
					}
				},
				callConfirmed: function (call, message, cause) {
					let lineIndex = getLineIndex(call);

					let counter = countCalls();
					if (counter <= 1) {
						countSeconds = 0;
						timerC = setInterval(incrementSeconds, 1000);
					}

					incomingSound.pause();
					RingbackSound.pause();
					console.log(call);

					$("#callButton").removeClass("btn-success");
					$("#callButton").addClass("btn-danger");
					$("#callButton").val("Hang up");
					$("#holdButton").show();
					$("#estadoLabel").html("Call conected");
					$("#callMenuDiv").show();
					//ocultamos teclado
					$("#divDialPad").hide();
					dialpadFlag = false;
					lines[lineIndex] = call;
					//test
					showLineButton(lineIndex, call.data["_user"]);
					selectedLine(lineIndex);
					let remoteVideo = document.getElementById(
						`remote_video_${lineIndex}`
					);
					setVideoElementVisibility(remoteVideo, call.hasReceiveVideo());
				},
				callShowStreams: function (call, localStream, remoteStream) {
					let lineIndex = getLineIndex(call);
					ac_log(`phone>>> callShowStreams line=${lineIndex + 1}`);

					// additional debugging for remote stream and track. To check PSTN hold/unhold.
					if (remoteStream.getAudioTracks().length > 0) {
						let audioTrack = remoteStream.getAudioTracks()[0];
						ac_log(
							`[DEBUG] remoteStream.active=${remoteStream.active} audioTrack.readyState="${audioTrack.readyState}"`,
							audioTrack
						);
					}

					audioPlayer.stop();
					let remoteVideo = document.getElementById(
						`remote_video_${lineIndex}`
					);
					remoteVideo.srcObject = remoteStream; // to play audio and optional video
					if (flagConference === true && !call.data["audioMixer"]) {
					}
				},
				incomingCall: function (call, invite) {
					if (checkIncomingCallsActive() == true) {
						ac_log("Reject incoming call, because already exist one");
						call.reject();
						return;
					}
					// check if exists other active call
					let lineIndex = getFirstFreeLine();

					if (lineIndex === -1) {
						ac_log("Reject incoming call, because all lines are busy");
						call.reject();
						return;
					}

					lines[lineIndex] = call;
					call.data["_line_index"] = lineIndex;
					incomingCallIndex = lineIndex;

					//console.log(call.data);

					let user = call.data["_user"];
					let dn = call.data["_display_name"]; // optional
					//let caller = dn ? `"${dn}" ${user}` : user;
					let caller = dn ? `${dn}` : user;

					$("#callerLabel").html(caller);
					client.invoke("popover", "show");

					$("#incomingCallModal").modal({
						backdrop: "static",
						keyboard: false,
						show: true,
					});

					$("#estadoLabel").html("Incoming call");
					incomingSound.currentTime = 0;
					incomingSound.play();

					getZendeskUserInfoByPhone(userIdSymp, user, call);

					let urlIntegrations = localStorage.getItem("urlIntegrations");
					if (urlIntegrations != "" && urlIntegrations != undefined) {
						sendEvent("incomingCall", caller);
					}
					//guiNotificationShow(caller);
				},
				transferorNotification: function (call, state) {
					switch (state) {
						case 0:
							ac_log(`phone>>> transferor: transfer in progress...`);
							break;

						case -1:
							ac_log(`phone>>> transferor: transfer failed`);
							clearInterval(timerC);
							$("#estadoLabel").html("");
							for (var i = 0; i < lines.length; i++) {
								//Buscamos lineas que tengan llamada
								if (lines[i] != null) {
									//Buscamos las lineas diferentes al indice proporcionado
									if (lines[i] !== lines[selected]) {
										selectedLine(i);
										var transferAg = document.getElementById("transferButton");
										sleep(2000).then(() => {
											transferAg.click();
										});
										break;
									}
								}
							}
							break;

						case 1:
							ac_log(`phone>>> transferor: transfer is successful`);
							if (isSelectedLine(call)) {
							}
							call.data["terminated_transferred"] = true;
							call.terminate(); // terminate call initiated transfer
							clearInterval(timerC);
							$("#estadoLabel").html("");
							break;
					}
				},
				callHoldStateChanged: function (call, isHold, isRemote) {
					if (isHold) {
						if (!isRemote) {
							$("#estadoLabel").html("Call on hold");
							$("#holdButton").val("Unhold");
							$("#holdButton").addClass("active");
						}
					} else {
						$("#estadoLabel").html("Call conected");
						$("#holdButton").val("Hold");
						$("#holdButton").removeClass("active");
					}
				},
			});

			// API modes and workarounds
			phone.setModes(phoneConfig.modes);
			phone.init(true);
			guiEnableSound();
		}
	} else {
		$("#loginModal").modal({
			backdrop: "static",
			keyboard: false,
			show: true,
		});

		$("#loginButton").click(startSession);

		$("#emailSym, #passwordSym").keypress(function (event) {
			if (event.which == 13 || event.keyCode == 13) {
				startSession();
			}
		});
	}

	client.on("voice.dialout", function (e) {
		client.invoke("popover", "show");
		makeRecentCall(e.number, false);
	});

	function startSession() {
		userIdSymp = $("#emailSym").val();
		passwordSymp = $("#passwordSym").val();
		let uniqueID = createUDID(userIdSymp);

		var configUser = askLoginData(userIdSymp, passwordSymp, uniqueID);
		if (configUser === null) {
		} else {
			getDirectory(userIdSymp, passwordSymp);
			getAutoManage(userIdSymp);

			var fields = configUser.split(",");
			phone = new AudioCodesUA();
			let numberSymphony = fields[0];
			let passwordSymphony = fields[1];
			let authUsrName = fields[2];
			let displayName = fields[3];
			sessionStorage.setItem("accSymphony", userIdSymp);
			sessionStorage.setItem("passSymphony", passwordSymp);
			sessionStorage.setItem("DIDSymphony", acDID);

			userConfig.number = numberSymphony;
			userConfig.displayName = displayName;
			userConfig.password = passwordSymphony;

			$("#displayNameDiv").html(displayName);
			$("#numberSymphonyDiv").html(authUsrName);

			if (hasCC === 1) {
				startCallCenterOptions();
			}

			if (hasMessages === 1) {
				startMessagesOptions();
			}

			showElements();

			phone.setServerConfig(
				serverConfig.addresses,
				serverConfig.domain,
				serverConfig.iceServers
			);
			phone.setAccount(
				numberSymphony,
				displayName,
				passwordSymphony,
				authUsrName
			);

			// Setting phone options
			phone.setReconnectIntervals(
				phoneConfig.reconnectIntervalMin,
				phoneConfig.reconnectIntervalMax
			);
			phone.setRegisterExpires(phoneConfig.registerExpires);
			phone.setUseSessionTimer(phoneConfig.useSessionTimer);
			phone.setBrowsersConstraints(phoneConfig.constraints);
			phone.setWebSocketKeepAlive(phoneConfig.pingInterval, phoneConfig.pongTimeout, phoneConfig.timerThrottlingBestEffort, phoneConfig.pongReport, phoneConfig.pongDist);
			phone.setDtmfOptions(
				phoneConfig.dtmfUseWebRTC,
				phoneConfig.dtmfDuration,
				phoneConfig.dtmfInterToneGap
			);
			phone.setEnableAddVideo(phoneConfig.enableAddVideo);

			phone.setListeners({
				loginStateChanged: function (isLogin, cause) {
					console.log("isLogin: " + isLogin, "cause: " + cause);

					switch (cause) {
						case "login":
							$("#displayNameTitle").text(userConfig.displayName);
							$("#loginModal").modal("hide");
							break;

						case "login failed":
							alert("Login failed. try again.");
							phone = null;
							break;
					}
				},
				outgoingCallProgress: function (call, response) {
					let lineIndex = getLineIndex(call);
					call["outgoing_call_progress"] = true;
					//Lamada saliente
					RingbackSound.play();
					$("#callButton").removeClass("btn-success");
					$("#callButton").addClass("btn-danger");
					$("#callButton").val("Hang up");
					$("#estadoLabel").html("Calling");
					$("#callMenuDiv").show();
					//ocultamos teclado
					$("#divDialPad").hide();
					dialpadFlag = false;
				},
				callTerminated: function (call, message, cause) {
					console.log(`Causa del termino de llamada: ${cause}`);
					if (checkIncomingCallsActive() == true && cause === "Rejected") {
						$("#textErrorAlert").html(
							"La llamada que estas intentado contestar o colgar ya no esta disponible o no existe."
						);
						$("#autoCloseAlert").fadeIn();
						setTimeout(function () {
							$("#autoCloseAlert").fadeOut();
						}, 3000);
					}
					if (cause === "Busy") {
						$("#textErrorAlert").html(
							"El número que marcaste no esta disponible o no existe."
						);
						$("#autoCloseAlert").fadeIn();
						setTimeout(function () {
							$("#autoCloseAlert").fadeOut();
						}, 3000);
						let counter = countCalls();
						if (counter >= 1) {
							$("#callButton").val("Hang up");
						}
					}

					incomingSound.pause();
					RingbackSound.pause();
					const music = new Audio(
						"https://webrtcphone.mcm.net.mx/sounds/HangUp.mp3"
					);
					music.play();
					$("#incomingCallModal").modal("hide");
					if (cause == "User Denied Media Access") {
						$("#textErrorAlert").html(
							"User Denied Media Access: No se detecto un micrófono o dispositivo de sonido"
						);
						$("#autoCloseAlert").fadeIn();
						setTimeout(function () {
							$("#autoCloseAlert").fadeOut();
						}, 3000);
						incomingSound.pause();
						RingbackSound.pause();
						clearInterval(timerC);
						$("#estadoLabel").html("");
						let lineIndex = getLineIndex(call);
						lines[lineIndex] = null;
						hideLineButton(lineIndex);
					} else {
					}

					let lineIndex = getLineIndex(call);
					let urlIntegrations = localStorage.getItem("urlIntegrations");

					if (urlIntegrations != "" && urlIntegrations != undefined) {
						sendEvent("callTerminated", $(`#line_${lineIndex}`).text());
					}

					if (lines[lineIndex] == null) {
						ac_log("terminated no active call");
						return;
					}

					lines[lineIndex] = null;
					hideLineButton(lineIndex);

					let activeLine = getFirstActiveLine();
					let counter = countCalls();
					if (counter <= 1) {
						flagConference = false;
					}
					if (counter == 0) {
						clearCallControlButtons(lineIndex);
						$("#divDialPad").show();
						clearInterval(timerC);
						$("#estadoLabel").html("");
					}
					if (activeLine != -1) {
						showLineButton(activeLine);
						setOneLineActive(activeLine);
					} else {
						$("#callButton").addClass("btn-success");
						$("#callButton").removeClass("btn-danger");
						$("#callButton").val("Call");
						$("#holdButton").hide();
						$("#callTo").val("");
						$("#estadoLabel").html("");
						$("#callMenuDiv").hide();
						$("#incomingCallModal").modal("hide");
						$("#callMenuDiv").hide();
						activeCall = null;
						localStorage.removeItem("phoneRestoreCall");
					}
					if (StatusAgentFlag === 1) {
						asyncChangeStatus(5000);
					}
				},
				callConfirmed: function (call, message, cause) {
					let lineIndex = getLineIndex(call);
					let counter = countCalls();
					if (counter <= 1) {
						countSeconds = 0;
						timerC = setInterval(incrementSeconds, 1000);
					}
					incomingSound.pause();
					RingbackSound.pause();
					console.log(call);

					$("#callButton").removeClass("btn-success");
					$("#callButton").addClass("btn-danger");
					$("#callButton").val("Hang up");
					$("#holdButton").show();
					$("#estadoLabel").html("Call conected");
					$("#callMenuDiv").show();
					//ocultamos teclado
					$("#divDialPad").hide();
					dialpadFlag = false;
					lines[lineIndex] = call;
					//test
					showLineButton(lineIndex, call.data["_user"]);
					selectedLine(lineIndex);
					let remoteVideo = document.getElementById(
						`remote_video_${lineIndex}`
					);
					setVideoElementVisibility(remoteVideo, call.hasReceiveVideo());
				},
				callShowStreams: function (call, localStream, remoteStream) {
					let lineIndex = getLineIndex(call);
					ac_log(`phone>>> callShowStreams line=${lineIndex + 1}`);

					// additional debugging for remote stream and track. To check PSTN hold/unhold.
					if (remoteStream.getAudioTracks().length > 0) {
						let audioTrack = remoteStream.getAudioTracks()[0];
						ac_log(
							`[DEBUG] remoteStream.active=${remoteStream.active} audioTrack.readyState="${audioTrack.readyState}"`,
							audioTrack
						);
					}

					audioPlayer.stop();
					let remoteVideo = document.getElementById(
						`remote_video_${lineIndex}`
					);
					remoteVideo.srcObject = remoteStream; // to play audio and optional video
					if (flagConference === true && !call.data["audioMixer"]) {
					}
				},
				incomingCall: function (call, invite) {
					if (checkIncomingCallsActive() == true) {
						ac_log("Reject incoming call, because already exist one");
						call.reject();
						return;
					}
					// check if exists other active call
					let lineIndex = getFirstFreeLine();
					if (lineIndex === -1) {
						ac_log("Reject incoming call, because all lines are busy");
						call.reject();
						return;
					}

					lines[lineIndex] = call;
					call.data["_line_index"] = lineIndex;
					incomingCallIndex = lineIndex;

					console.log(call.data);

					let user = call.data["_user"];
					let dn = call.data["_display_name"]; // optional
					//let caller = dn ? `"${dn}" ${user}` : user;
					let caller = dn ? `${dn}` : user;

					$("#callerLabel").html(caller);
					client.invoke("popover", "show");

					$("#incomingCallModal").modal({
						backdrop: "static",
						keyboard: false,
						show: true,
					});

					$("#estadoLabel").html("Incoming call");
					incomingSound.currentTime = 0;
					incomingSound.play();

					let urlIntegrations = localStorage.getItem("urlIntegrations");
					if (urlIntegrations != "" && urlIntegrations != undefined) {
						sendEvent("incomingCall", caller);
					}

					getZendeskUserInfoByPhone(userIdSymp, user, call);
				},
				transferorNotification: function (call, state) {
					switch (state) {
						case 0:
							ac_log(`phone>>> transferor: transfer in progress...`);
							break;

						case -1:
							ac_log(`phone>>> transferor: transfer failed`);
							clearInterval(timerC);
							$("#estadoLabel").html("");
							for (var i = 0; i < lines.length; i++) {
								//Buscamos lineas que tengan llamada
								if (lines[i] != null) {
									//Buscamos las lineas diferentes al indice proporcionado
									if (lines[i] !== lines[selected]) {
										selectedLine(i);
										var transferAg =
											document.getElementById("transferButton");
										sleep(2000).then(() => {
											transferAg.click();
										});
										break;
									}
								}
							}
							break;

						case 1:
							ac_log(`phone>>> transferor: transfer is successful`);
							if (isSelectedLine(call)) {
							}
							call.data["terminated_transferred"] = true;
							call.terminate(); // terminate call initiated transfer
							clearInterval(timerC);
							$("#estadoLabel").html("");
							break;
					}
				},
				callHoldStateChanged: function (call, isHold, isRemote) {
					if (isHold) {
						if (!isRemote) {
							$("#estadoLabel").html("Call on hold");
							$("#holdButton").val("Unhold");
							$("#holdButton").addClass("active");
						}
					} else {
						$("#estadoLabel").html("Call conected");
						$("#holdButton").val("Hold");
						$("#holdButton").removeClass("active");
					}
				},
			});

			// API modes and workarounds
			phone.setModes(phoneConfig.modes);
			phone.init(true);
			guiEnableSound();
		}
	}

	client.on('voice.dialout', function (e) {
		client.invoke('popover', 'show');
		makeRecentCall(e.number, false);
	});

	$("#callTo").keypress(function (event) {
		var keycode = event.keyCode ? event.keyCode : event.which;
		if (!addCallFlag && dialpadButtonFlag && keycode == "13") {
			console.log("Para llamar presiona el boton AddCall");
			$("#textErrorAlert").html(
				"Para realizar una llamada, presiona el botón AddCall"
			);
			$("#autoCloseAlert").fadeIn();
			setTimeout(function () {
				$("#autoCloseAlert").fadeOut();
			}, 3000);
			event.preventDefault();
		}

		if (keycode == "13") {
			if ($("#callButton").val() == "Call") {
				$("#estadoLabel").html("Calling");
				makeCall(phone.AUDIO);
				$("#addCallButton").removeClass("active");
				addCallFlag = false;
				$("#callTo").val("");
				event.preventDefault();
				return false;
			}
		}
	});

	$("#settingsButton").click(function () {
		$("#configOptionsModal").modal({
			backdrop: "static",
			keyboard: false,
			show: true,
		});
	});

	$("#authForIntegrations").on("click", function () {
		if ($(this).is(":checked")) {
			// Hacer algo si el checkbox ha sido seleccionado
			localStorage.setItem("flagBasicAuth", "true");
			$("#filedsBasicAuth").show();
		} else {
			// Hacer algo si el checkbox ha sido deseleccionado
			localStorage.setItem("flagBasicAuth", "false");
			$("#filedsBasicAuth").hide();
		}
	});

	$("#recentsButton").click(function () {
		requestCallRecents();
	});

	$("#one").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-01.mp3"
		);
		music.play();
		pressDialButton("1");
	});

	$("#two").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-02.mp3"
		);
		music.play();
		pressDialButton("2");
	});

	$("#three").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-03.mp3"
		);
		music.play();
		pressDialButton("3");
	});

	$("#four").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-04.mp3"
		);
		music.play();
		pressDialButton("4");
	});

	$("#five").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-05.mp3"
		);
		music.play();
		pressDialButton("5");
	});

	$("#six").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-06.mp3"
		);
		music.play();
		pressDialButton("6");
	});

	$("#seven").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-07.mp3"
		);
		music.play();
		pressDialButton("7");
	});

	$("#eight").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-08.mp3"
		);
		music.play();
		pressDialButton("8");
	});

	$("#nine").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-09.mp3"
		);
		music.play();
		pressDialButton("9");
	});

	$("#asterisc").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-11.mp3"
		);
		music.play();
		pressDialButton("*");
	});

	$("#zero").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-00.mp3"
		);
		music.play();
		pressDialButton("0");
	});

	$("#number").click(function () {
		const music = new Audio(
			"https://webrtcphone.mcm.net.mx/sounds/dtmf-10.mp3"
		);
		music.play();
		pressDialButton("#");
	});

	$("#callButton").click(function () {
		if ($("#callButton").val() == "Call") {
			if ($("#callTo").val() == "") {
				return;
			}
			$("#estadoLabel").html("Calling");
			makeCall(phone.AUDIO);
			$("#addCallButton").removeClass("active");
			addCallFlag = false;
			$("#callTo").val("");
		} else {
			//Se agrega validación de conferencia para colgar a todos
			if (flagConference === false) {
				lines[selected].terminate();
			} else {
				terminateConference();
			}
		}
	});

	$("#acceptIncomingCallButton").click(function () {
		$("#incomingCallModal").modal("hide");
		let urlIntegrations = localStorage.getItem("urlIntegrations");
		if (urlIntegrations != "" && urlIntegrations != undefined) {
			sendEvent("answercall", $("#callerLabel").text());
		}
		if (lines[incomingCallIndex] != null) {
			lines[incomingCallIndex].answer(phone.AUDIO);
		} else {
			$("#textErrorAlert").html(
				"La llamada que estas intentado contestar o colgar ya no esta disponible o no existe."
			);
			$("#autoCloseAlert").fadeIn();
			setTimeout(function () {
				$("#autoCloseAlert").fadeOut();
			}, 3000);
		}
		$('#tabsHeader a[href="#phone"]').tab("show");
	});

	$("#rejectIncomingCallButton").click(function () {
		$("#incomingCallModal").modal("hide");
		if (lines[incomingCallIndex] != null) {
			lines[incomingCallIndex].reject();
		} else {
			$("#textErrorAlert").html(
				"La llamada que estas intentado contestar o colgar ya no esta disponible o no existe."
			);
			$("#autoCloseAlert").fadeIn();
			setTimeout(function () {
				$("#autoCloseAlert").alert("close");
			}, 3000);
		}
		$("#callerLabel").val("");
	});

	$("#muteButton").click(function () {
		let muted = lines[selected].isAudioMuted();
		if (flagConference === false) {
			lines[selected].muteAudio(!muted);
		} else {
			conferMute();
		}
		if (!muted) {
			$("#muteButton").html('<div class="material-icons md-18">mic_off</div>');
			$("#muteButton").addClass("active");
		} else {
			$("#muteButton").html('<div class="material-icons md-18">mic_none</div>');
			$("#muteButton").removeClass("active");
		}
	});

	$("#holdButton").click(function () {
		if ($("#holdButton").val() == "Hold") holdCall(selected);
		else {
			unholdCall(selected);
		}
	});

	$("#line_0").click(function () {
		if (flagConference === false) {
			selectedLine(0);
		}
	});

	$("#line_1").click(function () {
		if (flagConference === false) {
			selectedLine(1);
		}
	});

	$("#line_2").click(function () {
		if (flagConference === false) {
			selectedLine(2);
		}
	});

	$("#line_3").click(function () {
		if (flagConference === false) {
			selectedLine(3);
		}
	});

	$("#logoutButton").click(function () {
		clearInterval(CCInterval);
		if (StatusAgentFlag === 1) {
			logoutMyCC(userIdSymp, passwordSymp);
		} else {
			logoutBS(userIdSymp, passwordSymp);
		}
		sessionStorage.removeItem("accSymphony");
		sessionStorage.removeItem("DIDSymphony");
		sessionStorage.removeItem("passSymphony");
		sessionStorage.removeItem("browserFingerprint");
		location.reload();
	});

	$("#addCallButton").click(function () {
		//Si se está en conferencia no hacer absolutamente nada
		$("#dialpadButton").removeClass("active");
		if (flagConference) {
			$("#textErrorAlert").html(
				"No puedes agregar una llamada cuando estás en conferencia."
			);
			$("#autoCloseAlert").fadeIn();
			setTimeout(function () {
				$("#autoCloseAlert").fadeOut();
			}, 3000);
			return;
		}

		//Si el botón ya fue presionado
		if (addCallFlag) {
			if (lines[selected].isLocalHold() || lines[selected].isRemoteHold())
				unholdCall(selected);
			addCallFlag = false;
			$("#addCallButton").removeClass("active");
			$("#callButton").removeClass("btn-success");
			$("#callButton").addClass("btn-danger");
			$("#callButton").val("Hang up");
			$("#divDialPad").hide();
			dialpadFlag = false;
		} else {
			if (!(lines[selected].isLocalHold() || lines[selected].isRemoteHold()))
				holdCall(selected);
			$("#callTo").val("");
			$("#addCallButton").addClass("active");
			$("#callButton").addClass("btn-success");
			$("#callButton").removeClass("btn-danger");
			$("#callButton").val("Call");
			addCallFlag = true;
			$("#divDialPad").show();
			dialpadFlag = true;
		}
	});

	$("#cancelConfOptionsButton").click(function () {
		$("#configOptionsModal").modal("hide");
	});

	$(window).resize(checkSize);

	function hideElements() {
		$("#autoCloseAlert").hide();
		$("#statusNames").hide();
		$("#DnisNames").hide();
		$("#callMenuDiv").hide();
		$("#line_0").hide();
		$("#line_1").hide();
		$("#line_2").hide();
		$("#line_3").hide();
		$("#tabsHeader").hide();
		$("#callTo").hide();
		$("#numbers1").hide();
		$("#numbers2").hide();
		$("#numbers3").hide();
		$("#numbers4").hide();
		$("#callButton").hide();
		$("#backButton").hide();
		$("#newMessageInterface").hide();
		$("#displayNameDiv").show();
		$("#numberSymphonyDiv").show();
		$("#messagesTab").hide();
		$("#backButton").hide();
		$("#messagesDiv").hide();
		$("#barChatDiv").hide();
		$("#newMessageInterface").hide();
		$("#newMessageButton").hide();
		$("#conversationsDiv").hide();
		$("#messagesTabButton").hide();
		$("#whatsButton").hide();
		$("#FondoInicio").hide();
	}

	function showElements() {
		$("#tabsHeader").show();
		$("#callTo").show();
		$("#numbers1").show();
		$("#numbers2").show();
		$("#numbers3").show();
		$("#numbers4").show();
		$("#callButton").show();
		$("#displayNameDiv").show();
		$("#numberSymphonyDiv").show();
		$("#FondoInicio").show();
	}

	$("#saveConfOptionsButton").click(function () {
		/* Integration configuration */
		let urlIntegrations = $("#urlInput").val();

		localStorage.setItem("urlIntegrations", urlIntegrations);
		$("#urlInput").val(localStorage.getItem("urlIntegrations"));

		if (localStorage.getItem("flagBasicAuth") == "true") {
			localStorage.setItem("userIntegrations", btoa($("#basicUsername").val()));
			localStorage.setItem("passIntegrations", btoa($("#basicPassword").val()));
		} else {
			localStorage.setItem("userIntegrations", "");
			localStorage.setItem("passIntegrations", "");
		}

		//Mandamos bandera
		$.ajax({
			method: "POST",
			url: `https://integrations.mcmtelecomapi.com/dev/subscription/automatization`,
			data: JSON.stringify({
				userId: userIdSymp,
				auto: $("#autoTicketsCheck").is(":checked") ? "1" : "0",
			}),
			success: function (data) {
				console.log(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.error(
					"Error requesting ride: ",
					textStatus,
					", Details: ",
					errorThrown
				);
				console.error("Response: ", jqXHR.responseText);
			},
			complete: function (xhr, status) { },
		});
	});

	$("#createTicketButton").click(function () {
		var createTicket = {
			url: `https://integrations.mcmtelecomapi.com/dev/ticket`,

			data: JSON.stringify({
				userId: currentCreateTicketUserId,
				operation: "createTicket",
				via_id: "45",
				subject: $("#subjectTicketInput").val(),
				comment: $("#commentTicketInput").val(),
				priority: $("#priorityTicketSelect option").filter(":selected").val(),
				type: $("#typeTicketSelect option").filter(":selected").val(),
				callId: currentCreateTicketCallId,
				phone: currentCreateTicketPhone,
			}),
			type: "POST",
			dataType: "json",
		};

		client
			.request(createTicket)
			.then(function (dataResponse) {
				console.log(dataResponse);
				ticketsProcess();
			})
			.catch((err) => {
				console.log(err);
			});
		$("#createTicketDiv").hide();
	});

	$("#outputSelect").on("change", function () {
		/* Audio configuration */
		let outputDeviceId = $("#outputSelect option").filter(":selected").val();
		attachSinkId(document.getElementById("remote_video"), outputDeviceId);
	});
});

function getPermissions() {
	navigator.permissions
		.query({ name: "microphone" })
		.then(function (permissionStatus) {
			console.log(permissionStatus.state);
			return permissionStatus.state;
		});
}

function setVideoElementVisibility(videoElement, isVisible) {
	if (phone.getBrowser() !== "safari") {
		videoElement.style.display = isVisible ? "inline-block" : "none";
	} else {
		// Mac Safari stop playing audio if set style.display='none'
		videoElement.style.display = "inline-block";
		if (isVisible) {
			let size = videoElement.dataset.size;
		} else {
			ac_log(
				"Safari workaround: to hide HTMLVideoElement used style.width=style.height=0"
			);
			videoElement.style.width = videoElement.style.height = 0;
		}
	}
}

function sendEvent(eventType, number) {
	if (localStorage.getItem("flagBasicAuth") == "true") {
		$.ajax({
			method: "POST",
			url: `${localStorage.getItem("urlIntegrations")}`,
			headers: {
				Authorization:
					"Basic " +
					btoa(
						atob(localStorage.getItem("userIntegrations")) +
						":" +
						atob(localStorage.getItem("passIntegrations"))
					),
			},
			data: {
				eventType: eventType,
				date: new Date(),
				number: number,
			},
			success: function (data) {
				console.log(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.error(
					"Error requesting ride: ",
					textStatus,
					", Details: ",
					errorThrown
				);
				console.error("Response: ", jqXHR.responseText);
			},
			complete: function (xhr, status) { },
		});
	} else {
		$.ajax({
			method: "POST",
			url: `${localStorage.getItem("urlIntegrations")}`,
			data: {
				eventType: eventType,
				date: new Date(),
				number: number,
			},
			success: function (data) {
				console.log(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.error(
					"Error requesting ride: ",
					textStatus,
					", Details: ",
					errorThrown
				);
				console.error("Response: ", jqXHR.responseText);
			},
			complete: function (xhr, status) { },
		});
	}
}

function guiNotificationShow(caller) {
	//if (Notification.permission !== "granted")
	//    return;
	guiNotificationClose();

	const options = {
		image: "",
		requireInteraction: false,
	};
	floatNotification = new Notification("Llamada Entrante " + caller, options);
	ac_log("desktopNotification created");
	floatNotification.onclick = function (event) {
		window.focus();
		event.target.close();
		floatNotification = null;
	};
}

function guiNotificationClose() {
	if (floatNotification) {
		floatNotification.close();
		floatNotification = null;
		ac_log("desktopNofification.close()");
	}
}

//Get Directory
function getDirectory(userId, password) {
	$.ajax({
		method: "GET",
		url: `https://integrations.mcmtelecomapi.com/dev/directory?userId=${userId}&password=${encodeURIComponent(
			password
		)}`,
		contentType: "application/json",
		success: function (data) {
			let jsonData = JSON.parse(data);
			var contactsKeys = Object.keys(jsonData);

			for (var i = 0; i < contactsKeys.length; i++)
				arrayContacts.push(jsonData[contactsKeys[i]]);

			arrayContacts.sort();
			fillContacts(arrayContacts);
			checkSize();
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error(
				"Error requesting ride: ",
				textStatus,
				", Details: ",
				errorThrown
			);
			console.error("Response: ", jqXHR.responseText);
		},
		complete: function (xhr, status) { },
	});
}

function askLoginData(userLogin, passwordLogin, UDIDVal) {
	let UrlSym =
		"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
		userLogin +
		"&password=" +
		encodeURIComponent(passwordLogin) +
		"&udid=" +
		UDIDVal +
		"&typeId=2";
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", UrlSym, false); // false for synchronous request
	xmlHttp.send(null);
	var statusCode = xmlHttp.status;
	console.log("statuscode: " + statusCode);
	if (statusCode === 200) {
		intentsLogin = 0;
		var responseSymp = xmlHttp.responseText;
		var alldata = splitData(responseSymp);
		readExtra(responseSymp);
		$("#loginButton").html("Login");
		$("#loginButton").attr("disabled", false);
		return alldata;
	}
	if (statusCode === 412) {
		showError("Algo salió mal, actualiza la pagina e inténtalo de nuevo");
		return null;
	}
	if (statusCode === 404) {
		intentsLogin += 1;
		if (intentsLogin === 2) {
			showError(
				"404: Usuario o Contraseña son inválidos, un intento más y la cuenta será bloqueada"
			);
			return null;
		} else {
			if (intentsLogin >= 3) {
				showError(
					"404: La cuenta ha sido bloqueada por más de 2 intentos fallidos de inicio de sesión"
				);
				return null;
			} else {
				showError("404: Usuario o Contraseña son inválidos");
				return null;
			}
		}
	}
	if (statusCode === 401) {
		intentsLogin += 1;
		if (intentsLogin === 2) {
			showError(
				"401: Usuario o Contraseña son inválidos, un intento más y la cuenta será bloqueada"
			);
			return null;
		} else {
			if (intentsLogin >= 3) {
				showError(
					"401: La cuenta ha sido bloqueada por más de 2 intentos fallidos de inicio de sesión"
				);
				return null;
			} else {
				showError("401: Usuario o Contraseña son inválidos");
				return null;
			}
		}
	}
	if (statusCode === 403) {
		showError("403: El usuario no cuenta con licencia para usar este servicio");
		return null;
	}
	if (statusCode === 408) {
		showError("403: El usuario no cuenta con licencia para usar este servicio");
		return null;
	}
	if (statusCode === 406) {
		intentsLogin += 1;
		if (intentsLogin === 2) {
			showError(
				"406: Usuario o Contraseña son inválidos, un intento más y la cuenta será bloqueada"
			);
			return null;
		} else {
			if (intentsLogin >= 3) {
				showError(
					"406: La cuenta ha sido bloqueada por más de 2 intentos fallidos de inicio de sesión"
				);
				return null;
			} else {
				showError("406: Usuario o Contraseña son inválidos");
				return null;
			}
		}
	}
	if (statusCode === 409) {
		showError("409: Demasiados dispositivos, por favor llame a Contact Center");
		return null;
	}
	if (statusCode === 411) {
		showError("411: Usuario o Contraseña son inválidos");
		return null;
	} else {
		showError("Error: Por favor intente más tarde o llame a Contact Center");
		return null;
	}

	$("#loginButton").html("Login");
	$("#loginButton").attr("disabled", false);
}

function splitData(response) {
	var userSIP, passSIP, authUser, display, zendeskId;

	var fields = response.split("</DisplayName>");
	display = fields[0];
	fields = display.split("<DisplayName>");
	display = fields[1];

	fields = response.split("</AuthUsername>");
	authUser = fields[0];
	fields = authUser.split("<AuthUsername>");
	authUser = fields[1];

	fields = response.split("</Password>");
	passSIP = fields[0];
	fields = passSIP.split("<Password>");
	passSIP = fields[1];

	fields = response.split("</Username>");
	userSIP = fields[0];
	fields = userSIP.split("<Username>");
	userSIP = fields[1];

	fields = response.split("</ZendeskId>");
	zendeskId = fields[0];
	fields = zendeskId.split("<ZendeskId>");
	zendeskId = fields[1];

	var data =
		userSIP + "," + passSIP + "," + authUser + "," + display + "," + zendeskId;
	return data;
}

function readExtra(response) {
	var obj = response.split('</ZendeskId>\\",\\"interfaz\\":');
	if (obj.length > 1) {
		var datas = obj[1];
		datas = datas.replace(/(\\r\\n|\\n|\\r)/gm, "");
		//datas = datas.replace(/"/g, '');
		datas = datas.replace(/\\/g, "");
		//datas = datas.replace(/\s/g,'');
		datas = datas.substring(0, datas.length - 2);
		console.log("DATOS  ", datas);
		var jsonData = JSON.parse(datas);
		console.log(jsonData);

		enterprise = jsonData.enterprise;
		console.log(enterprise);
		if (jsonData.callCenter.activo === true) {
			hasCC = 1;
			if (jsonData.callCenter.proveedor === "mycc") {
				StatusAgentFlag = 1;
				listaStatus = jsonData.callCenter.estatus;
			}

			if (jsonData.callCenter.proveedor === "broadsoft") StatusAgentFlag = 0;
		}

		if (jsonData.mensajeria.activo === true) {
			console.log("Tiene mensajes");
			hasMessages = 1;

			if (jsonData.mensajeria.sms.activo === true) {
				hasSMS = 1;
				$("#messagesTabButton").show();
			}

			if (jsonData.mensajeria.whatsapp.activo === true) {
				hasWhats = 1;
				$("#whatsButton").show();
				console.log("Tipo whats: " + jsonData.mensajeria.whatsapp.proveedor);
				if (jsonData.mensajeria.whatsapp.proveedor == "meta") {
					typeWhatsapp = 0;
				}

				if (jsonData.mensajeria.whatsapp.proveedor == "mycc") {
					typeWhatsapp = 1;
				}
			}
		}

		if (jsonData.interfaz.activo === true) {
			hasInterface = 1;
		}
	}
}

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
	if (typeof element.sinkId !== "undefined") {
		element
			.setSinkId(sinkId)
			.then(() => {
				console.log(`Success, audio output device attached: ${sinkId}`);
			})
			.catch((error) => {
				let errorMessage = error;
				if (error.name === "SecurityError") {
					errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
				}
				console.error(errorMessage);
				// Jump back to first output device in the list as it's the default.
				$("#outputSelect").selectedIndex = 0;
			});
	} else {
		console.warn("Browser does not support output device selection.");
	}
}

function gotStream(stream) {
	window.stream = stream; // make stream available to console
	document.getElementById("remote_video").srcObject = stream;
	// Refresh button list in case labels have become available
	return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
	console.log(
		"navigator.MediaDevices.getUserMedia error: ",
		error.message,
		error.name
	);
}

function selectedLine(lineIndex = selected) {
	if (lineIndex < 0 || lineIndex >= lines.length)
		throw "selected line index=" + ix + " is out of range";

	selected = lineIndex;

	setOneLineActive(selected);
	checkCallControls(selected);
	activeCall = lines[selected];
	saveCall(activeCall);

	for (var i = 0; i < lines.length; i++) {
		if (i == lineIndex) {
			$(`#line_${i}`).addClass("active");
			$(`#line_${i}`).show();
		} else {
			$(`#line_${i}`).removeClass("active");
		}
	}
}

function showLineButton(lineIndex, contact) {
	checkCallControls(lineIndex);
	selected = lineIndex;
	$(`#line_${lineIndex}`).addClass("active");
	$(`#line_${lineIndex}`).text(contact);
	$(`#line_${lineIndex}`).show();
}

function hideLineButton(lineIndex) {
	$(`#line_${lineIndex}`).addClass("active");
	$(`#line_${lineIndex}`).text("");
	$(`#line_${lineIndex}`).hide();
}

function setOneLineActive(lineIndex) {
	//Recorremos el arreglo de llamadas
	for (var i = 0; i < lines.length; i++) {
		//Buscamos lineas que tengan llamada
		if (lines[i] != null) {
			//Buscamos las lineas diferentes al indice proporcionado
			if (lineIndex != i) {
				if (!(lines[i].isLocalHold() || lines[i].isRemoteHold())) {
					holdCall(i);
				}
			} else {
				if (lines[i].isLocalHold() || lines[i].isRemoteHold()) {
					unholdCall(i);
				}
			}
		}
	}
}

function holdCall(lineIndex) {
	lines[lineIndex]
		.hold(true)
		.catch(() => {
			// ac_log('hold/unhold - failure');
		})
		.finally(() => { });
}

function unholdCall(lineIndex) {
	lines[lineIndex]
		.hold(false)
		.catch(() => {
			//ac_log('hold/unhold - failure');
		})
		.finally(() => { });
}

$("#transferButton").click(function () {
	let transferTo;
	let targetCall;
	transferTo = $("#callTo").val().trim();

	let calls = 0;
	calls = countCalls();
	if (calls === 1) {
		if (transferTo === "") {
			$("#textErrorAlert").html("Ingresa un número para trasferir");
			$("#autoCloseAlert").fadeIn();
			setTimeout(function () {
				$("#autoCloseAlert").fadeOut();
			}, 3000);
			$("#dialpadButton").addClass("active");
			$("#divDialPad").show();
			return;
		} else {
			targetCall = null;
		}
		transfer(transferTo, targetCall);
	} else {
		if (calls === 2) {
			targetCall = getTrasferCall();
			transferTo = targetCall.data["_user"];
			transfer(transferTo, targetCall);
		}
		/*else
				{
					targetCall = lines[selected];
					transferTo = targetCall.data['_user'];
					transfer(transferTo, targetCall);
				}*/
	}
	addCallFlag = false;
	$("#addCallButton").removeClass("active");
	ac_log(`llamadas activas: ${calls}`);
});

$("#conferenceButton").click(function () {
	let counter = countCalls();
	if (counter <= 1) {
		flagConference = false;
		$("#textErrorAlert").html(
			"Debe de haber 2 o más llamadas para poder realizar la conferencia"
		);
		$("#autoCloseAlert").fadeIn();
		setTimeout(function () {
			$("#autoCloseAlert").fadeOut();
		}, 3000);
		return;
	}

	lastActive = selected;
	if (flagConference === false) {
		allUnhold();
		sleep(3000).then(() => {
			addCallsStream();
		});

		flagConference = true;
		$("#conferenceButton").html(
			'<div class="material-icons md-18">call_split</div>'
		);
	} else {
		for (var i = 0; i < lines.length; i++) {
			if (lines[i] != null) {
				conferenceRemoveAudio(lines[i]);
			}
		}
		holdConfer();
		flagConference = false;
		$("#conferenceButton").html(
			'<div class="material-icons md-18">call_merge</div>'
		);
	}
});



$("#dialpadButton").click(function () {
	console.log("Se presiona botón de teclado");
	if (!dialpadFlag) {
		$("#divDialPad").show();
		$("#dialpadButton").addClass("active");
		dialpadFlag = true;
		dialpadButtonFlag = true;

	} else {
		$("#divDialPad").hide();
		$("#dialpadButton").removeClass("active");
		dialpadFlag = false;
		dialpadButtonFlag = false;
	}
});

$("#messagesTabButton1").click(function () {
	backToConvs();

	if (whatsappUserSalesforce === "0" || whatsappUserMyccZendesk === "0") {
		flagSendMessage = 1;
	}

	getWhatsConvs();
	getChatConvs();


	flagSendMessage = 0;
	askConversations(sessionStorage.getItem("DIDSymphony"));
});


$("#callZendesk").click(function () {
	$("#clickToAction").modal("hide");
	$('#tabsHeader a[href="#phone"]').tab("show");
	makeRecentCall(whatsappUserMyccZendesk, phone.AUDIO);
});

$("#whatsappZendesk").click(function () {
	$("#clickToAction").modal("hide");
	$('#tabsHeader a[href="#messages"]').tab("show");
	flagSendMessage = 1;
	getWhatsConvs();
});

function conferMute() {
	for (var i = 0; i < lines.length; i++) {
		if (lines[i] != null) {
			var muted = lines[i].isAudioMuted();
			lines[i].muteAudio(!muted);
		}
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function countCalls() {
	let numCall = 0;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i] !== null) numCall += 1;
	}
	return numCall;
}

function getTrasferCall(call) {
	let transferCall = 0;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i] !== null) {
			if (lines[i] !== lines[selected]) {
				transferCall = lines[i];
			}
		}
	}
	return transferCall;
}

async function transfer(transferTo, targetCall = null) {
	if (targetCall === null)
		ac_log(`blind call transfer: target URL: ${transferTo}`);
	else
		ac_log(`attended call transfer: target line: ${getLineName(targetCall)}`);

	lines[selected].sendRefer(transferTo, targetCall);
}

function updateMenuCallForLine(lineIndex) {
	//Hold button
	if (lines[lineIndex].isLocalHold() || lines[lineIndex].isRemoteHold()) {
		$("#holdButton").addClass("active");
		$("#estadoLabel").html("Call on hold");
		$("#holdButton").val("Unhold");
	} else {
		$("#holdButton").removeClass("active");
		$("#estadoLabel").html("Call conected");
		$("#holdButton").val("Hold");
	}
}

function guiMakeCallTo(
	callTo,
	videoOption,
	extraHeaders = null,
	extraData = null
) {
	let call;
	let lineIndex = getFirstFreeLine();

	if (lines[lineIndex] !== null) {
		throw "Already exists active call in this line";
	}

	console.log("calllllllllllllll: " + callTo);
	call = lines[lineIndex] = phone.call(videoOption, callTo);
	call.data["_line_index"] = lineIndex;
	showLineButton(lineIndex, callTo);
}

function pressDialButton(number) {
	//Si hay una llamada envía DTMF
	if (lines[selected] !== null) {
		if (!addCallFlag) lines[selected].sendDTMF(number);
		else $("#callTo").val($("#callTo").val() + number);
	}
	//Si no hay llamada se agrega solamente al número a llamar
	else {
		$("#callTo").val($("#callTo").val() + number);
	}
}

function makeCall(videoOption) {
	if (addCallFlag) {
		let call;
		let lineIndex = getFirstFreeLine();

		let callTo = $("#callTo").val().trim();
		if (callTo === "") return;

		call = lines[lineIndex] = phone.call(videoOption, callTo);
		call.data["_line_index"] = lineIndex;
		showLineButton(lineIndex, callTo);
	} else {
		let call;
		let lineIndex = getFirstFreeLine();

		if (lines[lineIndex] !== null)
			throw "Already exists active call in this line";
		let callTo = $("#callTo").val().trim();
		if (callTo === "") return;

		call = lines[lineIndex] = phone.call(videoOption, callTo);
		call.data["_line_index"] = lineIndex;
		showLineButton(lineIndex, callTo);
		console.log(call.data);
	}
}

function makeRecentCall(callTo, hasVideo) {
	let call;
	let lineIndex = getFirstFreeLine();

	if (lines[lineIndex] !== null)
		throw "Already exists active call in this line";

	if (callTo === "") return;

	if (hasVideo) {
		call = lines[lineIndex] = phone.call(phone.VIDEO, callTo);
	} else {
		call = lines[lineIndex] = phone.call(phone.AUDIO, callTo);
	}

	call.data["_line_index"] = lineIndex;
	$('#tabsHeader a[href="#phone"]').tab("show");
	showLineButton(lineIndex, callTo);
	console.log(call.data);
}

// Check WebRTC support. Check presence of microphone and camera.
function checkAvailableDevices() {
	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
		return Promise.reject("WebRTC is not supported");
	let cam = false,
		mic = false,
		spkr = false;
	return navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
		deviceInfos.forEach(function (d) {
			//console.log(d);  // print device info for debugging
			switch (d.kind) {
				case "videoinput":
					cam = true;
					/*$('#cameraSelect').append($('<option>', {
												value: d.deviceId,
												text : d.label=='' ? "default" : d.label
											}));*/
					break;
				case "audioinput":
					mic = true;
					/*$('#micSelect').append($('<option>', {
												value: d.deviceId,
												text : d.label=='' ? "default" : d.label
											}));*/
					break;
				case "audiooutput":
					spkr = true;
					$("#outputSelect").append(
						$("<option>", {
							value: d.deviceId,
							text: d.label == "" ? "default" : d.label,
						})
					);
					break;
			}
		});

		// Chrome supports 'audiooutput', Firefox and Safari do not support.
		if (navigator.webkitGetUserMedia === undefined) {
			// Not Chrome
			spkr = true;
		}
		if (!spkr)
			return Promise.reject("Missing a speaker! Please connect one and reload");
		if (!mic)
			return Promise.reject(
				"Missing a microphone! Please connect one and reload"
			);

		return Promise.resolve(cam);
	});
}

function requestCallRecents() {
	$.ajax({
		method: "GET",
		url: `https://integrations.mcmtelecomapi.com/dev/calllog?userId=${userIdSymp}&password=${encodeURIComponent(
			passwordSymp
		)}`,

		success: function (data) {
			fillCallRecents(JSON.parse(data));
			checkSize();
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error("Error status: ", jqXHR.status, ", Details: ", errorThrown);
			console.error("Response: ", jqXHR.responseText);
		},
		complete: function (xhr, status) { },
	});
}

function fillContacts(array) {
	var txtContact = "<ul class='list-group'>";

	for (var i = 0; i < array.length; i++) {
		var name = array[i][0];
		var callTo = array[i][1];
		txtContact += `<li class="list-group-item flex justify-content-between friend-drawer--onhover:hover">`;
		txtContact += "<div class='row ml-1'>";
		txtContact += `<div class="col-2 lateral-list"></div>`;
		txtContact += `<div class="col-8 centerDivList" align="left">`;
		txtContact += `<div class='row'>`;
		txtContact += `<div class='col-12 contact' style="margin-left:23%;" align="left"><strong>${name}</strong></div>`;
		txtContact += `</div>`;
		txtContact += `<div class='row'>`;
		txtContact += `<div class='col-12 contact-number' style="margin-left:23%;" align="left">${callTo}</div>`;
		txtContact += `</div>`;
		txtContact += `</div>`;
		txtContact += `<div class="col-2 lateral-button" style="text-align: -webkit-center; margin-left: auto;" align="left"><button type="button" class="btn btn-success btn-circle" onclick='makeRecentCall("${callTo}", false)'><div class="material-icons md-14">phone</div></button></div>`;
		txtContact += "</div>";
		txtContact += "</li>";
		txtContact += `<hr class="contactshr">`;
	}

	txtContact += "</ul>";

	$("#contactsDiv").html(txtContact);
}


function fillCallRecents(recentCallsList) {
	let recentCallsListPlaced = recentCallsList.placed.callLogsEntry;
	let recentCallsListMissed = recentCallsList.missed.callLogsEntry;
	let recentCallsListReceived = recentCallsList.received.callLogsEntry;

	var txtMissed = "<ul class='list-group'>";
	var txtPlaced = "<ul class='list-group'>";
	var txtReceived = "<ul class='list-group'>";

	/* Verifica si la variable de llamadas perdidas es un Array, tiene >= 2 llamadas */
	if (!Array.isArray(recentCallsListMissed)) {
		/* Verifica si la variable de llamadas perdidas viene vacia, llamadas = 0 */
		if (recentCallsListMissed === undefined) {
			txtMissed += "<br>"
			txtMissed += "<div class='row'>";
			txtMissed += "<div class='col-2 lateral-list'></div>";
			txtMissed += `<div class="col-4 call-recents contact-recents" align="center" style="color:white">${"Sin llamadas"}</div>`;
			txtMissed += "<div class='col-2 lateral-list'></div>";
			txtMissed += "</li>";
		} else {
			var callTo = recentCallsListMissed.phoneNumber;
			var name =
				recentCallsListMissed.name == "Unavailable"
					? callTo
					: recentCallsListMissed.name;
			var time = recentCallsListMissed.time.substring(0, 19).replace("T", " ");
			txtMissed += `<li class="list-group-item flex justify-content-between">`;
			txtMissed += "<div class='row ml-1'>";
			txtMissed += "<div class='col-2 lateral-list'></div>";
			txtMissed += `<div class="col-4 contact-recents" align="left">${name}</div>`;
			txtMissed += `<div class="col-4 call-recents" align="right"><button type="button" class="btn btn-success btn-circle" onclick='makeRecentCall("${callTo}", false)'><div class="material-icons md-14">phone</div></button></div>`;
			txtMissed += "<div class='col-2 lateral-list'></div>";
			txtMissed += "</div>";
			txtMissed += "<div class='row ml-1'>";
			txtMissed += "<div class='col-2 lateral-list'></div>";
			txtMissed += `<div class="col-4 recent-number" align="left">${callTo}</div>`;
			txtMissed += `<div class='col-4 recent-number' align="right">${time}</div>`;
			txtMissed += "<div class='col-2 lateral-list'></div>";
			txtMissed += "</div>";
			txtMissed += "</li>";
			txtMissed += `<hr class="recentshr"></hr>`;
		}
	} else {
		for (var i = 0; i < recentCallsListMissed.length; i++) {
			var callTo = recentCallsListMissed[i].phoneNumber;
			var name =
				recentCallsListMissed[i].name == "Unavailable"
					? callTo
					: recentCallsListMissed[i].name;
			var time = recentCallsListMissed[i].time
				.substring(0, 19)
				.replace("T", " ");
			txtMissed += `<li class="list-group-item flex justify-content-between">`;
			txtMissed += "<div class='row ml-1'>";
			txtMissed += "<div class='col-2 lateral-list'></div>";
			txtMissed += `<div class="col-4 contact-recents" align="left"><strong>${name}</strong></div>`;
			txtMissed += `<div class="col-4 call-recents" align="right"><button type="button" class="btn btn-success btn-circle" onclick='makeRecentCall("${callTo}", false)'><div class="material-icons md-14">phone</div></button></div>`;
			txtMissed += "<div class='col-2 lateral-list'></div>";
			txtMissed += "</div>";
			txtMissed += "<div class='row ml-1'>";
			txtMissed += "<div class='col-2 lateral-list'></div>";
			txtMissed += `<div class="col-4 recent-number" align="left">${callTo}</div>`;
			txtMissed += `<div class='col-4 recent-number' align="right">${time}</div>`;
			txtMissed += "<div class='col-2 lateral-list'></div>";
			txtMissed += "</div>";
			txtMissed += "</li>";
			txtMissed += `<hr class="recentshr"></hr>`;
		}
	}
	/* Verifica si la variable de llamadas realizadas es un Array, tiene >= 2 llamadas */
	if (!Array.isArray(recentCallsListPlaced)) {
		/* Verifica si la variable de llamadas realizadas viene vacia, llamadas = 0 */
		if (recentCallsListPlaced === undefined) {
			txtPlaced += "<div class='row'>";
			txtPlaced += "<div class='col-2 lateral-list'></div>";
			txtPlaced += `<div class="col-4 contact-recents" align="center" style="color:white";>${"Sin llamadas"}</div>`;
			txtPlaced += "<div class='col-2 lateral-list'></div>";
			txtPlaced += "</li>";
		} else {
			var callTo = recentCallsListPlaced.phoneNumber;
			var name =
				recentCallsListPlaced.name == "Unavailable"
					? callTo
					: recentCallsListPlaced.name;
			var time = recentCallsListPlaced.time.substring(0, 19).replace("T", " ");
			txtPlaced += `<li class="list-group-item flex justify-content-between">`;
			txtPlaced += "<div class='row ml-1'>";
			txtPlaced += "<div class='col-2 lateral-list'></div>";
			txtPlaced += `<div class="col-4 contact-recents" align="left"><strong>${name}</strong></div>`;
			txtPlaced += `<div class="col-4 call-recents" align="right"><button type="button" class="btn btn-success btn-circle" onclick='makeRecentCall("${callTo}", false)'><div class="material-icons md-14">phone</div></button></div>`;
			txtPlaced += "<div class='col-2 lateral-list'></div>";
			txtPlaced += "</div>";
			txtPlaced += "<div class='row ml-1'>";
			txtPlaced += "<div class='col-2 lateral-list'></div>";
			txtPlaced += `<div class="col-4 recent-number" align="left">${callTo}</div>`;
			txtPlaced += `<div class='col-4 recent-number' align="right">${time}</div>`;
			txtPlaced += "<div class='col-2 lateral-list'></div>";
			txtPlaced += "</div>";
			txtPlaced += "</li>";
			txtPlaced += `<hr class="recentshr"></hr>`;
		}
	} else {
		for (var i = 0; i < recentCallsListPlaced.length; i++) {
			var callTo = recentCallsListPlaced[i].phoneNumber;
			var name =
				recentCallsListPlaced[i].name == "Unavailable"
					? callTo
					: recentCallsListPlaced[i].name;
			var time = recentCallsListPlaced[i].time
				.substring(0, 19)
				.replace("T", " ");
			txtPlaced += `<li class="list-group-item flex justify-content-between">`;
			txtPlaced += "<div class='row ml-1'>";
			txtPlaced += "<div class='col-2 lateral-list'></div>";
			txtPlaced += `<div class="col-4 contact-recents" align="left"><strong>${name}</strong></div>`;
			txtPlaced += `<div class="col-4 call-recents" align="right"><button type="button" class="btn btn-success btn-circle" onclick='makeRecentCall("${callTo}", false)'><div class="material-icons md-14">phone</div></button></div>`;
			txtPlaced += "<div class='col-2 lateral-list'></div>";
			txtPlaced += "</div>";
			txtPlaced += "<div class='row ml-1'>";
			txtPlaced += "<div class='col-2 lateral-list'></div>";
			txtPlaced += `<div class="col-4 recent-number" align="left">${callTo}</div>`;
			txtPlaced += `<div class='col-4 recent-number' align="right">${time}</div>`;
			txtPlaced += "<div class='col-2 lateral-list'></div>";
			txtPlaced += "</div>";
			txtPlaced += "</li>";
			txtPlaced += `<hr class="recentshr"></hr>`;
		}
	}
	/* Verifica si la variable de llamadas recibidas es un Array, tiene >= 2 llamadas */
	if (!Array.isArray(recentCallsListReceived)) {
		/* Verifica si la variable de llamadas recibidas viene vacia, llamadas = 0 */
		if (recentCallsListReceived === undefined) {
			txtReceived += "<div class='row'>";
			txtReceived += "<div class='col-2 lateral-list'></div>";
			txtReceived += `<div class="col-4 call-recents contact-recents" align="center" style="color:white";>${"Sin llamadas"}</div>`;
			txtReceived += "<div class='col-2 lateral-list';></div>";
			txtReceived += "</li>";
			txtReceived += `<hr class="recentshr"></hr>`;
		} else {
			var callTo = recentCallsListReceived.phoneNumber;
			var name =
				recentCallsListReceived.name == "Unavailable"
					? callTo
					: recentCallsListReceived.name;
			var time = recentCallsListReceived.time
				.substring(0, 19)
				.replace("T", " ");
			txtReceived += `<li class="list-group-item flex justify-content-between">`;
			txtReceived += "<div class='row ml-1'>";
			txtReceived += "<div class='col-2 lateral-list'></div>";
			txtReceived += `<div class="col-4 contact-recents" align="left"><strong>${name}</strong></div>`;
			txtReceived += `<div class="col-4 call-recents" align="right"><button type="button" class="btn btn btn-success btn-circle" onclick='makeRecentCall("${callTo}", false)'><div class="material-icons md-14">phone</div></button></div>`;
			txtReceived += "<div class='col-2 lateral-list'></div>";
			txtReceived += "</div>";
			txtReceived += "<div class='row ml-1'>";
			txtReceived += "<div class='col-2 lateral-list'></div>";
			txtReceived += `<div class="col-4 recent-number" align="left">${callTo}</div>`;
			txtReceived += `<div class='col-4 recent-number' align="right">${time}</div>`;
			txtReceived += "<div class='col-2 lateral-list'></div>";
			txtReceived += "</div>";
			txtReceived += "</li>";
			txtReceived += `<hr class="recentshr"></hr>`;
		}
	} else {
		for (var i = 0; i < recentCallsListReceived.length; i++) {
			var callTo = recentCallsListReceived[i].phoneNumber;
			var name =
				recentCallsListReceived[i].name == "Unavailable"
					? callTo
					: recentCallsListReceived[i].name;
			var time = recentCallsListReceived[i].time
				.substring(0, 19)
				.replace("T", " ");
			txtReceived += `<li class="list-group-item flex justify-content-between">`;
			txtReceived += "<div class='row ml-1'>";
			txtReceived += "<div class='col-2 lateral-list'></div>";
			txtReceived += `<div class="col-4 contact-recents" align="left"><strong>${name}</strong></div>`;
			txtReceived += `<div class="col-4 call-recents" align="right"><button type="button" class="btn btn btn-success btn-circle" onclick='makeRecentCall("${callTo}", false)'><div class="material-icons md-14">phone</div></button></div>`;
			txtReceived += "<div class='col-2 lateral-list'></div>";
			txtReceived += "</div>";
			txtReceived += "<div class='row ml-1'>";
			txtReceived += "<div class='col-2 lateral-list'></div>";
			txtReceived += `<div class="col-4 recent-number" align="left">${callTo}</div>`;
			txtReceived += `<div class='col-4 recent-number' align="right">${time}</div>`;
			txtReceived += "<div class='col-2 lateral-list'></div>";
			txtReceived += "</div>";
			txtReceived += "</li>";
			txtReceived += `<hr class="recentshr"></hr>`;
		}
	}
	txtMissed += "</ul>";
	txtPlaced += "</ul>";
	txtReceived += "</ul>";

	$("#recentPlacedCallsDiv").html(txtPlaced);
	$("#recentReceivedCallsDiv").html(txtReceived);
	$("#recentMissedCallsDiv").html(txtMissed);

	$('#tabsCall a[href="#placed"]').tab("show");
}

/* ------ Lines ------ */
function isSelectedLine(call) {
	return getLineIndex(call) === selected;
}

function getLineIndex(call) {
	let index = call.data["_line_index"];
	if (isNaN(index)) {
		ac_log("phone: getLineIndex(): No line index assigned to the call !");
		return -1;
	}
	return index;
}

// The 1st line has name "1" (not "0")
function getLineName(call) {
	return getLineIndex(call) + 1;
}

function getFirstFreeLine() {
	for (let i = 0; i < lines.length; i++) if (lines[i] === null) return i;
	return -1;
}

function getFirstActiveLine() {
	for (let i = 0; i < lines.length; i++) if (lines[i] !== null) return i;
	return -1;
}

/* ------ Logs ------ */
function ac_log() {
	let args = [].slice.call(arguments);
	console.log.apply(
		console,
		["%c" + args[0]].concat(["color: BlueViolet;"], args.slice(1))
	);
}

function jssip_log() {
	let args = [].slice.call(arguments);
	console.log.apply(console, [args[0]].concat(args.slice(1)));
}

function createUDID(username) {
	//arturo_lopez_mcm.net_(windows/ios/android)
	var UDID, user;
	user = username.replace("@", "_");
	let system = window.navigator.platform;
	UDID = user + "_" + system;
	return UDID;
}

function getAllCalls(exceptCall = null) {
	let allCalls = [];
	for (let call of lines) {
		if (call !== null && call.isEstablished() && call !== exceptCall)
			allCalls.push(call);
	}
	return allCalls;
}

function guiEnableSound() {
	if (!audioPlayer.isDisabled()) return;
	ac_log("Let enable sound...");
	audioPlayer
		.enable()
		.then(() => {
			ac_log("Sound is enabled");
			guiHide("enable_sound_btn");
		})
		.catch((e) => {
			ac_log("Cannot enable sound", e);
		});
}

function getOpenLines(exceptCall = null) {
	let result = [];
	for (let call of lines) {
		if (call !== null && call.isEstablished() && call !== exceptCall)
			result.push(call);
	}
	return result;
}

async function conferenceAddAudio(call) {
	ac_log(`Conference add audio ${getLineName(call)}`);
	if (call.data["audioMixer"]) {
		ac_log(`Warning: audio mixer already set in line ${getLineName(call)}`);
		return;
	}
	let audioMixer = (call.data["audioMixer"] = new CallAudioMixer(
		audioPlayer.audioCtx,
		call
	));
	ac_log(audioMixer.toString() + " created");

	for (let otherCall of getOpenLines(call)) {
		if (audioMixer.add(otherCall)) {
			ac_log(
				`Line ${getLineName(otherCall)} added to audio mixer ${getLineName(
					call
				)}`
			);
		}
	}
	for (let otherCall of getOpenLines(call)) {
		let audioMixer = otherCall.data["audioMixer"];
		if (audioMixer) {
			if (audioMixer.add(call)) {
				ac_log(
					`Line ${getLineName(call)} added to audio mixer ${getLineName(
						otherCall
					)}`
				);
			}
		}
	}

	ac_log(`Let set audio mix as sender for line ${getLineName(call)}`);
	let mixStream = audioMixer.getMix();
	let connection = call.getRTCPeerConnection();
	phone
		.getWR()
		.connection.replaceSenderTrack(connection, "audio", mixStream)
		.then(() => {
			ac_log(`Audio mix set as audio sender for line ${getLineName(call)}`);
		})
		.catch((e) => {
			ac_log(`Cannot set audio mix as sender for line ${getLineName(call)}`, e);
		});
}

function allUnhold() {
	for (var i = 0; i < lines.length; i++) {
		if (lines[i] != null) {
			if (lines[i].isLocalHold() || lines[i].isRemoteHold()) {
				unholdConfer(i);
			}
		}
	}
}

function unholdConfer(lineIndex) {
	return new Promise(function (e) {
		lines[lineIndex]
			.hold(false)
			.catch(() => { })
			.finally(() => { });
	});
}

function holdConfer() {
	return new Promise(function (e) {
		lines[lastActive]
			.hold(true)
			.catch(() => { })
			.finally(() => { });
	});
}

function addCallsStream() {
	for (let call of getOpenLines()) {
		sleep(3000).then(() => {
			console.log(call);
			conferenceAddAudio(call);
		});
	}
}

function saveCall(activeCall) {
	if (activeCall !== null && activeCall.isEstablished()) {
		let data = {
			callTo: activeCall.data["_user"],
			video: activeCall.getVideoState(),
			replaces: activeCall.getReplacesHeader(),
			time: new Date().getTime(),
			hold: `${activeCall.isLocalHold() ? "local" : ""} ${activeCall.isRemoteHold() ? "remote" : ""
				}`,
			mute: `${activeCall.isAudioMuted() ? "audio" : ""} ${activeCall.isVideoMuted() ? "video" : ""
				}`,
		};
		localStorage.setItem("phoneRestoreCall", JSON.stringify(data));
	}
}

function conferenceRemoveAudio(call) {
	ac_log(`Conference remove audio ${getLineName(call)}`);
	let audioMixer = call.data["audioMixer"];
	if (!audioMixer) {
		ac_log(`Audio mixer is not found on line ${getLineName(call)}`);
		return;
	}
	audioMixer.close();
	call.data["audioMixer"] = undefined;
	ac_log(`Audio mixer ${getLineName(call)} closed`);

	for (let otherCall of getOpenLines(call)) {
		let audioMixer = otherCall.data["audioMixer"];
		if (audioMixer) {
			if (audioMixer.remove(call)) {
				ac_log(
					`Line ${getLineName(call)} removed from audio mixer ${getLineName(
						otherCall
					)}`
				);
			}
		}
	}

	if (call.isTerminated()) {
		return;
	}
	let connection = call.getRTCPeerConnection();
	let localStream = call.getRTCLocalStream();
	ac_log(`Let restore audio sender for line ${getLineName(call)}`);
	phone
		.getWR()
		.connection.replaceSenderTrack(connection, "audio", localStream)
		.then(() => {
			ac_log(`Audio sender restored for line ${getLineName(call)}`);
		})
		.catch((e) => {
			ac_log(`Cannot restore audio sender for line ${getLineName(call)}`, e);
		});
}

function incrementSeconds() {
	let counter = countCalls();
	if (counter <= 0) {
		clearInterval(timerC);
		$("#estadoLabel").html("");
	} else {
		countSeconds += 1;
		var timeformat = formatSecs(countSeconds);
		$("#estadoLabel").html(timeformat);
	}
}

function formatSecs(time) {
	// Hours, minutes and seconds
	var hrs = ~~(time / 3600);
	var mins = ~~((time % 3600) / 60);
	var secs = ~~time % 60;

	// Output like "1:01" or "4:03:59" or "123:03:59"
	var ret = "";
	if (hrs > 0) {
		ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
	}
	ret += "" + String(mins).padStart(2, "0") + ":" + (secs < 10 ? "0" : "");
	ret += "" + secs;
	return ret;
}

function getChromeVersion() {
	var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
	console.log(raw);
	var splitRaw = raw.input.split("Chrome/");
	splitRaw = splitRaw[1].split(" ");
	//return raw ? parseInt(raw[2], 10) : false;
	return splitRaw[0];
}

function checkSize() {
	var windowsize = $(window).width();
	if (windowsize <= 500) {
		//if the window is equal or smaller than 500px wide then made a mini phone
		$(".lateral").removeClass("col-3");
		$(".number").removeClass("col-2");
		$(".number").addClass("col-4");
		$(".centerDiv").removeClass("col-6");
		$(".centerDiv").addClass("col-12");
		$(".icon").removeClass("btn-lg");
		$(".recent-number").removeClass("col-4");
		$(".recent-number").addClass("col-6");
		$(".lateral-control").removeClass("col-1");
		$(".lateral-list").removeClass("col-2");
		$(".call-recents").removeClass("col-4");
		$(".call-recents").addClass("col-6");
		$(".contact-recents").removeClass("col-4");
		$(".contact-recents").addClass("col-6");
		$(".label-integrations").removeClass("col-2");
		$(".label-integrations").addClass("col-12");
		$(".input-integrations").removeClass("col-10");
		$(".input-integrations").addClass("col-12");
		$(".label-audio").removeClass("col-4");
		$(".label-audio").addClass("col-12");
		$(".input-audio").removeClass("col-4");
		$(".input-audio").addClass("col-12");
		$(".inputSelect").removeClass("col-3");
		$(".inputSelect").addClass("col-12");
		$("#statusNames").css("width", "60%");
	} else {
		$(".lateral").addClass("col-3");
		$(".number").removeClass("col-4");
		$(".number").addClass("col-2");
		$(".centerDiv").addClass("col-6");
		$(".centerDiv").removeClass("col-12");
		$(".icon").addClass("btn-lg");
		$(".recent-number").removeClass("col-6");
		$(".recent-number").addClass("col-4");
		$(".lateral-control").addClass("col-1");
		$(".lateral-list").addClass("col-2");
		$(".call-recents").removeClass("col-6");
		$(".call-recents").addClass("col-4");
		$(".contact-recents").removeClass("col-6");
		$(".contact-recents").addClass("col-4");
		$(".label-integrations").removeClass("col-12");
		$(".label-integrations").addClass("col-2");
		$(".input-integrations").removeClass("col-12");
		$(".input-integrations").addClass("col-10");
		$(".label-audio").removeClass("col-12");
		$(".label-audio").addClass("col-4");
		$(".input-audio").removeClass("col-12");
		$(".input-audio").addClass("col-4");
		$(".inputSelect").removeClass("col-12");
		$(".inputSelect").addClass("col-3");
		$("#statusNames").css("width", "100%");
	}
}

function showError(title, message) {
	$("#headerErrorModal").html(title);
	$("#bodyErrorModal").html(message);
	$("#errorModal").modal("show");
}

//Métodos para Estados CC, SMS, WA Meta y WA MyCC
function selectStatusC() {
	if (StatusAgentFlag === 1) {
		//MyCC
		var statList = document.getElementById("statusNames");
		var optMycc = statList.value;
		var statSelected = statList.options[statList.selectedIndex].text;
		lastIndexSelected = statList.selectedIndex;

		//No se hace nada porque el agente no puede colocarse en estado My Acd
		if (optMycc == "setMyAcd") {
			askCCMyCC();
			return;
		}

		//Se guarda valor de pausa para mostrar estado correcto
		statusAgentMyCC = statSelected;

		let UrlSym =
			"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
			sessionStorage.getItem("accSymphony") +
			"&password=" +
			encodeURIComponent(sessionStorage.getItem("passSymphony")) +
			"&statusCC=" +
			optMycc +
			"&service=zendesk" +
			"&pauseVal=" +
			statSelected;

		$.ajax({
			method: "GET",
			url: UrlSym,
			contentType: "application/json",
			success: function (data) {
				console.log("Estado de agente actualizado", data);
				statusAgentMyCC = statSelected;
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.error(
					"Error requesting ride: ",
					textStatus,
					", Details: ",
					errorThrown
				);
				console.error("Response: ", jqXHR.responseText);
			},
			complete: function (xhr, status) { },
		});

		/*var xmlHttp = new XMLHttpRequest();
				xmlHttp.open( "GET", UrlSym, false ); // false for synchronous request
				xmlHttp.send( null );
				var statusCode = xmlHttp.status;
				if(statusCode === 200)
				{
					var responseSymp = xmlHttp.responseText;
				}
				else
				{
					var responseSymp = xmlHttp.responseText;
				}*/
	} else {
		var UrlSym;
		var statusSelected = document.getElementById("statusNames").value;

		var selList = document.getElementById("statusNames");

		statusAgente = selList.options[selList.selectedIndex].text;

		var statusSelected = selList.value;

		if (
			statusAgente === "Available" ||
			statusAgente === "Wrap-Up" ||
			statusAgente === "Unavailable" ||
			statusAgente === "Sign-Out"
		) {
			UrlSym =
				"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
				sessionStorage.getItem("accSymphony") +
				"&password=" +
				encodeURIComponent(sessionStorage.getItem("passSymphony")) +
				"&statusCC=postS" +
				"&stateBS=" +
				statusSelected;
		} else {
			UrlSym =
				"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
				sessionStorage.getItem("accSymphony") +
				"&password=" +
				encodeURIComponent(sessionStorage.getItem("passSymphony")) +
				"&statusCC=postS" +
				"&codigoBS=" +
				statusSelected;
		}
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open("GET", UrlSym, false); // false for synchronous request
		xmlHttp.send(null);
		var statusCode = xmlHttp.status;
		if (statusCode === 200) {
			var responseSymp = xmlHttp.responseText;
		} else {
			var responseSymp = xmlHttp.responseText;
		}
	}
}

function dnisOption() {
	var dnisList = document.getElementById("DnisNames");
	var dnisSelected = dnisList.options[dnisList.selectedIndex].text;
	//lastIndexSelected = dnisList.selectedIndex;
	var serviceSelected = document.getElementById("DnisNames").value;
	let UrlSym;
	if (dnisSelected === "none") {
		UrlSym =
			"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
			sessionStorage.getItem("accSymphony") +
			"&password=" +
			encodeURIComponent(sessionStorage.getItem("passSymphony")) +
			"&statusCC=postD" +
			"&dnisDisable=none";
	} else {
		UrlSym =
			"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
			sessionStorage.getItem("accSymphony") +
			"&password=" +
			encodeURIComponent(sessionStorage.getItem("passSymphony")) +
			"&statusCC=postD" +
			"&dnisName=" +
			dnisSelected +
			"&serviceName=" +
			serviceSelected;
	}
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", UrlSym, false); // false for synchronous request
	xmlHttp.send(null);
	var statusCode = xmlHttp.status;
	if (statusCode === 200) {
		var responseSymp = xmlHttp.responseText;
	} else {
		var responseSymp = xmlHttp.responseText;
	}
}

//Get Conversations
function askConversations(mynumber) {
	arrayConversations = [];
	$.ajax({
		method: "GET",
		url: `https://integrations.mcmtelecomapi.com/dev/sms/conversation?participant=${mynumber}&type=${typeId}`,
		contentType: "application/json",
		success: function (data) {
			var convKeys = Object.keys(data);

			for (var i = 0; i < convKeys.length; i++)
				arrayConversations.push(data[convKeys[i]]);

			arrayConversations.sort(function (a, b) {
				return a.timestamp - b.timestamp;
			});

			arrayConversations.sort();
			fillConvs(arrayConversations);
			checkSize();
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error(
				"Error requesting ride: ",
				textStatus,
				", Details: ",
				errorThrown
			);
			console.error("Response: ", jqXHR.responseText);
		},
		complete: function (xhr, status) { },
	});
}

function list_sms_chat(mynumber) {	
	return $.ajax({
		method: "GET",
		url: `https://integrations.mcmtelecomapi.com/dev/sms/conversation?participant=${mynumber}&type=${typeId}`,
		contentType: "application/json",
	});
}

//Get SMS Convs
function getSMSbyConv(toNumber, fromNumber) {
	arrayMessages = [];
	$.ajax({
		method: "GET",
		url: `https://integrations.mcmtelecomapi.com/dev/sms/message?participant1=${toNumber}&participant2=${fromNumber}&type=${typeId2}`,
		contentType: "application/json",
		success: function (data) {
			var messKeys = Object.keys(data);

			for (var i = 0; i < messKeys.length; i++)
				arrayMessages.push(data[messKeys[i]]);

			arrayMessages.sort();
			fillMessages(arrayMessages, toNumber, fromNumber);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error(
				"Error requesting ride: ",
				textStatus,
				", Details: ",
				errorThrown
			);
			console.error("Response: ", jqXHR.responseText);
		},
		complete: function (xhr, status) { },
	});
}

function fillConvs(array) {
	var txtMainConvs = "";
	$("#conversationsDiv").html("");

	array.sort(function (a, b) {
		return a.timestamp - b.timestamp;
	});


	for (var i = 0; i < array.length; i++) {
		var convData = array[i];
		/*{
					"p1": "5531444341",
					"p2": "5553500216",
					"participants": "5553500216-5531444341-3",
					"type": "3",
					"timestamp": "1677007791"
				}*/
		var fromNumber = convData.p1;
		var toNumber = convData.p2;
		if (fromNumber !== sessionStorage.getItem("DIDSymphony")) {
			toNumber = fromNumber;
			fromNumber = sessionStorage.getItem("DIDSymphony");
		}

		//getLastMessage(toNumber, fromNumber);
	}
}

function getLastMessageSMS(toNumber, fromNumber) {
	return $.ajax({
		method: "GET",
		url: `https://integrations.mcmtelecomapi.com/dev/sms/message?participant1=${toNumber}&participant2=${fromNumber}&type=${typeId2}`,
		contentType: "application/json",
	});
}

function drawConversations(messages){
	for(var i=0; i<messages.length; i++){
		var txtMainConvs = "";
		var imageTypeNone = messages[i].channel == 'SMS' ? "img/smsIcon.png" : "img/whatsappIcon.png";
		var dateMessages = new Date(messages[i].time * 1000);
		var year = dateMessages.getFullYear();
		var month = (dateMessages.getMonth() + 1).toString().padStart(2, "0");
		var day = dateMessages.getDate();
		var hours = dateMessages.getHours().toString().padStart(2, "0");;
		var minutes = "0" + dateMessages.getMinutes();

		var formattedTime = day + "/" + month + "/" + year;
		var formattedTime2 = hours + ":" + minutes.substr(-2);

		txtMainConvs += `<li class="list-group-item-messages flex justify-content-between friend-drawer--onhover message-number" onclick='fillMessagesChat("${messages[i].phone}", "ZENDESK", "${messages[i].channel}")'>`;
		txtMainConvs += `<div class="row ml-1">`;
		txtMainConvs += `<div class="col-2" style="align-self: end;" align=left>`;
		txtMainConvs += `<img src="${imageTypeNone}" alt="" style="width: 100%; max-width:60px; border-radius:50%; background:white">`;
		txtMainConvs += `</div>`;
		txtMainConvs += `<div class="lateral-list">`;
		// Contenido de lateral-list
		txtMainConvs += `</div>`;
		txtMainConvs += `<div class="col-8 centerDivList" align="left">`;
		txtMainConvs += `<div class="col-12">`;
		txtMainConvs += `<div class="col-8 contact message" align="left" style="margin-left: -16px;"><strong>${messages[i].phone}</strong></div>`;
		txtMainConvs += `<div>`
		txtMainConvs += `<div class="col-6 contact message" align="left" style="font-size:10px; margin-left: 79px; margin-top: -19px; text-align: right; align-self: center;" >${formattedTime}</div>`;
		txtMainConvs += `<div class="col-12 contact message" align="center" style="font-size:10px; margin-left: 66px; margin-top: 8px; align-self: center;" >${formattedTime2}</div>`;
		txtMainConvs += `</div>`
		txtMainConvs += `</div>`;
		txtMainConvs += `<div class="row">`;

		// Extraer la primera palabra del último mensaje
		words = messages[i].lastMessage.split(" ");
		if (words.length > 0) {
			print = words[0];
		}
		txtMainConvs += `<div class="col-9 message-number message" align="left" style="margin-top:-18px; margin-left:-44px;">${print}</div></div></div>`;
		// Eliminé la columna derecha vacía (col-2 lateral-button)
		txtMainConvs += `</div></li>`;
		txtMainConvs += `<hr class="messagehr">`;

		$("#conversationsDiv").append(txtMainConvs);
		words = "";
	}
}

function drawMessages(array, phone){
	$("#messagesDiv").html("");
	var txtMainMessages = "";
	txtMainMessages += `<div class="chat-panel">`;

	for (var i = 0; i < array.length; i++) {
		var messData = array[i];
		/*{
					"text": "Hola, deseo contactar con mi ejecutivo de venta.",
					"to": "5553500216",
					"from": "5531444341",
					"type": "3",
					"timestamp": "1674588168"
				}*/
		var text = messData.message;
		var timestamp = messData.timestamp;
		var dateMessages = new Date(messData.external_message_date);
		var year = dateMessages.getFullYear();
		var month = (dateMessages.getMonth() + 1).toString().padStart(2, "0");
		var day = dateMessages.getDate();
		var hours = dateMessages.getHours().toString().padStart(2, "0");;
		var minutes = "0" + dateMessages.getMinutes();

		var formattedTime = day + "/" + month + "/" + year;
		var formattedTime2 = hours + ":" + minutes.substr(-2);

		txtMainMessages += `<div class="row no-gutters">`;
		if (messData.sender !== "CLIENT") {
			txtMainMessages += `<div class="col-md-4">`;
			txtMainMessages += `<div class="chat-bubble chat-bubble--left" style="color:black;"><small class="text-max" style="margin-left:12px;">${text}</small></div>`;
			txtMainMessages += `</div>`;
			txtMainMessages += `<div class="col-3 dateMessage-left">`;
			txtMainMessages += `<span id="dateMessage-left">${formattedTime}`;
			txtMainMessages += `</span></div>`;
			txtMainMessages += `<div class="col-3 dateMessage-left">`;
			txtMainMessages += `<span id="dateMessage-left"">${formattedTime2}`;
			txtMainMessages += `</div>`;
			txtMainMessages += `<div class="col-6">`;
			txtMainMessages += `</div>`;
		} else {
			txtMainMessages += `<div class="col-md-4 offset-md-8">`;
			txtMainMessages += `<div class="chat-bubbleR chat-bubbleR--right"><small class="text-max" style="margin-right:18px;">${text}</small></div>`;
			txtMainMessages += `</div>`;
			txtMainMessages += `<div class="col-6">`;
			txtMainMessages += `</div>`;
			txtMainMessages += `<div class="col-3 dateMessage-right">`;
			txtMainMessages += `<span id="dateMessage-right">${formattedTime}`;
			txtMainMessages += `</span></div>`;
			txtMainMessages += `<div class="col-3 dateMessage-right">`;
			txtMainMessages += `<span id="dateMessage-right">${formattedTime2}`;
			txtMainMessages += `</div>`;
		}

		txtMainMessages += `</div>`;
	}

	txtMainMessages += `</div>`;
	$("#titleMessages").html(phone).css({
		"text-align": "right",
	}).show("slow");
	$("#backButton").show();
	$("#conversationsDiv").hide("slow");
	$("#messagesDiv").html(txtMainMessages).show("slow");
	$("#messagesDiv").show("slow");
	$("#barChatDiv").show("slow");
	$("#newMessageButton").hide("slow");
	$("#messagesDiv").scrollTop($("#messagesDiv")[0].scrollHeight);
}

function getLastMessage(toNumber, fromNumber) {
	var txtMainConvs = "";
	var imageTypeNone = "img/smsIcon.png";
	$.ajax({
		method: "GET",
		url: `https://integrations.mcmtelecomapi.com/dev/sms/message?participant1=${toNumber}&participant2=${fromNumber}&type=${typeId2}`,
		contentType: "application/json",
		success: function (data) {
			var messKeys = Object.keys(data);
			var lastMessage = data[data.length - 1].text;
			var print = "";
			var timestamp = data[data.length - 1].timestamp;
			var dateMessages = new Date(timestamp * 1000);

			var year = dateMessages.getFullYear();
			var month = dateMessages.getMonth() + 1;
			var day = dateMessages.getDay();
			var hours = dateMessages.getHours();
			var minutes = "0" + dateMessages.getMinutes();

			var formattedTime = day + "/" + month + "/" + year;
			var formattedTime2 = hours + ":" + minutes.substr(-2);

			txtMainConvs += `<li class="list-group-item-messages flex justify-content-between friend-drawer--onhover message-number" onclick='openConv("${toNumber}", "${fromNumber}")'>`;
			txtMainConvs += `<div class="row ml-1">`;
			txtMainConvs += `<div class="col-2" style="align-self: end;" align=left>`;
			txtMainConvs += `<img src="${imageTypeNone}" alt="" style="width: 100%; max-width:60px; border-radius:50%; background:white">`;
			txtMainConvs += `</div>`;
			txtMainConvs += `<div class="lateral-list">`;
			// Contenido de lateral-list
			txtMainConvs += `</div>`;
			txtMainConvs += `<div class="col-8 centerDivList" align="left">`;
			txtMainConvs += `<div class="row">`;
			txtMainConvs += `<div class="col-6 contact message" align="left"><strong class="ellipsis">${toNumber}</strong></div>`;
			txtMainConvs += `<div class="col-3 contact message" align="left" style="font-size:10px; align-self: center;" >${formattedTime}</div>`;
			txtMainConvs += `<div class="col-3 contact message" align="center" style="font-size:10px; align-self: center;" >${formattedTime2}</div>`;
			txtMainConvs += `</div>`;
			txtMainConvs += `<div class="row">`;

			// Extraer la primera palabra del último mensaje
			words = lastMessage.split(" ");
			if (words.length > 0) {
				print = words[0];
			}
			txtMainConvs += `<div class="col-12 message-number message" align="left">${print}</div></div></div>`;
			// Eliminé la columna derecha vacía (col-2 lateral-button)
			txtMainConvs += `</div></li>`;
			txtMainConvs += `<hr class="messagehr">`;

			$("#conversationsDiv").append(txtMainConvs);
			words = "";
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error(
				"Error requesting ride: ",
				textStatus,
				", Details: ",
				errorThrown
			);
			console.error("Response: ", jqXHR.responseText);
		},
		complete: function (xhr, status) { },
	});

	$("#backButton").hide();
	$("#conversationsDiv").append(txtMainConvs);
	$("#messagesDiv").hide("slow");
	$("#barChatDiv").hide("slow");
	$("#conversationsDiv").show("slow");
	$("#newMessageButton").show("slow");
	$("#newMessageInterface").hide("slow");
}

function dynamicSort(property) {
	var sortOrder = 1;
	if (property[0] === "-") {
		sortOrder = -1;
		property = property.substr(1);
	}
	return function (a, b) {
		/* next line works with strings and numbers, 
		 * and you may want to customize it to your needs
		 */
		var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
		return result * sortOrder;
	}
}

function fillMessages(array, toNumberG, fromNumberG) {
	var txtMainMessages = "";
	array.sort(dynamicSort("timestamp"));
	if (fromNumberG !== sessionStorage.getItem("DIDSymphony")) {
		toNumberG = fromNumberG;
	}
	smsNumber = toNumberG;
	$("#messagesDiv").html("");
	txtMainMessages += `<div class="chat-panel">`;

	for (var i = 0; i < array.length; i++) {
		var messData = array[i];
		/*{
					"text": "Hola, deseo contactar con mi ejecutivo de venta.",
					"to": "5553500216",
					"from": "5531444341",
					"type": "3",
					"timestamp": "1674588168"
				}*/
		var text = messData.text;
		var toNumber = messData.to;
		var fromNumber = messData.from;
		var timestamp = messData.timestamp;
		var dateMessages = new Date(timestamp * 1000);
		var year = dateMessages.getFullYear();
		var month = dateMessages.getMonth();
		var day = dateMessages.getDay();
		var hours = dateMessages.getHours();
		var minutes = "0" + dateMessages.getMinutes();

		var formattedTime = day + "/" + month + "/" + year;
		var formattedTime2 = hours + ":" + minutes.substr(-2);
		txtMainMessages += `<div class="row no-gutters">`;
		if (toNumber !== sessionStorage.getItem("DIDSymphony")) {
			txtMainMessages += `<div class="col-md-4">`;
			txtMainMessages += `<div class="chat-bubble chat-bubble--left" style="color:black;"><small class="text-max" style="margin-left:12px;">${text}</small></div>`;
			txtMainMessages += `</div>`;
			txtMainMessages += `<div class="col-3 dateMessage-left">`;
			txtMainMessages += `<span id="dateMessage-left">${formattedTime}`;
			txtMainMessages += `</span></div>`;
			txtMainMessages += `<div class="col-3 dateMessage-left">`;
			txtMainMessages += `<span id="dateMessage-left"">${formattedTime2}`;
			txtMainMessages += `</div>`;
			txtMainMessages += `<div class="col-6">`;
			txtMainMessages += `</div>`;
		} else {
			txtMainMessages += `<div class="col-md-4 offset-md-8">`;
			txtMainMessages += `<div class="chat-bubbleR chat-bubbleR--right"><small class="text-max" style="margin-right:18px;">${text}</small></div>`;
			txtMainMessages += `</div>`;
			txtMainMessages += `<div class="col-6">`;
			txtMainMessages += `</div>`;
			txtMainMessages += `<div class="col-3 dateMessage-right">`;
			txtMainMessages += `<span id="dateMessage-right">${formattedTime}`;
			txtMainMessages += `</span></div>`;
			txtMainMessages += `<div class="col-3 dateMessage-right">`;
			txtMainMessages += `<span id="dateMessage-right">${formattedTime2}`;
			txtMainMessages += `</div>`;
		}

		txtMainMessages += `</div>`;
	}

	txtMainMessages += `</div>`;
	$("#titleMessages").html(fromNumber).css({
		"text-align": "right",
	}).show("slow");
	$("#backButton").show();
	$("#conversationsDiv").hide("slow");
	$("#messagesDiv").html(txtMainMessages).show("slow");
	$("#messagesDiv").show("slow");
	$("#barChatDiv").show("slow");
	$("#newMessageButton").hide("slow");
	$("#messagesDiv").scrollTop($("#messagesDiv")[0].scrollHeight);
}



function fillMessagesChat(phone, platform, channel) {
	//Dependiendo el canal hacer la solicitud a Symphony Chat o a SMS por ahora
	if(channel == "SMS"){
		flagSendMessage = 0;
		getSMSbyConv(sessionStorage.getItem("DIDSymphony"), phone);
	}else if(channel = "MYCC"){
		flagSendMessage = 1;
		list_message(phone, platform, channel).then(function(respuesta){
			drawMessages(respuesta, phone);
		}).catch(function(error){
			console.error("Error:", error);
		})
	}
}

function startCallCenterOptions() {
	$("#statusNames").show();
	fillSelectAgent();
	if (StatusAgentFlag === 0) {
		askCCBroadsoft();
		askCCDnis();
		removeOptions(document.getElementById("DnisNames"));
		$("#DnisNames").append(
			$("<option>", {
				value: "none",
				text: "none",
			})
		);
		$("#DnisNames").show();
		CCInterval = setInterval(askCCBroadsoft, 5000);
	} else {
		loginMyCC(userIdSymp, passwordSymp);
		askCCMyCC();
		CCInterval = setInterval(askCCMyCC, 5000);
	}
}

function startMessagesOptions() {
	document.getElementById("navMes").style.display = "block";
	if (hasSMS === 1) getsmsSocket();

	//if (hasWhats === 1) getWhatsToken();
	if(hasWhats === 1){
		console.log("typeWhats: " + typeWhatsapp);
		if (typeWhatsapp == 0) {
			console.log("Se conectará a socket de meta");
			connecWhatsSocket(access_token);
		}else{
			//Aquí inciar el websocket Symphony Chat
			console.log("Conectar socket de Symphony Chat");
			connectChatSocket();
		}
	}
}

function openConv(toNumber, fromNumber) {
	console.log(toNumber);
	console.log(fromNumber);
	getSMSbyConv(toNumber, fromNumber);
}

function backToConvs() {
	$("#titleMessages").html("Messages").css({
		"text-align": "center",
	});
	$("#backButton").hide();
	$("#messagesDiv").hide("slow");
	$("#barChatDiv").hide("slow");
	$("#newMessageInterface").hide("slow");
	$("#messagesTabButton").show("slow");
	$("#conversationsDiv").show("slow");
	$("#newMessageButton").show("slow");
}

function OpenNew() {
	$("#backButton").show();
	$("#conversationsDiv").hide("slow");
	$("#newMessageButton").hide("slow");
	$("#newMessageInterface").show("slow")
	$("#titleMessages").show("slow");;

}

function sendMessage() {
	let urlSend = `{"action":"sendMessage", "text":"${$(
		"#chatTrayBox"
	).val()}", "to":"${$(
		"#toPerson"
	).val()}", "enterprise":"${enterprise}", "from":"5590207223", "idUser":"${sessionStorage.getItem(
		"accSymphony"
	)}", "formatSMS":"0"}`;
	//let urlSend = `{"action":"sendMessage", "text":"${$("#chatTrayBox").val()}", "to":"${$("#toPerson").val()}", "enterprise":"${enterprise}", "from":"5590207223", "formatSMS":"0"}`;
	smsSocket.send(urlSend);
	saveConversation(
		$("#toPerson").val(),
		sessionStorage.getItem("DIDSymphony"),
		typeId
	);
	saveMessage(
		sessionStorage.getItem("DIDSymphony"),
		$("#toPerson").val(),
		typeId,
		$("#chatTrayBox").val(),
		0
	);
	$("#chatTrayBox").val("");
	$("#toPerson").val("");
}

function sendMessage2() {
	if (flagSendMessage == 0) {
		let urlSend = `{"action":"sendMessage", "text":"${$(
			"#chatTrayBox2"
		).val()}", "to":"${smsNumber}", "enterprise":"${enterprise}", "from":"${sessionStorage.getItem(
			"DIDSymphony"
		)}", "idUser":"${sessionStorage.getItem("accSymphony")}", "formatSMS":"0"}`;
		smsSocket.send(urlSend);
		saveConversation(smsNumber, sessionStorage.getItem("DIDSymphony"), typeId);
		saveMessage(
			sessionStorage.getItem("DIDSymphony"),
			smsNumber,
			typeId,
			$("#chatTrayBox2").val(),
			1
		);
		$("#chatTrayBox2").val("");
	} else if (flagSendMessage == 1){
		if (typeWhatsapp == 0) {
			sendWhatsapp();
		} else {
			postMyCCMessage();
		}
	} else if(flagSendMessage == 2){
		//Aquí hacer el envío del archivo y mensaje al WS Chat
	    var phone_number = document.getElementById('titleMessages');
	    var formData = new FormData();

	    
	    var file = $('#fileInput')[0].files[0];
        formData.append('file', file); // Obtiene el archivo seleccionado
	    uploadFileTos3(formData,phone_number.innerHTML, "MYCC");
	}
}

function attachFile(){
	$('#fileInput').click();
	flagSendMessage = 2;
}

// Evento de cambio para el campo de entrada de archivo
$('#fileInput').change(function(){
    var file = this.files[0];
    console.log(file);
    var allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    var maxSizeMB = 4;

    // Validación del tipo de archivo
    if (allowedTypes.indexOf(file.type) === -1) {
        alert('Solo se permiten archivos de imagen (JPEG, PNG) o PDF.');
        $('#fileInput').val(''); // Borra el valor del campo de entrada de archivo
        return;
    }

    // Validación del tamaño del archivo
    if (file.size > maxSizeMB * 1024 * 1024) {
        alert('El archivo no puede ser mayor a 4MB.');
        $('#fileInput').val(''); // Borra el valor del campo de entrada de archivo
        return;
    }
});

async function uploadFileTos3(file, phone, channel){
    /**
     * Uploads a file to a s3 bucket and send a file
     * mesaage to the SC webcoket
     *  Args:
     *      file: file object
     *      phone: string
     */
    
    var file_extension = getFileExtension(file.get('file'));
    var b64_file = await convertFileToBase64(file.get('file'));
    console.log(b64_file);

    var body = {
        "phone":phone,
        "platform":"ZENDESK",
        "enterprise": user_id_enterprise,
        "file": b64_file,
        "file_extension":file_extension,
        "channel": channel
    }

    $.ajax({
		method: "POST",
		url: `https://integrations.mcmtelecomapi.com/dev/symphony-messaging/api/enterprise/${user_id_enterprise}/uploadfile`,
		data: JSON.stringify(body),
		contentType: 'application/json',
		success: function (data) {
			var responseSymp = data;
			console.log(data);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.log('error uploading file, reason:',errorThrown);
		},
		complete: function (xhr, status) { },
	});
}

function getFileExtension(archivo) {
	console.log(archivo);
	console.log(archivo	.type);
    // Obtener la parte después del "/" en el tipo MIME
    var tipo = archivo.type.split('/')[1];
    return tipo;
}

function convertFileToBase64(archivo) {
    return new Promise(function(resolve, reject) {
        var lector = new FileReader();

        lector.onload = function(evento) {
            var base64 = evento.target.result;
            base64 = base64.split(",")[1];
            resolve(base64);
        };

        lector.onerror = function(error) {
            reject(error);
        };

        lector.readAsDataURL(archivo);
    });
}

function postMyCCMessage() {
	//Aquí se actualiza código para enviar whats con MyCC
	//{"action":"send", "data": { "phone": "5215531444341", "platform": "ZENDESK", "message": "Test ws chat", "message_type": "TEXT", "channel": "MYCC", "idUser":"giovany_castellanos@mcm.net"}}

	var messageTray = $("#chatTrayBox2").val();
	var message = {
		"action":"send", "data": { 
			"phone": whatsappUserMyccZendesk, 
			"platform": "ZENDESK", 
			"message": messageTray, 
			"message_type": "TEXT",
			"channel": "MYCC", 
			"idUser":sessionStorage.getItem("accSymphony")}
	}

	chatSocket.send(message);

	/*var messaageTray = $("#chatTrayBox2").val();
	var conData = {
		url: "https://whatsappwh.mcmtelecomapi.com/dev/messages/mycc/zendesk",
		method: "POST",
		timeout: 0,
		headers: {
			"Content-Type": "application/json",
		},
		data: JSON.stringify({
			opcion: "sendMessage",
			numero: whatsappUserMyccZendesk,
			mensaje: messaageTray,
			enterprise: enterprise,
		}),
	};

	$.ajax(conData).done(function (response) {
		console.log("Response: ", response);
	});*/
	$("#chatTrayBox2").val("");
	//Sustituir este método por el correspondiente para symphony Chat con la onversación
	//getWhatsConvs();
}

function sendWhatsapp() {
	//{"action":"sendMessage","messaging_product": "whatsapp", "recipient_type": "individual", "to": "5215587654321", "type": "text", "body": "${$("#chatTrayBox2").val()}", "phoneNumber": "5215512345678"}

	let urlSend = `{"action":"sendMessage", "messaging_product":"whatsapp", "recipient_type":"individual", "to":"${whatsappUserSalesforce}", "type":"text", "body":"${$(
		"#chatTrayBox2"
	).val()}", "phoneNumber":"${salesNUmber}"}`;
	whatsSocket.send(urlSend);
	$("#chatTrayBox2").val("");
	getWhatsConvs();
}

function saveConversation(toNumber, fromNumer, type) {
	var conData = {
		url: "https://integrations.mcmtelecomapi.com/dev/sms/conversation",
		method: "POST",
		timeout: 0,
		headers: {
			"Content-Type": "application/json",
		},
		data: JSON.stringify({
			participant1: toNumber,
			participant2: fromNumer,
			type: type,
		}),
	};

	$.ajax(conData).done(function (response) {
		console.log("Response: ", response);
	});
}

function askCCBroadsoft() {
	if (
		sessionStorage.getItem("accSymphony") == null ||
		sessionStorage.getItem("accSymphony") == undefined ||
		sessionStorage.getItem("accSymphony") == ""
	) {
		sessionExpire();
		return;
	}

	$.ajax({
		method: "GET",
		url:
			"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
			sessionStorage.getItem("accSymphony") +
			"&password=" +
			encodeURIComponent(sessionStorage.getItem("passSymphony")) +
			"&statusCC=getS",
		success: function (data) {
			var responseSymp = data;
			splitnreadStatus(responseSymp);
			//splitnreadCC(responseSymp);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error(
				"Error requesting ride: ",
				textStatus,
				", Details: ",
				errorThrown
			);
			console.error("Response: ", jqXHR.responseText);
		},
		complete: function (xhr, status) { },
	});
}

function askCCDnis() {
	$.ajax({
		method: "GET",
		url:
			"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
			sessionStorage.getItem("accSymphony") +
			"&password=" +
			encodeURIComponent(sessionStorage.getItem("passSymphony")) +
			"&statusCC=getS",
		success: function (data) {
			var responseSymp = data;
			splitnreadCC(responseSymp);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error(
				"Error requesting ride: ",
				textStatus,
				", Details: ",
				errorThrown
			);
			console.error("Response: ", jqXHR.responseText);
		},
		complete: function (xhr, status) { },
	});
}

function askCCMyCC() {
	if (
		sessionStorage.getItem("accSymphony") == null ||
		sessionStorage.getItem("accSymphony") == undefined ||
		sessionStorage.getItem("accSymphony") == ""
	) {
		sessionExpire();
		return;
	}

	var StatusOpt = "getStateMyCC";
	let UrlSym =
		"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
		sessionStorage.getItem("accSymphony") +
		"&password=" +
		encodeURIComponent(sessionStorage.getItem("passSymphony")) +
		"&statusCC=" +
		StatusOpt +
		"&service=zendesk";
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", UrlSym, false); // false for synchronous request
	xmlHttp.send(null);
	var statusCode = xmlHttp.status;
	if (statusCode === 200) {
		var responseSymp = xmlHttp.responseText;
		var fields = responseSymp.split("</descripcion>");
		responseSymp = fields[0];
		fields = responseSymp.split('<descripcion xsi:type=\\"xsd:string\\">');
		responseSymp = fields[1];
		if (responseSymp === "No Disponible" || responseSymp === "En Pausa") {
			//Validar qué texto se guardó al momento de actualizar a una pausa personalizada
			//En progreso //Probar cambios
			if (listaStatus.indexOf(statusAgentMyCC) != -1) {
				//document.getElementById("statusNames").selectedIndex = listaStatus.indexOf(statusAgentMyCC) + 3;
				document.getElementById("statusNames").selectedIndex =
					lastIndexSelected;
			} else {
				document.getElementById("statusNames").selectedIndex = 0;
			}
		}
		if (responseSymp === "Disponible") {
			document.getElementById("statusNames").selectedIndex = 1;
		}
		if (responseSymp === "My Acd") {
			document.getElementById("statusNames").selectedIndex = 2;
		}
	} else {
		var responseSymp = xmlHttp.responseText;
	}
}

function splitnreadStatus(responseStat) {
	var stringSplit;
	var stringcodeSplit;
	var arrSplit;
	//statusAgente
	if (responseStat.includes("agentACDState")) {
		arrSplit = responseStat.split("</agentACDState>");
		stringSplit = arrSplit[0];
		arrSplit = stringSplit.split("<agentACDState>");
		statusAgente = arrSplit[1];
	}
	if (responseStat.includes("agentUnavailableCode")) {
		arrSplit = responseStat.split("</agentUnavailableCode>");
		stringcodeSplit = arrSplit[0];
		arrSplit = stringcodeSplit.split("<agentUnavailableCode>");
		codigoStatusAgente = arrSplit[1];
	}
	if (
		statusAgente === "Available" ||
		statusAgente === "Wrap-Up" ||
		statusAgente === "Sign-Out"
	) {
		let element = document.getElementById("statusNames");
		element.value = statusAgente;
		codigoStatusAgente = "";
	}
	if (statusAgente === "Unavailable") {
		let element = document.getElementById("statusNames");
		element.value = statusAgente;
	}
	if (codigoStatusAgente !== "") {
		let element = document.getElementById("statusNames");
		element.value = codigoStatusAgente;
	}
}

function splitnreadCC(responseStat) {
	var currentDnis;
	var serviceNames;
	var stringSplit;
	var arrSplit;
	if (responseStat.includes("outgoingCallDNIS")) {
		arrSplit = responseStat.split("</outgoingCallDNIS>");
		stringSplit = arrSplit[0];
		arrSplit = stringSplit.split("<outgoingCallDNIS>");
		stringSplit = arrSplit[1];
		arrSplit = stringSplit.split("</name>");
		stringSplit = arrSplit[0];
		arrSplit = stringSplit.split("<name>");
		currentDnis = arrSplit[1];
	}
	if (responseStat.includes("callCenterList")) {
		arrSplit = responseStat.split("</callCenterList>");
		stringSplit = arrSplit[0];
		arrSplit = stringSplit.split("<callCenterList>");
		stringSplit = arrSplit[1];
		arrSplit = stringSplit.split("</serviceUserId>");
		for (var i = 0; i < arrSplit.length - 1; i++) {
			var splitnames;
			serviceNames = arrSplit[i];
			splitnames = serviceNames.split("<serviceUserId>");
			serviceNames = splitnames[1];
			allServiceNames.push(serviceNames);
		}
		askDnisRealName();
		askProfileVals();
	}
}

function fillSelPauses(lista) {
	removeOptions(document.getElementById("statusNames"));
	$("#statusNames").append(
		$("<option>", {
			value: "setUnavailable",
			text: "Unavailable",
		})
	);
	$("#statusNames").append(
		$("<option>", {
			value: "setAvailable",
			text: "Available",
		})
	);
	$("#statusNames").append(
		$("<option>", {
			value: "setMyAcd",
			text: "My Acd",
		})
	);

	if (lista) {
		for (var i = 0; i < lista.length; i++) {
			$("#statusNames").append(
				$("<option>", {
					value: "setUnavailable",
					text: lista[i],
				})
			);
		}
	}
	document.getElementById("statusNames").selectedIndex = lastIndexSelected;
}

function askDnisRealName() {
	allServiceNames.forEach((element) => {
		$.ajax({
			method: "GET",
			url:
				"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
				sessionStorage.getItem("accSymphony") +
				"&password=" +
				encodeURIComponent(sessionStorage.getItem("passSymphony")) +
				"&statusCC=getD" +
				"&serviceName=" +
				element,
			success: function (data) {
				var responseData = data;
				var nameCC = element;
				readDnisName(responseData, nameCC);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.error(
					"Error requesting ride: ",
					textStatus,
					", Details: ",
					errorThrown
				);
				console.error("Response: ", jqXHR.responseText);
			},
			complete: function (xhr, status) { },
		});
	});
}

function askProfileVals() {
	$.ajax({
		method: "GET",
		url:
			"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
			sessionStorage.getItem("accSymphony") +
			"&password=" +
			encodeURIComponent(sessionStorage.getItem("passSymphony")) +
			"&statusCC=getProf",
		success: function (data) {
			var responseData = data;
			readProfileVals(responseData);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error(
				"Error requesting ride: ",
				textStatus,
				", Details: ",
				errorThrown
			);
			console.error("Response: ", jqXHR.responseText);
		},
		complete: function (xhr, status) { },
	});
}

function askUnavailableCodes(groupid, servicename) {
	$.ajax({
		method: "GET",
		url:
			"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
			sessionStorage.getItem("accSymphony") +
			"&password=" +
			encodeURIComponent(sessionStorage.getItem("passSymphony")) +
			"&statusCC=getUC" +
			"&groupName=" +
			encodeURIComponent(groupid) +
			"&enterpriseName=" +
			encodeURIComponent(servicename),
		success: function (data) {
			var responseData = data;
			readUnCodes(responseData);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error(
				"Error requesting ride: ",
				textStatus,
				", Details: ",
				errorThrown
			);
			console.error("Response: ", jqXHR.responseText);
		},
		complete: function (xhr, status) { },
	});
}

function readUnCodes(responseData) {
	//</unavailableCodes>
	var UCNames;
	var CodeUCNames;
	var availableStat;
	var stringSplit;
	var arrSplit;
	let allUnCodes = [];
	if (responseData.includes("</unavailableCodes>")) {
		arrSplit = responseData.split("</unavailableCodes>");
		stringSplit = arrSplit[0];
		arrSplit = stringSplit.split("<unavailableCodes>");
		stringSplit = arrSplit[1];
		arrSplit = stringSplit.split("</unavailableCodeDetail>");
		for (var i = 0; i < arrSplit.length - 1; i++) {
			var splitnames0;
			var splitnames;
			var splitnames2;
			availableStat = arrSplit[i];
			UCNames = arrSplit[i];
			CodeUCNames = arrSplit[i];
			splitnames0 = availableStat.split("<unavailableCodeDetail>");
			splitnames = UCNames.split("<unavailableCodeDetail>");
			splitnames2 = CodeUCNames.split("<unavailableCodeDetail>");

			availableStat = splitnames0[1];
			splitnames0 = availableStat.split("</active>");
			availableStat = splitnames0[0];
			splitnames0 = availableStat.split("<active>");
			availableStat = splitnames0[1];

			if (availableStat === "true") {
				UCNames = splitnames[1];
				splitnames = UCNames.split("</description>");
				UCNames = splitnames[0];
				splitnames = UCNames.split("<description>");
				UCNames = splitnames[1];

				CodeUCNames = splitnames2[1];
				splitnames2 = CodeUCNames.split("</code>");
				CodeUCNames = splitnames2[0];
				splitnames2 = CodeUCNames.split("<code>");
				CodeUCNames = splitnames2[1];

				UCNames = UCNames.replaceAll("\uFFFD", "");
				UCNames = UCNames + "|||" + CodeUCNames;
				allUnCodes.push(UCNames);
			}
		}
		fillSelUnCodes(allUnCodes);
	}
}

function readProfileVals(responseData) {
	var groupID;
	var serviceProvider;
	var stringSplit;
	var arrSplit;
	if (responseData.includes("details")) {
		arrSplit = responseData.split("</groupId>");
		stringSplit = arrSplit[0];
		arrSplit = stringSplit.split("<groupId>");
		groupID = arrSplit[1];

		arrSplit = responseData.split("</serviceProvider>");
		stringSplit = arrSplit[0];
		arrSplit = stringSplit.split('<serviceProvider isEnterprise="true">');
		serviceProvider = arrSplit[1];
	}
	askUnavailableCodes(groupID, serviceProvider);
}

function readDnisName(responseData, callCenterName) {
	var dnisNames;
	var stringSplit;
	var arrSplit;
	let allDnisNames = [];
	if (responseData.includes("dnisInfoList")) {
		arrSplit = responseData.split("</dnisInfoList>");
		stringSplit = arrSplit[0];
		arrSplit = stringSplit.split("<dnisInfoList>");
		stringSplit = arrSplit[1];
		arrSplit = stringSplit.split("</dnisInfo>");
		for (var i = 0; i < arrSplit.length - 1; i++) {
			var splitnames;
			dnisNames = arrSplit[i];
			splitnames = dnisNames.split("<dnisInfo>");
			dnisNames = splitnames[1];
			splitnames = dnisNames.split("</name>");
			dnisNames = splitnames[0];
			splitnames = dnisNames.split("<name>");
			dnisNames = splitnames[1];
			dnisNames = dnisNames + "|||" + callCenterName;
			allDnisNames.push(dnisNames);
		}
		fillSelDnis(allDnisNames);
	}
}

function fillSelUnCodes(arrayCodes) {
	for (var i = 0; i < arrayCodes.length; i++) {
		var convData = arrayCodes[i];
		var splitVals;
		splitVals = convData.split("|||");
		$("#statusNames").append(
			$("<option>", {
				value: splitVals[1],
				text: splitVals[0],
			})
		);
	}
	//document.getElementById("DnisNames").selectedIndex = lastIndexSelected;
}

function fillSelDnis(arrayDnis) {
	for (var i = 0; i < arrayDnis.length; i++) {
		var convData = arrayDnis[i];
		var splitVals;
		splitVals = convData.split("|||");
		$("#DnisNames").append(
			$("<option>", {
				value: splitVals[1],
				text: splitVals[0],
			})
		);
	}
	//document.getElementById("DnisNames").selectedIndex = lastIndexSelected;
}

function loginMyCC(userId, password) {
	var StatusOpt = "loginS";
	let UrlSym =
		"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
		userId +
		"&password=" +
		encodeURIComponent(password) +
		"&statusCC=" +
		StatusOpt +
		"&service=zendesk";
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", UrlSym, false); // false for synchronous request
	xmlHttp.send(null);
	var statusCode = xmlHttp.status;
	if (statusCode === 200) {
		var responseSymp = xmlHttp.responseText;
	} else {
		var responseSymp = xmlHttp.responseText;
	}
}

function logoutMyCC(userId, password) {
	var StatusOpt = "logoutS";
	let UrlSym =
		"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
		userId +
		"&password=" +
		encodeURIComponent(password) +
		"&statusCC=" +
		StatusOpt +
		"&service=zendesk";
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", UrlSym, false); // false for synchronous request
	xmlHttp.send(null);
	var statusCode = xmlHttp.status;
	if (statusCode === 200) {
		var responseSymp = xmlHttp.responseText;
	} else {
		var responseSymp = xmlHttp.responseText;
	}
}

function logoutBS(userId, password) {
	var UrlSym;
	UrlSym =
		"https://integrations.mcmtelecomapi.com/dev/signin?userId=" +
		sessionStorage.getItem("accSymphony") +
		"&password=" +
		encodeURIComponent(sessionStorage.getItem("passSymphony")) +
		"&statusCC=postS" +
		"&stateBS=Sign-Out";
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", UrlSym, false); // false for synchronous request
	xmlHttp.send(null);
	var statusCode = xmlHttp.status;
	if (statusCode === 200) {
		var responseSymp = xmlHttp.responseText;
	} else {
		var responseSymp = xmlHttp.responseText;
	}
}

function fillSelectAgent() {
	if (StatusAgentFlag === 1) {
		fillSelPauses(listaStatus);
	} else {
		$("#statusNames").append(
			$("<option>", {
				value: "Available",
				text: "Available",
			})
		);
		$("#statusNames").append(
			$("<option>", {
				value: "Unavailable",
				text: "Unavailable",
			})
		);
		$("#statusNames").append(
			$("<option>", {
				value: "Wrap-Up",
				text: "Wrap-Up",
			})
		);
		$("#statusNames").append(
			$("<option>", {
				value: "Sign-Out",
				text: "Sign-Out",
			})
		);
	}
}

function removeOptions(selectElement) {
	var i,
		L = selectElement.options.length - 1;
	for (i = L; i >= 0; i--) {
		selectElement.remove(i);
	}
}

/****************************************** Funciones Symphony Chat Web Socket ***************************************************/
function connectChatSocket() {
	//Realizar conexión
	//chatSocket = new WebSocketClient('wss://integrationsws.mcmtelecomapi.com/v1/', id_user, processMessage, handleOpen, handleClose, handleErrorWS);
	let wsurl = `wss://integrationsws.mcmtelecomapi.com/v1/?idUser=${sessionStorage.getItem("accSymphony")}`;
	chatSocket = new WebSocket(wsurl);

	chatSocket.onopen = function (event) {
		console.log(event);
		console.log('WebSocket Symphony Chat connection opened.');
		intervalChat = setInterval(keepAliveSymphonyChat, 520000);
		console.log(intervalId);
	};

	chatSocket.onmessage = function (event) {
		if (event == "" || event == null) {
		} else {
			console.log(event);
		}
	};

	chatSocket.onclose = function (event) {
		console.log(event);
		chatSocket.onopen = null;
		chatSocket.onmessage = null;
		chatSocket.onclose = null;
		chatSocket.onerror = null;
		console.log(intervalChat);
		clearInterval(intervalChat);
	};

	chatSocket.onerror = function (event) {
		console.log(event);
	};
}

/****************************************** Funciones para SMS ***************************************************/
function sendKeepAliveSymhonyChat() {
	console.log("Se ejecuta keepAlive chat");
	chatSocket.send("keep alive");
}

function keepAlive() {
	console.log("Se ejecuta keepAlive");
	smsSocket.send("keep alive");
}

function sendKeep() {
	whatsSocket.send(' ');
}

function connectSmsSocket(access_token) {
	//Realizar conexión
	let wsurl = `wss://smsws.mcmtelecomapi.com/dev?idUser=${sessionStorage.getItem(
		"accSymphony"
	)}&Authorization=${access_token}`;
	smsSocket = new WebSocket(wsurl);

	smsSocket.onopen = function (event) {
		console.log(event);
		intervalId = setInterval(keepAlive, 520000);
		//intervalId = setInterval(keepAlive ,20000);
		console.log(intervalId);
	};

	smsSocket.onmessage = function (event) {
		if (event == "" || event == null) {
		} else {
			var alldata = event.data;
			console.log(alldata);
			if (alldata.includes("connectionId") || alldata == "") {
			} else {
				let data = JSON.parse(event.data);
				let incomingSMS = data.text;
				let fromSMS = data.from;
				let toSMS = data.to;
				saveConversation(toSMS, fromSMS, typeId);
				saveMessage(fromSMS, toSMS, typeId, incomingSMS, 1);
			}
			console.log(event);
		}
	};

	smsSocket.onclose = function (event) {
		console.log(event);
		smsSocket.onopen = null;
		smsSocket.onmessage = null;
		smsSocket.onclose = null;
		smsSocket.onerror = null;
		console.log(intervalId);
		clearInterval(intervalId);
	};

	smsSocket.onerror = function (event) {
		console.log(event);
	};
}

function getsmsSocket() {
	var settings = {
		url: "https://sms.mcmtelecomapi.com/dev/auth",
		method: "POST",
		timeout: 0,
		headers: {
			"Content-Type": "application/json",
		},
		data: JSON.stringify({
			userAPI: "MCM_SMS_API_TEST",
			keyAPI: "iE#IIpSi#^@A",
		}),
	};

	$.ajax(settings).done(function (response) {
		let access_token = response[0]["access_token"];
		connectSmsSocket(access_token);
	});
}

function saveMessage(toNumber, fromNumber, type, text, inter) {
	var conData = {
		url: "https://5ya5ekzrkj.execute-api.us-east-1.amazonaws.com/dev/sms/message",
		method: "POST",
		timeout: 0,
		headers: {
			"Content-Type": "application/json",
		},
		data: JSON.stringify({
			from: fromNumber,
			to: toNumber,
			type: type,
			text: text,
		}),
	};

	$.ajax(conData).done(function (response) {
		if (inter === 0) {
			askConversations(sessionStorage.getItem("DIDSymphony"));
		} else {
			getSMSbyConv(fromNumber, toNumber);
		}
		console.log("Response: ", response);
	});
}

/* Funciones para REST - Symphony Chat - */

//Función para solicitar las conversaciones del usuario
function list_chat_agent(id_user, platform, channel){
	return $.ajax({
		method: "GET",
		url: `https://integrations.mcmtelecomapi.com/dev/symphony-messaging/api/agent/${id_user}/chats?platform=${platform}&channel=${channel}`,
		contentType: "application/json",
	});
}

//Función para solicitar los mensajes de una conversación
function list_message(phone, platform, channel){
	return $.ajax({
		method: "GET",
		url: `https://integrations.mcmtelecomapi.com/dev/symphony-messaging/api/phone/${phone}/platform/${platform}/messages?channel=${channel}`,
		contentType: "application/json",
	});
}

//Función para subir un archivo en la conversación
function upload_file(enterprise_id, channel){
	var settings = {
		url: `https://integrations.mcmtelecomapi.com/dev/symphony-messaging/api/enterprise/${enterprise_id}/uploadFile`,
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		data: JSON.stringify({
			"channel": channel,
			"phone": phone,
			"platform": platform,
			"file": file,
			"file_extension": file_extension
		})
	};

	$.ajax(settings).done(function (response) {
		console.log(response);
	});
}

//Función para obtener el link público de un archivo en la conversación
function get_public_file(){

}

//Función para obtener el archivo de la conversación
function get_file(){
	
}

// Para cerrar la conexión:
// wsClient.close();

function keepAliveSymphonyChat(){
	console.log("Se ejecuta keepAlive Symphony Chat");
	sendKeepAliveSymhonyChat();
}



/* Funciones para WhatsApp */
function keepAlive2() {
	console.log("Se ejecuta keepAlive");
	//whatsSocket.send('keep alive');
	sendKeep();
}

function getWhatsToken() {
	var settings = {
		url: "https://whatsappwh.mcmtelecomapi.com/dev/auth",
		method: "POST",
		timeout: 0,
		headers: {
			"Content-Type": "application/json",
		},
		data: JSON.stringify({
			userAPI: "MCM_SMS_API_TEST",
			keyAPI: "iE#IIpSi#^@A",
		}),
	};

	$.ajax(settings).done(function (response) {
		let access_token = response[0].access_token;
		if (typeWhatsapp == 0) {
			connecWhatsSocket(access_token);
		} else {
			connecWhatsMyccSocket(access_token);
			
		}
	});
}

function connecWhatsSocket(access_token) {
	//Realizar conexión
	let wsurl = `wss://85d3undfkg.execute-api.us-east-1.amazonaws.com/prod?idUser=${sessionStorage.getItem(
		"accSymphony"
	)}&did=${salesNUmber}&Authorization=${access_token}`;
	whatsSocket = new WebSocket(wsurl);

	whatsSocket.onopen = function (event) {
		console.log(event);
		intervalId2 = setInterval(keepAlive2, 520000);
		//intervalId2 = setInterval(keepAlive2 ,20000);
	};

	whatsSocket.onmessage = function (event) {
		if (event == "" || event == null) {
		} else {
			var alldata = event.data;
			if (alldata.includes("connectionId")) {
			} else {
				getWhatsConvs();
			}
			console.log(event);
		}
	};

	whatsSocket.onclose = function (event) {
		console.log(event);
		whatsSocket.onopen = null;
		whatsSocket.onmessage = null;
		whatsSocket.onclose = null;
		whatsSocket.onerror = null;
		console.log(intervalId2);
		clearInterval(intervalId2);
	};

	whatsSocket.onerror = function (event) {
		console.log(event);
	};
}

function connecWhatsMyccSocket(access_token) {
	//Realizar conexión
	let wsurl = `wss://50tuuxu0rc.execute-api.us-east-1.amazonaws.com/prod?enterprise=${enterprise}&Authorization=${access_token}`;
	whatsSocket = new WebSocket(wsurl);

	whatsSocket.onopen = function (event) {
		console.log(event);
		intervalId2 = setInterval(keepAlive2, 520000);
		//intervalId2 = setInterval(keepAlive2 ,20000);
	};

	whatsSocket.onmessage = function (event) {
		if (event == "" || event == null) {
		} else {
			var alldata = event.data;
			if (alldata.includes("connectionId")) {
			} else {
				getWhatsConvs();
			}
			console.log(event);
		}
	};

	whatsSocket.onclose = function (event) {
		console.log(event);
		whatsSocket.onopen = null;
		whatsSocket.onmessage = null;
		whatsSocket.onclose = null;
		whatsSocket.onerror = null;
		console.log(intervalId2);
		clearInterval(intervalId2);
	};

	whatsSocket.onerror = function (event) {
		console.log(event);
	};
}


function getChatConvs() {
	// Hacer las dos peticiones AJAX simultáneamente
	Promise.all([
		list_chat_agent(sessionStorage.getItem("accSymphony"), "ZENDESK", "MYCC"),
		list_sms_chat(sessionStorage.getItem("DIDSymphony")),
	]).then(function(respuestas) {
		// Las dos peticiones se han completado con éxito
		var respuesta1 = respuestas[0];
		var respuesta2 = respuestas[1];

		var all_chats = [];

		//Leemos respuesta de Symphony Chat
		for(var i=0; i<respuesta1.length; i++){
			var modelMessage = {
				"phone": respuesta1[i].phone,
				"time": Math.round(Date.parse(respuesta1[i].messages[respuesta1[i].messages.length-1].external_message_date)/1000),
				"channel": respuesta1[i].channel,
				"lastMessage": respuesta1[i].last_message
			};
			all_chats.push(modelMessage);
		}

		// Crear arreglo de promesas para las solicitudes de getLastMessageSMS
		var promesas = respuesta2.map(function(chat) {
			return getLastMessageSMS(chat.p1, chat.p2);
		});

		// Esperar a que todas las promesas se resuelvan
		return Promise.all(promesas).then(function(respuestas4) {
			// Asociar respuestas4 con respuesta2
			for (var i = 0; i < respuesta2.length; i++) {
				respuesta2[i].last_message = respuestas4[i][respuestas4[i].length-1]['text']; // Asignar la respuesta de getLastMessageSMS a cada elemento en respuesta2
			}

			//Leemos respuesta de SMS
			for(var i=0; i<respuesta2.length; i++){
				var modelMessage = {
					"phone": respuesta2[i].p1 != sessionStorage.getItem("DIDSymphony") ? respuesta2[i].p1 : respuesta2[i].p2,
					"time": respuesta2[i].timestamp,
					"channel": "SMS",
					"lastMessage": respuesta2[i].last_message
				};

				all_chats.push(modelMessage);
			}
			//console.log("Respuestas de las peticiones a 'getLastMessageSMS':", respuestas4);
			//console.log("Respuesta2 con lastMessageSMS asociado:", respuesta2);
			all_chats.sort(function(a, b) {
			    return b.time - a.time;
			});

			//Pintar chats
			//console.log("Todos los chats:", all_chats);
			drawConversations(all_chats);
		});
	}).catch(function(error) {
		// Al menos una de las peticiones falló
		console.error("Error:", error);
	});
}

function getWhatsConvs() {
	var urlGET;
	if (typeWhatsapp == 0) {
		urlGET = `https://whatsappwh.mcmtelecomapi.com/dev/messages?participant1=${whatsappUserSalesforce}&participant2=${salesNUmber}`;
	} else {
		list_chat_agent(sessionStorage.getItem("accSymphony"), "ZENDESK", "MYCC");
		urlGET = `https://whatsappwh.mcmtelecomapi.com/dev/messages/mycc/zendesk?enterprise=${enterprise}&contact=${whatsappUserMyccZendesk}`;
	}

	/*$.ajax({
		method: "GET",
		url: urlGET,

		success: function (data) {
			fillWhatsConv(data);
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error("Error status: ", jqXHR.status, ", Details: ", errorThrown);
			console.error("Response: ", jqXHR.responseText);
		},
		complete: function (xhr, status) { },
	});*/
}

function fillWhatsConv(array) {
	var txtMainMessages = "";
	array.sort(dynamicSort("timestamp"));
	if (array.length == 0) {
		$("#textErrorAlert").html(
			"No hay conversaciones de WhatsApp con este número"
		);
		Nomessages += 1;
		$("#autoCloseAlert").fadeIn();
		setTimeout(function () {
			$("#autoCloseAlert").fadeOut();
		}, 3000);
	} else {
		$("#messagesDiv").html("");
		txtMainMessages += `<div class="chat-panel">`;
		for (var i = 0; i < array.length; i++) {
			var timestamp = array[i].timestamp;
			var text = array[i].text;
			var from = array[i].from;
			var from_me = array[i].from_me;
			var d = new Date(0);
			d.setUTCSeconds(timestamp);
			let day = d.getDate();
			let month = d.getMonth() + 1;
			let year = d.getFullYear();
			let hour = d.getHours();
			let min = d.getMinutes();
			var fecha = "" + day + "/" + month + "/" + year + " " + hour + ":" + min;
			txtMainMessages += `<div class="row no-gutters">`;
			if (typeWhatsapp == 0) {
				if (from === salesNUmber) {
					txtMainMessages += `<div class="col-md-4 offset-md-8">`;
					txtMainMessages += `<div class="chat-bubbleR chat-bubbleR--right">${text} <div style="display: flex; justify-content: flex-end"><small><small><small>${fecha}</small></small></small></div></div>`;
					txtMainMessages += `</div>`;
				} else {
					txtMainMessages += `<div class="col-md-4">`;
					//txtMainMessages += `<div class="chat-bubble chat-bubble--left">${text} <div style="display: flex; justify-content: flex-end"><small><small><small>${fecha}</small></small></small> </div>`;
					txtMainMessages += `<div class="chat-bubble chat-bubble--left">${text} <div style="display: flex; justify-content: flex-end"><small><small><small>${fecha}</small></small></small></div> </div>`;
					txtMainMessages += `</div>`;
				}
			} else {
				if (from_me !== "False") {
					txtMainMessages += `<div class="col-md-4 offset-md-8">`;
					txtMainMessages += `<div class="chat-bubbleR chat-bubbleR--right">${text} <div style="display: flex; justify-content: flex-end"><small><small><small>${fecha}</small></small></small></div></div>`;
					txtMainMessages += `</div>`;
				} else {
					//whatsappUserMyccSalesforce = from;
					txtMainMessages += `<div class="col-md-4">`;
					//txtMainMessages += `<div class="chat-bubble chat-bubble--left">${text} <div style="display: flex; justify-content: flex-end"><small><small><small>${fecha}</small></small></small> </div>`;
					txtMainMessages += `<div class="chat-bubble chat-bubble--left">${text} <div style="display: flex; justify-content: flex-end"><small><small><small>${fecha}</small></small></small></div> </div>`;
					txtMainMessages += `</div>`;
				}
			}

			txtMainMessages += `</div>`;
		}

		txtMainMessages += `</div>`;

		$("#backButton").show();
		$("#conversationsDiv").hide("slow");
		$("#messagesDiv").html(txtMainMessages);
		$("#messagesDiv").show("slow");
		$("#barChatDiv").show("slow");
		$("#newMessageButton").hide("slow");
		$("#messagesDiv").scrollTop($("#messagesDiv")[0].scrollHeight);
	}
}

/* Funciones para Zendesk */
function getZendeskUserInfoByPhone(userId, phone, call) {
	console.log(phone);
	var fetchItem = {
		url: `https://integrations.mcmtelecomapi.com/dev/ticket`,
		data: JSON.stringify({
			userId: userId,
			operation: "searchUser",
			phone: phone,
		}),
		type: "post",
		dataType: "json",
	};

	console.log(fetchItem);

	client.request(fetchItem).then(function (data) {
		console.log(data);
		switch (data.count) {
			case 0:
				//Create user, show caller number
				$("#callerLabel").html(phone);

				if (autoManage == 0) {
					console.log("Se creará usario");
					var createUserData = {
						url: `https://integrations.mcmtelecomapi.com/dev/ticket`,
						data: JSON.stringify({
							userId: userId,
							operation: "createUser",
							phone: phone,
						}),
						type: "POST",
						dataType: "json",
					};

					client.request(createUserData).then(function (dataUser) {
						//zendeskEndUserCaller = dataUser.user.id;
						//zendeskEndUserCaller.push(dataUser.user);
						var openUserTab = {
							url: `https://integrations.mcmtelecomapi.com/dev/ticket`,
							data: JSON.stringify({
								userId: userId,
								operation: "displayUser",
								userZendeskId: dataUser.user.id,
							}),
							type: "POST",
							dataType: "json",
						};

						client.request(openUserTab).then(function (dataResponse) {
							console.log(dataResponse);
						});
					});
				}

				break;

			case 1:
				//Show name caller according zendesk user profile
				console.log(data.results);
				$("#callerLabel").html(data.results[0].name);
				//call.data['_user'] = data.results[0].name;

				var openUserTab = {
					url: `https://integrations.mcmtelecomapi.com/dev/ticket`,
					data: JSON.stringify({
						userId: userId,
						operation: "displayUser",
						userZendeskId: data.results[0].id,
					}),
					type: "POST",
					dataType: "json",
				};

				client.request(openUserTab).then(function (dataResponse) {
					console.log(dataResponse);
				});
				break;

			default:
				console.log(data.results);
				$("#callerLabel").html(data.results[0].name);
				//call.data['_user'] = data.results[0].name;

				var openUserTab = {
					url: `https://integrations.mcmtelecomapi.com/dev/ticket`,
					data: JSON.stringify({
						userId: userId,
						operation: "displayUser",
						userZendeskId: data.results[0].id,
					}),
					type: "POST",
					dataType: "json",
				};

				client.request(openUserTab).then(function (dataResponse) {
					console.log(dataResponse);
				});
				break;
		}
	});
}

function ticketsProcess() {
	$("#updateTicketDiv").hide();
	$("#createTicketDiv").hide();
	//Hacer petición a lista de llamadas no procesadas
	var listCalls = {
		url: `https://integrations.mcmtelecomapi.com/dev/callsog?userId=${userIdSymp}&idType=2`,
		type: "get",
		dataType: "json",
	};

	client.request(listCalls).then(function (dataCalls) {
		console.log(dataCalls);
		if (dataCalls.length == 0) {
			$("#ticketsDiv").html("No hay llamadas sin procesar");
		} else {
			var txt = "";
			for (var i = 0; i < dataCalls.length; i++) {
				var utcSeconds = dataCalls[i].answerTime;
				var d = new Date(0);
				d.setUTCSeconds(utcSeconds / 1000);
				let day = d.getDate();
				let month = d.getMonth() + 1;
				let year = d.getFullYear();
				let hour = d.getHours();
				let min = d.getMinutes();

				let formattedTime = day + "/" + month + "/" + year;
				let formattedTime2 = ("0" + hour).slice(-2) + ":" + ("0" + min).slice(-2);

				txt += `
				<li class="list-group-item flex justify-content-between friend-drawer--onhover:hover">
					<div class='row'>
					<div class="col-12 centerDivList" align="left">
						<div class='row'>
						<div class='col-8 contact' align="left"><strong>${dataCalls[i].address}</strong></div>
						<div class='col-2 contact' align="left" style="margin-left: -106px;">${formattedTime} ${formattedTime2}</div>
						<div class="col-2 lateral-button" align="left">
						<button type="button"  style="margin-left: 20px;" class="btn btn-successTickets btn-circle" onclick='createTicket("${userIdSymp}","${dataCalls[i].callId}","${dataCalls[i].address}")'>
						<div class="material-icons md-14" style="font-size: 25px;">add_circle</div>
						</button>
						</div>
						</div>
					</div>
					
					</div>
				</li>
				<hr class="ticketshr">
				`;
			}

			$("#ticketsDiv").html(txt);
			$("#ticketsDiv").show();
		}
	});
}

function createTicket(userId, callId, phone) {
	currentCreateTicketUserId = userId;
	currentCreateTicketCallId = callId;
	currentCreateTicketPhone = phone;

	$("#ticketsDiv").hide();
	$("#createTicketDiv").show();
	$("#updateTicketDiv").hide();
}

function getAutoManage(user) {
	//Obtenemos bandera
	$.ajax({
		method: "GET",
		url: `https://integrations.mcmtelecomapi.com/dev/subscription/automatization?userId=${user}`,
		success: function (data) {
			console.log(data);
			autoManage = data.autoManage;
			console.log(autoManage);
			if (autoManage == "1") {
				console.log("Activar checkbox");
				$("#autoTicketsCheck").prop("checked", true);
			} else {
				console.log("No activar checkbox");
				$("#autoTicketsCheck").prop("checked", false);
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {
			console.error(
				"Error requesting ride: ",
				textStatus,
				", Details: ",
				errorThrown
			);
			console.error("Response: ", jqXHR.responseText);
		},
		complete: function (xhr, status) { },
	});
}

//Timer cambio de estado de agente MyCC
function resolveAfterNSecond(n) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve("resolved");
		}, n);
	});
}

async function asyncChangeStatus(x) {
	let result = await resolveAfterNSecond(x);
	document.getElementById("statusNames").selectedIndex = 1;
	selectStatusC();
}

function clearCallControlButtons(numberLine) {
	//Bóton de mute
	$("#muteButton").html('<div class="material-icons md-18">mic_none</div>');
	$("#muteButton").removeClass("active");

	//Botón de hold
	$("#holdButton").val("Hold");
	$("#holdButton").removeClass("active");

	//Botón de add call
	$("#addCallButton").removeClass("active");
	addCallFlag = false;
}
function checkCallControls(numberLine) {
	if (lines[numberLine].isLocalHold() == true) {
		$("#holdButton").val("Unhold");
		$("#holdButton").addClass("active");
	} else {
		$("#holdButton").val("Hold");
		$("#holdButton").removeClass("active");
	}
	if (lines[numberLine].isAudioMuted() == true) {
		$("#muteButton").html('<div class="material-icons md-18">mic_off</div>');
		$("#muteButton").addClass("active");
	} else {
		$("#muteButton").html('<div class="material-icons md-18">mic_none</div>');
		$("#muteButton").removeClass("active");
	}
}

function terminateConference() {
	var llamadas = getAllCalls();
	llamadas.forEach(function (llamada) {
		if (llamada.data["audioMixer"]) {
			conferenceRemoveAudio(llamada);
			llamada.terminate();
		}
	});
	flagConference = false;
}

// Función para obtener el identificador único del navegador
function getBrowserFingerprint(callback) {
	Fingerprint2.get({}, (components) => {
		const fingerprint = Fingerprint2.x64hash128(
			components.map((pair) => pair.value).join(),
			31
		);
		callback(fingerprint);
	});
}

//función para solicitar credenciales por sesión que expiró
function sessionExpire() {
	clearInterval(CCInterval);
	//Se muestra mensaje de sesión expirada
	$("#textErrorAlert").html(
		"Sesión expirada, por favor inicia sesión nuevamente."
	);
	$("#autoCloseAlert").fadeIn();
	setTimeout(function () {
		$("#autoCloseAlert").fadeOut();
		location.reload();
	}, 4000);
}

function checkIncomingCallsActive() {
	for (var i = 0; i < lines.length; i++) {
		//Buscamos lineas que tengan llamada entrante
		if (lines[i] != null && lines[i].isEstablished() == false) {
			return true;
		}
	}
}

//Función para solicitar la información del usuario
function get_user_info(id_user){
	return $.ajax({
		method: "GET",
		url: `https://integrations.mcmtelecomapi.com/dev/hubspot/api/agent/${id_user}/agent_info`,
		contentType: "application/json",
	});
}
