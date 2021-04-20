const database = require('../database/database.service');

const tableName = 'changes'

function insert(data) {
  return database.insert(tableName, data);
}

async function getLastRevision(clientIdentity) {
  let response = await database.query('select MAX(rev) from changes where source = $1',[clientIdentity]);
  return response.rows[0];
}

async function getChanges(clientIdentity) { // no need
  let reponse = await database.query('select * from changes where source = $1', [clientIdentity]);
  return reponse.rows ? reponse.rows.map(item => { return { ...item, table: item.table_name }}) : [];
}

async function getServerChanges(clientIdentity) {
  let reponse = await database.query('select * from changes where source = $1', [clientIdentity]);
  return reponse.rows ? reponse.rows.map(item => { return { ...item, table: item.table_name }}) : [];
}

module.exports = {
  insert,
  getChanges,
  getServerChanges,
}
