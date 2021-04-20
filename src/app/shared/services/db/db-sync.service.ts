import { Injectable } from "@angular/core";
import { OfflineService } from "./offline.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";

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
      const changes = await this.db.table("changes").toArray();
      const postChangesRequest = await this.postChanges([change, ...changes]);
      postChangesRequest.subscribe(
        (res) => {
          console.log(res);
        },
        () => {
          this.addToIndexedDb(change);
        }
      );
    }
  }

  // ---------- add todo to the indexedDB on offline mode
  private async addToIndexedDb(change: any) {
    this.db
      .table("changes")
      .add(change)
      .then(async () => {
        const allItems: any[] = await this.db.table("changes").toArray();
        console.log("saved in DB, DB is now", allItems);
      })
      .catch((e) => {
        console.log("Error: " + (e.stack || e));
      });
  }
  //  ---------- send the todos to the backend to be added inside the database
  private async sendItemsFromIndexedDb() {
    console.log("sending items");

    const allItems: any[] = await this.db.table("changes").toArray();
    //bulk update to server
    const postChangesRequest = await this.postChanges(allItems);
    postChangesRequest.subscribe(
      (res) => console.log(res),
      (error) => console.log(error),
      () => this.db.table("changes").clear()
    );
  }
}
