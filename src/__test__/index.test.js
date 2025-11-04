import Html5Tracker from "../tracker";

const exportedModule = require("../index");

describe("Html5Tracker Module Export", () => {
  it("should export Html5Tracker as default", () => {
    expect(exportedModule.default).toBe(Html5Tracker);
  });
});
