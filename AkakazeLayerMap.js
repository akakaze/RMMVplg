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
 * @default 7
 * 
 * @help
 * ＞圖層地圖標記方式為: <Layer Tag:Default Layer Z>
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
    var _param = {};
    var _layer_add = false;

    var parameters = PluginManager.parameters('AkakazeLayer');
    _param["layerTag"] = parameters['Layer Tag']; //"AkakazeLayer"
    _param["layerZ"] = parameters['Default Layer Z']; //7

    function getLayer(map_id) {
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

    function getLayerData(mapdata) {
        _data_map = JSON.parse(mapdata);
        _layer_add = true;
    }

    function AkakazeOnLoad(obj) {
        if (obj === $dataMapInfos) {
            // console.log(obj);
            var re = /<([^<>:]+)(:?)([^>]*)>/g;
            obj.forEach(function(map) {
                // console.log(map);
                if (map) {
                    var id = map["id"];
                    var name = map["name"];
                    var parent = map["parentId"];
                    var match = re.exec(name);
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

    function AkakazeCreate() {
        _layer_add = false;
        _map_id = this._transfer ? $gamePlayer.newMapId() : $gameMap.mapId();
        if ($dataMapInfos[_map_id][_param["layerTag"]]) {
            _layer_id = $dataMapInfos[_map_id][_param["layerTag"]]["id"];
            getLayer(_layer_id)
                .then(getLayerData);
        }
    }

    function AkakazeCreateTilemap() {
        if (_layer_add) {
            this.akakaze_tilemap = new ShaderTilemap();
            this.akakaze_tilemap.paintAllTiles = function() {
                this.lowerZLayer.clear();
                this.upperZLayer.clear();
                var tileCols = $dataMap.width;
                var tileRows = $dataMap.height;
                for (var y = 0; y < tileRows; y++) {
                    for (var x = 0; x < tileCols; x++) {
                        this._paintTiles(0, 0, x, y);
                    }
                }
            };
            this.akakaze_tilemap.setData(_data_map.width, _data_map.height, _data_map.data);
        }
    }

    function AkakazeLoadTileset() {
        // console.log("Spriteset_Map.prototype.AkakazeLoadTileset");
        if (_layer_add) {
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
            this.akakaze_tilemap.refreshTileset();
            if (!this.akakaze_tilemap.flags.equals(newTilesetFlags)) {
                this.akakaze_tilemap.refresh();
            }
            this.akakaze_tilemap.flags = tile_sets.flags;
        }
    }

    function AkakazeCreateLowerLayer() {
        // console.log("Spriteset_Map.prototype.AkakazeCreateLowerLayer");
        if (_layer_add) {
            this.akakaze_layer = new Sprite();
            this.akakaze_layer.addChild(this.akakaze_tilemap.lowerLayer);
            this.akakaze_layer.addChild(this.akakaze_tilemap.upperLayer);
            this.akakaze_layer.move($gameMap.displayX() * -$gameMap.tileWidth(), 0, Graphics.width, Graphics.height);
            this.akakaze_layer.z = $dataMapInfos[_map_id][_param["layerTag"]]["z"];
            this._tilemap.addChild(this.akakaze_layer);
            this.akakaze_tilemap.paintAllTiles();
        }
    }

    function AkakazeUpdate() {
        // console.log("Spriteset_Map.prototype.AkakazeUpdate");
        if (_layer_add) {
            this.akakaze_layer.x = $gameMap.displayX() * -$gameMap.tileWidth();
            this.akakaze_layer.y = $gameMap.displayY() * -$gameMap.tileHeight();
        }
    }

    var DataManager_onLoad = DataManager.onLoad;
    DataManager.onLoad = function(obj) {
        DataManager_onLoad.call(this, obj);
        AkakazeOnLoad.call(this, obj);
    }

    var Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        Scene_Map_create.call(this);
        AkakazeCreate.call(this);
    }

    var Spriteset_Map_createTilemap = Spriteset_Map.prototype.createTilemap;
    Spriteset_Map.prototype.createTilemap = function() {
        AkakazeCreateTilemap.call(this);
        Spriteset_Map_createTilemap.call(this);
    }

    var Spriteset_Map_loadTileset = Spriteset_Map.prototype.loadTileset;
    Spriteset_Map.prototype.loadTileset = function() {
        Spriteset_Map_loadTileset.call(this);
        AkakazeLoadTileset.call(this);
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