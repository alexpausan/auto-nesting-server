"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AltTextNode = exports.AltGroupNode = exports.AltFrameNode = exports.AltEllipseNode = exports.AltRectangleNode = void 0;
// ALTSCENENODE
require("@figma/plugin-typings");
class AltRectangleNode {
    constructor() {
        this.type = 'RECTANGLE';
    }
}
exports.AltRectangleNode = AltRectangleNode;
class AltEllipseNode {
    constructor() {
        this.type = 'ELLIPSE';
    }
}
exports.AltEllipseNode = AltEllipseNode;
class AltFrameNode {
    constructor() {
        this.type = 'FRAME';
    }
}
exports.AltFrameNode = AltFrameNode;
class AltGroupNode {
    constructor() {
        this.type = 'GROUP';
    }
}
exports.AltGroupNode = AltGroupNode;
class AltTextNode {
    constructor() {
        this.type = 'TEXT';
    }
}
exports.AltTextNode = AltTextNode;
// // DOCUMENT
// class AltDocumentNode {
//   type = "DOCUMENT";
//   children = [];
// }
// // PAGE
// class AltPageNode {
//   type = "PAGE";
//   children = [];
//   _selection: Array<SceneNode> = [];
//   get selection() {
//     return this._selection || [];
//   }
//   set selection(value) {
//     this._selection = value;
//   }
// }
