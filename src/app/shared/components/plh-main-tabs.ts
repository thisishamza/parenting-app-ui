import { Component } from "@angular/core";

@Component({
  selector: "plh-main-tabs",
  template: `<ion-segment (ionChange)="segmentChanged($event)">
    <ion-segment-button routerLink="module_list" value="modules" layout="icon-top">
      <ion-label>Modules</ion-label>
      <ion-icon name="book-outline"></ion-icon>
    </ion-segment-button>
    <ion-segment-button value="self-care" layout="icon-top">
      <ion-label>Self Care</ion-label>
      <ion-icon name=""></ion-icon>
    </ion-segment-button>
    <ion-segment-button value="help-me-now" layout="icon-top">
      <ion-label>Help Me Now</ion-label>
      <ion-icon name="help-circle-outline"></ion-icon>
    </ion-segment-button>
  </ion-segment>`,
  styles: [
    `
      ion-segment {
        background: var(--ion-color-primary);
      }
      ion-segment-button {
        --color: white;
        --color-checked: white;
        --indicator-height: 0;
        text-transform: unset;
      }
      ion-segment-button:focus {
        outline-width: 0;
      }
    `,
  ],
})
export class PLHMainTabsComponent {
  segmentChanged(e) {
    console.log("segment changed", e.target.value);
  }
}