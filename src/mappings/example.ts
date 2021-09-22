
{
  chain: 'eos',
  contact: 'bitcashbank1',
  actions: '*',
  tables: [
    {
      table: 'appstates',
      table_type: 'singleton',
    },
    {
      table: 'tokens',
      computed_key_type: 'symbol',
    },
    {
      table: 'deposits',
      table_key: 'id',
    },
    {
      table: 'positions',
      table_key: 'balance',
      computed_key_type: 'asset_symbol',
    },
    {  table: 'loans', table_key: 'key' },
    {
      table: 'p2p',
      table_key: 'id',
    },
    {
      table: 'ltvlevels',
      table_key: 'token',
      computed_key_type: 'symbol',
    },
    {
      table: 'activity',
      table_key: 'account',
    },
  ],
}