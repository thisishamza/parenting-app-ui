const BaseError = require("../errors/BaseError");
const baseRepo = require('../repositories/base');
const ErrorCodes = require('../errors/errorCodes');
const changesRepo = require('../repositories/changes');
const apiResponseUtil = require('../helpers/api-response');
const sessionActionsRepo = require('../repositories/session-actions');
const {
  TYPE,
  applyModifications,
} = require('../helpers/utils');

module.exports = async (req, res) => {
  const changes = req.body;
  const clientIdentity = req.headers.clientidentity;

  let db = {
    revision: 0,

    create: async function (table, key, obj) {
      try {
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
      } catch (e) {
        return apiResponseUtil.errorResponse(res, e);
      }
    },
    update: async function (table, key, modifications) {
      try {
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
      } catch (e) {
        return apiResponseUtil.errorResponse(res, e);
      }
    },
    'delete': async function (table, key) {
      try {
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
      } catch (e) {
        return apiResponseUtil.errorResponse(res, e);
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
    
    changes.forEach(async function (change) {
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

    return apiResponseUtil.jsonResponse(res, { message: 'Changes successfully processed'})
  } catch (e) {
    return apiResponseUtil.errorResponse(res, e)
  }
};
