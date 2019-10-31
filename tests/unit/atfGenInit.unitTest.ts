import {SQService} from "../../src/services/SQService";
import {StreamService} from "../../src/services/StreamService";
import {PromiseResult} from "aws-sdk/lib/request";
import {SendMessageResult} from "aws-sdk/clients/sqs";
import {AWSError} from "aws-sdk";
import event from "../resources/stream-event.json";
import SQS = require("aws-sdk/clients/sqs");
jest.mock("aws-sdk/clients/sqs");

describe("atf-gen-init", () => {
    let processedEvent: any;

    context("StreamService", () => {
        const expectedResult: any[] = [
            {
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
            }
        ];

        context("when fetching an activity stream with both visits and wait times", () => {
            it("should result in an array of filtered js objects containing only visits", () => {
                processedEvent = StreamService.getVisitsStream(event);
                expect(processedEvent).toEqual(expectedResult);
            });
        });
    });

    context("SQService", () => {
        context("when invoking sendMessage", () => {
            it("should call the AWS SQS sendMessage function with expected params", async () => {
                SQS.prototype.getQueueUrl = jest.fn().mockReturnValue({promise: () => Promise.resolve({ QueueUrl: "aQueueUrl" })});
                const sendMessageMock = jest.fn().mockReturnValue({ promise: () => { return; }});
                SQS.prototype.sendMessage = sendMessageMock;

                const sqService: SQService = new SQService(new SQS());
                const sendMessagePromises: Array<Promise<PromiseResult<SendMessageResult, AWSError>>> = [];

                event.Records.forEach(async (record: any) => {
                    sendMessagePromises.push(sqService.sendMessage(JSON.stringify(record)));
                });

                expect.assertions(3);
                await Promise.all(sendMessagePromises);
                expect(sendMessageMock).toHaveBeenCalledTimes(2);
                expect(sendMessageMock).toHaveBeenNthCalledWith(1, {MessageBody: JSON.stringify(event.Records[0]), QueueUrl: "aQueueUrl"});
                expect(sendMessageMock).toHaveBeenNthCalledWith(2, {MessageBody: JSON.stringify(event.Records[1]), QueueUrl: "aQueueUrl"});
            });

            // Not really testable, and wasn't meaningful when it was
            //
            // it("should successfully read the added records from the queue", () => {
            //     return sqService.getMessages()
            //     .then((messages: ReceiveMessageResult) => {
            //         expect(messages.Messages!.map((message) => JSON.parse(message.Body as string))).toEqual(processedEvent);
            //     });
            // });
        });
    });
});
