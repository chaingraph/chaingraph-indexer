
## handling micro-forks

SHiP gives us a streams of table deltas ( latest state ) on each block and a list of transactions for that block.
But some times these blocks don't make it to the chain and these changes have to be rollbacked
When table_rows are updated we first take a snapshot of the state and store it on table called `table_row_snapshots` with that also has `snapshot_block_num` that serves as index to quickly retrieve data to rollback state updates on microforks.

```
table_row_snapshots
  chain
  contract
  data
  primary_key
  scope
  table
  block_num: 1
  snapshot_block_num: 2  // index to quickly retrieve 

table_rows
  chain
  contract
  data
  primary_key
  scope
  table
  block_num: 2
```
a cron job cleans up table_row_snapshots when their block_num is -3 from block latest indexed block.

A postgres function manages the ingestion of block data and microfork handling logic

```
function insert_block(new_block){
  // get the last block entry
  SELECT block_num FROM blocks ORDER BY block_num DESC LIMIT 1

  // check if we had a microfork and rollback changes
  if(new_block.block_num == block_num) {
    // rollback table rows to previous state 
    INSERT INTO table_rows VALUES(
      SELECT * FROM table_row_snapshots WHERE snapshot_block_num = new_block.block_num
    )

    // delete cascade the previous block. it removes transactions and action data
    DELETE FROM blocks WHERE block_num == new_block.block_num
  }

  // Insert new_block data
  INSERT INTO blocks VALUES(new_block.meta)
  INSERT INTO table_rows VALUES(new_block.table_rows)
  INSERT INTO transaction VALUES(new_block.transactions)
  INSERT INTO actions VALUES(new_block.actions)
}
```
