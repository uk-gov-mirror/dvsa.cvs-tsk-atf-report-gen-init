import {atfGenInit} from "../../src/functions/atfGenInit";
import mockContext from "aws-lambda-mock-context";
import event from "../resources/stream-event.json";
import {SQService} from "../../src/services/SQService";

describe("ATF Report Gen Init Function", () => {
  const ctx = mockContext();
  describe("Passed no event", () => {
    it("should return immediately with undefined", async () => {
      const response = await atfGenInit(null, ctx, () => { return; });
      expect(response).toBe(undefined);
    });
  });
  describe("gets valid DyanmoDB streams event", () => {
    it("correctly unmarshals the event for further processing", async () => {
      const sendMessage = jest.fn().mockResolvedValue("Success");
      SQService.prototype.sendMessage = sendMessage;
      const expectedResponse = {
        id: "5e4bd304-446e-4678-8289-d34fca9256e9",
        activityType: "visit",
        testStationName: "Rowe, Wunsch and Wisoky",
        testStationPNumber: "87-1369569",
        testStationEmail: "teststationname@dvsa.gov.uk",
        testStationType: "gvts",
        testerName: "Gica",
        testerStaffId: "132",
        startTime: "2019-02-13T09:27:21.077Z",
        endTime: "2019-02-12T15:25:27.077Z"
      };

      await atfGenInit(event, ctx, () => { return; });
      expect(JSON.parse(sendMessage.mock.calls[0])).toEqual(expectedResponse);
    });
  });
  describe("SQS Service throws an error", () => {
    it("returns undefined", async () => {
      SQService.prototype.sendMessage = jest.fn().mockRejectedValue("Doh!");
      const response = await atfGenInit(event, ctx, () => { return; });
      expect(response).toBe(undefined);
    });
  });
});
