(function() {
    var _map_id;
    var _layer_id;
    var _data_map;
    var _param = {};
    _param["layerTag"] = "AkakazeLayer";
    _param["layerZ"] = 6;
    var _layer_add = false;

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
            xhr.onerror = reject;
            xhr.send();
        });
    }

    function getLayerData(mapdata) {
        _data_map = JSON.parse(mapdata);
        _layer_add = true;
    }

    function catchError(error) {
        console.error(error.stack);
    }

    Scene_Map.prototype.AkakazeCreate = function() {
        _layer_add = false;
        _map_id = this._transfer ? $gamePlayer.newMapId() : $gameMap.mapId();
        if ($dataMapInfos[_map_id][_param["layerTag"]]) {
            _layer_id = $dataMapInfos[_map_id][_param["layerTag"]]["id"];
            getLayer(_layer_id)
                .then(getLayerData)
                .catch(catchError);
        }
    };

    Spriteset_Map.prototype.AkakazeCreateTilemap = function() {
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
    };

    Spriteset_Map.prototype.AkakazeLoadTileset = function() {
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
    };

    Spriteset_Map.prototype.AkakazeCreateLowerLayer = function() {
        // console.log("Spriteset_Map.prototype.AkakazeCreateLowerLayer");
        if (_layer_add) {
            this.akakaze_layer = new Sprite();
            this.akakaze_layer.addChild(this.akakaze_tilemap.lowerLayer);
            this.akakaze_layer.addChild(this.akakaze_tilemap.upperLayer);
            this.akakaze_layer.move($gameMap.displayX() * -$gameMap.tileWidth(), 0, Graphics.width, Graphics.height);
            this.akakaze_layer.z = $dataMapInfos[_map_id][_param["layerTag"]];
            this._tilemap.addChild(this.akakaze_layer);
            this.akakaze_tilemap.paintAllTiles();
        }
    };

    Spriteset_Map.prototype.AkakazeUpdate = function() {
        // console.log("Spriteset_Map.prototype.AkakazeUpdate");
        // console.log(this);
        // Spriteset_Map.prototype.AkakazeUpdate = function() {};
        if (_layer_add) {
            this.akakaze_layer.x = $gameMap.displayX() * -$gameMap.tileWidth();
            this.akakaze_layer.y = $gameMap.displayY() * -$gameMap.tileHeight();
        }
    };

    var DataManager_onLoad = DataManager.onLoad;
    DataManager.onLoad = function(obj) {
        DataManager_onLoad.call(this, obj);
        if (obj === $dataMapInfos) {
            console.log(obj);
            var re = /<([^<>:]+)(:?)([^>]*)>/g;
            // for (var i = 0; i < obj.length; i++) {
            //     
            obj.forEach(function(map) {
                // console.log(map);
                if (map !== null) {
                    var id = map["id"];
                    var name = map["name"];
                    var parent = map["parentId"];
                    var match = re.exec(name);
                    if (match && match[1] === _param["layerTag"]) { //param
                        $dataMapInfos[parent][_param["layerTag"]] = {};
                        $dataMapInfos[parent][_param["layerTag"]]["id"] = id;
                        if (match[2] === ':') {
                            $dataMapInfos[parent][_param["layerTag"]]["z"] = match[3];
                        } else {
                            $dataMapInfos[parent][_param["layerTag"]]["z"] = _param["layerZ"]; //param
                        }
                    }
                }
            }, this);
        }
    }

    // var Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    // Scene_Map.prototype.onMapLoaded = function() {
    //     Scene_Map_onMapLoaded.call(this);
    //     this.AkakazeOnMapLoaded();
    // };

    var Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        Scene_Map_create.call(this);
        this.AkakazeCreate();
    }

    var Spriteset_Map_createTilemap = Spriteset_Map.prototype.createTilemap;
    Spriteset_Map.prototype.createTilemap = function() {
        this.AkakazeCreateTilemap();
        Spriteset_Map_createTilemap.call(this);
    }

    var Spriteset_Map_loadTileset = Spriteset_Map.prototype.loadTileset;
    Spriteset_Map.prototype.loadTileset = function() {
        Spriteset_Map_loadTileset.call(this);
        this.AkakazeLoadTileset();
    }

    var Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        Spriteset_Map_createLowerLayer.call(this);
        this.AkakazeCreateLowerLayer();
    }

    var Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        Spriteset_Map_update.call(this);
        this.AkakazeUpdate();
    }
})();