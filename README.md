EaselJsStageBuilder
====================

A jQuery plugin for building stages in EaselJs, using Texture Packer sprites (PNG+JSON) and a simple json describing object, textures and behaviours. Requires latest EaselJs, underscore.js and jQuery. See LICENSE for licensing.


Usage
--------------------
Include the dependencies and this script.
```html
  <script src="jquery.min.js"></script>
  <script src="underscore-min.js"></script>
  <script src="easel.js"></script>
  <script src="jquery.easeljs-stage-builder.js"></script>
```

Define a canvas:
```html
  <canvas id="mainCanvas" width="760" height="700">Canvas is not supported</canvas>
```

Given that you already have a texture packer JSON+PNG export named FooBar.png and FooBar.json (they must have the same name), you can build a JSON file describing the objects (with bitmaps, texts, containers - nesting them as much as you need) in your level in a very simple and intuitive way.
Just be sure that every element have a unique name (in the following example, if you define two myBitmap in the same container, the last will overwrite the first)
```javascript
{
    "elements": {
        "myContainer": {
            "index": 0,
            "type": "Container",
            "properties": {
                "x": 0,
                "y": 110
            },
            "texture": "FooBar",
            "children": {
                "myBitmap": {
                    "bitmap": "myBitmapNameAsDefinedInFooBarJson",
                    "index": 0,
                    "type": "Bitmap",
                    "properties": {
                        "x": 1,
                        "y": 0
                    }
                },
                "myText": {
                    "index": 1,
                    "type": "Text",
                    "properties": {
                        "text": "HELLO WORLD",
                        "font": "18px Arial",
                        "color": "#666666",
                        "textBaseline": "top",
                        "x": 300,
                        "y": 60
                    }
                },
                "myBitmapWithEvents": {
                    "bitmap": "myBitmapWithEventsNameAsDefinedInFooBarJson",
                    "index": 2,
                    "type": "Bitmap",
                    "texture": "FooBar",
                    "properties": {
                        "x": 390,
                        "y": 330,
                        "regX": 100,
                        "regY": 100
                    },
                    "events": {
                        "onClick": "anyFunctionDefinedInWindowContext",
                        "onMouseOver": "anotherFunctionDefinedInWindowContext"
                    }
                },
                "myAnimation": {
                    "index": 3,
                    "type": "BitmapAnimation",
                    "texture": "FooBar",
                    "onLoad": "gotoAndStop",
                    "onLoadFrame": "myStopFrame",
                    "animations": {
                        "myStopFrame": [
                            10
                        ],
                        "myFullAnimation": {
                            "frames": [
                                10,
                                15
                            ],
                            "next": "myFullAnimation",
                            "frequency": 2
                        }
                    },
                    "properties": {
                        "x": 200,
                        "y": 90
                    }
                },
                "MyPath": {
                    "index": 0,
                    "type": "Shape",
                    "transform": [
                        0.0499591,
                        0,
                        0,
                        0.0499591,
                        119.302,
                        111.024
                    ],
                    "events": {
                        "onClick": "polygonClick"
                    },
                    "properties": {
                        "visible": true,
                        "alpha": 0.7
                    },
                    "graphics": {
                        "draw": [
                            {
                                "type": "beginFill",
                                "properties": {
                                    "fill": {
                                        "r": 0,
                                        "g": 136,
                                        "b": 0
                                    }
                                }
                            },
                            {
                                "type": "moveTo",
                                "properties": {
                                    "x": "1685",
                                    "y": " 0"
                                }
                            },
                            {
                                "type": "lineTo",
                                "properties": {
                                    "x": "0",
                                    "y": " 1753"
                                }
                            },
                            {
                                "type": "lineTo",
                                "properties": {
                                    "x": "1089",
                                    "y": " 1753"
                                }
                            },
                            {
                                "type": "lineTo",
                                "properties": {
                                    "x": "1685",
                                    "y": " 1157"
                                }
                            },
                            {
                                "type": "lineTo",
                                "properties": {
                                    "x": "1685",
                                    "y": " 0"
                                }
                            },
                            {
                                "type": "closePath"
                            }
                        ]
                    }
                }
            }
        }
    }
}
```
*Notice*: BitmapAnimations point to frames with their indexes in the Texture Packer JSON: it is strongly suggested that you use independent exports for complex animations, otherwise new additions to the global Texture Packer project (in which animation frames are) will offset every frame and mess your animation up!


Now feed the builder with your JSON and you are ready to go!

```javascript
$(document).ready(function(){
    easeljsBuilder = $('#mainCanvas').easelJsStageBuilder();
    $.when(
        easeljsBuilder.buildFromJSON('myLevel.json')
    ).then( function () {
        //do init stuff
    });
            
});
```

You can use easeljsBuilder.plainObjectTree to access all the EaselJs elements created with a unique name:
```javascript
easeljsBuilder.plainObjectTree['myBitmapWithEvents']
```

You can easily access the stage:
```javascript
easeljsBuilder.stage
```

easeljsBuilder is 100% deferred compliant for loading JSONs and PNGs, so you don't have to worry about anything when loading complex levels. Consider that you can define multiple JSON levels each referring to multiples texture packers exports. For example:

```javascript
$(document).ready(function(){
    easeljsBuilder = $('#mainCanvas').easelJsStageBuilder();
    $.when(
        easeljsBuilder.buildFromJSON('myLevel.json');
        easeljsBuilder.buildFromJSON('myOtherLevel.json');
    ).then( function () {
        //do init stuff
    });
            
});
```
It will load everything, and every object created will be fully loaded and accessible as the promises are resolved.