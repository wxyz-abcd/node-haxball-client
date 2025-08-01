var API = sandboxRoomWrapper();
const { OperationType, VariableType, ConnectionState, AllowFlags, CollisionFlags, Callback, Utils, Room, Replay, Query, RoomConfig, Plugin, Renderer, Errors, Language, Impl } = API;
importAll({
	roomConfigs: ["CMD_extendedConfig"],
	libraries: ["commands", "permissions"],
	plugins: ["balanceTeams", "modifyPlayerData", "CMD_controlOtherPlayers", "CMD_eventPermissions", "CMD_messaging", "CMD_accounts", "CMD_modifyPlayerInput", "CMD_afk", "CMD_autoPlay_mixed_inmemory_multiple", "CMD_breakConnection", "CMD_speedHack", "CMD_chess", "CMD_sokoban"],
}, () => {
  var prm = new libraries.permissions(API);
	API.Room.create({
    name: "chess", 
    password: null, 
    noPlayer: false,
    showInRoomList: true, 
    playerCount: 27,
    maxPlayerCount: 10,
    unlimitedPlayerCount: true,
    //fakePassword: false,
    geo: { /*lat: 11, lon: 11,*/ flag: "au" },
    token: "sandbox" 
	},{
		storage: {
      crappy_router: false,
      player_name: "abc_bodd",
      geo: {
        lat: 41.021999,
        lon: 28.971162,
        flag: "au"
      },
      avatar: "👾"
		},
		libraries: [new libraries.commands(API), prm],
		config: new roomConfigs.CMD_extendedConfig(API),
		//renderer: ... // renderer is auto-configured by the sandbox room wrapper.
		plugins: [/*new plugins.balanceTeams(API),*/ new plugins.modifyPlayerData(API), new plugins.CMD_accounts(API), new plugins.CMD_afk(API), new plugins.CMD_autoPlay_mixed_inmemory_multiple(API), new plugins.CMD_breakConnection(API), new plugins.CMD_controlOtherPlayers(API), new plugins.CMD_eventPermissions(API), new plugins.CMD_messaging(API), new plugins.CMD_modifyPlayerInput(API), new plugins.CMD_speedHack(API)/*, new plugins.CMD_chess(API), new plugins.CMD_sokoban(API)*/],
    onOpen: (room)=>{
      room.mixConfig({
        onRoomLink: (roomLink, customData)=>{
          console.log("room link:", roomLink);
        },
        onPlayerJoin: (playerObj, customData) => {
          var {id, auth} = playerObj;
          console.log("Player joined : ", auth);
          room.setPlayerAdmin(id, true);
          if (auth=="jvkjiKo9XgPXfaBwIJk7WTIIPl1PbswilcIKkhdI6bw"){
            prm.allContexts.forEach((ctx)=>{
              for (var i=0;i<ctx.permissions.length;i++)
                if (!ctx.permissions[i].defaultValue)
                  ctx.addPlayerPermission(id, i);
            });
          }
        }
      });
      room.setPlayerAdmin(0, true);
      room.hostPing = 1987987987;
      room.setPlayerTeam(0, 1)
      //room.addAuthBan(null);
      room.setTimeLimit(0);
      room.setScoreLimit(0);
      room.startGame();
    },
    onClose: (x)=>{
      if (x?.code==Errors.ErrorCodes.MissingRecaptchaCallbackError)
        console.log("Recaptcha requested.");
      else
        console.log("Bot has left the room: "+x?.toString());
    }
	});
});