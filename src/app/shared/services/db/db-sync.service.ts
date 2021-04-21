import { Injectable } from "@angular/core";
import { OfflineService } from "./offline.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";

const enum STATUS {
  SYNCED = 1,
  NOT_SYNCED = 0,
}

@Injectable({
  providedIn: "root",
})
export class SyncService {
  private db: any;

  constructor(private readonly offlineService: OfflineService, private httpClient: HttpClient) {
    this.registerToEvents(offlineService);
  }

  public setDb(db) {
    this.db = db;
  }

  public async postChanges(rawChanges) {
    let { value: clientIdentity } = await this.db.table("user_meta").get("uuid");

    const headers = new HttpHeaders()
      .set("Content-Type", "application/json")
      .set("clientIdentity", clientIdentity);

    const changes = rawChanges.map((change) => {
      if (change.type === 1) {
        return {
          type: change.type,
          table: change.table,
          key: change.key,
          obj: change.obj,
        };
      } else {
        return {
          type: change.type,
          table: change.table,
          key: change.key,
          mods: change.mods,
        };
      }
    });
    return this.httpClient.post(
      "https://plh-db.idems.international/api/changes",
      JSON.stringify(changes),
      {
        headers,
      }
    );
  }

  private registerToEvents(offlineService: OfflineService) {
    offlineService.connectionChanged.subscribe((online) => {
      if (online) {
        console.log("went online");
        console.log("sending all stored items");

        //pass the items to the backend if the connetion is enabled
        this.sendItemsFromIndexedDb();
      } else {
        console.log("went offline, storing in indexdb");
      }
    });
  }

  async addChange(change) {
    // save into the indexedDB if the connection is lost
    if (!this.offlineService.isOnline) {
      this.addToIndexedDb(change);
    } else {
      //post request to server
      const changes = await this.getNotSyncedChanges();
      const postChangesRequest = await this.postChanges([...changes, change]);
      postChangesRequest.subscribe(
        (res) => console.log(res),
        (error) => console.log(error),
        async () => {
          await this.addToIndexedDb(change, STATUS.SYNCED);
          await this.db
            .table("changes")
            .where({ synced: STATUS.NOT_SYNCED })
            .modify({ synced: STATUS.SYNCED });
        }
      );
    }
  }

  // ---------- add todo to the indexedDB on offline mode
  private async addToIndexedDb(change: any, synced: number = STATUS.NOT_SYNCED) {
    this.db
      .table("changes")
      .add({ changes: change, synced })
      .catch((e) => {
        console.log("Error: " + (e.stack || e));
      });
  }
  //  ---------- send the todos to the backend to be added inside the database
  private async sendItemsFromIndexedDb() {
    const changes = await this.getNotSyncedChanges();
    const postChangesRequest = await this.postChanges(changes);
    postChangesRequest.subscribe(
      (res) => console.log(res),
      (error) => console.log(error),
      async () => {
        await this.db
          .table("changes")
          .where({ synced: STATUS.NOT_SYNCED })
          .modify({ synced: STATUS.SYNCED });
      }
    );
  }

  private async getNotSyncedChanges() {
    const allItems: any[] = await this.db
      .table("changes")
      .where({ synced: STATUS.NOT_SYNCED })
      .toArray();
    return allItems.map((item) => item.changes);
  }
}
