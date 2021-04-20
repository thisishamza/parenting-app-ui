const BaseError = require("../errors/BaseError");
const baseRepo = require('../repositories/base');
const ErrorCodes = require('../errors/errorCodes');
const changesRepo = require('../repositories/changes');
const apiResponseUtil = require('../helpers/api-response');
const sessionActionsRepo = require('../repositories/session-actions');
const {
  TYPE,
  reduceChanges,
  resolveConflicts,
  applyModifications,
} = require('../helpers/utils');

module.exports = async (req, res) => {
  const changes = req.body;
  const clientIdentity = req.headers.clientidentity;

  let db = {
    uncommittedChanges: {}, // Map<clientID,Array<change>> Changes where partial=true buffered for being committed later on.
    subscribers: [], // Subscribers to when database got changes. Used by server connections to be able to push out changes to their clients as they occur.
    revision: 0,

    create: async function (table, key, obj) {
      await changesRepo.insert({
        rev: ++db.revision,
        source: clientIdentity,
        type: TYPE.CREATE,
        table_name: table,
        key,
        obj,
      })

      if (table === 'session_actions') {
        await sessionActionsRepo.insert(obj);
      }
    },
    update: async function (table, key, modifications) {
      const obj = await baseRepo.getByKey(table, key);
      if (obj) {
        applyModifications(obj, modifications);
        await changesRepo.insert({
          rev: ++db.revision,
          source: clientIdentity,
          type: TYPE.UPDATE,
          table_name: table,
          key,
          mods: modifications
        })

        if (table === 'session_actions') {
          await sessionActionsRepo.update(obj);
        }
      }
    },
    'delete': async function (table, key) {
      const obj = await baseRepo.getByKey(key);

      if (obj) {
        await changesRepo.insert({
          rev: ++db.revision,
          source: clientIdentity,
          type: TYPE.DELETE,
          table: table,
          key,
        })

        if (table === 'session_actions') {
          await sessionActionsRepo.remove(obj.id);
        }
      }
    }
  };

  try {
    if (!changes instanceof Array) {
      return apiResponseUtil.errorResponse(
        res,
        new BaseError("Property 'changes' must be provided and must be an array", ErrorCodes.BAD_REQUEST)
      )
    }
    // ----------------------------------------------
    //
    //
    //
    // HERE COMES THE QUITE IMPORTANT SYNC ALGORITHM!
    //
    // 1. Reduce all server changes (not client changes) that have occurred after given
    //    baseRevision (our changes) to a set (key/value object where key is the combination of table/primaryKey)
    // 2. Check all client changes against reduced server
    //    changes to detect conflict. Resolve conflicts:
    //      If server created an object with same key as client creates, updates or deletes: Always discard client change.
    //      If server deleted an object with same key as client creates, updates or deletes: Always discard client change.
    //      If server updated an object with same key as client updates: Apply all properties the client updates unless they conflict with server updates
    //      If server updated an object with same key as client creates: Apply the client create but apply the server update on top
    //      If server updated an object with same key as client deletes: Let client win. Deletes always wins over Updates.
    //
    // 3. After resolving conflicts, apply client changes into server database.
    // 4. Send an ack to the client that we have persisted its changes
    //
    //
    // ----------------------------------------------
    // let baseRevision = req.baseRevision || 0;
    // const serverChanges = await changesRepo.getServerChanges(baseRevision)
    const serverChanges = await changesRepo.getServerChanges(clientIdentity)
    let reducedServerChangeSet = reduceChanges(serverChanges);
    // let resolved = resolveConflicts(changes, reducedServerChangeSet);
    let resolved = resolveConflicts(changes, reducedServerChangeSet);
    // Now apply the resolved changes:
    changes.forEach(async function (change) { // change
      switch (change.type) {
        case TYPE.CREATE:
          await db.create(change.table, change.key, change.obj);
          break;
        case TYPE.UPDATE:
          await db.update(change.table, change.key, change.mods);
          break;
        case TYPE.DELETE:
          await db.delete(change.table, change.key);
          break;
      }
    });

    // Now ack client that we have recieved his changes. This should be done no matter if the're buffered into uncommittedChanges
    // or if the're actually committed to db.
    return apiResponseUtil.jsonResponse(res, { message: 'Changes successfully processed'})
  } catch (e) {
    return apiResponseUtil.errorResponse(res, e)
  }
};
