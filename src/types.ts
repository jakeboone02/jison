export type Pojo = Record<string, any>;

export interface IJison {
  Generator?: any;
  parser?: any;
  Parser?: any;
  print?: any;
}

export type Grammar = {
  tokens: string;
  startSymbol: string;
  // TODO: expand this
  bnf: Pojo;
  options: Pojo;
};

export type ParserOptions = {
  // TODO: Narrow this to allowed types
  type: 'lr0' | 'slr' | 'lr' | 'll';
  debug: boolean;
  noDefaultResolve: boolean;
};

export type ProductionType = {
  symbol: string;
  handle: string[];
  nullable: boolean;
  id: string;
  first: any[];
  precedence: number;
};

// TODO: update these from any to real types
export interface SetMixin {
  constructor: any;
  concat: any;
  eq: any;
  indexOf: any;
  union: any;
  intersection: any;
  complement: any;
  subset: any;
  superset: any;
  joinSet: any;
  contains: any;
  item: any;
  i: any;
  first: any;
  last: any;
  size: any;
  isEmpty: any;
  copy: any;
  toString: any;
  push?: any;
  shift?: any;
  unshift?: any;
  forEach?: any;
  some?: any;
  every?: any;
  join?: any;
  sort?: any;
  filter?: any;
  slice?: any;
  map?: any;
}
