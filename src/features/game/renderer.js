export default function(API, params){
  const { OperationType, VariableType, ConnectionState, AllowFlags, Direction, CollisionFlags, CameraFollow, BackgroundType, GamePlayState, BanEntryType, Callback, Utils, Room, Replay, Query, Library, RoomConfig, Plugin, Renderer, Errors, Language, EventFactory, Impl } = API;

  Object.setPrototypeOf(this, Renderer.prototype);
  Renderer.call(this, { // Every renderer should have a unique name.
    name: "PIXI",
    version: "1.0",
    author: "abc & JerryOldson",
    description: `This is the defaultRenderer implemented using the pixi.js renderer which also has webgl/webGPU capabilities.`
  });

  // parameters are exported so that they can be edited outside this class.
  this.defineVariable({
    name: "webGPU",
    description: "Whether to use WebGL or WebGPU",
    type: VariableType.Boolean,
    value: false
  });

  this.defineVariable({
    name: "extrapolation",
    description: "The desired extrapolation value in milliseconds",
    type: VariableType.Integer,
    value: 0,
    range: {
      min: -1000,
      max: 10000,
      step: 5
    }
  });

  this.defineVariable({
    name: "zoomCoeff",
    description: "Zoom Coefficient", 
    type: VariableType.Number,
    value: 1.0,
    range: {
      min: 0,
      max: Infinity,
      step: 0.01
    }
  });

  
  this.defineVariable({
    name: "wheelZoomCoeff",
    description: "Defines how fast you zoom in/out with mouse wheel", 
    type: VariableType.Number,
    value: 1.2,
    range: {
      min: 1,
      max: 10,
      step: 0.01
    }
  });

  this.defineVariable({ // team_colors
    name: "showTeamColors",
    description: "Show team colors?", 
    type: VariableType.Boolean,
    value: true
  });
  
  this.defineVariable({ // show_avatars
    name: "showAvatars",
    description: "Show player avatars?", 
    type: VariableType.Boolean,
    value: true
  });

  this.defineVariable({
    name: "showPlayerIds",
    description: "Show player ids?", 
    type: VariableType.Boolean,
    value: false
  });

  this.defineVariable({
    name: "resolutionScale",
    description: "Resolution Scale",
    type: VariableType.Number,
    value: 1,
    range: {
      min: 0,
      max: Infinity,
      step: 0.01
    }
  });

  this.defineVariable({
    name: "followPlayerId",
    description: "Id of the player that the camera will follow",
    type: VariableType.Integer,
    value: 0
  });

  this.defineVariable({
    name: "restrictCameraOrigin",
    description: "Restrict camera origin to view bounds?", 
    type: VariableType.Boolean,
    value: true
  });

  this.defineVariable({
    name: "followMode",
    description: "Follow camera enabled?", 
    type: VariableType.Boolean,
    value: true
  });

  this.defineVariable({ // show_indicators
    name: "showChatIndicators",
    description: "Show Chat Indicators?", 
    type: VariableType.Boolean,
    value: true
  });

  this.defineVariable({
    name: "showFPS",
    description: "Show FPS counter?", 
    type: VariableType.Boolean,
    value: true
  });

  this.defineVariable({
    name: "showInputLag",
    description: "Show Input Lag counter?", 
    type: VariableType.Boolean,
    value: true
  });

  this.defineVariable({
    name: "drawBackground",
    description: "Draw Background?", 
    type: VariableType.Boolean,
    value: true
  });
    
  this.defineVariable({
    name: "squarePlayers",
    description: "Draw Players as squares?", 
    type: VariableType.Boolean,
    value: false
  });
  
  this.defineVariable({
    name: "currentPlayerDistinction",
    description: "Hide current player's name and draw halo around current player?", 
    type: VariableType.Boolean,
    value: true
  });

  this.defineVariable({
    name: "showInvisibleSegments",
    description: "Show invisible segments?", 
    type: VariableType.Boolean,
    value: false
  });

  this.defineVariable({
    name: "showVertices",
    description: "Show vertices?",
    type: VariableType.Boolean,
    value: false,
  });

  this.defineVariable({
    name: "generalLineWidth",
    description: "The line width of everything except discs and texts on screen.", 
    type: VariableType.Number,
    value: 3,
    range: {
      min: 0,
      max: 100,
      step: 0.01
    }
  });

  this.defineVariable({
    name: "discLineWidth",
    description: "The line width of discs.", 
    type: VariableType.Number,
    value: 4,
    range: {
      min: 0,
      max: 100,
      step: 0.01
    }
  });

  this.defineVariable({
    name: "displayMode",
    description: "Display mode (windowed, borderless, exclusive)",
    type: VariableType.String,
    value: 'windowed'
  });

  this.defineVariable({
    name: "resolution",
    description: "Game target resolution",
    type: VariableType.String,
    value: 'native'
  });

  this.defineVariable({
    name: "playerAvatarTexturePath",
    description: "texture path",
    value: null
  });

  var thisRenderer = this, { Point, Team, TeamColors } = Impl.Core;
  thisRenderer.bottomPaddingPx = 0;
  var defaultTeamColors = [new TeamColors(), new TeamColors(), new TeamColors()];
  defaultTeamColors[1].inner.push(15035990);
  defaultTeamColors[2].inner.push(5671397);

  function bakeTextureFill(halfWidth, halfHeight, centerX, centerY){
    centerX = centerX||0;
    centerY = centerY||0;
    var w = Math.max(2, Math.ceil(2*halfWidth)), h = Math.max(2, Math.ceil(2*halfHeight));
    var img = avatarImage;
    if (!img || !(img.naturalWidth || img.width))
      return null;
    var dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
    var oversample = Math.max(1, Math.ceil(dpr * (thisRenderer.resolutionScale || 1) * 2));
    var canvasW = w * oversample, canvasH = h * oversample;
    var canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    var imgW = img.naturalWidth || img.width, imgH = img.naturalHeight || img.height;
    var srcSize = Math.min(imgW, imgH);
    var sx = (imgW - srcSize) / 2, sy = (imgH - srcSize) / 2;
    ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, canvasW, canvasH);
    var texture = PIXI.Texture.from(canvas);
    texture.source.scaleMode = "linear";
    texture.source.addressMode = "clamp-to-edge";
    texture.source.resolution = oversample;
    texture.resolution = oversample;
    var matrix = new PIXI.Matrix();
    return {
      texture,
      matrix
    };
  }

  // language-related stuff

  const LanguageData = {
    "GB": [
      "Time is", "Up!", 
      "Red is", "Victorious!", 
      "Red", "Scores!", 
      "Blue is", "Victorious!", 
      "Blue", "Scores!", 
      "Game", "Paused" 
    ],
    "TR": [
      "Süre", "Doldu!", 
      "Kırmızı Takım", "Kazandı!", 
      "Kırmızı Takım", "Gol Attı!", 
      "Mavi Takım", "Kazandı!", 
      "Mavi Takım", "Gol Attı!", 
      "Oyun", "Durduruldu" 
    ],
    "PT": [
      "O tempo", "Acabou!",
      "O vermelho é", "Vitorioso!",
      "O vermelho", "Marca!",
      "O azul é", "Vitorioso!",
      "Pontuações", "Azuis!",
      "Jogo em", "Pausa"
    ],
    "ES": [
      "¡El tiempo ha", "Terminado!",
      "¡El red ha", "Ganado!",
      "¡Punto para el", "Red!",
      "¡El azul ha", "Ganado!",
      "¡Punto para el", "Blue!",
      "Juego en", "Pausa"
    ]
  };

  var scriptElem = null, rendererObj = null, stage = null, stage2 = null, stage3 = null, playerContainer = null, nameContainer = null, haloContainer = null, texture1 = null, texture2 = null, texture3 = null, texture4 = null, customDiscInfo = [], customJointInfo = [], customSegmentInfo = [], customHaloInfo = null, textInfo = {time: 0,queue: []}, locationIndicatorInfo = {}, chatIndicatorInfo = {}, pauseRect = null, fpsText = null, fpsFrameCount = 0, fpsLastSecond = 0, fpsDisplay = 0, inputLagText = null, lastProcessedInputTime = 0, inputLagRollingSum = 0, inputLagRollingCount = 0, lastRenderTime = null, spf = null, scale = thisRenderer.zoomCoeff, origin = {x: 0, y: 0}, gamePaused = false, framesInFlight = 0, rendererLifecycleToken = 0, renderBlockedByGPU = false, forceImmediateRender = false;
  var maxFramesInFlight = 2;
  var avatarImage = null;

  function loadImages(playerAvatar){
    avatarImage = null;
    const el = document.createElement("img");
    el.crossOrigin = "anonymous";
    el.src = playerAvatar;
    avatarImage = el;
  }

  function redrawJoint({ gr, dx, dy, color }){
    gr.moveTo(0, 0);
    gr.lineTo(dx, dy);
    gr.stroke({
      color: color,
      width: thisRenderer.generalLineWidth,
      alignment: 0.5,
    });
  };

  function redrawDisc({gr, disc}){
    gr.clear();
    gr.circle(0, 0, disc.radius);
    const transparent = (disc.color|0)==-1;
    if (!transparent){
      gr.setFillStyle(Utils.numberToColor(disc.color));
      gr.fill();
    }
    gr.stroke();
  }

  function redrawPlayerDisc(discInfo, teamColors, disc, player) {
    const gr = discInfo.gr;
    const mask = discInfo.mask;
    const size = disc.radius * 2;
    const half = disc.radius;
    const stepWidth = size / teamColors.inner.length;
    let x = -half;
    gr.clear();
    mask.clear();
    if (thisRenderer.squarePlayers){
      //gr.rect(-disc.radius,-disc.radius, 2*disc.radius, 2*disc.radius);
      mask.rect(-disc.radius,-disc.radius, 2*disc.radius, 2*disc.radius);
    }
    else{
      //gr.circle(0, 0, disc.radius+1);
      mask.circle(0, 0, disc.radius);
    }
    gr.rotation = (3.141592653589793*teamColors.angle)/128;
    //var stepWidth = 32/teamColors.inner.length, x=-16;
    if (thisRenderer.playerAvatarTexturePath && player.id == thisRenderer.followPlayerId) {
      loadImages(thisRenderer.playerAvatarTexturePath);
      if (discInfo.texture && discInfo.texture?.destroy && !discInfo.texture?.destroyed) discInfo.texture?.destroy();
      discInfo.texture = null;
      gr.rotation = 0;
      const baked = bakeTextureFill(half, half);
      discInfo.texture = baked.texture;
      gr.rect(x, -half, size, size);
      gr.fill({
        texture: baked.texture,
        matrix: baked.matrix,
      });
    } else
      for (var i=0; i<teamColors.inner.length; i++){
        gr.setFillStyle(Utils.numberToColor(teamColors.inner[i]));
        //gr.rect(x, -16, stepWidth+4, 32);
        gr.rect(x, -half, stepWidth+(Math.max(1, disc.radius * 0.125)), size);
        gr.fill();
        x+=stepWidth;
      };
    if (thisRenderer.squarePlayers){
      gr.rect(-disc.radius,-disc.radius, 2*disc.radius, 2*disc.radius);
    }
    else{
      gr.circle(0, 0, disc.radius+1);
    }
    /*gr.stroke({
      width: thisRenderer.discLineWidth,
      color: player.isKicking ? 0xffffff : 0x000000
    });*/
    mask.fill({ color: disc.color });
  };

  function redrawHalo(){
    const grHalo = customHaloInfo.gr;
    grHalo.clear();
    if (thisRenderer.squarePlayers)
      grHalo.rect(-25, -25, 50, 50);
    else
      grHalo.circle(0, 0, 25);
    grHalo.stroke({
      color: 0xffffff,
      width: thisRenderer.generalLineWidth,
      alignment: 0.5,
      alpha: 0.3,
    });
  }

  function computeViewportGeometry(stadium, viewWidth, viewHeight, zoom){
    var topPadding = 50 / zoom;
    var bottomPadding = (thisRenderer.bottomPaddingPx / (thisRenderer.cssStretchFactor || 1)) / zoom;
    return { viewWidth, viewHeight, topPadding, bottomPadding };
  }

  function calculateLocationIndicatorValues(pos, geo) {
    var { viewWidth, viewHeight, topPadding, bottomPadding } = geo;
    viewWidth = 0.5*viewWidth-25;
    var viewHeightTop = 0.5*viewHeight-25 - topPadding;
    var viewHeightBottom = 0.5*viewHeight-25-bottomPadding;
    var deltaX = pos.x-origin.x;
    var deltaY = pos.y-origin.y;
    var x = origin.x+((deltaX>viewWidth) ? viewWidth : ((deltaX<-viewWidth) ? -viewWidth : deltaX));
    var y = origin.y+((deltaY>viewHeightBottom) ? viewHeightBottom : ((deltaY<-viewHeightTop) ? -viewHeightTop : deltaY));
    deltaX = pos.x-x;
    deltaY = pos.y-y;
    return (deltaX*deltaX+deltaY*deltaY<=900) ? null : { x, y, angle: Math.atan2(deltaY, deltaX) };
  }

  function _destroyDiscInfo(discInfo) {
    discInfo.gr?.parent?.removeChild(discInfo.gr);
    discInfo.gr?.destroy();
    discInfo.mask?.parent?.removeChild(discInfo.mask);
    discInfo.mask?.destroy();
    discInfo.avatarText?.parent?.removeChild(discInfo.avatarText);
    discInfo.avatarText?.destroy();
    discInfo.playerNameText?.parent?.removeChild(discInfo.playerNameText);
    discInfo.playerNameText?.destroy();
    discInfo.playerNameMask?.parent?.removeChild(discInfo.playerNameMask);
    discInfo.playerNameMask?.destroy();
    discInfo.playerStroke?.parent?.removeChild(discInfo.playerStroke);
    discInfo.playerStroke?.destroy();
    if (discInfo.texture) {
      discInfo?.texture?.destroy(true);
      discInfo.texture = null;
    }
  }

  function _removeDiscByPlayerId(playerId) {
    if (!customDiscInfo) return;
    const idx = customDiscInfo.findIndex(info => info && info.playerId === playerId);
    if (idx === -1) return;
    _destroyDiscInfo(customDiscInfo[idx]);
    customDiscInfo.splice(idx, 1);
  }

  function _addMissingDiscInfos(){
    if (!stage2 || !customDiscInfo || !thisRenderer.room?.state?.gameState) return;
    const discs = thisRenderer.room.state.gameState.physicsState.discs;
    for (let i = customDiscInfo.length; i < discs.length; i++){
      customDiscInfo[i] = _createDiscGraphics(discs[i]);
    }
  }

  function _addChatIndicatorForPlayer(playerId){
    if (!stage2 || chatIndicatorInfo[playerId]) return;
    const gr = new PIXI.Sprite(texture4);
    gr.anchor.set(0.5);
    gr.visible = false;
    stage2.addChild(gr);
    chatIndicatorInfo[playerId] = { gr, active: false };
  }

  function _removeChatIndicatorForPlayer(playerId){
    const info = chatIndicatorInfo[playerId];
    if (!info) return;
    info.gr?.parent?.removeChild(info.gr);
    info.gr?.destroy();
    delete chatIndicatorInfo[playerId];
  }

  function _addLocationIndicatorForPlayer(playerId, color) {
    if (!stage2 || locationIndicatorInfo[playerId]) return;
    const gr = new PIXI.Graphics();
    const gr1 = new PIXI.Graphics();
    gr1.x = 2; gr1.y = 2;
    gr1.moveTo(15, 0); gr1.lineTo(0, 7); gr1.lineTo(0, -7); gr1.closePath();
    gr1.fill({ color: "rgba(0,0,0,0.5)" });
    gr.addChild(gr1);
    const gr2 = new PIXI.Graphics();
    gr2.x = -2; gr2.y = -2;
    gr2.moveTo(15, 0); gr2.lineTo(0, 7); gr2.lineTo(0, -7); gr2.closePath();
    gr2.fill({ color: Utils.numberToColor(color) });
    gr.addChild(gr2);
    gr.visible = false; // la posición real la fija updateLocationIndicators en el próximo frame
    stage2.addChild(gr);
    locationIndicatorInfo[playerId] = gr;
  }

  function _removeLocationIndicatorForPlayer(playerId) {
    const gr = locationIndicatorInfo[playerId];
    if (!gr) return;
    gr.parent?.removeChild(gr);
    gr.destroy();
    delete locationIndicatorInfo[playerId];
  }

  function _createDiscGraphics(discObj) {
    const gr = new PIXI.Graphics();
    if (thisRenderer.squarePlayers)
      gr.rect(-discObj.radius, -discObj.radius, 2 * discObj.radius, 2 * discObj.radius);
    else
      gr.circle(0, 0, discObj.radius + 10);

    const bakedDiscTexture = (discObj.playerId == thisRenderer.followPlayerId && thisRenderer.playerAvatarTexturePath) ? bakeTextureFill(discObj.radius, discObj.radius) : null;
    const discTransparent = (discObj.color|0)==-1;
    if (bakedDiscTexture || !discTransparent)
      gr.fill(bakedDiscTexture || { color: Utils.numberToColor(discObj.color) });
    gr.stroke({
      color: 0x000000,
      width: thisRenderer.discLineWidth - 2,
      alignment: 0.5,
    });
    stage2.addChild(gr);

    let gr2 = null, avatarText = null, playerNameText = null, playerNameMask = null, avatarMask, playerStroke;

    if (discObj.playerId !== null && discObj.playerId !== undefined) {
      gr2 = new PIXI.Graphics();
      if (thisRenderer.squarePlayers)
        gr2.rect(-discObj.radius, -discObj.radius, 2 * discObj.radius, 2 * discObj.radius);
      else
        gr2.circle(0, 0, discObj.radius + 11);
      gr2.fill({ color: Utils.numberToColor(discObj.color) });
      gr.mask = gr2;

      playerStroke = new PIXI.Graphics();
      if (thisRenderer.squarePlayers)
        playerStroke.rect(-discObj.radius, -discObj.radius, 2 * discObj.radius, 2 * discObj.radius);
      else
        playerStroke.circle(0, 0, discObj.radius + 11);

      avatarText = new PIXI.Text({
        text: "",
        style: {
          fontFamily: ["Arial Black", "Arial Bold", "Gadget", "sans-serif"],
          fontSize: 16,
          align: "center",
          fill: "#000000",
          fontWeight: "900"
        }
      });
      avatarText.resolution = 2;
      avatarText.anchor.set(0.5);
      avatarMask = new PIXI.Graphics();
      if (thisRenderer.squarePlayers)
        avatarMask.rect(-discObj.radius, -discObj.radius, 2*discObj.radius, 2*discObj.radius);
      else
        avatarMask.circle(0, 0, discObj.radius-1);
      avatarMask.fill({ color: 0xffffff });
      avatarText.mask = avatarMask;

      const player = thisRenderer.room.getPlayer(discObj.playerId);
      playerNameText = new PIXI.Text({
        text: player.name,
        style: {
          fontFamily: ["sans-serif"],
          fontSize: 12,
          fill: "#ffffff",
          fontWeight: "100",
        }
      });
      playerNameText.resolution = 2;

      if (2 * playerNameText.width > 160) {
        playerNameMask = new PIXI.Graphics();
        playerNameMask.rect(0, 0, 73, 16);
        playerNameMask.fill(0x000000);
        playerNameMask.alpha = 0.5;
        playerNameText.anchor.set(0, 0.5);
        playerNameText.pivot.set(34, -discObj.radius * 1.65);
        playerNameMask.pivot.set(34, -discObj.radius * 1.65 + 4);
        stage2.addChild(playerNameMask);
        playerNameText.mask = playerNameMask;
      } else {
        playerNameText.anchor.set(0.5);
        playerNameText.pivot.set(0, -discObj.radius * 1.65);
      }

      stage2.removeChild(gr);
      playerContainer.addChild(gr);
      nameContainer.addChild(playerNameText);
      playerContainer.addChild(gr2);
      playerContainer.addChild(avatarText);
      playerContainer.addChild(avatarMask);
      playerContainer.addChild(playerStroke);
    }
    // cache prop is an obj with general disc data, such as radius, etc.
    // teamCache prop is an obj with teams cache data, such as color, etc.
    return {
      gr, avatarText, avatarMask, playerNameText, mask: gr2,
      cache: null, teamCache: null, playerNameMask,
      playerId: discObj.playerId ?? null,
      texture: bakedDiscTexture,
      playerStroke,
      texturePath: thisRenderer.playerAvatarTexturePath,
      isKicking: discObj.playerId ? thisRenderer.room.getPlayer(discObj.playerId).isKicking : null
    };
  }

  function regenerateNecessaryObjects({FillGradient, Matrix, Container, Graphics, Text, Sprite}, {players, gameState}){
    if (!gameState)
      return;

    if (stage) stage.destroy({ children: true });
    if (thisRenderer.playerAvatarTexturePath) loadImages(thisRenderer.playerAvatarTexturePath);
    var {physicsState, stadium} = gameState;
    customDiscInfo = [];
    customJointInfo = [];
    customSegmentInfo = [];
    locationIndicatorInfo = {};
    chatIndicatorInfo = {};
    stage = new Container();
    stage.x = params.canvas.width/2;
    stage.y = params.canvas.height/2;
    stage2 = new Container();
    stage2.scale.set(scale, scale);
    stage2.x = -origin.x;
    stage2.y = -origin.y;
    stage.addChild(stage2);
    stage3 = new Container();
    stage3.x = -origin.x;
    stage3.y = -origin.y;
    nameContainer = new Container();
    playerContainer = new Container();
    haloContainer = new Container();
    function initHalo(){
      const gr = new Graphics();
      if (thisRenderer.squarePlayers)
        gr.rect(-25, -25, 50, 50)
      else gr.circle(0, 0, 25);
      gr.stroke({
        color: 0xffffff,
        width: thisRenderer.generalLineWidth,
        alignment: 0.5,
        alpha: 0.3,
      });
      haloContainer.addChild(gr);
      stage2.addChild(haloContainer);
      customHaloInfo = {gr, haloContainer};
    }
    function initBackground(){
      const { bgType, bgWidth, bgHeight, bgColor, bgCornerRadius, bgKickOffRadius, bgGoalLine } = stadium, gr = new Graphics();
      rendererObj.background.color = bgColor;
      if (bgType==1){
        gr.x = -bgWidth;
        gr.y = -bgHeight;
        gr.roundRect(0, 0, 2*bgWidth, 2*bgHeight, bgCornerRadius);
        gr.fill({
          texture: texture1,
          matrix: new Matrix().scale(2, 2),
          textureSpace: 'global'
        });
        gr.stroke({
          color: 0xc7e6bd,
          width: thisRenderer.generalLineWidth,
          alignment: 0.5,
        });
        gr.moveTo(bgWidth, 0);
        gr.lineTo(bgWidth, 2*bgHeight);
        gr.stroke({
          color: 0xc7e6bd,
          width: thisRenderer.generalLineWidth,
          alignment: 0.5,
        });
        gr.beginPath();
        gr.arc(bgWidth, bgHeight, bgKickOffRadius, 0, 2*Math.PI);
        gr.stroke({
          color: 0xc7e6bd,
          width: thisRenderer.generalLineWidth,
          alignment: 0.5,
        });
      }
      else if (bgType==2){
        const safeHeight = Number.isFinite(bgHeight) && bgHeight > 0 ? bgHeight : 1;
        const gradientFill = new FillGradient(0, 0, 0, 2*bgHeight), h = Math.max(1, Math.floor((safeHeight*2)/15))
        for (var i=0; i<=2*h; i++)
          gradientFill.addColorStop((i+1-((i+1)%2))/(2*h), i%4<2 ? 0x6d6d6d : 0xe9cc6e);
        gr.x = -10000
        gr.y = -10000
        gr.rect(0, 0, 20000, 20000);
        gr.fill({
          texture: texture3,
          matrix: new Matrix().scale(2, 2),
          textureSpace: 'global'
        });
        const gr2 = new Graphics();
        gr2.x = 10000-bgWidth;
        gr2.y = 10000-bgHeight;
        gr2.roundRect(0, 0, 2*bgWidth, 2*bgHeight, bgCornerRadius);
        gr2.fill({
          texture: texture2,
          matrix: new Matrix().scale(2, 2),
          textureSpace: 'global'
        });
        gr2.stroke({
          color: 0xe9cc6e,
          width: thisRenderer.generalLineWidth,
          alignment: 0.5,
        });

        //gr2.lineStyle(1,0xe9cc6e,1);
        gr2.moveTo(bgWidth, 8);
        gr2.lineTo(bgWidth, 2*bgHeight); // gr2.dashLineTo(bgWidth, 2*bgHeight, 15, 15);
        gr2.stroke({
          //color: 0xe9cc6e,
          fill: gradientFill,
          width: thisRenderer.generalLineWidth, // maybe 2
          alignment: 0.5,
        });
        var delta = bgWidth-bgGoalLine;
        if (bgGoalLine<bgCornerRadius)
          delta=0;
        var drawKickOff = function(color, x, ccw){
          gr2.beginPath();
          gr2.arc(bgWidth, bgHeight, bgKickOffRadius, -Math.PI/2, Math.PI/2, ccw);
          if (x!=0){
            gr2.moveTo(x+bgWidth, 0);
            gr2.lineTo(x+bgWidth, 2*bgHeight);
          }
          gr2.stroke({
            color: color,
            width: thisRenderer.generalLineWidth,
            alignment: 0.5,
          });
        };
        drawKickOff("#85ACF3", delta, false);
        drawKickOff("#E18977", -delta, true);
        gr.addChild(gr2);
      }
      stage2.addChild(gr);
    }
    function initVertex(vertexObj){
      const gr = new Graphics();
      gr.stroke({
        color: 0x000000,
        width: thisRenderer.generalLineWidth,
        alignment: 0.5,
      });
      gr.beginFill(0xff44ff);
      gr.circle(0, 0, 4);
      gr.endFill();
      gr.x = vertexObj.pos.x;
      gr.y = vertexObj.pos.y;
      stage2.addChild(gr);
    }
    function initSegment(segmentObj, id){
      if (!segmentObj.vis && !thisRenderer.showInvisibleSegments) return;
      const { x: x0, y: y0 } = physicsState.vertices[segmentObj.v0.id].pos;
      const { x: x1, y: y1 } = physicsState.vertices[segmentObj.v1.id].pos;
      const gr = new Graphics();
      const segmentTransparent = (segmentObj.color|0)==-1;
      if (!segmentObj.arcCenter){
        gr.moveTo(0, 0);
        gr.lineTo(x1-x0, y1-y0);
        if (!segmentTransparent)
          gr.stroke({
            color: segmentObj.color,
            width: thisRenderer.generalLineWidth,
            alignment: 0.5,
          });
        gr.x = x0;
        gr.y = y0;
      }
      else{
        var { x: cx, y: cy } = segmentObj.arcCenter;
        gr.arc(0, 0, segmentObj.arcRadius, Math.atan2(y0-cy, x0-cx), Math.atan2(y1-cy, x1-cx));
        if (!segmentTransparent)
          gr.stroke({
            color: segmentObj.color,
            width: thisRenderer.generalLineWidth,
            alignment: 0.5,
          });
        gr.x = cx;
        gr.y = cy;
      }
      stage2.addChild(gr);
      customSegmentInfo[id] = {gr, cache:null};
    }
    function initDisc(discObj, id){
      customDiscInfo[id] = _createDiscGraphics(discObj);
    }
    function initJoint(jointObj, id){
      if (jointObj.color==-1)
        return;
      const { x: x0, y: y0 } = physicsState.discs[jointObj.d0].pos;
      const { x: x1, y: y1 } = physicsState.discs[jointObj.d1].pos;
      const gr = new Graphics();
      var info = customJointInfo[id] = {
        dx: x1-x0,
        dy: y1-y0,
        gr,
        color: jointObj.color,
      };
      redrawJoint(info);
      gr.x = x0;
      gr.y = y0;
      stage2.addChild(gr);
    }

    function Animator(values){ // Ib
      this.values = values.slice(); // Yb
    }
    Animator.prototype = {
      eval: function(x){
        var idx = this.values.length-1;
        if (x<=this.values[0])
          return this.values[1];
        if (x>=this.values[idx])
          return this.values[idx-2];
        var min = 0, max = (max/5)|0;
        do {
          var cur = (max+min)>>>1;
          if (x>this.values[5*cur])
            min = cur+1;
          else
            max = cur-1;
        } while (min<=max);
        var idx2 = 5*max, idx3 = this.values[idx2];
        var X = (x-idx3)/(this.values[idx2+5]-idx3), sqrX = X*X, cubeX = sqrX*X;
        return (2*cubeX-3*sqrX+1)*this.values[idx2+1]+(cubeX-2*sqrX+X)*this.values[idx2+2]+(-2*cubeX+3*sqrX)*this.values[idx2+3]+(cubeX-sqrX)*this.values[idx2+4];
      }
    }
    function CanvasText(lines, color){ // R
      var arr = [];
      for (var i=0;i<lines.length;i++){
        var line = new Graphics();
        var text1 = new Text({
          text: lines[i],
          style: {
            fontFamily: ["Arial Black", "Arial Bold", "Gadget", "sans-serif"],
            fontSize: 70,
            align: "center",
            fill: "#000000",
            fontWeight: "bold"
          }
        });
        text1.anchor.set(0.5);
        text1.x=7;
        text1.y=7;
        line.addChild(text1);
        var text2 = new Text({
          text: lines[i],
          style: {
            fontFamily: ["Arial Black", "Arial Bold", "Gadget", "sans-serif"],
            fontSize: 70,
            align: "center",
            fill: Utils.numberToColor(color),
            fontWeight: "bold"
          }
        });
        text2.anchor.set(0.5);
        text2.x=0;
        text2.y=0;
        line.addChild(text2);
        arr.push(line);
      }
      this.arr = arr; // We
    }
    CanvasText.alphaAnimator = new Animator([0, 0, 2, 1, 0, 0.35, 1, 0, 1, 0, 0.7, 1, 0, 0, 0, 1]); // jn
    CanvasText.coordAnimator = new Animator([0, -1, 3, 0, 0, 0.35, 0, 0, 0, 0, 0.65, 0, 0, 1, 3, 1]); // kn
    CanvasText.prototype = {
      calculateTime: function(){ // zo
        return 2.31+0.1155*(this.arr.length-1);
      },
      updateInStage: function(coeff){
        var coeff1 = coeff / 2.31;
        this.arr.forEach((x, i)=>{
          var coeff2 = coeff1-0.05*i, width = ((0!=(i&1)) ? -1 : 1)*180*CanvasText.coordAnimator.eval(coeff2);
          x.alpha = CanvasText.alphaAnimator.eval(coeff2);
          x.x = origin.x+ width//*-0.5*canvas.width*/;
          x.y = origin.y + 35*(1-this.arr.length)+70*i/*-0.5*canvas.height*/;
          stage3.addChild(x);
        });
      },
      renderStatic: function() {
        this.arr.forEach((x,i)=>{
          x.x= origin.x + 0;/*-0.5 * canvas.width*/
          x.y= origin.y + 35 * (1 - this.arr.length) + 70 * i;/*- 0.5 * canvas.height*/
          stage3.addChild(x);
        })
      },
      removeFromStage: function(){
        this.arr.forEach((x)=>{
          stage3.removeChild(x);
        });
      },
      destroy: function(){
        this.arr.forEach((x) => {
          x.destroy({ children: true, texture: true });
        });
        this.arr = [];
      }
    }
    function initTexts(){
      if (textInfo) {
        ['timeUp', 'redVictory', 'redScore', 'blueVictory', 'blueScore', 'gamePause'].forEach(key => {
          textInfo[key]?.destroy?.();
        });
      }
      const TextMap = LanguageData[Language.current?.abbr||"GB"];
      textInfo = {
        time: 0, // xc
        queue: [], // ab
        timeUp: new CanvasText([TextMap[0], TextMap[1]], 16777215), // Ar // ["Time is", "Up!"]
        redVictory: new CanvasText([TextMap[2], TextMap[3]], 15035990), // Gq // ["Red is", "Victorious!"]
        redScore: new CanvasText([TextMap[4], TextMap[5]], 15035990), // Fq // ["Red", "Scores!"]
        blueVictory: new CanvasText([TextMap[6], TextMap[7]], 625603), // Cn // ["Blue is", "Victorious!"]
        blueScore: new CanvasText([TextMap[8], TextMap[9]], 625603), // Bn // ["Blue", "Scores!"]
        gamePause: new CanvasText([TextMap[10], TextMap[11]], 16777215) // eq // ["Game", "Paused"]
      };
    }
    function initPauseRect(){
      const gr = new Graphics();
      gr.rect(-0.5, 0, 1, 20);
      gr.fill({color: "white"});
      gr.x = 0;
      gr.y = 0;
      gr.visible = false;
      pauseRect = gr;
      stage3.addChild(gr);
    }
    function initLocationIndicator(id, pos, color, viewWidth, viewHeight){ // nk
      var vals = calculateLocationIndicatorValues(pos, viewWidth, viewHeight);
      const gr = new Graphics();
      const gr1 = new Graphics();
      gr1.x = 2;
      gr1.y = 2;
      gr1.moveTo(15, 0);
      gr1.lineTo(0, 7);
      gr1.lineTo(0, -7);
      gr1.closePath();
      gr1.fill({
        color: "rgba(0,0,0,0.5)"
      });
      gr.addChild(gr1);
      const gr2 = new Graphics();
      gr2.x = -2;
      gr2.y = -2;
      gr2.moveTo(15, 0);
      gr2.lineTo(0, 7);
      gr2.lineTo(0, -7);
      gr2.closePath();
      gr2.fill({
        color: Utils.numberToColor(color)
      });
      gr.addChild(gr2);
      stage2.addChild(gr);
      if (vals){
        gr.x = vals.x;
        gr.y = vals.y;
        gr.rotation = vals.angle;
        gr.visible = true;
      } else {
        gr.visible = false;
      }
      locationIndicatorInfo[id] = gr;
    }
    function initLocationIndicators(){ // Lq
      var ballDisc = physicsState.discs[0];
      var viewWidth = 0;
      var viewHeight = 0;
      initLocationIndicator("ball", ballDisc.pos, ballDisc.color, viewWidth, viewHeight);
      players.forEach((player)=>(player.disc && initLocationIndicator(player.id, player.disc.pos, player.team.color, viewWidth, viewHeight)));
    }
    function initChatIndicators(){
      players.forEach((player)=>{
        var gr = new Sprite(texture4);
        gr.anchor.set(0.5);
        gr.visible = false;
        stage2.addChild(gr);
        chatIndicatorInfo[player.id] = {
          gr,
          active: false,
        };
      });
    };
    function initFPSCounter(){
      fpsText = new Text({
        text: "FPS: 60",
        style: {
          fontFamily: ["sans-serif"],
          fontSize: 16,
          fill: "#00FF00",
          fontWeight: "bold",
          stroke: { color: 0x000000, width: 3 }
        }
      });
      fpsText.x = -params.canvas.width/2 + 20;
      fpsText.y = -params.canvas.height/2 + 20;
      fpsText.visible = thisRenderer.showFPS;
      stage.addChild(fpsText);

      inputLagText = new Text({
        text: "Input Lag: 0.00ms",
        style: {
          fontFamily: ["sans-serif"],
          fontSize: 16,
          fill: "#FFFF00",
          fontWeight: "bold",
          stroke: { color: 0x000000, width: 3 }
        }
      });
      inputLagText.x = -params.canvas.width/2 + 20;
      inputLagText.y = -params.canvas.height/2 + 40;
      inputLagText.visible = thisRenderer.showInputLag;
      stage.addChild(inputLagText);
    }
    thisRenderer.drawBackground && initBackground();
    thisRenderer.showVertices && physicsState.vertices.forEach(initVertex);
    physicsState.segments.forEach(initSegment);
    stage2.addChild(nameContainer);
    stage2.addChild(playerContainer);
    initHalo();
    physicsState.discs.forEach(initDisc);
    physicsState.joints.forEach(initJoint);
    initPauseRect();
    initChatIndicators();
    initTexts();
    initLocationIndicators();
    initFPSCounter();
    stage.addChild(stage3);
    lastRenderTime = window.performance.now();
  }

  function _regenerateNecessaryObjects(){
    thisRenderer.room && (typeof PIXI!="undefined") && regenerateNecessaryObjects(PIXI, thisRenderer.room);
  }

  function updateLocationIndicators(roomState, geo){
    function updateLocationIndicator(id, disc){
      var gr = locationIndicatorInfo[id];
      if (!gr)
        return;
      var vals = disc && calculateLocationIndicatorValues(disc.pos, geo);
      if (vals){
        gr.x = vals.x;
        gr.y = vals.y;
        gr.rotation = vals.angle;
        gr.visible = true;
      }
      else
        gr.visible = false;
    }
    updateLocationIndicator("ball", roomState.gameState.physicsState.discs[0]);
    roomState.players.forEach((player)=>updateLocationIndicator(player.id, player.disc));
  }

  function addText(textObj){
    textInfo.queue.push(textObj);
  }

  function resetTexts(){
    textInfo.queue = [];
    textInfo.time = 0;
  }

  function updateText(deltaTime){
    if (!textInfo)
      return;
    var {queue} = textInfo;
    if (queue.length==0)
      return;
    textInfo.time += deltaTime;
    if (textInfo.time<=queue[0].calculateTime())
      return;
    textInfo.time = 0;
    queue[0].removeFromStage();
    queue.shift();
  }

  function renderText(){
    if (textInfo.queue.length==0)
      return;
    textInfo.queue[0].updateInStage(textInfo.time);
  }
  
  function updateCameraOrigin(gameState, followDisc, geo, deltaTime){
    var stadium = gameState.stadium;
    var viewWidth = geo.viewWidth, viewHeight = geo.viewHeight;
    var topPadding = geo.topPadding, bottomPadding = geo.bottomPadding;
    if (thisRenderer.followMode){
      var x, y, pos;
      if (followDisc && stadium.cameraFollow==1){
        pos = followDisc.pos; // player's position
        x = pos.x;
        y = pos.y-(bottomPadding-topPadding)/2;
      }
      else{
        pos = gameState.physicsState.discs[0].pos; // ball's position
        x = pos.x;
        y = pos.y;
        if (followDisc){
          var playerPos = followDisc.pos;
          x = 0.5*(x+playerPos.x);
          y = 0.5*(y+playerPos.y);
          y -= (bottomPadding - topPadding) / 2;
          var w = 0.5*viewWidth;
          var h = 0.5*viewHeight;
          var minX = playerPos.x-w+50;
          var minY = playerPos.y-h+50 + bottomPadding;
          var maxX = playerPos.x+w-50;
          var maxY = playerPos.y+h-50-topPadding;
          x = x > maxX ? maxX : x < minX ? minX : x;
          y = y > maxY ? maxY : y < minY ? minY : y;
        }
      }
      var t = 60*deltaTime;
      if (t>1)
        t = 1;
      t *= 0.04;
      var x0 = origin.x;
      var y0 = origin.y;
      origin.x = x0+(x-x0)*t;
      origin.y = y0+(y-y0)*t;
    }
    if (thisRenderer.restrictCameraOrigin){
      if (viewWidth>2*stadium.width)
        origin.x = 0;
      else if (origin.x+0.5*viewWidth>stadium.width)
        origin.x = stadium.width-0.5*viewWidth;
      else if (origin.x-0.5*viewWidth<-stadium.width)
        origin.x = -stadium.width+0.5*viewWidth;
      if (viewHeight - topPadding - bottomPadding > 2 * stadium.height)
          origin.y = (bottomPadding - topPadding) / 2;
      else if (origin.y+0.5*viewHeight-bottomPadding>stadium.height)
          origin.y = stadium.height-0.5*viewHeight+bottomPadding;
      else if (origin.y-0.5*viewHeight + topPadding <-stadium.height)
          origin.y = -stadium.height+0.5*viewHeight - topPadding;
    }
    // fix all possible camera bugs
    if (Number.isNaN(origin.x))
      origin.x = 0;
    if (Number.isNaN(origin.y))
      origin.y = 0;
    stage2.x = -origin.x*scale;
    stage2.y = -origin.y*scale;
    stage3.x = -origin.x;
    stage3.y = -origin.y;
  }

  function update(roomState, geo){
    const { discs, joints, segments } = roomState.gameState.physicsState;
    if (!customDiscInfo)
      return;

    const {
      showTeamColors, showAvatars, showPlayerIds, currentPlayerDistinction,
      followPlayerId, showChatIndicators, squarePlayers, discLineWidth,
      generalLineWidth, playerAvatarTexturePath
    } = thisRenderer;

    updateLocationIndicators(roomState, geo);
    updateGamePaused(roomState.gameState);

    segments.forEach((segment, id)=>{
      if (!segment.vis)
        return;
      const segInfo = customSegmentInfo[id];
      const gr = segInfo.gr;
      const pos1 = segment.v0.pos, pos2 = segment.v1.pos;
      const segmentTransparent = (segment.color|0)==-1;
      if (0*segment.curveF!=0){
        const dx = pos2.x-pos1.x, dy = pos2.y-pos1.y;
        if (dx!=gr.dx || dy!=gr.dy){
          gr.dx = dx;
          gr.dy = dy;
          gr.clear();
          gr.moveTo(0, 0);
          gr.lineTo(dx, dy);
          if (!segmentTransparent)
            gr.stroke({
              color: segment.color,
              width: generalLineWidth,
              alignment: 0.5,
            });
        }
        gr.x = pos1.x;
        gr.y = pos1.y;
      }
      else{
        const center = segment.arcCenter;
        const deltaX = pos1.x-center.x, deltaY = pos1.y-center.y;
        if (!segInfo.cache || segInfo.cache.deltaX!== deltaX || segInfo.cache.deltaY!==deltaY) {
          gr.clear();
          gr.arc(0, 0, Math.sqrt(deltaX*deltaX+deltaY*deltaY), Math.atan2(deltaY, deltaX), Math.atan2(pos2.y-center.y, pos2.x-center.x));
          if (!segmentTransparent)
            gr.stroke({
              color: segment.color,
              width: generalLineWidth,
              alignment: 0.5,
            });
          segInfo.cache = {deltaX, deltaY};
        }
        gr.x = center.x;
        gr.y = center.y;
      }
    });

    discs.forEach((disc, id)=>{
      const { pos } = disc, discInfo = customDiscInfo[id];
      if (!discInfo)
        return;
      const gr = discInfo.gr;
      gr.x = pos.x;
      gr.y = pos.y;

      if (disc.playerId==null){
        if (!discInfo.cache || discInfo.cache.color !== disc.color || discInfo.cache.radius !== disc.radius){
          redrawDisc({gr, disc});
        }
        discInfo.cache = { color: disc.color, radius: disc.radius };
        return;
      }

      const player = roomState.getPlayer(disc.playerId);
      const { mask, playerStroke, avatarMask, avatarText, playerNameText, playerNameMask, cache } = discInfo;
      const radiusChanged = cache?.radius !== disc.radius;

      mask.x = pos.x;
      mask.y = pos.y;
      playerStroke.x = pos.x;
      playerStroke.y = pos.y;
      avatarMask.x = pos.x;
      avatarMask.y = pos.y;

      const teamColors = showTeamColors ? roomState.teamColors[player.team.id] : defaultTeamColors[player.team.id];

      const usingTexture = !!playerAvatarTexturePath && player.id === followPlayerId;
      if (usingTexture){
        if (avatarText.visible) avatarText.visible = false;
        if (avatarMask.visible) avatarMask.visible = false;
      } else {
        if (!avatarText.visible) avatarText.visible = true;
        if (!avatarMask.visible) avatarMask.visible = true;
        const avatarStr = showAvatars ? (player.avatar || player.avatarNumber) : player.avatarNumber;
        const textCache = discInfo.textCache || (discInfo.textCache = {});
        if (textCache.avatar !== avatarStr || textCache.avatarColor !== teamColors.text || radiusChanged) {
          avatarText.text = avatarStr;
          avatarText.style.fill = teamColors.text;
          avatarText.style.fontSize = disc.radius+1;
          textCache.avatar = avatarStr;
          textCache.avatarColor = teamColors.text;
        }
        avatarText.x = pos.x;
        avatarText.y = pos.y;
      }

      if (!currentPlayerDistinction || player.id !== followPlayerId) {
        const nameStr = showPlayerIds ? `[${player.id}] ${player.name}` : player.name;
        const textCache = discInfo.textCache || (discInfo.textCache = {});
        if (textCache.name !== nameStr) {
          playerNameText.text = nameStr;
          textCache.name = nameStr;
        }
        playerNameText.x = pos.x;
        playerNameText.y = pos.y;
        if (playerNameMask) {
          playerNameMask.x = pos.x;
          playerNameMask.y = pos.y;
        }
      } else {
        const textCache = discInfo.textCache || (discInfo.textCache = {});
        if (textCache.name !== "") {
          playerNameText.text = "";
          textCache.name = "";
        }
      }

      const chatIndicator = chatIndicatorInfo[player.id];
      if (chatIndicator.active && showChatIndicators){
        chatIndicator.gr.x = pos.x;
        chatIndicator.gr.y = pos.y-25;
        chatIndicator.gr.visible = true;
      } else {
        chatIndicator.gr.visible = false;
      }

      if (!discInfo.teamCache || discInfo.isKicking !== player.isKicking || radiusChanged) {
        const strokeGr = playerStroke;
        strokeGr.clear();
        if (squarePlayers) {
          strokeGr.rect(-disc.radius, -disc.radius, 2 * disc.radius, 2 * disc.radius);
        } else {
          strokeGr.circle(0, 0, disc.radius);
        }
        strokeGr.stroke({
          width: discLineWidth-2,
          color: player.isKicking ? 0xffffff : 0x000000
        });
        discInfo.isKicking = player.isKicking;
      }

      if (!discInfo.teamCache || discInfo.teamCache.teamId !== player.team.id || discInfo.teamCache.colors !== teamColors.inner || radiusChanged || discInfo.texturePath !== playerAvatarTexturePath){
        redrawPlayerDisc(discInfo, teamColors, disc, player);
        discInfo.teamCache = {
          teamId: player.team.id,
          colors: teamColors.inner
        };
        discInfo.texturePath = playerAvatarTexturePath;
      }

      discInfo.cache = { color: disc.color, radius: disc.radius };
    });

    joints.forEach((joint, id)=>{
      const jointInfo = customJointInfo[id];
      if (!jointInfo)
        return;
      const { gr, dx, dy } = jointInfo;
      const { x: x0, y: y0 } = discs[joint.d0].pos;
      const { x: x1, y: y1 } = discs[joint.d1].pos;
      const _dx = x1-x0, _dy = y1-y0;
      if (_dx!=dx || _dy!=dy){
        jointInfo.dx = _dx;
        jointInfo.dy = _dy;
        gr.clear();
        redrawJoint(jointInfo);
      }
      gr.x = x0;
      gr.y = y0;
    });

    updateHalo(roomState);
  }

  function updateGamePaused(gameState) {
    var paused = gameState.pauseGameTickCounter>0;
    setGamePaused(paused);
    if (!paused) {
      pauseRect.visible = false;
      return;
    }
    if (gameState.pauseGameTickCounter!=120) {
      pauseRect.visible = true;
      pauseRect.x = origin.x;
      pauseRect.y = origin.y + 100;
      pauseRect.scale.x = (gameState.pauseGameTickCounter/120)*200;
      pauseRect.scale.y = 1;
    } else {
      pauseRect.visible = false;
    }
    textInfo.gamePause.renderStatic();
  }

  function setGamePaused(pauseState) { // lr
    if (pauseState==gamePaused)
      return;
    if (!pauseState) {
      textInfo.gamePause.removeFromStage();
      pauseRect.visible = false;
    }
    params.canvas.style.filter = pauseState ? "grayscale(70%)" : "";
    gamePaused = pauseState;
  }


  var needsRecenter = false;

  function resizeCanvas(){
    var { canvas } = params;
    if (!canvas.parentElement)
      return { width: rendererObj.width, height: rendererObj.height };
    
    var rect = canvas.parentElement.getBoundingClientRect();
    var parentWidth = Math.round(rect.width);
    var parentHeight = Math.round(rect.height);
    
    var logicalWidth = parentWidth;
    var logicalHeight = parentHeight;

    const isBorderless = thisRenderer.displayMode === 'borderless';
    const targetRes = thisRenderer.resolution;

    if (isBorderless && targetRes && targetRes !== 'native' && targetRes !== 'custom') {
      const parts = targetRes.split('x');
      const w = Number(parts[0]), h = Number(parts[1]);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        logicalWidth = w;
        logicalHeight = h;
      }
    }
    thisRenderer.cssStretchFactor = parentHeight / logicalHeight;

    var expectedResolution = window.devicePixelRatio * thisRenderer.resolutionScale;
    var expectedPhysicalWidth = Math.round(logicalWidth * expectedResolution);
    var expectedPhysicalHeight = Math.round(logicalHeight * expectedResolution);
    
    if (needsRecenter || Math.abs(rendererObj.resolution - expectedResolution) > 0.001 || rendererObj.width !== expectedPhysicalWidth || rendererObj.height !== expectedPhysicalHeight){
      const changed = rendererObj.width !== expectedPhysicalWidth || rendererObj.height !== expectedPhysicalHeight || Math.abs(rendererObj.resolution - expectedResolution) > 0.001;
      
      rendererObj.resolution = expectedResolution;
      rendererObj.resize(logicalWidth, logicalHeight);
      
      params.canvas.style.width = '100%';
      params.canvas.style.height = '100%';
      
      stage.pivot.set(0, 0);
      stage.x = logicalWidth / 2;
      stage.y = logicalHeight / 2;
      
      if (fpsText) {
        fpsText.x = -logicalWidth / 2 + 20;
        fpsText.y = -logicalHeight / 2 + 20;
      }
      if (inputLagText) {
        inputLagText.x = -logicalWidth / 2 + 20;
        inputLagText.y = -logicalHeight / 2 + 40;
      }

      // If it is the first frame of the change, mark to re-orient the next frame as well (double-sync)
      if (changed && !needsRecenter) {
        needsRecenter = true;
      } else {
        needsRecenter = false;
      }
    }
    return { width: logicalWidth, height: logicalHeight };
  }

  function updateHalo(roomState){
    var pos = roomState.getPlayer(thisRenderer.followPlayerId)?.disc?.pos;
    if (thisRenderer.currentPlayerDistinction && pos){
      customHaloInfo.gr.x = pos.x;
      customHaloInfo.gr.y = pos.y;
      customHaloInfo.gr.visible = true;
      return;
    }
    customHaloInfo.gr.visible = false;
  };

  this.initialize = function(){
  var bottomEl = document.getElementsByClassName("chatbox-view")[0];
  this.resizeObserver = new ResizeObserver(function(entries){
    thisRenderer.bottomPaddingPx = entries[0].contentRect.height;
  });
  this.resizeObserver.observe(bottomEl);
    function loadScript(src, onload){
      var e = document.createElement("script");
      e.onload = onload;
      e.src = src;
      document.body.appendChild(e);
      return e;
    }

    async function isWebGPUSupported(){
      if (!('gpu' in navigator)) return false;
      try {
        const adapter = await navigator.gpu.requestAdapter();
        return !!adapter;
      } catch (e) {
        return false;
      }
    }

    async function createRenderer(){
      const wantsWebGPU = thisRenderer.webGPU && await isWebGPUSupported();

      const rendererOptions = {
        view: params.canvas,
        antialias: true,
        resolution: window.devicePixelRatio * thisRenderer.resolutionScale,
        autoDensity: false,
        backgroundColor: "#1099bb",
        forceFXAA: true,
        legacy: false,
        powerPreference: "high-performance",
      };

      rendererObj = wantsWebGPU ? new PIXI.WebGPURenderer() : new PIXI.WebGLRenderer();

      try {
        await rendererObj.init(rendererOptions);
      } catch (e) {
        console.warn("WebGL fallback", e);
        rendererObj = new PIXI.WebGLRenderer();
        await rendererObj.init(rendererOptions);
      }

      _regenerateNecessaryObjects();
    }
    
    scriptElem = loadScript("pixi/pixi.min.js", ()=>{
      texture1 = PIXI.Texture.from(params.images?.grass);
      texture2 = PIXI.Texture.from(params.images?.concrete);
      texture3 = PIXI.Texture.from(params.images?.concrete2);
      texture4 = PIXI.Texture.from(params.images?.typing);
      thisRenderer.followPlayerId = thisRenderer.room?.currentPlayerId;

      createRenderer();
    });
  };

  this.finalize = function(){
    stage?.destroy(true);
    stage2?.destroy(true);
    stage3?.destroy(true);
    rendererObj?.destroy(true);
    scriptElem && document.body.removeChild(scriptElem);
    scriptElem = null;
    if (PIXI) PIXI=null;
    rendererObj = null;
    stage = null;
    stage2 = null;
    stage3 = null;
    texture1?.destroy(true);
    texture2?.destroy(true);
    texture3?.destroy(true);
    texture4?.destroy(true);
    texture1 = null;
    texture2 = null;
    texture3 = null;
    texture4 = null;
    customDiscInfo = null;
    customJointInfo = null;
    customSegmentInfo = null;
    customHaloInfo = null;
    textInfo = null;
    locationIndicatorInfo = null;
    chatIndicatorInfo = null;
    _stopCustomLoop();
    thisRenderer.resizeObserver?.disconnect();
    thisRenderer.resizeObserver = null;
  };

  var customLoopId = null;
  var renderFromCustomLoop = false;
  const RenderResult = {
    skipped: 0,
    rendered: 1,
    blocked: 2,
  };

  function _resetFrameThrottleState() {
    framesInFlight = 0;
    renderBlockedByGPU = false;
    forceImmediateRender = false;
    messagePending = false;
    rendererLifecycleToken++;
  }

  function _resolveFrameCompletion(token) {
    if (token !== rendererLifecycleToken)
      return;
    framesInFlight = Math.max(0, framesInFlight - 1);
    if (renderBlockedByGPU && isLoopRunning) {
      renderBlockedByGPU = false;
      messageChannel.port2.postMessage(null);
    }
  }

  function _trackSubmittedFrame(queue) {
    framesInFlight++;
    const token = rendererLifecycleToken;
    queue.onSubmittedWorkDone().then(
      ()=>_resolveFrameCompletion(token),
      ()=>_resolveFrameCompletion(token)
    );
  }

  function _getGPUQueue() {
    return rendererObj?.gpu?.device?.queue;
  }

  function _doRender() {
    if (!stage || !stage2 || !stage3)
      return RenderResult.skipped;
    if (!params.paintGame || !rendererObj)
      return RenderResult.skipped;
    const queue = _getGPUQueue();
    if (queue?.onSubmittedWorkDone && framesInFlight >= maxFramesInFlight) {
      renderBlockedByGPU = true;
      return RenderResult.blocked;
    }
    var extrapolatedRoomState = thisRenderer.room.extrapolate(thisRenderer.extrapolation, true);
    if (!extrapolatedRoomState.gameState)
      return RenderResult.skipped;

    // 1. Synchronize dimensions and capture final LOGICAL values immediately
    const currentDims = resizeCanvas();
    const currentWidth = currentDims.width;
    const currentHeight = currentDims.height;

    var time = window.performance.now();
    spf = (time-lastRenderTime)/1000;
    var followPlayer = extrapolatedRoomState.getPlayer(thisRenderer.followPlayerId), followDisc = followPlayer?.disc;
    
    // USE the newly confirmed dimensions for the camera and framing
    var stadium = extrapolatedRoomState.gameState.stadium;
    var maxViewWidth = 2*stadium.width+100;
    var zoomCoeff = thisRenderer.zoomCoeff;
    if (currentWidth/zoomCoeff > maxViewWidth){
      zoomCoeff = currentWidth/maxViewWidth;
    }
    var viewWidth = currentWidth/zoomCoeff;
    var viewHeight = currentHeight/zoomCoeff;
    var geo = computeViewportGeometry(stadium, viewWidth, viewHeight, zoomCoeff);
    
    lastRenderTime = time;
    updateCameraOrigin(extrapolatedRoomState.gameState, followDisc, geo, spf);
    update(extrapolatedRoomState, geo);
    if (extrapolatedRoomState.gameState.pauseGameTickCounter<=0){
      updateText(spf);
      renderText();
    }
    if (thisRenderer.showFPS && fpsText) {
      fpsFrameCount++;
      if (time - fpsLastSecond >= 1000) {
        fpsDisplay = fpsFrameCount;
        fpsFrameCount = 0;
        fpsLastSecond = time;
        fpsText.text = "FPS: " + fpsDisplay;
      }
    }
    if (thisRenderer.showInputLag && inputLagText && thisRenderer.room._lastInputTime) {
      const currentInputTime = thisRenderer.room._lastInputTime;
      if (currentInputTime !== lastProcessedInputTime) {
        const lag = time - currentInputTime;
        inputLagRollingSum += lag;
        inputLagRollingCount++;
        lastProcessedInputTime = currentInputTime;
      }
      
      if (inputLagRollingCount >= 10) {
        const avgLag = inputLagRollingSum / inputLagRollingCount;
        inputLagText.text = "Input Lag: " + avgLag.toFixed(2) + "ms";
        inputLagRollingSum = 0;
        inputLagRollingCount = 0;
      }
    }
    rendererObj.render({container: stage});
    if (queue?.onSubmittedWorkDone) {
      renderBlockedByGPU = false;
      _trackSubmittedFrame(queue);
    }
    params.onRequestAnimationFrame?.(extrapolatedRoomState);
    return RenderResult.rendered;
  }

  var messageChannel = new MessageChannel();
  var isLoopRunning = false;
  var targetFrameTime = 0;
  var messagePending = false;

  function _postToLoop() {
    if (messagePending) return;
    messagePending = true;
    messageChannel.port2.postMessage(null);
  }

  messageChannel.port1.onmessage = async function() {
    messagePending = false;
    if (!isLoopRunning) return;
    if (customLoopId != null) {
      clearTimeout(customLoopId);
      customLoopId = null;
    }

    var now = performance.now();
    const bypassFrameLimit = forceImmediateRender;

    // If targetFPS > 0, we prioritize that. 
    if (thisRenderer.targetFPS > 0 && !bypassFrameLimit) {
      if (now < targetFrameTime) {
        // Not time yet? Use a hybrid approach to save CPU
        var remaining = targetFrameTime - now;
        if (remaining > 5) {
          // If more than 5ms remaining, use a passive sleep to save CPU
          customLoopId = setTimeout(() => {
            if (isLoopRunning) _postToLoop();
          }, remaining - 2); // Wait until almost the right time
        } else {
          // SPIN MODE: Check in every possible tick for sub-ms precision
          _postToLoop();
        }
        return;
      }
      // TIME TO RENDER
      targetFrameTime = Math.max(now, targetFrameTime + 1000 / thisRenderer.targetFPS);
    }

    renderFromCustomLoop = true;
    thisRenderer.room._flushPendingKeyState?.();
    const renderResult = _doRender();
    renderFromCustomLoop = false;
    if (renderResult === RenderResult.rendered) {
      forceImmediateRender = false;
      if (thisRenderer.targetFPS > 0 && bypassFrameLimit)
        targetFrameTime = now + 1000 / thisRenderer.targetFPS;
    }
    if (renderResult === RenderResult.blocked)
      return;

    // Continue the loop
    _postToLoop();
  };

  function _scheduleNextTick() {
    if (!isLoopRunning) return;
    targetFrameTime = performance.now();
    _postToLoop();
  }

  function _customRenderTick() {
    _scheduleNextTick();
  }

  function _requestImmediateRender() {
    if (!isLoopRunning)
      return;
    forceImmediateRender = true;
    if (customLoopId != null) {
      clearTimeout(customLoopId);
      customLoopId = null;
    }
    _postToLoop();
  }

  function _startCustomLoop() {
    if (isLoopRunning) return;
    _resetFrameThrottleState();
    isLoopRunning = true;
    _scheduleNextTick();
  }

  function _stopCustomLoop() {
    isLoopRunning = false;
    _resetFrameThrottleState();
    if (customLoopId != null) {
      clearTimeout(customLoopId);
      customLoopId = null;
    }
    messageChannel.port1.close();
    messageChannel.port2.close();
  }

  this.render = function(){ // render logic here. called inside requestAnimationFrame callback
    // When custom loop is active, skip rAF-triggered renders to avoid double-rendering
    if (isLoopRunning && !renderFromCustomLoop)
      return;
    _doRender();
  };

  this.requestImmediateRender = function() {
    _requestImmediateRender();
  };

  // Start the custom render loop once the renderer is ready
  var _origInitialize = this.initialize;
  this.initialize = function() {
    _origInitialize?.call(thisRenderer);
    _startCustomLoop();
  };

  this.fps = function(){
    return 1/spf;
  };

  // you can keep track of changes using these callbacks, and apply them in your render logic:

  this.onPlayerChatIndicatorChange = function(id, value, customData){ // wl (a, b)
    chatIndicatorInfo[id] && (chatIndicatorInfo[id].active = value);
  };

  this.onPlayerJoin = function(playerObj, customData){
    if (!stage2) return;
    if (playerObj.disc) {
      _addMissingDiscInfos();
      _addLocationIndicatorForPlayer(playerObj.id, playerObj.team.color);
    }
    _addChatIndicatorForPlayer(playerObj.id);
  };

  this.onPlayerLeave = function (playerObj, reason, isBanned, byId, customData) {
    _removeDiscByPlayerId(playerObj.id);
    _removeChatIndicatorForPlayer(playerObj.id);
    _removeLocationIndicatorForPlayer(playerObj.id);
  };

  this.onPlayerTeamChange = function (id, teamId, byId, customData) {
    if (!customDiscInfo) return;
    const player = thisRenderer.room.getPlayer(id);
    const hadDiscInfo = customDiscInfo.some(info => info && info.playerId === id);
    const hasDiscNow = !!player?.disc;

    if (hadDiscInfo && !hasDiscNow) {
      _removeDiscByPlayerId(id);
      _removeLocationIndicatorForPlayer(id);
      _removeChatIndicatorForPlayer(id);
    } else if (!hadDiscInfo && hasDiscNow) {
      _addMissingDiscInfos();
      _addLocationIndicatorForPlayer(id, player.team.color);
      _addChatIndicatorForPlayer(id);
    }
  };

  this.onVariableValueChange = function(addonObject, variableName, oldValue, newValue){
    if (addonObject!=thisRenderer)
      return;
    switch(variableName){
      case "squarePlayers":
        redrawHalo();
        const discs = thisRenderer.room.state.gameState.physicsState.discs;
        for (let i=0;i<discs.length;i++){
          if (discs[i].playerId!==null && discs[i].playerId!==undefined){
            const playerObj = thisRenderer.room.getPlayer(discs[i].playerId);
            const discInfo = customDiscInfo[i];
            var teamColors = thisRenderer.showTeamColors ? thisRenderer.room.state.teamColors[playerObj.team.id] : defaultTeamColors[playerObj.team.id];
            redrawPlayerDisc(discInfo, teamColors, playerObj.disc, playerObj);
          }
        }
        break;
      case "drawBackground":
      case "showInvisibleSegments":
      case "showVertices":
      case "generalLineWidth":
      case "discLineWidth":
        _regenerateNecessaryObjects();
        break;
      case "showFPS":
        if (fpsText) fpsText.visible = newValue;
        break;
      case "showInputLag":
        if (inputLagText) inputLagText.visible = newValue;
        break;
      case "resolutionScale":
        if (rendererObj) {
            rendererObj.resolution = window.devicePixelRatio * newValue;
            _regenerateNecessaryObjects();
        }
        break;
      case "displayMode":
      case "resolution":
        resizeCanvas();
        break;
    }
  };

  this.onTeamGoal = function(teamId, goalId, goal, ballDiscId, ballDisc, customData){ // Ni (a)
    addText((teamId==Team.red.id) ? textInfo.redScore : textInfo.blueScore);
  };

  this.onGameStart = function(byId, customData){ // Ki (a)
    _regenerateNecessaryObjects();
    resetTexts();
  };

  this.onGameEnd = function(winningTeamId, customData){ // Oi (a)
    addText((winningTeamId==Team.red.id) ? textInfo.redVictory : textInfo.blueVictory);
  };

  this.onGameStop = function(winningTeamId, customData){
    stage?.destroy();
    stage = null;
    customDiscInfo = null;
    customJointInfo = null;
  };

  this.onTimeIsUp = function(customData){ // Pi ()
    addText(textInfo.timeUp);
  };

  this.zoomIn = function(pixelCoordX, pixelCoordY, zoomCoeff){
    var k = (1-1/zoomCoeff)/scale;
    origin.x += k*(pixelCoordX - (rendererObj ? rendererObj.screen.width/2 : params.canvas.width/2));
    origin.y += k*(pixelCoordY - (rendererObj ? rendererObj.screen.height/2 : params.canvas.height/2));
    scale *= zoomCoeff;
    thisRenderer.zoomCoeff = scale;
    stage2.scale.set(scale, scale);
    return scale;
  };

  this.zoomOut = function(pixelCoordX, pixelCoordY, zoomCoeff){
    var k = (1-zoomCoeff)/scale;
    origin.x += k*(pixelCoordX - (rendererObj ? rendererObj.screen.width/2 : params.canvas.width/2));
    origin.y += k*(pixelCoordY - (rendererObj ? rendererObj.screen.height/2 : params.canvas.height/2));
    scale /= zoomCoeff;
    thisRenderer.zoomCoeff = scale;
    stage2.scale.set(scale, scale);
    return scale;
  };

  this.onWheel = function(event){
    if (event.deltaY<0)
      return thisRenderer.zoomIn(event.offsetX, event.offsetY, thisRenderer.wheelZoomCoeff);
    else
      return thisRenderer.zoomOut(event.offsetX, event.offsetY, thisRenderer.wheelZoomCoeff);
  };

  this.setZoom = function(pixelCoordX, pixelCoordY, targetZoom) {
      var k = (1 - scale / targetZoom) / scale;

      origin.x += k * (pixelCoordX - (rendererObj ? rendererObj.screen.width / 2 : params.canvas.width / 2));
      origin.y += k * (pixelCoordY - (rendererObj ? rendererObj.screen.height / 2 : params.canvas.height / 2));

      scale = targetZoom;
      thisRenderer.zoomCoeff = scale;
      if (stage2 && stage2.scale) {
        stage2.scale.set(targetZoom, targetZoom);
      }

      return scale;
  };

  this.onLanguageChange = function(abbr, customData){
    //_regenerateNecessaryObjects();
  };

  this.onKeyDown = function(e){
    switch(e.keyCode){
      case 107:{ // Numpad '+' key
        thisRenderer.zoomCoeff += 0.1;
        scale += 0.1;
        _regenerateNecessaryObjects();
        break;
      }
      case 109:{ // Numpad '-' key
        thisRenderer.zoomCoeff -= 0.1;
        if (thisRenderer.zoomCoeff<=0){
          thisRenderer.zoomCoeff = 0.01;
          scale = 0.01;
        }
        else
          scale -= 0.1;
        _regenerateNecessaryObjects();
        break;
      }
    }
  };

  this.transformPixelCoordToMapCoord = (x, y)=>({
    x: (x-params.canvas.width/2)/scale+origin.x, 
    y: (y-params.canvas.height/2)/scale+origin.y
  });
  this.transformMapCoordToPixelCoord = (x, y)=>({
    x: scale*(x-origin.x)+params.canvas.width/2, 
    y: scale*(y-origin.y)+params.canvas.height/2
  });
  this.transformPixelDistanceToMapDistance = (dist)=>dist/scale;
  this.transformMapDistanceToPixelDistance = (dist)=>dist*scale;
  this.getOrigin = ()=>origin;
  this.getActualZoomCoefficient = ()=>scale;
  this.setOrigin = (_origin)=>{
    origin.x = _origin.x;
    origin.y = _origin.y;
  };

  // snapshot support

  this.takeSnapshot = function(){
    var { webGPU, extrapolation, zoomCoeff, wheelZoomCoeff, showTeamColors, showAvatars, showPlayerIds, resolutionScale, followPlayerId, restrictCameraOrigin, followMode, showChatIndicators, showFPS, drawBackground, squarePlayers, currentPlayerDistinction, showInvisibleSegments, showVertices, generalLineWidth, discLineWidth, displayMode, resolution } = thisRenderer;
    return {
      webGPU, 
      extrapolation, 
      showTeamColors, 
      showAvatars, 
      showPlayerIds, 
      zoomCoeff, 
      wheelZoomCoeff, 
      resolutionScale, 
      showChatIndicators, 
      showFPS, 
      restrictCameraOrigin, 
      followMode, 
      followPlayerId, 
      drawBackground, 
      squarePlayers, 
      currentPlayerDistinction, 
      showInvisibleSegments, 
      showVertices, 
      generalLineWidth, 
      discLineWidth,
      displayMode,
      resolution,
      /*
      customDiscInfo: JSON.parse(JSON.stringify(customDiscInfo)), 
      customJointInfo: JSON.parse(JSON.stringify(customJointInfo)), 
      customSegmentInfo: JSON.parse(JSON.stringify(customSegmentInfo)), 
      customHaloInfo: JSON.parse(JSON.stringify(customHaloInfo)), 
      textInfo: JSON.parse(JSON.stringify(textInfo)), 
      locationIndicatorInfo: JSON.parse(JSON.stringify(locationIndicatorInfo)), 
      chatIndicatorInfo: JSON.parse(JSON.stringify(chatIndicatorInfo)), 
      */
      scale,
      origin: JSON.parse(JSON.stringify(origin)), 
      gamePaused
    };
  };

  this.useSnapshot = function(snapshot){
    var { webGPU, extrapolation, zoomCoeff, wheelZoomCoeff, showTeamColors, showAvatars, showPlayerIds, resolutionScale, followPlayerId, restrictCameraOrigin, followMode, showChatIndicators, showFPS, drawBackground, squarePlayers, currentPlayerDistinction, showInvisibleSegments, showVertices, generalLineWidth, discLineWidth, displayMode, resolution } = snapshot;
    Object.assign(thisRenderer, {
      webGPU, 
      extrapolation, 
      showTeamColors, 
      showAvatars, 
      showPlayerIds, 
      zoomCoeff, 
      wheelZoomCoeff, 
      resolutionScale, 
      showChatIndicators, 
      showFPS, 
      restrictCameraOrigin, 
      followMode, 
      followPlayerId, 
      drawBackground, 
      squarePlayers, 
      currentPlayerDistinction, 
      showInvisibleSegments, 
      showVertices, 
      generalLineWidth, 
      discLineWidth,
      displayMode,
      resolution
    });
    /*
    customDiscInfo = snapshot.customDiscInfo;
    customJointInfo = snapshot.customJointInfo;
    customSegmentInfo = snapshot.customSegmentInfo;
    customHaloInfo = snapshot.customHaloInfo;
    textInfo = snapshot.textInfo;
    locationIndicatorInfo = snapshot.locationIndicatorInfo;
    chatIndicatorInfo = snapshot.chatIndicatorInfo;
    */
    scale = snapshot.scale;
    origin = snapshot.origin;
    gamePaused = snapshot.gamePaused;
  };
};
