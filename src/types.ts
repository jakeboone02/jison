export type Pojo = Record<string, any>;

export type Grammar = {
  tokens: string;
  startSymbol: string;
  // TODO: expand this
  bnf: Pojo;
  options: Pojo;
};

export type ParserOptions = {
  // TODO: Narrow this to allowed types
  type: string;
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
