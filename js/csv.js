
/*
  Written by SAKSHAM AGGARWAL
  Do not copy. Think something new and innovative instead
 */

(function() {
  var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  define(['droplet-helper', 'droplet-parser', 'droplet-model'], function(helper, parser, model) {
    var CLASSES, COLORS, CSVParser, exports;
    exports = {};
    COLORS = {
      'Default': 'violet'
    };
    CLASSES = ['mostly-value', 'no-drop'];
    exports.CSVParser = CSVParser = (function(superClass) {
      extend(CSVParser, superClass);

      function CSVParser(text1, opts) {
        this.text = text1;
        this.opts = opts != null ? opts : {};
        CSVParser.__super__.constructor.apply(this, arguments);
        this.lines = this.text.split('\n');
      }

      CSVParser.prototype.getAcceptsRule = function(node) {
        return {
          "default": helper.NORMAL
        };
      };

      CSVParser.prototype.getPrecedence = function(node) {
        return 1;
      };

      CSVParser.prototype.getClasses = function(node) {
        return CLASSES;
      };

      CSVParser.prototype.getColor = function(node) {
        return COLORS['Default'];
      };

      CSVParser.prototype.getBounds = function(node) {
        var bounds;
        return bounds = {
          start: {
            line: node.index,
            column: node.start
          },
          end: {
            line: node.index,
            column: node.end
          }
        };
      };

      CSVParser.prototype.getSocketLevel = function(node) {
        return helper.ANY_DROP;
      };

      CSVParser.prototype.csvBlock = function(node) {
        return this.addBlock({
          bounds: this.getBounds(node),
          depth: 0,
          precedence: this.getPrecedence(node),
          color: this.getColor(node),
          socketLevel: this.getSocketLevel(node)
        });
      };

      CSVParser.prototype.csvSocket = function(node) {
        return this.addSocket({
          bounds: this.getBounds(node),
          depth: 1,
          precedence: this.getPrecedence(node),
          classes: this.getClasses(node),
          acccepts: this.getAcceptsRule(node)
        });
      };

      CSVParser.prototype.markRoot = function() {
        var root;
        root = this.CSVtree(this.text);
        return this.mark(root);
      };

      CSVParser.prototype.mark = function(node) {
        var child, j, len, ref, results;
        if (node.type === 'Statement') {
          this.csvBlock(node);
        } else if (node.type === 'Value') {
          this.csvSocket(node);
        }
        ref = node.children;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          child = ref[j];
          results.push(this.mark(child));
        }
        return results;
      };

      CSVParser.prototype.CSVtree = function(text) {

        /*
          Structure of node:
          node->index = line number
          node->type = Tree/Statement/Value/Comment
          node->start = starting character
          node->end = ending character
          node->children = children
         */
        return this.getNode(text, 'Tree');
      };

      CSVParser.prototype.isComment = function(text) {
        return text.match(/^\s*\/\/.*$/);
      };

      CSVParser.prototype.getNode = function(text, type, index, start, end) {
        var i, inside_quotes, j, k, last, len, len1, node, row, substr, val;
        node = {};
        node.index = index;
        node.type = type;
        node.start = start;
        node.end = end;
        node.children = [];
        if (type === 'Tree') {
          text = text.split('\n');
          for (i = j = 0, len = text.length; j < len; i = ++j) {
            row = text[i];
            if ((row.length === 0) || (this.isComment(row))) {
              node.children.push(this.getNode(row, 'Comment', i, 0, row.length));
            } else {
              node.children.push(this.getNode(row, 'Statement', i, 0, row.length));
            }
          }
        } else if (type === 'Statement') {
          inside_quotes = false;
          last = 0;
          text = text.concat(',');
          for (i = k = 0, len1 = text.length; k < len1; i = ++k) {
            val = text[i];
            if (val === ',' && inside_quotes === false) {
              node.children.push(this.getNode(text.substring(last, i), 'Value', index, last, i));
              last = i + 1;
            } else if (val === '"' && inside_quotes === false) {
              inside_quotes = true;
            } else if (val === '"' && inside_quotes === true) {
              inside_quotes = false;
            }
          }
        } else if (type === 'Value') {
          substr = text.trim();
          node.start += text.indexOf(substr);
          node.end = node.start + substr.length;
        }
        return node;
      };

      return CSVParser;

    })(parser.Parser);
    CSVParser.parens = function(leading, trailing, node, context) {
      return [leading, trailing];
    };
    CSVParser.drop = function(block, context, preceding) {
      if ((context.type === 'socket') || (indexOf.call(context.classes, 'no-drop') >= 0)) {
        return helper.FORBID;
      } else {
        return helper.ENCOURAGE;
      }
    };
    return parser.wrapParser(CSVParser);
  });

}).call(this);

//# sourceMappingURL=csv.js.map