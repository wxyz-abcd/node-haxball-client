function sandboxWrapper(API){
  const defaultGeo = {
    "lat": 40,
    "lon": 40,
    "flag": "tr"
  };
  var callbacks = "PlayerObjectCreated|PlayerDiscCreated|PlayerDiscDestroyed|RoomLink|PlayerBallKick|TeamGoal|GameEnd|GameTick|PlayerSyncChange|Announcement|KickOff|AutoTeams|ScoreLimitChange|TimeLimitChange|PlayerAdminChange|PlayerAvatarChange|PlayerHeadlessAvatarChange|PlayersOrderChange|PlayerTeamChange|StadiumChange|TeamColorsChange|TeamsLockChange|PlayerJoin|GamePauseChange|PlayerChat|PlayerInputChange|PlayerChatIndicatorChange|PlayerLeave|SetDiscProperties|KickRateLimitChange|GameStart|GameStop|PingData|PingChange|CollisionDiscVsDisc|CollisionDiscVsSegment|CollisionDiscVsPlane|CollisionDiscVsVertex|ModifyJoint|TimeIsUp|PositionsReset|BansClear|BanClear|HandicapChange|RoomRecaptchaModeChange|RoomTokenChange|RoomRecordingChange|RoomPropertiesChange|CustomEvent|BinaryCustomEvent|IdentityEvent|PluginActiveChange|ConfigUpdate|RendererUpdate|PluginUpdate|LibraryUpdate|LanguageChange|VariableValueChange".split("|");
  function BanList(){
    this.addPlayer = function(){};
    this.addIp = function(){};
    this.addAuth = function(){};
    this.getList = function(){};
    this.clear = function(){};
    this.remove = function(){};
    this.removePlayer = function(){};
  }
  return {
		Callback: {
			add: (name)=>{
				var idx = callbacks.indexOf(name);
				if (idx>=0)
					return;
				callbacks.push(name);
			},
			remove: (name)=>{
				var idx = callbacks.indexOf(name);
				if (idx<0)
					return;
				callbacks.splice(idx, 1);
			}
		},
    Room: {
      create: (createParams, commonParams)=>{ // unused: createParams.onError, commonParams.onConnInfo
        var storage = commonParams.storage||{};
        storage.crappyRouter = storage.crappy_router||false;
        storage.playerName = storage.player_name||"abc";
        storage.avatar = storage.avatar||null;
        storage.geo = API.Utils.parseGeo(storage.geo||defaultGeo, defaultGeo);

        var room = {
          isHost: true,
          hostPing: 0,
          renderer: commonParams.renderer,
          libraries: commonParams.libraries || [],
          plugins: commonParams.plugins || [],
          config: commonParams.config || {},
        };

        room.librariesMap = room.libraries.reduce((map, obj)=>{
          map[obj.name] = obj;
          return map;
        }, {});
        room.pluginsMap = room.plugins.reduce((map, obj)=>{
          map[obj.name] = obj;
          return map;
        }, {});

        var roomId = "sandbox", token = createParams.token, recaptchaRequired = false, banList = new BanList(), sync = false, keyState = 0, initialized = false;
        var password = (createParams.password=="") ? null : createParams.password, noPlayer = !!createParams.noPlayer, geo = API.Utils.parseGeo(createParams.geo, storage.geo, false), maxClientCount = (createParams.maxPlayerCount|0) - (noPlayer?0:1), fakePassword = (createParams.fakePassword!=null)?(!!createParams.fakePassword):null, fakePlayerCount = createParams.playerCount, showInRoomList = !!createParams.showInRoomList, unlimitedPlayerCount = !!createParams.unlimitedPlayerCount;
        var cfg = room.config, renderer = room.renderer, activePlugins = room.plugins.filter((obj)=>obj.active);
        var sendPingInterval = setInterval(()=>sandbox.applyEvent(API.EventFactory.ping(sandbox.state.players.map((player)=>player.id==0?room.hostPing:(200*Math.random())|0))), 3000);

        function movePlayersToTeam(fPlayerFilter, teamId=0){
          sandbox.state.players.slice().forEach((player)=>{
            if (!fPlayerFilter(player))
              return;
            sandbox.applyEvent(API.EventFactory.setPlayerTeam(player.id, teamId));
          });
        }

        function addInOrder(arr, arr2, obj){ // arr is an array, arr2 is the same array with some elements removed, obj is one of the removed elements. objective is to always add the same element back in the same index.
          var i=0, j=0;
          while(i<arr.length && j<arr2.length){
            while (i<arr.length && j<arr2.length && arr[i]==arr2[j] && arr[i]!=obj){
              i++;
              j++;
            }
            if (arr[i]==obj)
              break;
            while (i<arr.length && j<arr2.length && arr[i]!=arr2[j] && arr[i]!=obj)
              i++;
            if (arr[i]==obj)
              break;
          }
          if (arr2[j]!=obj)
            arr2.splice(j, 0, obj);
        }

        function finalizeRoom(err){
          clearInterval(sendPingInterval);
          room.plugins.forEach((obj)=>{
            obj.finalize?.();
            obj.room = null;
          });
          if (room.renderer){
            room.renderer.finalize?.();
            room.renderer.room = null;
          }
          room.config.finalize?.();
          room.config.room = null;
          room.libraries.forEach((obj)=>{
            obj.finalize?.();
            obj.room = null;
          });
          sandbox.destroy();
          commonParams.onClose?.(err);
        }

        var sandbox = API.Room.sandbox({
          filterEvents: (event)=>(!initialized)?true:room._onOperationReceived(event.eventType, event, sandbox.currentFrameNo, null),
          onAnnouncement: (...args)=>room._onAnnouncement(...args),
          onPlayerObjectCreated: (...args)=>room._onPlayerObjectCreated(...args),
          onPlayerDiscCreated: (...args)=>room._onPlayerDiscCreated(...args),
          onPlayerDiscDestroyed: (...args)=>room._onPlayerDiscDestroyed(...args),
          onPlayerBallKick: (...args)=>room._onPlayerBallKick(...args),
          onTeamGoal: (...args)=>room._onTeamGoal(...args),
          onGameEnd: (...args)=>room._onGameEnd(...args),
          onGameTick: (...args)=>room._onGameTick(...args),
          onPlayerSyncChange: (...args)=>room._onPlayerSyncChange(...args),
          onKickOff: (...args)=>room._onKickOff(...args),
          onAutoTeams: (...args)=>room._onAutoTeams(...args),
          onScoreLimitChange: (...args)=>room._onScoreLimitChange(...args),
          onTimeLimitChange: (...args)=>room._onTimeLimitChange(...args),
          onPlayerAdminChange: (...args)=>room._onPlayerAdminChange(...args),
          onPlayerAvatarChange: (...args)=>room._onPlayerAvatarChange(...args),
          onPlayerHeadlessAvatarChange: (...args)=>room._onPlayerHeadlessAvatarChange(...args),
          onPlayersOrderChange: (...args)=>room._onPlayersOrderChange(...args),
          onPlayerTeamChange: (...args)=>room._onPlayerTeamChange(...args),
          onStadiumChange: (...args)=>room._onStadiumChange(...args),
          onTeamColorsChange: (...args)=>room._onTeamColorsChange(...args),
          onTeamsLockChange: (...args)=>room._onTeamsLockChange(...args),
          onPlayerJoin: (...args)=>room._onPlayerJoin(...args),
          onGamePauseChange: (...args)=>room._onGamePauseChange(...args),
          onPlayerChat: (...args)=>room._onPlayerChat(...args),
          onRoomRecordingChange: (...args)=>room._onRoomRecordingChange(...args),
          onPlayerInputChange: (id, input)=>{
            if (id==sandbox.controlledPlayerId)
              keyState = input;
            room._onPlayerInputChange(id, input);
          },
          onPlayerChatIndicatorChange: (...args)=>room._onPlayerChatIndicatorChange(...args),
          onPlayerLeave: (...args)=>room._onPlayerLeave(...args),
          onSetDiscProperties: (...args)=>room._onSetDiscProperties(...args),
          onKickRateLimitChange: (...args)=>room._onKickRateLimitChange(...args),
          onGameStart: (...args)=>room._onGameStart(...args),
          onGameStop: (...args)=>room._onGameStop(...args),
          onPingData: (...args)=>room._onPingData(...args),
          onCollisionDiscVsDisc: (...args)=>room._onCollisionDiscVsDisc(...args),
          onCollisionDiscVsSegment: (...args)=>room._onCollisionDiscVsSegment(...args),
          onCollisionDiscVsPlane: (...args)=>room._onCollisionDiscVsPlane(...args),
          onCollisionDiscVsVertex: (...args)=>room._onCollisionDiscVsVertex(...args),
          onModifyJoint: (...args)=>room._onModifyJoint(...args),
          onTimeIsUp: (...args)=>room._onTimeIsUp(...args),
          onPositionsReset: (...args)=>room._onPositionsReset(...args),
          onRoomPropertiesChange: (...args)=>room._onRoomPropertiesChange(...args),
          onCustomEvent: (...args)=>room._onCustomEvent(...args),
          onBinaryCustomEvent: (...args)=>room._onBinaryCustomEvent(...args),
          onIdentityEvent: (...args)=>room._onIdentityEvent(...args),
          render: ()=>renderer?.render(),
        }, {controlledPlayerId: 0, delayedInit: true});
        
        sandbox.state.name = createParams.name;
				sandbox.controlledPlayerId = 0;
    
        room.setConfig = function(newCfg){
          var oldCfg = cfg;
          oldCfg.finalize?.();
          oldCfg.room = null;
          newCfg = newCfg || {};
          newCfg.room = room;
          newCfg.initialize?.();
          cfg = room.config = newCfg;
          room._onConfigUpdate?.(oldCfg, newCfg);
        };
    
        room.mixConfig = function(newCfg){
          Object.keys(newCfg).forEach((key)=>{
            var f2 = newCfg[key];
            if (typeof f2=="function"){
              var f1 = cfg[key];
              if (!f1)
                cfg[key] = f2;
              else if (typeof f1=="function"){
                cfg[key] = function(...args){
                  f1(...args);
                  f2(...args);
                };
              }
            }
          });
        };
    
        room.setRenderer = function(newRenderer){
          var oldRenderer = renderer;
          if (oldRenderer){
            oldRenderer.finalize?.();
            oldRenderer.room = null;
          }
          if (newRenderer){
            newRenderer.room = room;
            newRenderer.initialize?.();
          }
          renderer = room.renderer = newRenderer;
          room._onRendererUpdate?.(oldRenderer, newRenderer);
        };

        room.updatePlugin = function(pluginIndex, newPluginObj){
          var oldPluginObj = room.plugins[pluginIndex];
          if (!oldPluginObj)
            throw API.Errors.ErrorCodes.PluginNotFoundError; // "Plugin not found at index " + pluginIndex
          var {name, active} = oldPluginObj;
          if (name!=newPluginObj.name)
            throw API.Errors.ErrorCodes.PluginNameChangeNotAllowedError; // "Plugin name should not change"
          if (active)
            room.setPluginActive(name, false);
          oldPluginObj.finalize?.();
          oldPluginObj.room = null;
          room.plugins[pluginIndex] = newPluginObj;
          room.pluginsMap[name] = newPluginObj;
          newPluginObj.room = room;
          newPluginObj.initialize?.();
          room._onPluginUpdate?.(oldPluginObj, newPluginObj);
          if (active){
            newPluginObj.active = false; // to force-trigger plugin activation event
            room.setPluginActive(name, true);
          }
        };

        room.updateLibrary = function(libraryIndex, newLibraryObj){
          var oldLibraryObj = room.libraries[libraryIndex];
          if (!oldLibraryObj)
            throw API.Errors.ErrorCodes.LibraryNotFoundError; // "Library not found at index " + libraryIndex
          var {name} = oldLibraryObj;
          if (name != newLibraryObj.name) // library name should not change, otherwise some bugs are possible.
            throw API.Errors.ErrorCodes.LibraryNameChangeNotAllowedError; // "Library name should not change"
          oldLibraryObj.finalize?.();
          oldLibraryObj.room = null;
          room.libraries[libraryIndex] = newLibraryObj;
          room.librariesMap[name] = newLibraryObj;
          newLibraryObj.room = this;
          newLibraryObj.initialize?.();
          room._onLibraryUpdate?.(oldLibraryObj, newLibraryObj);
        };
    
        room.setPluginActive = function(name, active){
          var obj = room.plugins.filter((x)=>x.name==name)[0], idx;
          if (!obj || obj.active==active)
            return;
          if (!active){
            idx = activePlugins.findIndex((x)=>x.name==name);
            if (idx<0)
              return;
            obj.active = active;
            room._onPluginActiveChange?.(obj);
            activePlugins.splice(idx, 1);
          }
          else{
            idx = activePlugins.findIndex((x)=>x.name==name);
            if (idx>=0)
              return;
            //activePlugins.splice(oIdx, 0, obj); // might change the order of plugins, therefore we have to implement addInOrder.
            addInOrder(room.plugins, activePlugins, obj); // insert plugin to its old index. 
            obj.active = active;
            room._onPluginActiveChange?.(obj);
          }
        };
    
        function defineCfgProperty(name){
          Object.defineProperty(room, name, {
            get(){
              return cfg[name];
            },
            set(value){
              cfg[name] = value;
            }
          });
        }
    
        function defineCfgModifierCallback(name){
          defineCfgProperty(name+"Before");
          defineCfgProperty(name);
          defineCfgProperty(name+"After");
        }
        
        room._modifyPlayerData = async(playerId, name, flag, avatar, conn, auth)=>{
          var vals = [name, flag, avatar], customData, val;
          if (cfg.modifyPlayerDataBefore){
            val = cfg.modifyPlayerDataBefore(playerId, vals[0], vals[1], vals[2], conn, auth);
            if (val instanceof Promise)
              val = await val;
            [vals, customData] = val;
          }
          if (customData!==false){
            for (var i=0;i<activePlugins.length;i++){
              var p = activePlugins[i];
              if (p.modifyPlayerData && vals){
                vals = p.modifyPlayerData(playerId, vals[0], vals[1], vals[2], conn, auth, customData);
                if (vals instanceof Promise)
                  vals = await vals;
              }
            }
            if (cfg.modifyPlayerData && vals){
              vals = cfg.modifyPlayerData(playerId, vals[0], vals[1], vals[2], conn, auth, customData);
              if (vals instanceof Promise)
                vals = await vals;
            }
            if (cfg.modifyPlayerDataAfter && vals){
              vals = cfg.modifyPlayerDataAfter(playerId, vals[0], vals[1], vals[2], conn, auth, customData);
              if (vals instanceof Promise)
                vals = await vals;
            }
          }
          return vals;
        };
        defineCfgModifierCallback("modifyPlayerData");
    
        room._modifyPlayerPing = function(playerId, ping){
          var customData;
          if (cfg.modifyPlayerPingBefore)
            [ping, customData] = cfg.modifyPlayerPingBefore(playerId, ping);
          if (customData!==false){
            activePlugins.forEach((p)=>{
              if (p.modifyPlayerPing)
                ping = p.modifyPlayerPing(playerId, ping, customData);
            });
            if (cfg.modifyPlayerPing)
              ping = cfg.modifyPlayerPing(playerId, ping, customData);
            if (cfg.modifyPlayerPingAfter)
              ping = cfg.modifyPlayerPingAfter(playerId, ping, customData);
          }
          return ping;
        };
        defineCfgModifierCallback("modifyPlayerPing");
    
        room._modifyClientPing = function(ping){
          var customData;
          if (cfg.modifyClientPingBefore)
            [ping, customData] = cfg.modifyClientPingBefore(ping);
          if (customData!==false){
            activePlugins.forEach((p)=>{
              if (p.modifyClientPing)
                ping = p.modifyClientPing(ping, customData);
            });
            if (cfg.modifyClientPing)
              ping = cfg.modifyClientPing(ping, customData);
            if (cfg.modifyClientPingAfter)
              ping = cfg.modifyClientPingAfter(ping, customData);
          }
          return ping;
        };
        defineCfgModifierCallback("modifyClientPing");

        room._onOperationReceived = function(type, msg, globalFrameNo, clientFrameNo){
          var customData = cfg.onBeforeOperationReceived?.(type, msg, globalFrameNo, clientFrameNo), ret = (customData!==false), f;
          activePlugins.forEach((p)=>{
            f = p.onOperationReceived;
            if (ret && f && !f(type, msg, globalFrameNo, clientFrameNo, customData))
              ret = false;
          });
          f = cfg.onOperationReceived;
          if (ret && f && !f(type, msg, globalFrameNo, clientFrameNo, customData))
            ret = false;
          f = cfg.onAfterOperationReceived;
          if (ret && f && !f(type, msg, globalFrameNo, clientFrameNo, customData))
            ret = false;
          return ret;
        };
        defineCfgProperty("onBeforeOperationReceived");
        defineCfgProperty("onOperationReceived");
        defineCfgProperty("onAfterOperationReceived");
    
        var createEventCallback = function(eventName){
          room["_on" + eventName] = function(...params){
            var customData = cfg["onBefore"+eventName]?.(...params);
            if (customData!==false){
              activePlugins.forEach((p)=>{
                p["on"+eventName]?.(...params, customData);
              });
              cfg["on"+eventName]?.(...params, customData);
              renderer?.["on"+eventName]?.(...params, customData);
              cfg["onAfter"+eventName]?.(...params, customData);
            }
          };
          defineCfgProperty("onBefore"+eventName);
          defineCfgProperty("on"+eventName);
          defineCfgProperty("onAfter"+eventName);
        };
        callbacks.forEach(createEventCallback);

        Object.defineProperties(room, {
          sdp: {
            get: ()=>null
          },
          currentPlayerId: {
            get: ()=>sandbox.controlledPlayerId,
						set: (value)=>{sandbox.controlledPlayerId = value}
          },
          currentPlayer: {
            get: ()=>sandbox.state.getPlayer(sandbox.controlledPlayerId)
          },
          state: {
            get: ()=>sandbox.state
          },
          stateExt: {
            get: ()=>sandbox.state?.ext
          },
          gameState: {
            get: ()=>sandbox.state?.gameState
          },
          gameStateExt: {
            get: ()=>sandbox.state?.gameState?.ext
          },
          currentFrameNo: {
            get: ()=>sandbox.currentFrameNo
          },
          banList: {
            get: ()=>banList.getList()
          },
          token: {
            get: ()=>token,
            set: (value)=>{
              token = value;
              _setTimeout(()=>{
                room._onRoomLink?.(room.link);
                room._onRoomTokenChange?.(token);
              }, 20000);
            }
          },
          requireRecaptcha: {
            get: ()=>recaptchaRequired,
            set: (value)=>{
              recaptchaRequired = value;
              _onRoomRecaptchaModeChange?.(value);
            }
          },
          name: {
            get: ()=>sandbox.state.name
          },
          password: {
            get: ()=>password
          },
          geo: {
            get: ()=>geo
          },
          maxPlayerCount: {
            get: ()=>(maxClientCount+(noPlayer?0:1))
          },
          fakePassword: {
            get: ()=>fakePassword
          },
          fixedPlayerCount: {
            get: ()=>fakePlayerCount
          },
          showInRoomList: {
            get: ()=>showInRoomList
          },
          unlimitedPlayerCount: {
            get: ()=>unlimitedPlayerCount
          },
          link: {
            get: ()=>"https://www.haxball.com/?c="+roomId+(password!=null?"&p=1":"")
          },
          timeLimit: {
            get: ()=>sandbox.state.timeLimit
          },
          scoreLimit: {
            get: ()=>sandbox.state.scoreLimit
          },
          redScore: {
            get: ()=>{ var gameState = sandbox.state.gameState; return (gameState?.ext || gameState)?.redScore; }
          },
          blueScore: {
            get: ()=>{ var gameState = sandbox.state.gameState; return (gameState?.ext || gameState)?.blueScore; }
          },
          timeElapsed: {
            get: ()=>{ var gameState = sandbox.state.gameState; return (gameState?.ext || gameState)?.timeElapsed; }
          },
          stadium: {
            get: ()=>sandbox.state.stadium
          },
          players: {
            get: ()=>sandbox.state.players
          }
        });

        Object.assign(room, {
          setProperties: function(properties){
            if (!properties)
              return;
            var props = {};
            if (properties.hasOwnProperty("name"))
              props.name = sandbox.state.name = properties.name||"";
            if (properties.hasOwnProperty("password"))
              props.password = password = properties.password;
            if (properties.hasOwnProperty("fakePassword"))
              props.fakePassword = fakePassword = properties.fakePassword;
            if (properties.hasOwnProperty("geo")){
              props.geo = properties.geo;
              geo = API.Utils.parseGeo(properties.geo, geo, false);
              if (!noPlayer)
                sandbox.state.getPlayer(0).flag = geo.flag;
            }
            if (properties.hasOwnProperty("unlimitedPlayerCount"))
              props.unlimitedPlayerCount = unlimitedPlayerCount = !!properties.unlimitedPlayerCount;
            if (properties.hasOwnProperty("showInRoomList"))
              props.showInRoomList = showInRoomList = !!properties.showInRoomList;
            if (properties.hasOwnProperty("playerCount"))
              props.playerCount = fakePlayerCount = properties.playerCount;
            if (properties.hasOwnProperty("maxPlayerCount"))
              props.maxPlayerCount = maxClientCount = (properties.maxPlayerCount==null)?null:(properties.maxPlayerCount-(noPlayer?0:1));
            room._onRoomPropertiesChange?.(props);
          },
          sendCustomEvent: (type, data, targetId)=>sandbox.sendCustomEvent(type, data, sandbox.controlledPlayerId),
          sendBinaryCustomEvent: (id, data, targetId)=>sandbox.sendBinaryCustomEvent(type, data, sandbox.controlledPlayerId),
          setPlayerIdentity: (id, data, targetId)=>sandbox.setPlayerIdentity(id, data, sandbox.controlledPlayerId),
          setHandicap: (handicap)=>room._onHandicapChange?.(handicap),
          setSync: (val)=>{ // ko
            if (val==sync)
              return;
            sync = val;
            sandbox.setPlayerSync(val, sandbox.controlledPlayerId);
          },
          clearBan: (playerId)=>(banList.removePlayer(playerId) && room._onBanClear?.(playerId)),
          clearBans: ()=>(banList.clear() && room._onBansClear?.()),
          addPlayerBan: (playerId)=>banList.addPlayer(sandbox.state.getPlayer(playerId)),
          addIpBan: (...values)=>banList.addIp(...values),
          addAuthBan: (...values)=>banList.addAuth(...values),
          removeBan: (banId)=>banList.remove(banId),
          changeTeam: (teamId)=>sandbox.setPlayerTeam(sandbox.controlledPlayerId, teamId, sandbox.controlledPlayerId),
          resetTeam: (teamId)=>movePlayersToTeam((player)=>player.team.id==teamId),
          resetTeams: ()=>movePlayersToTeam((player)=>player.team.id!=0),
          randTeams: ()=>{
            var {red, blue} = API.Impl.Core.Team, spectators = [], redCount = 0, blueCount = 0, moveRandomSpectatorToTeam = (team)=>sandbox.setPlayerTeam(spectators.splice((Math.random()*spectators.length)|0, 1)[0], team.id, sandbox.controlledPlayerId);
            sandbox.state.players.forEach((player)=>{
              if (player.team==red)
                redCount++;
              else if (player.team==blue)
                blueCount++;
              else
                spectators.push(player.id);
            });
            if (spectators.length==0)
              return;
            if (spectators.length==1){
              moveRandomSpectatorToTeam((Math.random()<0.5)?red:blue);
              return;
            }
            if (blueCount==redCount){
              moveRandomSpectatorToTeam(red);
              moveRandomSpectatorToTeam(blue);
              return;
            }
            moveRandomSpectatorToTeam((blueCount>redCount)?red:blue);
          },
          sendChat: (chat, targetId)=>sandbox.playerChat(chat, sandbox.controlledPlayerId),
          sendChatIndicator: (active)=>sandbox.setPlayerChatIndicator(active, sandbox.controlledPlayerId),
          sendAnnouncement: (announcement, targetId, color=-1, style="", sound=1)=>sandbox.sendAnnouncement(announcement, color, {"bold": 1, "italic": 2, "small": 3, "small-bold": 4, "small-italic": 5}[style]||0, sound, null, sandbox.controlledPlayerId),
          setDiscProperties: (discId, properties)=>sandbox.setDiscProperties(discId, 0, properties, sandbox.controlledPlayerId),
          setPlayerDiscProperties: (playerId, properties)=>sandbox.setDiscProperties(playerId, 1, properties, sandbox.controlledPlayerId),
          reorderPlayers: (playerIdList, moveToTop)=>sandbox.reorderPlayers(playerIdList, moveToTop, sandbox.controlledPlayerId),
          extrapolate: (extrapolationMS, ignoreMultipleCalls=false)=>(ignoreMultipleCalls ? sandbox.extrapolate(extrapolationMS) : (sandbox.state.ext || sandbox.extrapolate(extrapolationMS))),
          startGame: ()=>sandbox.startGame(sandbox.controlledPlayerId),
          stopGame: ()=>sandbox.stopGame(sandbox.controlledPlayerId),
          pauseGame: ()=>(sandbox.state.gameState && sandbox.setGamePaused(sandbox.state.gameState.pauseGameTickCounter!=120, sandbox.controlledPlayerId)),
          autoTeams: ()=>sandbox.autoTeams(sandbox.controlledPlayerId),
          lockTeams: ()=>sandbox.setTeamsLock(!sandbox.state.teamsLocked, sandbox.controlledPlayerId),
          isGamePaused: ()=>(sandbox.state.gameState?.pauseGameTickCounter==120),
          leave: ()=>finalizeRoom(),
          setCurrentStadium: (stadium)=>sandbox.setCurrentStadium(stadium, sandbox.controlledPlayerId),
          setTimeLimit: (value)=>sandbox.setTimeLimit(value, sandbox.controlledPlayerId),
          setScoreLimit: (value)=>sandbox.setScoreLimit(value, sandbox.controlledPlayerId),
          setPlayerTeam: (playerId, teamId)=>sandbox.setPlayerTeam(playerId, teamId, sandbox.controlledPlayerId),
          setPlayerAdmin: (playerId, isAdmin)=>sandbox.setPlayerAdmin(playerId, isAdmin, sandbox.controlledPlayerId),
          kickPlayer: (playerId, reason, isBanning)=>sandbox.kickPlayer(playerId, reason, isBanning, sandbox.controlledPlayerId),
          setAvatar: (avatar)=>sandbox.setPlayerAvatar(false, avatar, sandbox.controlledPlayerId),
          setPlayerAvatar: (id, value, headless)=>sandbox.setPlayerAvatar(headless, value, id),
          setChatIndicatorActive: (active)=>sandbox.setPlayerChatIndicator(active, sandbox.controlledPlayerId),
          setTeamColors: (teamId, angle, ...colors)=>sandbox.setTeamColors(teamId, angle, colors, sandbox.controlledPlayerId),
          setUnlimitedPlayerCount: (on)=>(unlimitedPlayerCount=on),
          setFakePassword: (on)=>(fakePassword=on),
          getPlayer: (id)=>sandbox.state.getPlayer(id),
          getBall: (extrapolated=false)=>((extrapolated ? (sandbox.state.gameState?.ext||sandbox.state.gameState) : sandbox.state.gameState)?.physicsState.discs[0]),
          getDiscs: (extrapolated=false)=>((extrapolated ? (sandbox.state.gameState?.ext||sandbox.state.gameState) : sandbox.state.gameState)?.physicsState.discs),
          getDisc: (discId, extrapolated=false)=>((extrapolated ? (sandbox.state.gameState?.ext||sandbox.state.gameState) : sandbox.state.gameState)?.physicsState.discs[discId]),
          getPlayerDisc: (playerId, extrapolated=false)=>{
            var allDiscs = room.getDiscs(extrapolated);
            for (var i=sandbox.state.stadium.discs.length;i<allDiscs.length;i++)
              if (allDiscs[i].playerId==playerId)
                return allDiscs[i];
          },
          getPlayerDisc_exp: (playerId)=>sandbox.state.getPlayer(playerId)?.disc,
          startRecording: ()=>sandbox.startRecording(),
          stopRecording: ()=>sandbox.stopRecording(),
          isRecording: ()=>sandbox.isRecording(),
          startStreaming: ()=>{}, // unnecessary
          stopStreaming: ()=>{}, // unnecessary
          takeSnapshot: ()=>{
						var obj = {
							state: sandbox.takeSnapshot(),
							renderer: room.renderer.takeSnapshot?.(),
							libraries: {},
							plugins: {},
							config: room.config.takeSnapshot?.(),
						};
						room.libraries.forEach((library)=>obj.libraries[library.name] = library.takeSnapshot?.())
						room.plugins.forEach((plugin)=>obj.plugins[plugin.name] = plugin.takeSnapshot?.())
						return obj;
					},
          useSnapshot: (snapshot)=>{
						sandbox.useSnapshot(snapshot.state);
						room.renderer.useSnapshot?.(snapshot.renderer);
						room.config.useSnapshot?.(snapshot.config);
						room.libraries.forEach((library)=>library.useSnapshot?.(snapshot.libraries[library.name]))
						room.plugins.forEach((plugin)=>plugin.useSnapshot?.(snapshot.plugins[plugin.name]))
					},
          setSimulationSpeed: (speed)=>sandbox.setSimulationSpeed(speed),
          runSteps: (steps)=>sandbox.runSteps(steps),
          exportStadium: ()=>sandbox.state.exportStadium(),
          getKeyState: ()=>keyState,
          setKeyState: (state)=>sandbox.playerInput(state, sandbox.controlledPlayerId),
          fakePlayerJoin: (id, name, flag, avatar, conn, auth)=>sandbox.playerJoin(id, name, flag, avatar, conn, auth),
          fakePlayerLeave: (playerId)=>{
            var player = sandbox.state.getPlayer(playerId);
            if (!player)
              return;
            sandbox.playerLeave(playerId);
            return {
              id: player.id, 
              name: player.name, 
              flag: player.flag, 
              avatar: player.avatar, 
              conn: player.conn, 
              auth: player.auth
            };
          },
          fakeSendPlayerInput: (input, byId)=>sandbox.playerInput(input, byId),
          fakeSendPlayerChat: (msg, byId)=>sandbox.playerChat(msg, byId),
          fakeSetPlayerChatIndicator: (value, byId)=>sandbox.setPlayerChatIndicator(value, byId),
          fakeSetPlayerAvatar: (value, byId)=>sandbox.setPlayerAvatar(false, value, byId),
          fakeSetStadium: (value, byId)=>sandbox.setCurrentStadium(value, byId),
          fakeStartGame: (byId)=>sandbox.startGame(byId),
          fakeStopGame: (byId)=>sandbox.stopGame(byId),
          fakeSetGamePaused: (value, byId)=>sandbox.setGamePaused(value, byId),
          fakeSetScoreLimit: (value, byId)=>sandbox.setScoreLimit(value, byId),
          fakeSetTimeLimit: (value, byId)=>sandbox.setTimeLimit(value, byId),
          fakeSetTeamsLock: (value, byId)=>sandbox.setTeamsLock(value, byId),
          fakeAutoTeams: (byId)=>sandbox.autoTeams(byId),
          fakeSetPlayerTeam: (playerId, teamId, byId)=>sandbox.setPlayerTeam(playerId, teamId, byId),
          fakeSetKickRateLimit: (min, rate, burst, byId)=>sandbox.setKickRateLimit(min, rate, burst, byId),
          fakeSetTeamColors: (teamId, angle, colors, byId)=>sandbox.setTeamColors(teamId, angle, colors, byId),
          fakeSetPlayerAdmin: (playerId, value, byId)=>sandbox.setPlayerAdmin(playerId, value, byId),
          fakeKickPlayer: (playerId, reason, ban, byId)=>sandbox.kickPlayer(playerId, reason, ban, byId),
          fakeSetPlayerSync: (value, byId)=>sandbox.setPlayerSync(value, byId),

          createVertex: (data)=>sandbox.state.createVertex(data),
          createSegment: (data)=>sandbox.state.createSegment(data),
          createSegmentFromObj: (data)=>sandbox.state.createSegmentFromObj(data),
          createGoal: (data)=>sandbox.state.createGoal(data),
          createPlane: (data)=>sandbox.state.createPlane(data),
          createDisc: (data)=>sandbox.state.createDisc(data),
          createJoint: (data)=>sandbox.state.createJoint(data),
          createJointFromObj: (data)=>sandbox.state.createJointFromObj(data),
          addVertex: (data)=>sandbox.state.addVertex(data),
          addSegment: (data)=>sandbox.state.addSegment(data),
          addGoal: (data)=>sandbox.state.addGoal(data),
          addPlane: (data)=>sandbox.state.addPlane(data),
          addDisc: (data)=>sandbox.state.addDisc(data),
          addJoint: (data)=>sandbox.state.addJoint(data),
          addSpawnPoint: (data)=>sandbox.state.addSpawnPoint(data),
          addPlayer: (data)=>sandbox.state.addPlayer(data),
          findVertexIndicesOfSegmentObj: (segmentObj)=>sandbox.state.findVertexIndicesOfSegmentObj(segmentObj),
          findVertexIndicesOfSegment: (segmentIndex)=>sandbox.state.findVertexIndicesOfSegment(segmentIndex),
          updateVertex: (idx, data)=>sandbox.state.updateVertex(idx, data),
          updateSegment: (idx, data)=>sandbox.state.updateSegment(idx, data),
          updateGoal: (idx, data)=>sandbox.state.updateGoal(idx, data),
          updatePlane: (idx, data)=>sandbox.state.updatePlane(idx, data),
          updateDisc: (idx, data)=>sandbox.state.updateDisc(idx, data),
          updateDiscObj: (discObj, data)=>sandbox.state.updateDiscObj(discObj, data),
          updateJoint: (idx, data)=>sandbox.state.updateJoint(idx, data),
          updateSpawnPoint: (idx, team, data)=>sandbox.state.updateSpawnPoint(idx, team, data),
          updatePlayer: (playerId, data)=>sandbox.state.updatePlayer(playerId, data),
          removeVertex: (idx)=>sandbox.state.removeVertex(idx),
          removeSegment: (idx)=>sandbox.state.removeSegment(idx),
          removeGoal: (idx)=>sandbox.state.removeGoal(idx),
          removePlane: (idx)=>sandbox.state.removePlane(idx),
          removeDisc: (idx)=>sandbox.state.removeDisc(idx),
          removeJoint: (idx)=>sandbox.state.removeJoint(idx),
          removeSpawnPoint: (idx, team)=>sandbox.state.removeSpawnPoint(idx, team),
          removePlayer: (playerId)=>sandbox.state.removePlayer(playerId),
          updateStadiumPlayerPhysics: (data)=>sandbox.state.updateStadiumPlayerPhysics(data),
          updateStadiumBg: (data)=>sandbox.state.updateStadiumBg(data),
          updateStadiumGeneral: (data)=>sandbox.state.updateStadiumGeneral(data)
        });
        
        if (!noPlayer)
          sandbox.playerJoin(0, storage.playerName, storage.geo.flag, storage.avatar, "host", "host");
        
        commonParams.preInit?.(room);

        room.libraries.forEach((obj)=>{
          obj.room = room;
          obj.initialize?.();
        });
        
        room.config.room = room;
        room.config.initialize?.();
        if (room.renderer){
          room.renderer.room = room;
          room.renderer.initialize?.();
        }
    
        room.plugins.forEach((obj)=>{
          obj.room = room;
          obj.initialize?.();
        });
    
        activePlugins.forEach((obj)=>{
          room._onPluginActiveChange?.(obj);
        });

        sandbox.initialize();
        initialized = true;
        commonParams.onOpen?.(room);
        setTimeout(()=>{
          if (token=="sandbox")
            setTimeout(()=>room._onRoomLink?.(room.link), 100);
          else{
            var err = new API.Errors.HBError();
            err.code = API.Errors.ErrorCodes.MissingRecaptchaCallbackError;
            finalizeRoom(err);
          }
        }, 100);
        return {
          cancel: ()=>finalizeRoom()
        };
      }
    }
  };
}