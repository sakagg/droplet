# Droplet ANTLR adapter
#
# Copyright (c) 2015 Anthony Bau
# MIT License

helper = require './helper.coffee'
model = require './model.coffee'
parser = require './parser.coffee'
treewalk = require './treewalk.coffee'
antlr4 = require 'antlr4'

ANTLR_PARSER_COLLECTION = {
  'JavaLexer': require('../antlr/JavaLexer'),
  'JavaParser': require('../antlr/JavaParser'),
  'CLexer': require('../antlr/CLexer'),
  'CParser': require('../antlr/CParser'),
  'jvmBasicLexer': require('../antlr/jvmBasicLexer'),
  'jvmBasicParser': require('../antlr/jvmBasicParser'),
}

exports.createANTLRParser = (name, config, root) ->
  root ?= 'compilationUnit'

  parse = (context, text) ->
    # Construct but do not execute all of the necessary ANTLR accessories
    chars = new antlr4.InputStream(text)
    lexer = new ANTLR_PARSER_COLLECTION["#{name}Lexer"]["#{name}Lexer"](chars)
    tokens = new antlr4.CommonTokenStream(lexer)
    parser = new ANTLR_PARSER_COLLECTION["#{name}Parser"]["#{name}Parser"](tokens)

    # Build the actual parse tree
    parser.buildParseTrees = true
    return transform parser[context]()

  # Transform an ANTLR tree into a treewalker-type tree
  transform = (node, parent = null) ->
    result = {}
    if node.children?
      result.terminal = node.children.length is 0
      result.type = node.parser.ruleNames[node.ruleIndex]
      result.children = (transform(child, result) for child in node.children)
      result.bounds = getBounds node
      result.parent = parent
    else
      result.terminal = true
      result.type = (node.parser ? node.parentCtx.parser).symbolicNames[node.symbol.type]
      result.children = []
      result.bounds = getBounds node
      result.parent = parent

    return result

  getBounds = (node) ->
    if node.start? and node.stop?
      return {
        start: {
          line: node.start.line - 1
          column: node.start.column
        }
        end: {
          line: node.stop.line - 1
          column: node.stop.column + node.stop.stop - node.stop.start + 1
        }
      }
    else
      return {
        start: {
          line: node.symbol.line - 1
          column: node.symbol.column
        }
        end: {
          line: node.symbol.line - 1
          column: node.symbol.column + node.symbol.stop - node.symbol.start + 1
        }
      }

  return treewalk.createTreewalkParser parse, config, root
