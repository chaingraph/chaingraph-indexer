export const bitcashbank1 = {
  type: '',
  actions: '',
  table_registry: [
    {
      code: 'bitcashbank1',
      scope: 'bitcashbank1',
      table: 'appstates',
      table_type: 'singleton',
    },
    {
      code: 'bitcashbank1',
      scope: 'bitcashbank1',
      table: 'tokens',
      computed_key_mapping: 'token_symbol',
    },
    {
      code: 'bitcashbank1',
      scope: 'bitcashbank1',
      table: 'deposits',
      table_key: 'id',
    },
    {
      code: 'bitcashbank1',
      table: 'positions',
      computed_key_mapping: 'asset_symbol',
    },
    { code: 'bitcashbank1', table: 'loans', table_key: 'key' },
    {
      code: 'bitcashbank1',
      scope: 'bitcashbank1',
      table: 'p2p',
      table_key: 'id',
    },
    {
      code: 'bitcashbank1',
      table: 'ltvlevels',
      computed_key_mapping: 'token_symbol',
    },
    {
      code: 'bitcashbank1',
      scope: 'bitcashbank1',
      table: 'activity',
      table_key: 'account',
    },
  ],
}
