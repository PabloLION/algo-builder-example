import { AccountStore, Runtime } from "@algo-builder/runtime";
import { types as webTypes } from "@algo-builder/web";
import { expect } from "chai";

it("test CallerApplicationID", () => {
  // Arrange
  let master = new AccountStore(1000000);
  let user = new AccountStore(1000000);
  let runtime = new Runtime([master, user]);
  const callerAppDef: webTypes.AppDefinition = {
    metaType: webTypes.MetaType.FILE,
    approvalProgramFilename: "caller_app.py",
    clearProgramFilename: "clear_v6.teal",
    localInts: 0,
    localBytes: 0,
    globalInts: 0,
    globalBytes: 0,
    extraPages: 0,
    appName: "caller-app",
  };
  const calleeAppDef: webTypes.AppDefinition = {
    metaType: webTypes.MetaType.FILE,
    approvalProgramFilename: "callee_app.py",
    clearProgramFilename: "clear_v6.teal",
    localInts: 0,
    localBytes: 0,
    globalInts: 0,
    globalBytes: 0,
    extraPages: 0,
    appName: "callee-app",
  };
  const callerInfo = runtime.deployApp(master.account, callerAppDef, {});
  const callerId = callerInfo.appID;
  const calleeId = runtime.deployApp(master.account, calleeAppDef, {}).appID;
  // fund caller app
  runtime.getAccount(callerInfo.applicationAccount).amount = 1000000n;
  expect(callerId).to.eq(9);
  expect(calleeId).to.eq(10);

  // Act
  const callCallerAppParam: webTypes.AppCallsParam = {
    type: webTypes.TransactionType.CallApp,
    sign: webTypes.SignType.SecretKey,
    fromAccount: master.account,
    appID: callerId,
    payFlags: {
      totalFee: 1000,
    },
    appArgs: ["str:creator_call"],
    // here it's not working , see EG14 // note: Convert.str2u8a(noteStr ?? "note"),
    foreignApps: [calleeId],
  };
  const logs = runtime.executeTx([callCallerAppParam])[0].logs!;
  const calling_log = String.fromCharCode.apply(null, Array.from(logs[0]));
  const log_from_callee = String.fromCharCode.apply(null, Array.from(logs[1]));
  const caller_app_id = Buffer.from(logs[2]).readBigUInt64BE();

  expect(calling_log).to.eq("Calling callee_app with inner txn");
  expect(log_from_callee).to.eq(
    "Called by Inner Transaction, logging Global.caller_app_id()"
  );
  expect(caller_app_id).to.not.eq(callerId); // SHOULD EQUAL!
  expect(caller_app_id).to.eq(calleeId); // SHOULD NOT EQUAL!
});
