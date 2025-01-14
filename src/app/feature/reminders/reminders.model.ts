import { FormControl, Validators } from "@angular/forms";
import { IDBDoc, IDBTable } from "packages/data-models/db.model";

/******************************************************************************************
 * Typings
 ******************************************************************************************/
export interface IReminderData {
  app_day: number;
  /** As database lookups are async and inefficient, store key results in memory (keyed by target field) */
  dbCache: { [table_id in IDBTable]?: { [filter_id: string]: any[] } };
  // taskdbCache: { [action_id: string]: ITaskAction[] };
  // appEventHistory: { [event_id in IAppEvent["event_id"]]?: IAppEvent[] };
  // reminderHistory: { [reminder_id: string]: IReminder[] };
}

/******************************************************************************************
 * Legacy code (to review) CC 2021-05-16
 ******************************************************************************************/

export interface IReminder extends IDBDoc {
  _created: ISODateString;
  _modified: ISODateString;
  /** */
  reminder_id: string;
  /**
   * ID for lookup against fix set of reminder types
   */
  type: IReminderType;
  /**
   * Date reminder is set as due, in date.toISOString() format
   */
  due: ISODateString;
  /**
   * Additional metadata to pass to a reminder
   */
  data: { customLabel?: string };
  complete: boolean;
  repeat: IRepeatString;
  notify: boolean;
  notifications: any[];
}

export interface IReminderTypeMeta {
  type: IReminderType;
  label: string;
  group: string;
}
export type IReminderType = "praise_child" | "one_on_one_time" | "custom";

type IRepeatString = keyof typeof REPEAT_DURATIONS;
type ISODateString = string;

/******************************************************************************************
 * Reminder templates
 ******************************************************************************************/

/**
 * The template is used to populate a formgroup with all reminder fields, default values
 * and validators.
 * @example
 * ```
 * const form = new FormGroup(REMINDER_FORM_TEMPLATE);
 * ```
 */
export const REMINDER_FORM_TEMPLATE: {
  [key in keyof IReminder]: FormControl;
} = {
  _created: new FormControl(new Date().toISOString()),
  _modified: new FormControl(new Date().toISOString()),
  reminder_id: new FormControl(undefined),
  id: new FormControl(undefined),
  complete: new FormControl(false),
  data: new FormControl({}),
  due: new FormControl(null, Validators.required),
  notify: new FormControl(false),
  notifications: new FormControl([]),
  repeat: new FormControl("never"),
  type: new FormControl(null, Validators.required),
};

/******************************************************************************************
 * Reminder properties and options
 ******************************************************************************************/

export const REMINDER_TYPES: {
  [key in IReminderType]: IReminderTypeMeta;
} = {
  praise_child: {
    type: "praise_child",
    label: "Praise my child",
    group: "",
  },
  one_on_one_time: {
    type: "one_on_one_time",
    label: "Spend one on one time with my child",
    group: "",
  },
  custom: {
    type: "custom",
    label: "Other",
    group: "",
  },
};

/**
 * Note - currently not used, preferring instead to use a calendar date picker
 */
export const REMINDER_TIMES = {
  one_hour: {
    label: "In One Hour",
    value: "one_hour",
  },
  tomorrow: {
    label: "Tomorrow",
    value: "tomorrow",
  },
  next_week: {
    label: "Next Week",
    value: "next_week",
  },
  custom: {
    label: "Custom",
    value: "custom",
  },
};

export const REPEAT_DURATIONS = {
  never: {
    label: "Do not repeat",
    value: "never",
  },
  daily: {
    label: "Daily",
    value: "daily",
  },
  weekly: {
    label: "Weekly",
    value: "weekly",
  },
  monthly: {
    label: "Monthly",
    value: "monthly",
  },
};
