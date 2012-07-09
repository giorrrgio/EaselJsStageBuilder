(function($){
    $.fn.easelJsStageBuilder = function(stage, settings) {
        var config = {
            enableMouseOver: true
        };
        this.stage = new Stage($(this).get(0));
        if (settings){$.extend(config, settings);}
        if (config.enableMouseOver == true) {
            this.stage.enableMouseOver();
        }
        var DEBUG = true;
        var $this = this;
        $this.textures = {};
        $this.plainObjectTree = {};
        $this.textures_preloaded = {};

        var loadJsonCache = {}
        var getJSON = function (JSONFilename) {
            var deferred = $.Deferred();
            $.getJSON(JSONFilename, function (data) {
                deferred.resolve(data);
            });
            loadJsonCache[JSONFilename] = deferred;
            
            return deferred.promise();
        }
        var preloadDeferreds = [];
        
        var preloadTextures = function (json_data) {
            _.each(json_data, function(val, key) {
                if (val["texture"] != undefined && typeof($this.textures_preloaded[val["texture"]]) == "undefined") {
                    $this.textures_preloaded[val["texture"]] = val["texture"];
                    if (DEBUG) {                    
                        console.log("preload "+val["texture"]);
                    }
                }
                if (val["children"] != undefined) {
                    preloadTextures(val["children"]);
                }        
            });
            return true;
        };

        var parseElements = function (json_data, parent, current_texture) {
            _.each(json_data, function(val, key) {
                if (DEBUG) {                
                    console.log('building '+key);
                }
                if (val["texture"] != undefined) {
                    current_texture = val["texture"];
                }
                if(val["type"] != "BitmapAnimation") {             
                    newelement = new window[val["type"]];
                } else {
                    if (val['animations'] != undefined) {
                        var newSpriteSheet = new SpriteSheet({
                            images: $this.textures[val["texture"]]._images,
                            frames: [],
                            animations: val['animations']
                        });
                        newSpriteSheet._frames = $this.textures[val["texture"]]._frames;
                        SpriteSheetUtils.addFlippedFrames(newSpriteSheet, true, false, false);
                    } else {
                        var newSpriteSheet = $this.textures[val["texture"]];
                    }
                    newelement = new window[val["type"]](newSpriteSheet);
    
                }
                if (val["type"] == "Bitmap") {
                    newelement.image = SpriteSheetUtils.extractFrame($this.textures[current_texture],key);
                } else if(val["type"] == "Shape") {
                    var g = new Graphics();
                    var gp = val["graphics"];
                    g.beginFill(
                        Graphics.getRGB(
                            gp["fill"]["r"],
                            gp["fill"]["g"],
                            gp["fill"]["b"]
                        )
                    );
                    g[gp["draw"]["type"]]();
                    var dp = gp["draw"]["properties"]
                    g.drawRect(dp["x"], dp["y"], dp["w"], dp["h"]);
                    newelement.graphics = g;
                } else if(val["type"] == "BitmapAnimation") {
                    var $addAt = val["index"];
                    var onLoad = val["onLoad"];
                    var onLoadFrame = val["onLoadFrame"];
                    newelement[onLoad](onLoadFrame);
                    parent.addChildAt(newelement, $addAt);

                }
                newelement.name = key;
                parent.addChildAt(newelement, val["index"]);
                $this.plainObjectTree[newelement.name] = newelement;
                if (val["properties"] != undefined) {
                    _.each(val["properties"], function(val2, key2) {
                        newelement[key2] = val2;
                    });
                }
                if (val["events"] != undefined) {
                    _.each(val["events"], function(val3, key3) {
                        newelement[key3] = window[val3];
                    });
                }
                if (val["children"] != undefined) {
                    parseElements(val["children"], newelement, current_texture);
                } else {
                    return parent;
                }         
            });
            
            return parent;
        };
        var preload = function(json_data) {
            var deferred = $.Deferred();
            doPreload(json_data);
            $.when.apply($, preloadDeferreds).then(function() {
                _.each(arguments, function(val, key) {
                    $this.textures[val["name"]] = val["pieces"];
                });
                deferred.resolve();
            }, function(e) {
                alert('ops');
            });
            
            return deferred.promise();            
        }
        var doPreload = function(json_data) {
            preloadTextures(json_data);
            _.each($this.textures_preloaded, function(val, key) {
                preloadDeferreds.push($this.texturePackerJSONParser(val+'.json', val+'.png'));
            })
        }
        //Texture Packer JSON Parser
        this.buildFromJSON = function(JSONFilename, callback) {
            var deferred = $.Deferred();
            $.when(getJSON(JSONFilename)).then( function (json_data) {
                $.when(preload(json_data["elements"])).then(function() {
                    parseElements(json_data["elements"], $this.stage);
                    deferred.resolve();
                });
            });
            return deferred.promise();
        };      

        this.addChild = function (obj, index) {
            if (index != undefined) {
                this.stage.addChildAt(obj, index);
            } else {
                this.stage.addChild(obj);
            }
            
            return obj;
        };
        this.addChildAndSetPosition = function (obj, index, x, y) {
            this.addChild(obj, index);
            if (x != undefined) {
                obj.x = x;
            }
            if (y != undefined) {
                obj.y = y;
            }
            
            return obj;
        };
        var loadJsonCache = {}
        var getJSON = function (JSONFilename) {
            var deferred = $.Deferred();            
            if (loadJsonCache[JSONFilename] != undefined) {
                return loadJsonCache[JSONFilename];
            }
            $.getJSON(JSONFilename, function (data) {
                deferred.resolve(data);
            });
            loadJsonCache[JSONFilename] = deferred;
            
            return deferred.promise();
        }
        var loadImageCache = {}
        var loadImage = function(imageSrc) {
            var deferred = $.Deferred();

            preloader         = new Image();
            preloader.onload  = function() { 
                deferred.resolve(this)
            };
            preloader.onerror = function() { 
                deferred.reject(this.src)  
            };
            preloader.src     = imageSrc;
            jQuery("<img>").attr("src", imageSrc);


            loadImageCache[imageSrc] = deferred;

            return deferred.promise();
        }
        //Texture Packer JSON Parser
        this.texturePackerJSONParser = function(JSONFilename, TextureFilename) {
            var img;
            var deferred = $.Deferred();
            $.when(loadImage(TextureFilename), getJSON(JSONFilename)).done( function (img, json_data) {
                frames = json_data["frames"];
                data_frames = [];
                animations = {};
                i = 0;
                _.each(frames, function(val, key) {
                    data_frames.push([val["frame"]["x"], val["frame"]["y"], val["frame"]["w"], val["frame"]["h"]]);
                    newarray = [];
                    newarray.push(i++);
                    animations[key.substr(0, key.lastIndexOf('.'))]=newarray;
                });
                data = {
                    images: [img],
                    frames: data_frames,
                    animations: animations
                };
                pieces = new SpriteSheet(data);
                deferred.resolve({"name": JSONFilename.substr(0, JSONFilename.lastIndexOf('.')), "pieces":pieces});
            });
            return deferred.promise();
        };
        
        this.tick = function () {
            this.stage.update();
        };
        
        return this;
    };
})(jQuery);
