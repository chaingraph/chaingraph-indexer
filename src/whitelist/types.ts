export interface ChainGraphTableRegistry extends EosioReaderTableRowFilter {
  table_key: string
}

export interface TokenRegistry {
  code: string
  table: string
  table_key: string
}
