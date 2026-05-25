import { RelevanceMode } from "./relevance";

export const CORE_INVESTMENT_OPENALEX_QUERIES: Array<{
  filter: string;
  mode: RelevanceMode;
}> = [
  { filter: "default.search:pension fund portfolio management", mode: "default" },
  { filter: "default.search:pension fund asset management", mode: "default" },
  { filter: "default.search:pension fund investment strategy", mode: "default" },
  { filter: "default.search:pension fund equity stock portfolio", mode: "default" },
  { filter: "default.search:pension fund fixed income bond", mode: "default" },
  { filter: "default.search:pension fund finance", mode: "default" },
  { filter: "default.search:pension fund risk management", mode: "default" },
  { filter: "default.search:pension fund performance evaluation", mode: "default" },
  { filter: "default.search:pension fund performance attribution", mode: "default" },
  { filter: "default.search:public pension portfolio management", mode: "default" },
  { filter: "default.search:institutional pension asset management", mode: "default" },
  { filter: "title.search:pension fund portfolio management", mode: "default" },
  { filter: "title.search:pension fund asset management", mode: "default" },
  { filter: "title.search:pension fund investment", mode: "default" },
  { filter: "title.search:pension fund stock equity", mode: "default" },
  { filter: "title.search:pension fund bond fixed income", mode: "default" },
  { filter: "title.search:pension fund risk management", mode: "default" },
  { filter: "title.search:pension fund performance", mode: "default" },
];

export const CORE_INVESTMENT_CROSSREF_QUERIES: Array<{
  query: string;
  mode: RelevanceMode;
}> = [
  { query: "pension fund portfolio management", mode: "default" },
  { query: "pension fund asset management", mode: "default" },
  { query: "pension fund investment strategy", mode: "default" },
  { query: "pension fund equity stock portfolio", mode: "default" },
  { query: "pension fund fixed income bond", mode: "default" },
  { query: "pension fund finance", mode: "default" },
  { query: "pension fund risk management", mode: "default" },
  { query: "pension fund performance evaluation", mode: "default" },
  { query: "pension fund performance attribution", mode: "default" },
  { query: "public pension portfolio management", mode: "default" },
  { query: "institutional pension asset management", mode: "default" },
  { query: "pension fund investment performance", mode: "default" },
];

export const CORE_INVESTMENT_NEWS_SEARCHES = [
  "pension fund portfolio management",
  "pension fund asset management",
  "pension fund investment strategy",
  "pension fund risk management",
  "pension fund performance",
  "public pension fund equity bond",
];
