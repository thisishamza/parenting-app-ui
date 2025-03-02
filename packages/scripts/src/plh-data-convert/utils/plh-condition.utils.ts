import chalk from "chalk";
import { FlowTypes } from "../../../types";
import { booleanStringToBoolean } from "../../utils";

type ICondition = FlowTypes.DataEvaluationCondition;

/**
 * Take an activation or deactivation criteria and format for use
 * Note, as the data can vary greatly we try to break the main args into specific key-value pairs
 *
 * @example
 * ```
 * get_field:first | debug_reminder_2.sent:TRUE | before : 2 : day
 * ```
  raw:     "get_field:first | debug_reminder_2.sent:TRUE | before : 2 : day"
  parsed: {
  condition_type:db_lookup, 
  condition_args:{
    db_lookup:{
      order:asc, 
      table_id:"data_events", 
      where:{value:"TRUE",name:debug_reminder_2}
      evaluate?: {
        operator: ">";
        value: 2;
        unit: "day";
      }
    }
  } 
 * raw:     'get_field | debug_reminder_default.sent:TRUE'
  parsed: {
  condition_type:field_evaluation, 
  condition_args:{
    field_evaluation:{
      field:"debug_reminder_default.sent", 
      value: true
    }
  } 
 *
 * TODO - CC 2021-05-15 ideally this should be refactored and combined with condition handling in templates
 */
export function extractConditionList(conditionText: string) {
  const cleanedTxt = _handleTextExceptions(conditionText);
  const condition = parseConditionList(cleanedTxt);
  condition._raw = conditionText;
  return condition;
}

function parseConditionList(conditionText: string) {
  let condition: ICondition = {} as any;
  let params: any = {};
  conditionText
    .split("|")
    .map((c) => c.split(":").map((v) => v.trim()))
    .forEach(([key, ...args]) => {
      if (key && args) {
        if (params[key]) {
          params[key] = [...params[key], args];
        } else {
          params[key] = args;
        }
      }
    });
  const condition_type = params.condition_type?.[0];
  if (condition_type) {
    condition.condition_type = params.condition_type?.[0];
    delete params.condition_type;
    switch (condition.condition_type) {
      case "db_lookup":
        condition.condition_args = { db_lookup: parseDBLookupParams(params) };
        break;
      case "field_evaluation":
        condition.condition_args = {
          field_evaluation: parseFieldEvaluationParams(params),
        };
        break;
      default:
        console.error("Could not extract condition type", params);
        process.exit(1);
    }
  }
  return condition;
}

function parseFieldEvaluationParams(params: {
  [key: string]: string[];
}): ICondition["condition_args"]["field_evaluation"] {
  const args: ICondition["condition_args"]["field_evaluation"] = {} as any;
  const entries = Object.entries(params);
  if (entries[0]) {
    const [field, values] = entries[0];
    if (field && values) {
      args.field = field;
      args.value = booleanStringToBoolean(values[0]) as any;
    }
  }
  return args;
}
function parseDBLookupParams(params: {
  [key: string]: string[];
}): ICondition["condition_args"]["db_lookup"] {
  const args: ICondition["condition_args"]["db_lookup"] = {
    table_id: "",
    where: {},
    order: "desc",
  };

  Object.entries(params).forEach(([key, values]) => {
    switch (key as keyof ICondition["condition_args"]["db_lookup"]) {
      case "table_id":
        args.table_id = values[0];
        break;
      case "order":
        args.order = values[0] as any;
        break;
      case "where":
        let [field, value] = values;
        // NOTE - where queries only support text or number, so convert booleans
        // see: https://github.com/dfahlander/Dexie.js/issues/427 (non-sparse indexes)
        if (typeof value === "boolean") value = `${value}`;
        args.where = { ...args.where, [field]: value };
        break;
      case "evaluate":
        const [comparatorText, quantity, unit] = values as any[];
        const operator = _extractComparator(comparatorText);
        args.evaluate = { operator, value: quantity, unit };
        break;
      // assume one non-defined param, meant to be where statement, e.g. debug_reminder_2.sent:TRUE
      default:
        args.where = {
          ...args.where,
          name: key,
          value: `${booleanStringToBoolean(values[0])}`, // we want a string value, but also convert TRUE -> "true"
        };
        break;
    }
  });
  return args;
}

/**
 * some common authoring scenarios have been reduced to single keywords for ease-of-authoring
 * replace these with full specifications
 */
function _handleTextExceptions(text: string) {
  // handle some general string tidying, e.g. `get_field:first` vs `get_field : first`
  const generalReplacements = {
    ": ": ":",
    " :": ":",
    "before:": "evaluate:before:",
    "within:": "evaluate:within:",
  };
  Object.entries(generalReplacements).forEach(([original, replacement]) => {
    const regex = new RegExp(`${original}`);
    text = text.replace(regex, replacement);
  });

  // Handle fixed replacements. Max 1 per string, so order in terms of specifivity
  const shorthandReplacements = {
    first_launch:
      "condition_type:db_lookup | table_id:app_events | order:asc | where:event_id:app_launch",
    "get_field:first": "condition_type:db_lookup | table_id:data_events | order:asc",
    get_field: "condition_type:field_evaluation",
  };
  Object.entries(shorthandReplacements).some(([original, replacement]) => {
    // use a regular expression to prevent matching words that have additional content before
    // e.g. app_launch should not match on first_app_launch (start of string regex)
    const regex = new RegExp(`^${original}`);
    text = text.replace(regex, replacement);
    // if a match has been found return a true value so that future matches are not made
    // (e.g. prevent app_launch match running after first_launch match)
    return regex.test(text);
  });
  return text;
}

/**
 * When timing conditions are specified related to a reminder, the condition should be specified
 * with leading text such as before_3_day or after_2_day.
 * Convert the text into a logical comparator that will be used during evaluation
 */
function _extractComparator(text: string) {
  //
  // when comparing, the target evaluation value will be compared relative to todays date / app day
  // first the difference between the target event and today is calculated, called diffInDays (app or calendar)
  // for an event to happen n days before (or more), diffInDays > n
  // for an event to happen within n days, diffInDays <= n
  switch (text) {
    case "before":
      return ">";
    case "within":
      return "<=";
    default:
      console.error(chalk.red(`Reminder timing comparison not defined: ${text}`));
      process.exit(1);
  }
}
