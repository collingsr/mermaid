(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("1YiZ5S"))
},{"1YiZ5S":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
(function (global){
var graph = require('./graphDb');
var flow = require('./parser/flow');

/**
 * Function that adds the vertices found in the graph definition to the graph to be rendered.
 * @param vert Object containing the vertices.
 * @param g The graph that is to be drawn.
 */
var addVertices = function (vert, g) {
    var keys = Object.keys(vert);

    // Iterate through each item in the vertice object (containing all the vertices found) in the graph definition
    keys.forEach(function (id) {
        var vertice = vert[id];
        var verticeText;

        var i;
        var style = '';
        // Create a compound style definition from the style definitions found for the node in the graph definition
        for (i = 0; i < vertice.styles.length; i++) {
            if (typeof vertice.styles[i] !== 'undefined') {
                style = style + vertice.styles[i] + ';';
            }
        }

        // Use vertice id as text in the box if no text is provided by the graph definition
        if (vertice.text === undefined) {
            verticeText = vertice.id;
        }
        else {
            verticeText = vertice.text;
        }

        // Create the node in the graph nased on defined form
        if (vertice.type === 'round') {
            g.setNode(vertice.id, {label: verticeText, rx: 5, ry: 5, style: style});
        } else {
            if (vertice.type === 'diamond') {
                g.setNode(vertice.id, {shape: "question", label: verticeText, rx: 0, ry: 0, style: style});
            } else {
                g.setNode(vertice.id, {label: verticeText, rx: 0, ry: 0, style: style});
            }
        }
    });
};

/**
 * Add edges to graph based on parsed graph defninition
 * @param edges
 * @param g
 */
var addEdges = function (edges, g) {
    edges.forEach(function (edge) {

        // Set link type for rendering
        if(edge.type === 'arrow_open'){
            aHead = 'none';
        }
        else{
            aHead = 'vee';
        }

        // Add the edge to the graph
        if (edge.text === 'undefined') {
            if(typeof edge.style === 'undefined'){
                g.setEdge(edge.start, edge.end,{ arrowheadStyle: "fill: #333", arrowhead: aHead});
            }else{
                g.setEdge(edge.start, edge.end, {
                    style: edge.style, arrowheadStyle: "fill: #333", arrowhead: aHead
                });
            }
        }
        else {
            if(typeof edge.style === 'undefined'){
                g.setEdge(edge.start, edge.end,{label: edge.text, arrowheadStyle: "fill: #33f", arrowhead: aHead});
            }else{
                g.setEdge(edge.start, edge.end, {
                    style: edge.style, arrowheadStyle: "fill: #333", label: edge.text, arrowhead: aHead
                });
            }
        }
    });
};

/**
 * Draws a chart in the tag with id: id based on the graph definition in text.
 * @param text
 * @param id
 */
var drawChart = function (text, id) {
    graph.clear();
    flow.parser.yy = graph;

    // Parse the graph definition
    flow.parser.parse(text);

    // Fetch the default direction, use TD if none was found
    var dir;
    dir = graph.getDirection();
    if(typeof dir === 'undefined'){
        dir='TD';
    }

    // Create the input mermaid.graph
    var g = new dagreD3.graphlib.Graph()
        .setGraph({
            rankdir: dir,
            marginx: 20,
            marginy: 20
        })
        .setDefaultEdgeLabel(function () {
            return {};
        });

    // Fetch the verices/nodes and edges/links from the parsed graph definition
    var vert = graph.getVertices();
    var edges = graph.getEdges();

    addVertices(vert, g);
    addEdges(edges, g);

    // Create the renderer
    var render = new dagreD3.render();

    // Add custom shape for rhombus type of boc (decision)
    render.shapes().question = function (parent, bbox, node) {
        var w = bbox.width,
            h = bbox.height * 3,
            points = [
                {x: w / 2, y: 0},
                {x: w, y: -h / 2},
                {x: w / 2, y: -h},
                {x: 0, y: -h / 2}
            ];
        shapeSvg = parent.insert("polygon", ":first-child")
            .attr("points", points.map(function (d) {
                return d.x + "," + d.y;
            }).join(" "))
            .style("fill", "#fff")
            .style("stroke", "#333")
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("transform", "translate(" + (-w / 2) + "," + (h * 2 / 4) + ")");
        node.intersect = function (point) {
            return dagreD3.intersect.polygon(node, points, point);
        };
        return shapeSvg;
    };

    // Add our custom arrow - an empty arrowhead
    render.arrows().none = function normal(parent, id, edge, type) {
      var marker = parent.append("marker")
        .attr("id", id)
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 9)
        .attr("refY", 5)
        .attr("markerUnits", "strokeWidth")
        .attr("markerWidth", 8)
        .attr("markerHeight", 6)
        .attr("orient", "auto");

      var path = marker.append("path")
        .attr("d", "M 0 0 L 0 0 L 0 0 z");
      dagreD3.util.applyStyle(path, edge[type + "Style"]);
    };

    // Set up an SVG group so that we can translate the final graph.
    var svg = d3.select("#" + id);
    svgGroup = d3.select("#" + id + " g");

    // Run the renderer. This is what draws the final graph.
    render(d3.select("#" + id + " g"), g);

    // Center the graph
    var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
    //svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
    svg.attr("height", g.graph().height + 40);
};

/**
 * Go through the document and find the chart definitions in there and render the charts
 */
var init = function () {
    console.log('Mermaid v'+exports.version()+' starting');
    var arr = document.querySelectorAll('.mermaid');

    var cnt = 0;
    for (i = 0; i < arr.length; i++) {
        var element = arr[i];
        var id;

        id = 'mermaidChart' + cnt;
        cnt++;

        var chartText = element.textContent.trim();

        element.innerHTML = '<svg id="' + id + '" width="100%">' +
        '<g />' +
        '</svg>';

        drawChart(chartText, id);
    }
    ;
};

/**
 * Version management
 * @returns {string}
 */
exports.version = function(){
    return '0.2.1';
}

var equals = function (val, variable){
    if(typeof variable !== 'undefined'){
        return false;
    }
    else{
        return (val === variable);
    }
};

/**
 * Wait for coument loaded before starting the execution
 */
document.addEventListener('DOMContentLoaded', function(){
    // Check presence of config object
    if(typeof mermaid_config !== 'undefined'){
        // Check if property startOnLoad is set
        if(equals(true,mermaid_config.startOnLoad)){
            init();
        }
    }
    else{
        // No config found, do autostart in this simple case
        init();
    }
}, false);

global.mermaid = {
    init:function(){
        init();
    },
    version:function(){
        exports.version();
    }
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./graphDb":5,"./parser/flow":6}],5:[function(require,module,exports){
/**
 * Created by knut on 14-11-03.
 */

var vertices = {};
var edges = [];
var direction;
/**
 * Function called by parser when a node definition has been found
 * @param id
 * @param text
 * @param type
 * @param style
 */
exports.addVertex = function (id, text, type, style) {
    console.log('Got node ' + id + ' ' + type + ' ' + text + ' styles: ' + JSON.stringify(style));
    if (typeof vertices[id] === 'undefined') {
        vertices[id] = {id: id, styles: []};
    }
    if (typeof text !== 'undefined') {
        vertices[id].text = text;
    }
    if (typeof type !== 'undefined') {
        vertices[id].type = type;
    }
    if (typeof style !== 'undefined') {
        if (style !== null) {
            style.forEach(function (s) {
                vertices[id].styles.push(s);
            });
        }
    }
};
/**
 * Function called by parser when a link/edge definition has been found
 * @param start
 * @param end
 * @param type
 * @param linktext
 */
exports.addLink = function (start, end, type, linktext) {
    var edge = {start: start, end: end, type: undefined, text: ''};
    var linktext = type.text;
    if (typeof linktext !== 'undefined') {
        edge.text = linktext;
    }

    if (typeof type !== 'undefined') {
        edge.type = type.type;
    }
    edges.push(edge);
};
/**
 * Updates a link with a style
 * @param pos
 * @param style
 */
exports.updateLink = function (pos, style) {
    var position = pos.substr(1);
    edges[position].style = style;
};
/**
 * Called by parser when a graph definition is found, stores the direction of the chart.
 * @param dir
 */
exports.setDirection = function (dir) {
    direction = dir;
};
exports.getDirection = function () {
    return direction;
};
/**
 * Retrieval function for fetching the found nodes after parsing has completed.
 * @returns {{}|*|vertices}
 */
exports.getVertices = function () {
    return vertices;
};

/**
 * Retrieval function for fetching the found links after parsing has completed.
 * @returns {{}|*|edges}
 */
exports.getEdges = function () {
    return edges;
};

/**
 * Clears the internal graph db so that a new graph can be parsed.
 */
exports.clear = function () {
    vertices = {};
    edges = [];
};
/**
 *
 * @returns {string}
 */
exports.defaultStyle = function () {
    return "fill:#ffa;stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;fill:#ffa;stroke: #666;";
};


},{}],6:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.15 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,7],$V1=[2,10],$V2=[1,15],$V3=[1,16],$V4=[1,11],$V5=[6,9],$V6=[11,27,28,29,37],$V7=[2,7],$V8=[11,32,33,34,35],$V9=[9,11,18,20,21,22,23,24,32,33,34,35,36],$Va=[9,11,18,20,21,22,23,24,28,29,32,33,34,35,36],$Vb=[9,11,18,20,21,22,23,24,27,28,29,32,33,34,35,36],$Vc=[28,29],$Vd=[28,29,36],$Ve=[20,22,24,36],$Vf=[1,67],$Vg=[1,64],$Vh=[1,62],$Vi=[1,65],$Vj=[1,68],$Vk=[1,63],$Vl=[1,66],$Vm=[1,72],$Vn=[11,41],$Vo=[9,11,27,28,29,39,41,43,44];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"expressions":3,"graphConfig":4,"statements":5,"EOF":6,"spaceList":7,"GRAPH":8,"SPACE":9,"DIR":10,"SEMI":11,"statement":12,"verticeStatement":13,"styleStatement":14,"vertex":15,"link":16,"alphaNum":17,"SQS":18,"text":19,"SQE":20,"PS":21,"PE":22,"DIAMOND_START":23,"DIAMOND_STOP":24,"alphaNumStatement":25,"alphaNumToken":26,"MINUS":27,"ALPHA":28,"NUM":29,"linkStatement":30,"arrowText":31,"ARROW_POINT":32,"ARROW_CIRCLE":33,"ARROW_CROSS":34,"ARROW_OPEN":35,"PIPE":36,"STYLE":37,"stylesOpt":38,"HEX":39,"style":40,"COMMA":41,"styleComponent":42,"COLON":43,"UNIT":44,"$accept":0,"$end":1},
terminals_: {2:"error",6:"EOF",8:"GRAPH",9:"SPACE",10:"DIR",11:"SEMI",18:"SQS",20:"SQE",21:"PS",22:"PE",23:"DIAMOND_START",24:"DIAMOND_STOP",27:"MINUS",28:"ALPHA",29:"NUM",32:"ARROW_POINT",33:"ARROW_CIRCLE",34:"ARROW_CROSS",35:"ARROW_OPEN",36:"PIPE",37:"STYLE",39:"HEX",41:"COMMA",43:"COLON",44:"UNIT"},
productions_: [0,[3,3],[3,4],[4,4],[5,3],[5,1],[7,2],[7,1],[12,2],[12,2],[13,0],[13,3],[13,1],[15,4],[15,4],[15,4],[15,1],[17,1],[17,2],[25,1],[25,3],[26,1],[26,1],[16,2],[16,1],[30,1],[30,1],[30,1],[30,1],[31,3],[19,3],[19,5],[19,1],[14,5],[14,5],[38,1],[38,3],[40,1],[40,2],[42,1],[42,1],[42,1],[42,1],[42,1],[42,1],[42,1]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 2:
this.$=$$[$0-3];
break;
case 3:
 yy.setDirection($$[$0-1]);this.$ = $$[$0-1];
break;
case 11:
 yy.addLink($$[$0-2],$$[$0],$$[$0-1]);this.$ = 'oy'
break;
case 12:
this.$ = 'yo';
break;
case 13:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'square');
break;
case 14:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'round');
break;
case 15:
this.$ = $$[$0-3];yy.addVertex($$[$0-3],$$[$0-1],'diamond');
break;
case 16:
this.$ = $$[$0];yy.addVertex($$[$0]);
break;
case 17: case 19: case 21: case 22: case 37:
this.$=$$[$0];
break;
case 18:
this.$=$$[$0-1]+''+$$[$0];
break;
case 20:
this.$=$$[$0-2]+'-'+$$[$0];
break;
case 23:
$$[$0-1].text = $$[$0];this.$ = $$[$0-1];
break;
case 24: case 32:
this.$ = $$[$0];
break;
case 25:
this.$ = {"type":"arrow"};
break;
case 26:
this.$ = {"type":"arrow_circle"};
break;
case 27:
this.$ = {"type":"arrow_cross"};
break;
case 28:
this.$ = {"type":"arrow_open"};
break;
case 29:
this.$ = $$[$0-1];
break;
case 30:
this.$ = $$[$0-2] + ' ' +$$[$0];
break;
case 31:
this.$ = $$[$0-4] + ' - ' +$$[$0];
break;
case 33:
this.$ = $$[$0-4];yy.addVertex($$[$0-2],undefined,undefined,$$[$0]);
break;
case 34:
this.$ = $$[$0-4];yy.updateLink($$[$0-2],$$[$0]);
break;
case 35:
this.$ = [$$[$0]]
break;
case 36:
$$[$0-2].push($$[$0]);this.$ = $$[$0-2];
break;
case 38:
this.$ = $$[$0-1] + $$[$0];
break;
case 39: case 40: case 41: case 42: case 43: case 44: case 45:
this.$=$$[$0]
break;
}
},
table: [{3:1,4:2,8:[1,3]},{1:[3]},{5:4,7:5,9:$V0,11:$V1,12:6,13:8,14:9,15:10,17:12,25:13,26:14,28:$V2,29:$V3,37:$V4},{9:[1,17]},{6:[1,18],7:19,9:$V0},{5:20,11:$V1,12:6,13:8,14:9,15:10,17:12,25:13,26:14,28:$V2,29:$V3,37:$V4},o($V5,[2,5]),o($V6,$V7,{7:21,9:$V0}),{11:[1,22]},{11:[1,23]},{11:[2,12],16:24,30:25,32:[1,26],33:[1,27],34:[1,28],35:[1,29]},{9:[1,30]},o($V8,[2,16],{18:[1,31],21:[1,32],23:[1,33]}),o($V9,[2,17],{25:13,26:14,17:34,28:$V2,29:$V3}),o($Va,[2,19],{27:[1,35]}),o($Vb,[2,21]),o($Vb,[2,22]),{10:[1,36]},{1:[2,1]},{11:$V1,12:37,13:8,14:9,15:10,17:12,25:13,26:14,28:$V2,29:$V3,37:$V4},{6:[1,38],7:19,9:$V0},o($V6,[2,6]),o($V5,[2,8]),o($V5,[2,9]),{15:39,17:12,25:13,26:14,28:$V2,29:$V3},o($Vc,[2,24],{31:40,36:[1,41]}),o($Vd,[2,25]),o($Vd,[2,26]),o($Vd,[2,27]),o($Vd,[2,28]),{17:42,25:13,26:14,28:$V2,29:$V3,39:[1,43]},{17:45,19:44,25:13,26:14,28:$V2,29:$V3},{17:45,19:46,25:13,26:14,28:$V2,29:$V3},{17:45,19:47,25:13,26:14,28:$V2,29:$V3},o($V9,[2,18]),{26:48,28:$V2,29:$V3},{11:[1,49]},o($V5,[2,4]),{1:[2,2]},{11:[2,11]},o($Vc,[2,23]),{17:45,19:50,25:13,26:14,28:$V2,29:$V3},{9:[1,51]},{9:[1,52]},{20:[1,53]},o($Ve,[2,32],{7:55,9:[1,54]}),{22:[1,56]},{24:[1,57]},o($Va,[2,20]),o([9,11,28,29,37],[2,3]),{36:[1,58]},{9:$Vf,27:$Vg,28:$Vh,29:$Vi,38:59,39:$Vj,40:60,42:61,43:$Vk,44:$Vl},{9:$Vf,27:$Vg,28:$Vh,29:$Vi,38:69,39:$Vj,40:60,42:61,43:$Vk,44:$Vl},o($V8,[2,13]),{7:21,9:$V0,17:45,19:70,25:13,26:14,27:$V7,28:$V2,29:$V3},{27:[1,71]},o($V8,[2,14]),o($V8,[2,15]),o($Vc,[2,29]),{11:[2,33],41:$Vm},o($Vn,[2,35],{42:73,9:$Vf,27:$Vg,28:$Vh,29:$Vi,39:$Vj,43:$Vk,44:$Vl}),o($Vo,[2,37]),o($Vo,[2,39]),o($Vo,[2,40]),o($Vo,[2,41]),o($Vo,[2,42]),o($Vo,[2,43]),o($Vo,[2,44]),o($Vo,[2,45]),{11:[2,34],41:$Vm},o($Ve,[2,30]),{7:74,9:$V0},{9:$Vf,27:$Vg,28:$Vh,29:$Vi,39:$Vj,40:75,42:61,43:$Vk,44:$Vl},o($Vo,[2,38]),{17:45,19:76,25:13,26:14,28:$V2,29:$V3},o($Vn,[2,36],{42:73,9:$Vf,27:$Vg,28:$Vh,29:$Vi,39:$Vj,43:$Vk,44:$Vl}),o($Ve,[2,31])],
defaultActions: {18:[2,1],38:[2,2],39:[2,11]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        function lex() {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 37;
break;
case 1:return 8;
break;
case 2:return 10;
break;
case 3:return 10;
break;
case 4:return 39;
break;
case 5:return 29;
break;
case 6:return 'BRKT';
break;
case 7:return 44;
break;
case 8:return 44;
break;
case 9:return 44;
break;
case 10:return 43;
break;
case 11:return 11;
break;
case 12:return 41;
break;
case 13:return 34;
break;
case 14:return 32;
break;
case 15:return 33;
break;
case 16:return 35;
break;
case 17:return 27;
break;
case 18:return 28;
break;
case 19:return 36;
break;
case 20:return 21;
break;
case 21:return 22;
break;
case 22:return 18;
break;
case 23:return 20;
break;
case 24:return 23
break;
case 25:return 24
break;
case 26:return 9;
break;
case 27:return 'NEWLINE';
break;
case 28:return 6;
break;
}
},
rules: [/^(?:style\b)/,/^(?:graph\b)/,/^(?:LR\b)/,/^(?:TD\b)/,/^(?:#[a-f0-9]+)/,/^(?:[0-9]+)/,/^(?:#)/,/^(?:px\b)/,/^(?:pt\b)/,/^(?:dot\b)/,/^(?::)/,/^(?:;)/,/^(?:,)/,/^(?:--[x])/,/^(?:-->)/,/^(?:--[o])/,/^(?:---)/,/^(?:-)/,/^(?:[a-zåäöæøA-ZÅÄÖÆØ]+)/,/^(?:\|)/,/^(?:\()/,/^(?:\))/,/^(?:\[)/,/^(?:\])/,/^(?:\{)/,/^(?:\})/,/^(?:\s)/,/^(?:\n)/,/^(?:$)/],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require("1YiZ5S"))
},{"1YiZ5S":3,"fs":1,"path":2}]},{},[4])