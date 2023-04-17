import { expect, it } from 'bun:test';
import { Jison } from '../../src/jison.js';
import Lexer from 'jison-lex';

it('test 0+0 grammar', () => {
  var lexData2 = {
    rules: [
      ['0', "return 'ZERO';"],
      ['\\+', "return 'PLUS';"],
    ],
  };
  var grammar = {
    tokens: ['ZERO', 'PLUS'],
    startSymbol: 'E',
    bnf: {
      E: ['E PLUS T', 'T'],
      T: ['ZERO'],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lalr' });
  parser.lexer = new Lexer(lexData2);

  // parse
  expect(parser.parse('0+0+0')).toBeTruthy();
  // parse single 0
  expect(parser.parse('0')).toBeTruthy();
  // throws parse error on invalid
  expect(() => parser.parse('+')).toThrow();
});

it('test xx nullable grammar', () => {
  var lexData = {
    rules: [['x', "return 'x';"]],
  };
  var grammar = {
    tokens: ['x'],
    startSymbol: 'A',
    bnf: {
      A: ['A x', ''],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lalr' });
  parser.lexer = new Lexer(lexData);

  // parse
  expect(parser.parse('xxx')).toBeTruthy();
  // parse single x
  expect(parser.parse('x')).toBeTruthy();
  // throws parse error on invalid
  expect(() => parser.parse('+')).toThrow();
});

it('test LALR algorithm from Bermudez, Logothetis', () => {
  var lexData = {
    rules: [
      ['a', "return 'a';"],
      ['b', "return 'b';"],
      ['c', "return 'c';"],
      ['d', "return 'd';"],
      ['g', "return 'g';"],
    ],
  };
  var grammar = {
    tokens: 'a b c d g',
    startSymbol: 'S',
    bnf: {
      S: ['a g d', 'a A c', 'b A d', 'b g c'],
      A: ['B'],
      B: ['g'],
    },
  };

  var parser = new Jison.Parser(grammar, { type: 'lalr' });
  parser.lexer = new Lexer(lexData);
  expect(parser.parse('agd')).toBeTruthy();
  expect(parser.parse('agc')).toBeTruthy();
  expect(parser.parse('bgd')).toBeTruthy();
  expect(parser.parse('bgc')).toBeTruthy();
});

it('test basic JSON grammar', () => {
  var grammar = {
    lex: {
      macros: {
        digit: '[0-9]',
        esc: '\\\\',
        int: '-?(?:[0-9]|[1-9][0-9]+)',
        exp: '(?:[eE][-+]?[0-9]+)',
        frac: '(?:\\.[0-9]+)',
      },
      rules: [
        ['\\s+', '/* skip whitespace */'],
        ['{int}{frac}?{exp}?\\b', "return 'NUMBER';"],
        [
          '"(?:{esc}["bfnrt/{esc}]|{esc}u[a-fA-F0-9]{4}|[^"{esc}])*"',
          "yytext = yytext.substr(1,yyleng-2); return 'STRING';",
        ],
        ['\\{', "return '{'"],
        ['\\}', "return '}'"],
        ['\\[', "return '['"],
        ['\\]', "return ']'"],
        [',', "return ','"],
        [':', "return ':'"],
        ['true\\b', "return 'TRUE'"],
        ['false\\b', "return 'FALSE'"],
        ['null\\b', "return 'NULL'"],
      ],
    },

    tokens: 'STRING NUMBER { } [ ] , : TRUE FALSE NULL',
    bnf: {
      JsonThing: ['JsonObject', 'JsonArray'],

      JsonObject: ['{ JsonPropertyList }'],

      JsonPropertyList: ['JsonProperty', 'JsonPropertyList , JsonProperty'],

      JsonProperty: ['StringLiteral : JsonValue'],

      JsonArray: ['[ JsonValueList ]'],

      JsonValueList: ['JsonValue', 'JsonValueList , JsonValue'],

      JsonValue: [
        'StringLiteral',
        'NumericalLiteral',
        'JsonObject',
        'JsonArray',
        'TRUE',
        'FALSE',
        'NULL',
      ],

      StringLiteral: ['STRING'],

      NumericalLiteral: ['NUMBER'],
    },
  };

  var source =
    '{"foo": "Bar", "hi": 42, "array": [1,2,3.004, -4.04e-4], "false": false, "true":true, "null": null, "obj": {"ha":"ho"}, "string": "str\\ting\\"sgfg" }';

  var gen = new Jison.Generator(grammar, { type: 'lalr' });
  var parser = gen.createParser();
  var gen2 = new Jison.Generator(grammar, { type: 'slr' });
  var parser2 = gen2.createParser();
  // SLR(1) and LALR(1) tables should be equal
  expect(gen.table).toEqual(gen2.table);
  expect(parser.parse(source)).toBeTruthy();
});

it('test LR(1) grammar', () => {
  var grammar = {
    comment: 'Produces a reduce-reduce conflict unless using LR(1).',
    tokens: 'z d b c a',
    start: 'S',
    bnf: {
      S: ['a A c', 'a B d', 'b A d', 'b B c'],
      A: ['z'],
      B: ['z'],
    },
  };

  var gen = new Jison.Generator(grammar, { type: 'lalr' });
  expect(gen.conflicts).toBe(2);
});

it('test BNF grammar bootstrap', () => {
  var grammar =
    "%%\n\nspec\n    : declaration_list '%%' grammar EOF\n        {$$ = $1; $$.bnf = $3; return $$;}\n    | declaration_list '%%' grammar '%%' EOF\n        {$$ = $1; $$.bnf = $3; return $$;}\n    ;\n\ndeclaration_list\n    : declaration_list declaration\n        {$$ = $1; yy.addDeclaration($$, $2);}\n    | \n        %{$$ = {};%}\n    ;\n\ndeclaration\n    : START id\n        %{$$ = {start: $2};%}\n    | operator\n        %{$$ = {operator: $1};%}\n    ;\n\noperator\n    : associativity token_list\n        {$$ = [$1]; $$.push.apply($$, $2);}\n    ;\n\nassociativity\n    : LEFT\n        {$$ = 'left';}\n    | RIGHT\n        {$$ = 'right';}\n    | NONASSOC\n        {$$ = 'nonassoc';}\n    ;\n\ntoken_list\n    : token_list symbol\n        {$$ = $1; $$.push($2);}\n    | symbol\n        {$$ = [$1];}\n    ;\n\ngrammar\n    : production_list\n        {$$ = $1;}\n    ;\n\nproduction_list\n    : production_list production\n        {$$ = $1; $$[$2[0]] = $2[1];}\n    | production\n        %{$$ = {}; $$[$1[0]] = $1[1];%}\n    ;\n\nproduction\n    : id ':' handle_list ';'\n        {$$ = [$1, $3];}\n    ;\n\nhandle_list\n    : handle_list '|' handle_action\n        {$$ = $1; $$.push($3);}\n    | handle_action\n        {$$ = [$1];}\n    ;\n\nhandle_action\n    : handle action prec\n        {$$ = [($1.length ? $1.join(' ') : '')];\n            if($2) $$.push($2);\n            if($3) $$.push($3);\n            if ($$.length === 1) $$ = $$[0];\n        }\n    ;\n\nhandle\n    : handle symbol\n        {$$ = $1; $$.push($2)}\n    | \n        {$$ = [];}\n    ;\n\nprec\n    : PREC symbol\n        %{$$ = {prec: $2};%}\n    | \n        {$$ = null;}\n    ;\n\nsymbol\n    : id\n        {$$ = $1;}\n    | STRING\n        {$$ = yytext;}\n    ;\n\nid\n    : ID\n        {$$ = yytext;}\n    ;\n\naction\n    : ACTION\n        {$$ = yytext;}\n    | \n        {$$ = '';}\n    ;\n\n";

  var lex =
    '\n%%\n\\s+    \t{/* skip whitespace */}\n"/*"[^*]*"*"    \t{return yy.lexComment(this);}\n[a-zA-Z][a-zA-Z0-9_-]*    \t{return \'ID\';}\n\'"\'[^"]+\'"\'    \t{yytext = yytext.substr(1, yyleng-2); return \'STRING\';}\n"\'"[^\']+"\'"    \t{yytext = yytext.substr(1, yyleng-2); return \'STRING\';}\n":"    \t{return \':\';}\n";"    \t{return \';\';}\n"|"    \t{return \'|\';}\n"%%"    \t{return \'%%\';}\n"%prec"    \t{return \'PREC\';}\n"%start"    \t{return \'START\';}\n"%left"    \t{return \'LEFT\';}\n"%right"    \t{return \'RIGHT\';}\n"%nonassoc"    \t{return \'NONASSOC\';}\n"%"[a-zA-Z]+[^\\n]*    \t{/* ignore unrecognized decl */}\n"{{"[^}]*"}"    \t{return yy.lexAction(this);}\n"{"[^}]*"}"    \t{yytext = yytext.substr(1, yyleng-2); return \'ACTION\';}\n"%{"(.|\\n)*?"%}"    	{yytext = yytext.substr(2, yytext.length-4);return \'ACTION\';} \n.    \t{/* ignore bad characters */}\n<<EOF>>    \t{return \'EOF\';}\n\n%%\n\n';

  var gen = new Jison.Generator(grammar, { type: 'lalr' });
  gen.lexer = new Lexer(lex);

  var parser = gen.createParser();

  // bootstrapped bnf parser should parse correctly.
  expect(parser.parse(grammar)).toBeTruthy();
});
