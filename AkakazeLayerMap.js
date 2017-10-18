/*=============================================================================
 * Akakaze - LayerMap
 * By IF_Akakaze - https://github.com/akakaze/RMMVplg
 * AkakazeLayerMap.js
 * Version: 1.0.0
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
 * @param Default Layer Z
 * @desc 圖層預設的Z值，在圖層地圖沒有設定Z值的時候啟用。Z值是圖層的高度，Z值大的會覆蓋Z值小的圖層(玩家角色圖層預設是3)。
 * @default 5
 * 
 * @help
 * ＞使用方法：
 * 1.將圖層地圖標記，標記方式為: <Layer Tag:Default Layer Z>
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
    var _layer_id;
    var _data_map;
    var _layer_isload;
    var _layer_isReady;
    var _param = {};

    var parameters = PluginManager.parameters('AkakazeLayer');
    _param["layerTag"] = parameters['Layer Tag']; //"AkakazeLayer"
    _param["layerZ"] = parseInt(parameters['Default Layer Z'], 10) || 5; //5

    function AkakazeLayerMap() {
        Tilemap.apply(this, arguments);
        this.lastRegionId = 0;
        this.currentRegionId = 0;
    }

    AkakazeLayerMap.prototype = Object.create(Tilemap.prototype);
    AkakazeLayerMap.prototype.constructor = AkakazeLayerMap;
    AkakazeLayerMap.prototype.updatePerspective = function() {
        var x = $gamePlayer.x;
        var y = $gamePlayer.y;
        var ri = this._readMapData(x, y, 5);
        if (ri !== this.currentRegionId) {
            this.lastRegionId = this.currentRegionId;
            this.currentRegionId = ri;
        }
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
        var lowerTiles = [];
        var upperTiles = [];
        var regionCheck = false;

        if (this._isHigherTile(tileId0)) {
            upperTiles.push(tileId0);
        } else {
            lowerTiles.push(tileId0);
        }
        if (this._isHigherTile(tileId1)) {
            upperTiles.push(tileId1);
        } else {
            lowerTiles.push(tileId1);
        }

        lowerTiles.push(-shadowBits);

        if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
            if (!Tilemap.isShadowingTile(tileId0)) {
                lowerTiles.push(tableEdgeVirtualId + upperTileId1);
            }
        }

        if (this._isOverpassPosition(mx, my)) {
            upperTiles.push(tileId2);
            upperTiles.push(tileId3);
        } else {
            if (this._isHigherTile(tileId2)) {
                upperTiles.push(tileId2);
            } else {
                lowerTiles.push(tileId2);
            }
            if (this._isHigherTile(tileId3)) {
                upperTiles.push(tileId3);
            } else {
                lowerTiles.push(tileId3);
            }
        }

        if (regionId !== 0 &&
            this.lastRegionId !== this.currentRegionId) {
            regionCheck = true;
            if (regionId === this.currentRegionId) {
                this._lowerBitmap.paintOpacity = 128;
                this._upperBitmap.paintOpacity = 128;
            }
        }

        var lastLowerTiles = this._readLastTiles(0, lx, ly);
        if (!lowerTiles.equals(lastLowerTiles) ||
            (Tilemap.isTileA1(tileId0) && this._frameUpdated) ||
            regionCheck) {
            this._lowerBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
            for (var i = 0; i < lowerTiles.length; i++) {
                var lowerTileId = lowerTiles[i];
                if (lowerTileId < 0) {
                    this._drawShadow(this._lowerBitmap, shadowBits, dx, dy);
                } else if (lowerTileId >= tableEdgeVirtualId) {
                    this._drawTableEdge(this._lowerBitmap, upperTileId1, dx, dy);
                } else {
                    this._drawTile(this._lowerBitmap, lowerTileId, dx, dy);
                }
            }
            this._writeLastTiles(0, lx, ly, lowerTiles);
        }

        var lastUpperTiles = this._readLastTiles(1, lx, ly);
        if (!upperTiles.equals(lastUpperTiles) ||
            regionCheck) {
            this._upperBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
            for (var j = 0; j < upperTiles.length; j++) {
                this._drawTile(this._upperBitmap, upperTiles[j], dx, dy);
            }
            this._writeLastTiles(1, lx, ly, upperTiles);
        }
        this._lowerBitmap.paintOpacity = 255;
        this._upperBitmap.paintOpacity = 255;
    };
    AkakazeLayerMap.prototype.constructor = AkakazeLayerMap;

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
        _layer_isload = true;
    }

    function AkakazeOnLoad(obj) { // 找出帶有標記的地圖名稱並記錄在 $dataMapInfos
        if (obj === $dataMapInfos) {
            var re = /<([^<>:]+)(:?)([^>]*)>/;
            obj.forEach(function(map) {
                if (map) {
                    var id = map["id"];
                    var name = map["name"];
                    var parent = map["parentId"];
                    var match = name.match(re);
                    if (match && match[1] === _param["layerTag"]) { //param
                        $dataMapInfos[parent][_param["layerTag"]] = {};
                        $dataMapInfos[parent][_param["layerTag"]]["id"] = id;
                        var layer_z = parseInt(match[3]);
                        if (!Number.isNaN(layer_z)) {
                            $dataMapInfos[parent][_param["layerTag"]]["z"] = layer_z;
                        } else {
                            $dataMapInfos[parent][_param["layerTag"]]["z"] = _param["layerZ"]; //param
                        }
                    }
                }
            }, this);
        }
    }

    function AkakazeInitialize() { //初始化數值
        _map_id = null;
        _layer_id = null;
        _data_map = null;
        _layer_isload = false;
        _layer_isReady = false;
    }

    function AkakazeCreate() { //讀取圖層地圖
        _map_id = this._transfer ? $gamePlayer.newMapId() : $gameMap.mapId();
        if ($dataMapInfos[_map_id][_param["layerTag"]]) {
            _layer_id = $dataMapInfos[_map_id][_param["layerTag"]]["id"];
            getLayerData(_layer_id)
                .then(parseLayerData);
        } else _layer_isload = true;
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
            console.log(this.akakaze_tilemap);
            this.akakaze_tilemap.z = $dataMapInfos[_map_id][_param["layerTag"]]["z"];
            this._tilemap.addChild(this.akakaze_tilemap);

            _layer_isReady = true;
        }
    }

    function AkakazeUpdate() {
        // console.log("Spriteset_Map.prototype.AkakazeUpdate");
        if (_layer_isReady) {
            this.akakaze_tilemap.updatePerspective();
            this.akakaze_tilemap.origin.x = $gameMap.displayX() * $gameMap.tileWidth();
            this.akakaze_tilemap.origin.y = $gameMap.displayY() * $gameMap.tileHeight();
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