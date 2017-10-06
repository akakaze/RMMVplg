(function() {

    var map_id = 6;
    var data_map;

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
        data_map = JSON.parse(mapdata);
    }

    function catchError(error) {
        console.error(error.stack);
    }

    Scene_Map.prototype.AkakazeCreate = function() {
        getLayer(map_id)
            .then(getLayerData)
            .catch(catchError);
    };

    Spriteset_Map.prototype.AkakazeCreateTilemap = function() {
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
        this.akakaze_tilemap.setData(data_map.width, data_map.height, data_map.data);
    };

    Spriteset_Map.prototype.AkakazeLoadTileset = function() {
        var tile_sets = $dataTilesets[data_map.tilesetId];
        if (tile_sets) {
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
        this.akakaze_layer = new Sprite();
        this.akakaze_layer.addChild(this.akakaze_tilemap.lowerLayer);
        this.akakaze_layer.addChild(this.akakaze_tilemap.upperLayer);
        this.akakaze_layer.move($gameMap.displayX() * -$gameMap.tileWidth(), 0, Graphics.width, Graphics.height);
        this.akakaze_layer.z = 6;
        this._tilemap.addChild(this.akakaze_layer);
        this.akakaze_tilemap.paintAllTiles();
    };

    Spriteset_Map.prototype.AkakazeUpdate = function() {
        this.akakaze_layer.x = $gameMap.displayX() * -$gameMap.tileWidth();
        this.akakaze_layer.y = $gameMap.displayY() * -$gameMap.tileHeight();
    };

    var create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        create.call(this);
        this.AkakazeCreate();
    }

    var createTilemap = Spriteset_Map.prototype.createTilemap;
    Spriteset_Map.prototype.createTilemap = function() {
        this.AkakazeCreateTilemap();
        createTilemap.call(this);
    }

    var loadTileset = Spriteset_Map.prototype.loadTileset;
    Spriteset_Map.prototype.loadTileset = function() {
        loadTileset.call(this);
        this.AkakazeLoadTileset();
    }

    var createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        createLowerLayer.call(this);
        this.AkakazeCreateLowerLayer();
    }

    var update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        update.call(this);
        this.AkakazeUpdate();
    }
})();