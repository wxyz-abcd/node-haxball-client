const teamNames = ["Spectators", "Red Team", "Blue Team"], chatHistoryLimit = 500, gameStateGUIUpdateFrameInterval = 30;

function sandboxRoomWrapper(){
	var API = abcHaxballAPI(window), wrapper = sandboxWrapper(API);
	return {
		...API,
		Room:{
			...API.Room,
			create: (p1,p2)=>{
				wrapper.Callback.add("KeyDown");
				wrapper.Callback.add("KeyUp");
				if ("ontouchstart" in document.documentElement){
					wrapper.Callback.add("TouchStart");
					wrapper.Callback.add("TouchMove");
					wrapper.Callback.add("TouchEnd");
				}
				else{
					wrapper.Callback.add("MouseDown");
					wrapper.Callback.add("MouseMove");
					wrapper.Callback.add("MouseUp");
					wrapper.Callback.add("Wheel");
				}
				var canvas = document.getElementById("canvas");
				var gameTime, redScore, blueScore, gameTime_ot, gameTime_m1, gameTime_m2, gameTime_s1, gameTime_s2;

				function loadImage(path){
					return new Promise((resolve, reject)=>{
						var img = document.createElement("img");
						img.src = path;
						img.onload = ()=>{
							resolve(img);
						};
						img.onerror = (err)=>{
							reject(err);
						};
					});
				}
				Promise.all([
					loadImage("./images/grass.png"),
					loadImage("./images/concrete.png"),
					loadImage("./images/concrete2.png"),
					loadImage("./images/typing.png"),
				]).then(([grass, concrete, concrete2, typing])=>{
					var rendererParams, room, sound, keyHandler, chatApi;
					var tmp = document.getElementsByClassName("canvasSubContainer");
					var roomFrame = tmp.item(0), canvasContainer = tmp.item(1);
					var chatLog = document.getElementsByClassName("chatLog").item(0);
					var chatInput = document.getElementsByClassName("chatInput").item(0);
					var bSendChat = chatInput.children.item(1);
					chatInput = chatInput.children.item(0);
					var scrollTopRef = -1;
					var gameStateContainer = canvasContainer.children.item(1);
					var scoreBoard = gameStateContainer.children.item(0);
					redScore = scoreBoard.children.item(1);
					blueScore = scoreBoard.children.item(3);
					gameTime = gameStateContainer.children.item(1);
					gameTime_ot = gameTime.children.item(0);
					gameTime_m1 = gameTime.children.item(1);
					gameTime_m2 = gameTime.children.item(2);
					gameTime_s1 = gameTime.children.item(4);
					gameTime_s2 = gameTime.children.item(5);
					chatLog.onscroll = function(event){
						if (chatLog.scrollTop>=chatLog.scrollHeight-chatLog.clientHeight-20)
							scrollTopRef = -1;
						else
							scrollTopRef = chatLog.scrollTop;
					};
					function addChatRow({type, className, content, color, font}){
						var e = document.createElement("p");
						if (type==0 && className!=null)
							e.className = className;
						else if (type==1){
							e.className = "announcement";
							if (color>=0)
								e.style.color = API.Utils.numberToColor(color);
							switch (font){
								case 1:
									e.style.fontWeight = "bold";
									break;
								case 2:
									e.style.fontStyle = "italic";
									break;
								case 3:
									e.style.fontSize = "12px";
									break;
								case 4:
									e.style.fontWeight = "bold";
									e.style.fontSize = "12px";
									break;
								case 5:
									e.style.fontStyle = "italic";
									e.style.fontSize = "12px";
									break;
							}
						}
						e.innerText = content;
						if (chatLog.children.length>=chatHistoryLimit)
							chatLog.children.item(0).remove();
						chatLog.appendChild(e);
						if (scrollTopRef==-1)
							chatLog.scrollTop = chatLog.scrollHeight-chatLog.clientHeight;
					}
					let mapCoord = null;
					const snapshots = [];
					let contextMenu;
					let snapshotIdCounter = 1;
					let playerIds = 1;
					let frozen = false;
					const $ = (sel, parent=window.document)=>parent.querySelector(sel);
					const $$ = (cls, parent=window.document)=>parent.querySelectorAll(cls);

					const createEl = (tag, className, text)=>{
						const el = window.document.createElement(tag);
						if (className) el.className = className;
						if (text) el.textContent = text;
						return el;
					};

					const createPopup = (id, title)=>{
						$$(".popup")[0]?.remove();;
						const popup = createEl("div", `popup`);
						const header = createEl("div", `popup-header`);
						const content = createEl("div", `popup-content`);
						const titleEl = createEl("div", `popup-title`, title);
						const buttonContainer = createEl("div", "popup-buttons");
						const closeBtn = createEl("button", "button", "✕");
						closeBtn.onclick = ()=>popup.remove();
						Object.assign(closeBtn.style, { float: "right", cursor: "pointer" });
						buttonContainer.appendChild(closeBtn);
						header.append(titleEl, buttonContainer);
						popup.append(header, content);
						window.document.body.appendChild(popup);
						return popup;
					};

					const addSnapshotToArray = (roomState)=>snapshots.push({
						id: snapshotIdCounter++,
						roomState,
						name: new Date().toLocaleString(),
						image: canvas.toDataURL()
					});

					const renderSnapshotList = (container)=>{
						container.innerHTML = "";

						snapshots.forEach((snap, i)=>{
							const item = createEl("div", "snapshot-item", `Snapshot ${snap.id} - ${snap.name}`);
							const img = createEl("img", "snapshot-thumbnail");
							Object.assign(img.style, { width: "100%", height: "80px", objectFit: "cover" });
							img.src = snap.image;
							item.appendChild(img);

							item.onclick = (e)=>{
								e.stopPropagation();
								contextMenu.innerHTML = "";

								[["Load Snapshot", ()=>room.useSnapshot(snap.roomState)], ["Remove Snapshot", ()=>{ snapshots.splice(i, 1); renderSnapshotList(container); }]].forEach(([text, fn])=>{
									const opt = createEl("div", "context-menu-item", text);
									opt.onclick = ()=>{
										fn();
										contextMenu.style.display = "none";
									};
									contextMenu.appendChild(opt);
								});

								Object.assign(contextMenu.style, {
									left: `${e.pageX}px`,
									top: `${e.pageY}px`,
									display: "flex"
								});
							};

							container.appendChild(item);
						});
					};

					const showSnapshots = ()=>{
						const popup = createPopup("snapshot-popup", "Snapshots");
						popup.style.minHeight = '600px';
						const saveBtn = createEl("button", "button", "Save");
						saveBtn.onclick = ()=>{
							const snap = room.takeSnapshot();
							if (snap){
								addSnapshotToArray(snap);
								renderSnapshotList(content);
							}
						};
						popup.querySelector(".popup-buttons").appendChild(saveBtn);
						const content = popup.querySelector(".popup-content");

						renderSnapshotList(content);

						if (!contextMenu){
							contextMenu = createEl("div", "context-menu");
							window.document.body.appendChild(contextMenu);
							window.document.addEventListener("click", ()=>{
								contextMenu.style.display = "none";
							});
						}
					};

					const showSandboxTools = ()=>{
						const toolbar = $(".toolbar1");
						toolbar.style.display = toolbar.style.display === "flex" ? "none" : "flex";
						const stepButton = $(".step");
						stepButton.onclick = ()=>{ room.runSteps(1) };

						$(".snapshotButton").onclick = showSnapshots;
						$(".addPlayerButton").onclick = ()=>getMultipleInput("Add player", ["Player Name", "Avatar", "Flag"], ["default", "0", "fr"], ([name, avatar, flag])=>{ room.addPlayer({ name, flag, avatar, id: playerIds++, team: "spec" }); });
						$(".speedInput").oninput = (e)=>{
							let speed = parseFloat(e.target.value);
							if (isNaN(speed) || speed<0 || speed>20)
								e.target.value = 1;
							room.setSimulationSpeed(+e.target.value);
						};
						$(".stopGame").onclick = ()=>(room.gameState ? (room.stopGame(), $(".stopGame").innerText = "▶", $(".stopGame").style.backgroundColor = "green") : (room.startGame(), $(".stopGame").innerText = "■", $(".stopGame").style.backgroundColor = "red"));
						$(".pauseGame").onclick = ()=>room.pauseGame();
						$(".freeze").onclick = ()=>(frozen ? (room.setSimulationSpeed(1), frozen = false, stepButton.disabled = true, $(".freeze").innerText = "Freeze") : (room.setSimulationSpeed(0), frozen = true, stepButton.disabled = false, $(".freeze").innerText = "Unfreeze"));
					};

					$(".sandbox-tools").onclick = showSandboxTools;
					function getMultipleInput(title, labels, defaultValues, onSubmit){
						const multiplePopup = createPopup("multiple-input", title);
						const content = multiplePopup.querySelector(".popup-content");
						labels.forEach((label, i)=>{
							const labelEl = createEl("label", "input-label");
							const title = createEl("div", null, label);
							content.appendChild(title);
							if (label == "Flag") {
								fetch("./countries.json").then((response)=>{
									return response.json();
								}).then((countries)=>{
									makeFlagSelector(countries, labelEl);
									content.appendChild(labelEl);
									content.setAttribute("style", "overflow-y:unset !important;")
									labelEl.setAttribute('style', 'position:relative')
									labelEl.classList.remove("flagSelector");
									labelEl.classList.add("flag-field");
									labelEl.querySelector(".flagSelectorPopup").setAttribute('style', 'background-color:rgba(0,0,0,100%);position:absolute')
									const flagSelector = labelEl.querySelector(".flagSelectorContents");
									flagSelector.classList.add("input-field");
									flagSelector.classList.remove("flagSelectorContents");
									flagSelector.setAttribute("style","display:ruby;");
								});
								return;
							};
							const input = createEl("input", "input-field");
							input.type = "text";
							input.value = defaultValues[i] || "";
							labelEl.appendChild(input);
							content.appendChild(labelEl);
						});

						const okButton = createEl("button", "button", "OK");
						okButton.onclick = ()=>{
							const values = Array.from(content.querySelectorAll(".input-field, .flag-field")).map((input)=>input.value);
							onSubmit(values);
						};
						multiplePopup.querySelector(".popup-buttons").appendChild(okButton);
					}
					function sendChat(){
						var chatText = chatInput.value;
						if (chatText.length>0 && !analyzeChatCommand(chatText))
							room.sendChat(chatText);
						chatInput.value = "";
						chatInput.blur();
					}
					function analyzeChatCommand(msg){
						if (msg.charAt(0)!="/")
							return false;
						if (msg.length==1)
							return true;
						var {parseHexInt} = API.Utils;
						msg = msg.substring(1).split(" ");
						switch(msg[0]){
							case "avatar":
								if (msg.length==2){
									room.setAvatar(msg[1]);
									chatApi.receiveNotice("Avatar set");
								}
								break;
							case "checksum":
								var cs = room.stadium.calculateChecksum();
								if (!cs)
									chatApi.receiveNotice('Current stadium is original: "'+room.stadium.name+'"')
								else
									chatApi.receiveNotice('Stadium: "'+room.stadium.name+'" (checksum: '+cs+")")
								break;
							case "clear_avatar":
								room.setAvatar(null);
								chatApi.receiveNotice("Avatar cleared");
								break;
							case "clear_bans":
								if (room.isHost){
									room.clearBans(null);
									chatApi.receiveNotice("All bans have been cleared");
								}
								else
									chatApi.receiveNotice("Only the host can clear bans");
								break;
							case "set_password":
								if (msg.length==2){
									if (room.isHost){
										room.setProperties({password: msg[1]});
										chatApi.receiveNotice("Password set");
									}
									else
									chatApi.receiveNotice("Only the host can change the password");
								}
								break;
							case "clear_password":
								if (room.isHost){
									room.setProperties({password: null});
									chatApi.receiveNotice("Password cleared");
								}
								else
									chatApi.receiveNotice("Only the host can change the password");
								break;
							case "colors":
								try {
									var teamId = (msg[1]=="blue") ? 2 : 1;
									var angle = msg[2];
									if (angle=="clear"){
										angle = 0;
										msg = [];
									}
									else
										msg.splice(0, 3);
									room.setTeamColors(teamId, angle, ...msg.map((c)=>parseHexInt("0x"+c)));
								}
								catch(g){
									chatApi.receiveNotice(msg.toString());
								}
								break;
							case "extrapolation":
								if (msg.length==2){
									msg = parseHexInt(msg[1]);
									if (msg!=null){ // && -200 <= msg && 200 >= msg
										room.setExtrapolation(msg),
										chatApi.receiveNotice("Extrapolation set to "+msg+" msec");
									}
									else
										chatApi.receiveNotice("Extrapolation must be a value between -200 and 200 milliseconds");
								}
								else
									chatApi.receiveNotice("Extrapolation requires a value in milliseconds.");
								break;
							case "handicap":
								if (msg.length==2){
									msg = parseHexInt(msg[1]);
									if (msg!=null){ // && 0 <= msg && 300 >= msg
										room.setHandicap(msg);
										chatApi.receiveNotice("Ping handicap set to "+msg+" msec");
									}
									else
										chatApi.receiveNotice("Ping handicap must be a value between 0 and 300 milliseconds");
								}
								else
									chatApi.receiveNotice("Ping handicap requires a value in milliseconds.");
								break;
							case "kick_ratelimit":
								if (msg.length<4)
									chatApi.receiveNotice("Usage: /kick_ratelimit <min> <rate> <burst>");
								else{
									var d = parseHexInt(msg[1]), e = parseHexInt(msg[2]);
									msg = parseHexInt(msg[3]);
									if (d==null || e==null || msg==null)
										chatApi.receiveNotice("Invalid arguments");
									else
										room.setKickRateLimit(d, e, msg);
								}
								break;
							case "recaptcha":
								if (!room.isHost) 
									chatApi.receiveNotice("Only the host can set recaptcha mode");
								else
									try{
										if (msg.length==2){
											switch(msg[1]){
												case "off":
													e = false;
													break;
												case "on":
													e = true;
													break;
												default:
													throw null;
											}
											room.setRecaptcha(e);
											chatApi.receiveNotice("Room join Recaptcha "+(e ? "enabled" : "disabled"));
										}
										else
											throw null;
									}
									catch(g){
										chatApi.receiveNotice("Usage: /recaptcha <on|off>");
									}
								break;
							case "store":
								var f = room.stadium;
								if (!f.isCustom)
									chatApi.receiveNotice("Can't store default stadium.");
								else {
									chatApi.receiveNotice("Not implemented to keep the web examples simple.");
									//insertStadium({name: f.name, contents: API.Utils.exportStadium(f)}).then(()=>{
									//chatApi.receiveNotice("Stadium stored");
									//}, ()=>{
									//chatApi.receiveNotice("Couldn't store stadium");
									//});
								};
								break;
							default:
								chatApi.receiveNotice('Unrecognized command: "' + msg[0] + '"');
						}
						return true;
					}
					bSendChat.onclick = sendChat;
					chatInput.onkeydown = function(event){
						switch (event.keyCode) {
							case 9:
								//b.Bc.Mb.hidden || (b.Bc.qo(), c.preventDefault());
								break;
							case 13:
								sendChat();
								break;
							case 27:
								chatInput.value = "";
								chatInput.blur();
								//b.Bc.Mb.hidden ? ((b.gb.value = ""), b.gb.blur()) : b.Bc.Qh();
								break;
							case 38:
								//b.Bc.Qj(-1);
								break;
							case 40:
								//b.Bc.Qj(1);
						}
						event.stopPropagation();
					}
					var chatFocus = false, chatFocusTimeout = null;
					function onFocusChange(focus){
						chatFocus = focus;
						if (chatFocusTimeout!=null)
							return;
						chatFocusTimeout = setTimeout(function(){
							chatFocusTimeout = null;
							room.sendChatIndicator(!chatFocus);
						}, 1000);
						room.sendChatIndicator(!chatFocus);
					};
					chatInput.onfocus = ()=>{
						onFocusChange(true);
					};
					chatInput.onblur = ()=>{
						onFocusChange(false);
					};
					chatApi = {
						receiveChatMessage: function(nick, msg){
							addChatRow({type: 0, content: nick + " : " + msg, color: 1, font: 1})
						},
						receiveAnnouncement: function(msg, color, style){
							addChatRow({type: 1, content: msg, color: color, font: style})
						},
						receiveNotice: function(msg){
							addChatRow({type: 0, content: msg, className: "notice"})
						},
						focusOnChat: function(){
							chatInput.focus();
						}
					};
					function Sound(){
						this.audio = new AudioContext(); // c
						this.gain = this.audio.createGain(); // ag
						this.gain.gain.value = 1;
						this.gain.connect(this.audio.destination);
						var that = this;
						this.loadSound = function(path){
							return new Promise((resolve, reject)=>{
								fetch(path).then((response) => {
									if (!response.ok) {
										reject();
										return;
									}
									return response.arrayBuffer();
								}).then((arrayBuffer) => {
									return that.audio.decodeAudioData(arrayBuffer, resolve, reject);
								}).catch(reject);
							});
						};
						this.playSound = function(sound){
							var bufferSource = that.audio.createBufferSource();
							bufferSource.buffer = sound;
							bufferSource.connect(that.gain);
							bufferSource.start();
						};
					}
					function GameKeysHandler(){
						this.keyState = 0;
						
						var that = this, keys = new Map();
						keys.set("ArrowUp", "Up");
						keys.set("KeyW", "Up");
						keys.set("ArrowDown", "Down");
						keys.set("KeyS", "Down");
						keys.set("ArrowLeft", "Left");
						keys.set("KeyA", "Left");
						keys.set("ArrowRight", "Right");
						keys.set("KeyD", "Right");
						keys.set("KeyX", "Kick");
						keys.set("Space", "Kick");
						keys.set("ControlLeft", "Kick");
						keys.set("ControlRight", "Kick");
						keys.set("ShiftLeft", "Kick");
						keys.set("ShiftRight", "Kick");
						keys.set("Numpad0", "Kick");

						var keyValue = function(key){
							switch(keys.get(key)){
								case "Down":
									return 2;
								case "Kick":
									return 16;
								case "Left":
									return 4;
								case "Right":
									return 8;
								case "Up":
									return 1;
								default:
									return 0;
							}
						};
						this.pressKey = function(key){
							that.keyState |= keyValue(key);
							room.setKeyState(that.keyState);
						};
						this.releaseKey = function(key){
							that.keyState &= ~keyValue(key);
							room.setKeyState(that.keyState);
						};
						this.reset = function(){
							if (that.keyState==0)
								return;
							that.keyState = 0;
							room.setKeyState(0);
						}
					};
					function updateGUI(){
						var pg = rendererParams?.paintGame;
						roomFrame.style.display = pg ? "none" : "block";
						canvasContainer.style.display = pg ? "block" : "none";
						if (!pg)
							roomFrame.contentWindow.update(API, room, room.state);
					}
					var oldGUIValues = {};
					function updateGameStateGUI(gameState){
						var _redScore = gameState.redScore, _blueScore = gameState.blueScore;
						if (oldGUIValues.redScore!=_redScore){
							redScore.innerText = ""+_redScore;
							oldGUIValues.redScore = _redScore;
						}
						if (oldGUIValues.blueScore!=_blueScore){
							blueScore.innerText = ""+_blueScore;
							oldGUIValues.blueScore = _blueScore;
						}
						var totalGameTime = 60*gameState.timeLimit, elapsedGameTime = gameState.timeElapsed|0;
						var s = elapsedGameTime%60, m = (elapsedGameTime/60)|0;
						if (elapsedGameTime<totalGameTime && elapsedGameTime>totalGameTime-30){
							if (!oldGUIValues.timeWarningActive){
								gameTime.classList.add("time-warn");
								oldGUIValues.timeWarningActive = true;
							}
						}
						else if (oldGUIValues.timeWarningActive){
							gameTime.classList.remove("time-warn");
							oldGUIValues.timeWarningActive = false;
						}
						if (totalGameTime!=0 && elapsedGameTime>totalGameTime){
							if (!oldGUIValues.overtimeActive){
								gameTime_ot.classList.add("on");
								oldGUIValues.overtimeActive = true;
							}
						}
						else if (oldGUIValues.overtimeActive){
							gameTime_ot.classList.remove("on");
							oldGUIValues.overtimeActive = false;
						}
						var m1 = ((m/10)|0)%10, m2 = m%10, s1 = ((s/10)|0)%10, s2 = s%10;
						if (oldGUIValues.m1!=m1){
							gameTime_m1.innerText = ""+m1;
							oldGUIValues.m1 = m1;
						}
						if (oldGUIValues.m2!=m2){
							gameTime_m2.innerText = ""+m2;
							oldGUIValues.m2 = m2;
						}
						if (oldGUIValues.s1!=s1){
							gameTime_s1.innerText = ""+s1;
							oldGUIValues.s1 = s1;
						}
						// we dont need check for s2 because this function runs once in each second, therefore the last digit should always be different.
						//if (oldGUIValues.s2!=s2){
						gameTime_s2.innerText = ""+s2;
						//oldGUIValues.s2 = s2;
						//}
					}
					function onOpen(_room){
						p2.onOpen?.(_room);
						room = _room;
						function by(playerObj){
							return (playerObj==null) ? "" : (" by ["+playerObj.id+"]"+playerObj.name);
						}
						room.onAfterRoomLink = (roomLink, customData)=>{
							window.roomLink = roomLink;
						};
						room.onAfterPlayerChat = function(id, message, customData){
							var playerObj = room.state.players.find((x)=>x.id==id);
							if (!playerObj)
								return;
							chatApi.receiveChatMessage("["+playerObj.id+"]"+playerObj.name, message); // d ? "highlight" : null
							sound.playSound(sound.chat);//sound.highlight
						};
						room.onAfterPlayerJoin = function(playerObj, customData){
							chatApi.receiveNotice("["+playerObj.id + "]"+playerObj.name+" has joined");
							sound.playSound(sound.join);
							updateGUI();
						};
						room.onAfterPlayerLeave = function(playerObj, reason, isBanned, byId, customData){
							var byPlayerObj = room.state.players.find((x)=>x.id==byId);
							if (reason != null)
								chatApi.receiveNotice("["+playerObj.id+"]"+playerObj.name+" was "+(isBanned ? "banned" : "kicked")+by(byPlayerObj)+(reason!="") ? (" ("+reason+")") : "");
							else
								chatApi.receiveNotice("["+playerObj.id+"]"+playerObj.name+" has left");
							sound.playSound(sound.leave);
							updateGUI();
						};
						room.onAfterAnnouncement = function(msg, color, style, _sound, customData){
							chatApi.receiveAnnouncement(msg, color, style);
							switch (_sound) {
								case 1:
									sound.playSound(sound.chat);
									break;
								case 2:
									sound.playSound(sound.highlight);
									break;
							}
						};
						room.onAfterPlayerBallKick = function(customData){
							sound.playSound(sound.kick);
						};
						room.onAfterTeamGoal = function(teamId, customData){
							sound.playSound(sound.goal);
						};
						room.onAfterGameEnd = function(winningTeamId, customData){
							chatApi.receiveNotice(teamNames[winningTeamId]+" won the match");
						};
						room.onAfterGamePauseChange = function(paused, byId, customData){
							var byPlayerObj = room.state.players.find((x)=>x.id==byId);
							if (paused)
								chatApi.receiveNotice("Game paused"+by(byPlayerObj));
							updateGUI();
						};
						room.onAfterGameStart = function(byId, customData){
							var byPlayerObj = room.state.players.find((x)=>x.id==byId);
							chatApi.receiveNotice("Game started"+by(byPlayerObj));
							if (rendererParams)
								rendererParams.paintGame = true;
							updateGUI();
						};
						room.onAfterGameStop = function(byId, customData){
							var byPlayerObj = room.state.players.find((x)=>x.id==byId);
							if (byPlayerObj!=null)
								chatApi.receiveNotice("Game stopped"+by(byPlayerObj));
							if (rendererParams)
								rendererParams.paintGame = false;
							updateGUI();
						};
						room.onAfterStadiumChange = function(stadium, byId, customData){
							var byPlayerObj = room.state.players.find((x)=>x.id==byId);
							var checksum = stadium.calculateChecksum();
							if (checksum)
								chatApi.receiveNotice('Stadium "'+stadium.name+'" ('+checksum+") loaded"+by(byPlayerObj));
							updateGUI();
						};
						room.onAfterPlayerSyncChange = function(playerId, value, customData){
							var playerObj = room.state.players.find((x)=>x.id==playerId);
							chatApi.receiveNotice("["+playerObj.id+"]"+playerObj.name+" "+(playerObj.sync ? "has desynchronized" : "is back in sync"));
						};
						room.onAfterPlayerTeamChange = function(id, teamId, byId, customData){
							var byPlayerObj = room.state.players.find((x)=>x.id==byId), playerObj = room.state.players.find((x)=>x.id==id);
							if (room.state.gameState!=null)
								chatApi.receiveNotice("["+playerObj.id+"]"+playerObj.name+" was moved to "+teamNames[teamId]+by(byPlayerObj));
							updateGUI();
						};
						room.onAfterAutoTeams = function(playerId1, teamId1, playerId2, teamId2, byId, customData){
							room.onAfterPlayerTeamChange(playerId1, teamId1, byId, customData);
							if (playerId2!=null && teamId2!=null)
								room.onAfterPlayerTeamChange(playerId2, teamId2, byId, customData);
						};
						room.onAfterPlayerAdminChange = function(id, isAdmin, byId, customData){
							var byPlayerObj = room.state.players.find((x)=>x.id==byId), playerObj = room.state.players.find((x)=>x.id==id);
							chatApi.receiveNotice((playerObj.isAdmin ? ("[" + playerObj.id + "]" + playerObj.name + " was given admin rights") : ("[" + playerObj.id + "]" + playerObj.name + "'s admin rights were taken away")) + by(byPlayerObj));
							updateGUI();
						};
						room.onAfterKickRateLimitChange = function(min, rate, burst, byId, customData){
							var byPlayerObj = room.state.players.find((x)=>x.id==byId);
							chatApi.receiveNotice("Kick Rate Limit set to (min: "+min+", rate: "+rate+", burst: "+burst+")"+by(byPlayerObj));
						};
						room.onAfterCustomEvent = function(type, data, byId, customData){
							var byPlayerObj = room.state.players.find((x)=>x.id==byId);
							chatApi.receiveNotice("Custom Event triggered (type: "+type+", data: ["+JSON.stringify(data)+"])"+by(byPlayerObj));
						};
						room.onAfterScoreLimitChange = function(value, byId, customData){
							updateGUI();
						};
						room.onAfterTimeLimitChange = function(value, byId, customData){
							updateGUI();
						};
						room.onAfterTeamsLockChange = function(value, byId, customData){
							updateGUI();
						};
						room.onAfterPingData = function(array, customData){
							updateGUI();
						};
					}
					function preInit(){
						p2.preInit?.();
						sound = new Sound();
				    keyHandler = new GameKeysHandler();
						window.onKeyDown = function(event){
							//room._onKeyDown(event); // This triggers the onKeyDown callback for all roomConfigs, plugins and renderers.
							switch(event.keyCode){
								case 9:
								case 13:{
									chatApi.focusOnChat();
									event.preventDefault();
									break;
								}
								case 27:{
									if (rendererParams)
										rendererParams.paintGame = (!!room.gameState) && (!rendererParams.paintGame);
									updateGUI();
									event.preventDefault();
									break;
								}
								case 80:{
									room.pauseGame();
									event.preventDefault();
									break;
								}
								default:
									keyHandler.pressKey(event.code);
							}
						};
						window.onKeyUp = function(event){
							//room._onKeyUp(event); // This triggers the onKeyUp callback for all roomConfigs, plugins and renderers.
							keyHandler.releaseKey(event.code);
						};
						window.onContextMenu = function(event){
							event.preventDefault();
							var pId = API.Query.getDiscAtMapCoord(room.state, mapCoord)?.playerId;
							const id = (pId==null) ? -1 : pId;
							room.renderer.followPlayerId = id;
							room.currentPlayerId = id;
						};
						window.document.addEventListener("focusout", keyHandler.reset);
						window.document.addEventListener("keyup", window.onKeyUp);
						window.document.addEventListener("keydown", window.onKeyDown);
						if ("ontouchstart" in document.documentElement){
							canvas.addEventListener("touchstart", window.onTouchStart);
							canvas.addEventListener("touchmove", window.onTouchMove);
							canvas.addEventListener("touchend", window.onTouchEnd);
							window.onTouchStart = function(event){
								room._onTouchStart(event);
							};
							window.onTouchMove = function(event){
								room._onTouchMove(event);
							};
							window.onTouchEnd = function(event){
								room._onTouchEnd(event);
							};
						}
						else{
							window.onMouseDown = function(event){
								room._onMouseDown(event);
							};
							window.onMouseUp = function(event){
								room._onMouseUp(event);
							};
							window.onMouseMove = function(event){
								room._onMouseMove(event);
								if (room?.renderer)
									mapCoord = room.renderer.transformPixelCoordToMapCoord(event.offsetX, event.offsetY);
							};
							window.onWheel = function(event){
								room._onWheel(event);
							};
							canvas.addEventListener("mousedown", window.onMouseDown);
							canvas.addEventListener("mouseup", window.onMouseUp);
							canvas.addEventListener("mousemove", window.onMouseMove);
							canvas.addEventListener("wheel", window.onWheel);
						}
						canvas.addEventListener("contextmenu", window.onContextMenu);
						window.onRoomLeave = function(){
							window.onbeforeunload = null;
							window.document.removeEventListener("focusout", keyHandler.reset);
							window.document.removeEventListener("keyup", window.onKeyUp);
							window.document.removeEventListener("keydown", window.onKeyDown);
							if ("ontouchstart" in document.documentElement){
								canvas.removeEventListener("touchstart", window.onTouchStart);
								canvas.removeEventListener("touchmove", window.onTouchMove);
								canvas.removeEventListener("touchend", window.onTouchEnd);
							}
							else{
								canvas.removeEventListener("mousedown", window.onMouseDown);
								canvas.removeEventListener("mouseup", window.onMouseUp);
								canvas.removeEventListener("mousemove", window.onMouseMove);
								canvas.removeEventListener("wheel", window.onWheel);
							}
							canvas.removeEventListener("contextmenu", window.onContextMenu);
							room.leave();
							window.close();
						};
						Promise.all([sound.loadSound("./sounds/chat.ogg"), sound.loadSound("./sounds/crowd.ogg"), sound.loadSound("./sounds/goal.ogg"), sound.loadSound("./sounds/highlight.wav"), sound.loadSound("./sounds/join.ogg"), sound.loadSound("./sounds/kick.ogg"), sound.loadSound("./sounds/leave.ogg")]).then((sounds)=>{
							sound.chat = sounds[0];
							sound.crowd = sounds[1];
							sound.goal = sounds[2];
							sound.highlight = sounds[3];
							sound.join = sounds[4];
							sound.kick = sounds[5];
							sound.leave = sounds[6];
						}, (err)=>{
							console.log(err);
							alert("Error loading sounds. Look at console for error details.");
						});
					}
					var counter = 0;
					importRenderers(["sandboxRenderer"], ()=>{
						function onRequestAnimationFrame(){
							if (!room?.gameState)
								return;
							counter++;
							if (counter>gameStateGUIUpdateFrameInterval){
								counter=0;
								updateGameStateGUI(room.gameState);
							}
						}
						rendererParams = { canvas, images: { grass, concrete, concrete2, typing }, paintGame: true, onRequestAnimationFrame };
						var renderer = new renderers.sandboxRenderer(API, rendererParams);
						renderer.followMode = true;
						renderer.restrictCameraOrigin = true;
						renderer.showInvisibleSegments = false;
						renderer.showInvisibleJoints = false;
						renderer.showPlanes = false;
						renderer.showGoals = false;
						renderer.showVertices = false;
						renderer.showSpawnPoints = false;
						wrapper.Room.create(p1, { ...p2, renderer, preInit, onOpen });
					});
				}, (err)=>{
					console.log(err);
					alert("Error loading images. Look at console for error details.");
				});
			}
		}
	};
}
