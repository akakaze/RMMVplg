/*=============================================================================
 * Akakaze - LayerMap
 * By IF_Akakaze - https://github.com/akakaze/RMMVplg
 * AkakazeLayerMap.js
 * Version: 1.2.0
 * 免費授權給商業與非商業用途。
 *=============================================================================*/
/*:
 * @plugindesc 將地圖讀取後輸出畫面變成圖層。
 * @author IF_Akakaze
 *
 * @param Layer Tag
 * @desc 設定圖層地圖名稱的標記
 * @default AkakazeLayer
 *
 * @param Layer Z
 * @desc 圖層預設的Z值，在圖層地圖沒有設定Z值的時候啟用。Z值是圖層的高度，Z值大的會覆蓋Z值小的圖層(玩家角色圖層預設是3)。
 * @default 4
 *
 * @param Parallax Opacity
 * @desc 圖層預設的Z值，在圖層地圖沒有設定Z值的時候啟用。Z值是圖層的高度，Z值大的會覆蓋Z值小的圖層(玩家角色圖層預設是3)。
 * @default 200
 * 
 * @help
 * ＞使用方法：
 * 1.將圖層地圖標記，標記方式為: <Layer Tag:X|Y|Z>
 * 2.將圖層地圖置於母地圖之下(編輯器左下，變成能讓母地圖折疊圖層地圖)
 * 
 * ＞將圖層標記設定在圖層名稱(不是顯示名稱！)，除了圖層標記外依然可以設定名稱
 * EX. "Aka的圖層 <AkakazeLayer:10>" | "kaze的圖層 <AkakazeLayer>"
 * 
 * ＞詳細預設圖層Z值請參考
 * https://github.com/rpgtkoolmv/corescript/blob/master/js/rpg_core/Tilemap.js#L263
 * 
 * ＞其他作品歡迎參觀 https://github.com/akakaze/RMMVplg
 */

(function() {
    var _map_id;
    var _data_map;
    var _layer_maps = {};
    var _param = {};

    var parameters = PluginManager.parameters('AkakazeLayer');
    _param["layerTag"] = parameters['Layer Tag'];
    _param["layerZ"] = parseInt(parameters['Default Layer Z'], 10) || 4;
    _param["opacity"] = parseInt(parameters['Parallax Opacity'], 10) || 200;
    _param["opacity"] = _param["opacity"].clamp(0, 255);

    function AkakazeLayerMap() {
        Tilemap.apply(this, arguments);
        this.lastRegionId = 0;
        this.currentRegionId = 0;
    }
    AkakazeLayerMap.prototype = Object.create(Tilemap.prototype);
    AkakazeLayerMap.prototype.constructor = AkakazeLayerMap;
    AkakazeLayerMap.prototype._createLayers = function() {
        var width = this._width;
        var height = this._height;
        var margin = this._margin;
        var tileCols = Math.ceil(width / this._tileWidth) + 1;
        var tileRows = Math.ceil(height / this._tileHeight) + 1;
        var layerWidth = tileCols * this._tileWidth;
        var layerHeight = tileRows * this._tileHeight;
        this._layerWidth = layerWidth;
        this._layerHeight = layerHeight;
        this._bitmap = new Bitmap(layerWidth, layerHeight);
        this._layer = new Sprite();
        this._layer.move(-margin, -margin,
            width,
            height);
        for (var j = 0; j < 4; j++) {
            this._layer.addChild(new Sprite(this._bitmap));
        }
        this.addChild(this._layer);
    };
    AkakazeLayerMap.prototype._updateLayerPositions = function(startX, startY) {
        var m = this._margin;
        var ox = Math.floor(this.origin.x);
        var oy = Math.floor(this.origin.y);
        var x2 = (ox - m).mod(this._layerWidth);
        var y2 = (oy - m).mod(this._layerHeight);
        var w1 = this._layerWidth - x2;
        var h1 = this._layerHeight - y2;
        var w2 = this._width - w1;
        var h2 = this._height - h1;
        children = this._layer.children;
        children[0].move(0, 0, w1, h1);
        children[0].setFrame(x2, y2, w1, h1);
        children[1].move(w1, 0, w2, h1);
        children[1].setFrame(0, y2, w2, h1);
        children[2].move(0, h1, w1, h2);
        children[2].setFrame(x2, 0, w1, h2);
        children[3].move(w1, h1, w2, h2);
        children[3].setFrame(0, 0, w2, h2);
    };
    AkakazeLayerMap.prototype._paintAllTiles = function(startX, startY) {
        Tilemap.prototype._paintAllTiles.call(this, startX, startY);
        if (this.lastRegionId !== this.currentRegionId)
            this.lastRegionId = this.currentRegionId;
    };
    AkakazeLayerMap.prototype._paintTiles = function(startX, startY, x, y) {
        var tableEdgeVirtualId = 10000;
        var mx = startX + x;
        var my = startY + y;
        var dx = (mx * this._tileWidth).mod(this._layerWidth);
        var dy = (my * this._tileHeight).mod(this._layerHeight);
        var lx = dx / this._tileWidth;
        var ly = dy / this._tileHeight;
        var tileId0 = this._readMapData(mx, my, 0);
        var tileId1 = this._readMapData(mx, my, 1);
        var tileId2 = this._readMapData(mx, my, 2);
        var tileId3 = this._readMapData(mx, my, 3);
        var shadowBits = this._readMapData(mx, my, 4);
        var regionId = this._readMapData(mx, my, 5);
        var upperTileId1 = this._readMapData(mx, my - 1, 1);
        var tiles = [];
        var regionCheck = false;

        tiles.push(tileId0);
        tiles.push(tileId1);
        tiles.push(-shadowBits);
        if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
            if (!Tilemap.isShadowingTile(tileId0)) {
                tiles.push(tableEdgeVirtualId + upperTileId1);
            }
        }
        tiles.push(tileId2);
        tiles.push(tileId3);

        if (this.lastRegionId !== this.currentRegionId) {
            regionCheck = true;
        }

        if (regionId !== 0 &&
            regionId === this.currentRegionId) {
            this._bitmap.paintOpacity = _param["opacity"];
        } else {
            this._bitmap.paintOpacity = 255;
        }

        var lastLowerTiles = this._readLastTiles(0, lx, ly);
        if (!tiles.equals(lastLowerTiles) ||
            (Tilemap.isTileA1(tileId0) && this._frameUpdated) ||
            regionCheck) {
            this._bitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
            for (var i = 0; i < tiles.length; i++) {
                var tileId = tiles[i];
                if (tileId < 0) {
                    this._drawShadow(this._bitmap, shadowBits, dx, dy);
                } else if (tileId >= tableEdgeVirtualId) {
                    this._drawTableEdge(this._bitmap, upperTileId1, dx, dy);
                } else {
                    this._drawTile(this._bitmap, tileId, dx, dy);
                }
            }
            this._writeLastTiles(0, lx, ly, tiles);
        }
    };
    AkakazeLayerMap.prototype.setPosition = function(x, y) {
        this._posX = x;
        this._posY = y;
    };
    AkakazeLayerMap.prototype.updatePosition = function() {
        this.origin.x = ($gameMap.displayX() - this._posX) * $gameMap.tileWidth();
        this.origin.y = ($gameMap.displayY() - this._posY) * $gameMap.tileHeight();
    };
    AkakazeLayerMap.prototype.updatePerspective = function() {
        var x = $gamePlayer.x - this._posX;
        var y = $gamePlayer.y - this._posY;
        var ri = this._readMapData(x, y, 5);
        if (ri !== this.currentRegionId) {
            this.lastRegionId = this.currentRegionId;
            this.currentRegionId = ri;
        }
    };

    function getLayerData(map_id) {
        return new Promise(function(resolve, reject) {
            var map_url = 'data/Map%1.json'.format(map_id.padZero(3));
            var xhr = new XMLHttpRequest();
            xhr.open('GET', map_url);
            xhr.overrideMimeType('application/json');
            xhr.onload = function() {
                if (xhr.status < 400) {
                    resolve(xhr.responseText);
                }
            };
            xhr.onerror = SceneManager.catchException;
            xhr.send();
        });
    }

    function parseLayerData(mapdata) {
        _data_map = JSON.parse(mapdata);
    }

    function AkakazeOnLoad(obj) { // 找出帶有標記的地圖名稱並記錄在 $dataMapInfos
        if (obj === $dataMapInfos) {
            var re = /<([^<>:]+):?(\d*)\|?(\d*)\|?(\d*)>/;
            obj.forEach(function(map) {
                if (map) {
                    var id = map["id"];
                    var name = map["name"];
                    var parent = map["parentId"];
                    var match = name.match(re);
                    if (match && match[1] === _param["layerTag"]) { //param
                        _layer_maps[parent] = {};
                        var layer_x = parseInt(match[2]);
                        var layer_y = parseInt(match[3]);
                        var layer_z = parseInt(match[4]);
                        _layer_maps[parent].id = id;
                        _layer_maps[parent].x = Number.isNaN(layer_x) ? 0 : layer_x;
                        _layer_maps[parent].y = Number.isNaN(layer_y) ? 0 : layer_y;
                        _layer_maps[parent].z = Number.isNaN(layer_z) ? _param["layerZ"] : layer_z;
                    }
                }
            }, this);
            console.log(_layer_maps);
        }
    }

    function AkakazeInitialize() { //初始化數值
        _map_id = null;
        _data_map = null;
    }

    function AkakazeCreate() { //讀取圖層地圖
        _map_id = this._transfer ? $gamePlayer.newMapId() : $gameMap.mapId();
        if (_layer_maps[_map_id]) {
            var layer_id = _layer_maps[_map_id].id;
            getLayerData(layer_id)
                .then(parseLayerData);
        }
    }

    function getLayerTileMap() { //讀取tileset
        // console.log("Spriteset_Map.prototype.AkakazeLoadTileset");
        var tile_sets = $dataTilesets[_data_map.tilesetId];
        var tilesetNames = tile_sets.tilesetNames;
        if (tilesetNames.equals(this._tileset.tilesetNames))
            this.akakaze_tilemap.bitmaps = this._tilemap.bitmaps;
        else {
            for (var i = 0; i < tilesetNames.length; i++) {
                this.akakaze_tilemap.bitmaps[i] = ImageManager.loadTileset(tilesetNames[i]);
            }
        }
        var newTilesetFlags = tile_sets.flags;
        if (!this.akakaze_tilemap.flags.equals(newTilesetFlags)) {
            this.akakaze_tilemap.refresh();
        }
        this.akakaze_tilemap.flags = tile_sets.flags;
    }

    function AkakazeCreateLowerLayer() {
        // console.log("Spriteset_Map.prototype.AkakazeCreateLowerLayer");
        if (_data_map) {
            this.akakaze_tilemap = new AkakazeLayerMap();
            this.akakaze_tilemap.setData(_data_map.width, _data_map.height, _data_map.data);
            this.akakaze_tilemap.horizontalWrap = _data_map.scrollType === 2 || _data_map.scrollType === 3;
            this.akakaze_tilemap.verticalWrap = _data_map.scrollType === 1 || _data_map.scrollType === 3;
            getLayerTileMap.call(this);
            this.akakaze_tilemap.setPosition(_layer_maps[_map_id].x, _layer_maps[_map_id].y);
            this.akakaze_tilemap.z = _layer_maps[_map_id].z;
            this._tilemap.addChild(this.akakaze_tilemap);
            console.log(this.akakaze_tilemap);
        }
    }

    function AkakazeUpdate() {
        // console.log("Spriteset_Map.prototype.AkakazeUpdate");
        if (this.akakaze_tilemap && this.akakaze_tilemap.isReady()) {
            this.akakaze_tilemap.updatePerspective();
            this.akakaze_tilemap.updatePosition();
        }
    }

    var DataManager_onLoad = DataManager.onLoad;
    DataManager.onLoad = function(obj) {
        DataManager_onLoad.call(this, obj);
        AkakazeOnLoad.call(this, obj);
    }

    var Scene_Map_initialize = Scene_Map.prototype.initialize;
    Scene_Map.prototype.initialize = function() {
        Scene_Map_initialize.call(this);
        AkakazeInitialize.call(this);
    }

    var Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        Scene_Map_create.call(this);
        AkakazeCreate.call(this);
    }

    var Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        Spriteset_Map_createLowerLayer.call(this);
        AkakazeCreateLowerLayer.call(this);
    }

    var Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        Spriteset_Map_update.call(this);
        AkakazeUpdate.call(this);
    }
})();