import { FlowTypes } from "data-models";
import { template as templateFlows } from "plh-data/data/template";

// Amount of time to wait before taking snapshot to try ensure content loaded
// TODO - add syntax to specify in template specific things to look for/expect
const SNAPSHOT_DELAY = 5000;

// Example code that could be used to generate screenshots for each template
// Note - a bit slow given need to wait delay to try ensure dom rendered
it("[Take snapshot of each template]", () => {
  // const totalTemplates = templateFlows.length;
  // cy.wrap(templateFlows).each((templateFlow, index) => {
  //   const template: FlowTypes.Template = templateFlow as any;
  //   cy.visit(`/template/${template.flow_name}`);
  //   cy.wait(SNAPSHOT_DELAY);
  //   cy.screenshot(template.flow_name);
  //   cy.log(`${index}/${totalTemplates}`);
  // });
});
