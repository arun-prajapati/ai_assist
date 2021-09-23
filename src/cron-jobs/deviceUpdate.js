import { scheduleJob } from "node-schedule";
import { logger, level } from "../config/logger/logger";
import moment from "moment";
import Devices from "../models/device.model";
import deviceHistory from "../models/deviceHistory.model";
import * as DeviceSrv from "../services/device/device.service";
const JOB_TIME = "* * * * *";
const MIN = 15; // this minute ago data should be update

scheduleJob(JOB_TIME, async (fireDate) => {
  logger.log(
    level.info,
    `>> Device state supposed to run at ${moment(
      fireDate
    ).format()} , but actually ran at ${moment().format()}`
  );

  try {
    let [idealValves, idealPumps] = await Promise.all([
      Devices.findData({
        vstate: 1,
        // valveCurrentstate: false,
        valveLastUpdated: {
          // 15 minutes ago (from now)
          $lte: new Date(new Date() - 1000 * 60 * MIN), //! make 15 here
        },
      }),
      await Devices.findData({
        pstate: 1,
        //pumpCurrentstate: false,
        pumpLastUpdated: {
          // 15 minutes ago (from now)
          $lte: new Date(new Date() - 1000 * 60 * MIN), //! make 15 here
        },
      }),
    ]);

    if (idealValves && idealValves.length > 0) updateValveState(idealValves);
    if (idealPumps && idealPumps.length > 0) updatePumpState(idealPumps);
  } catch (error) {
    logger.log(level.error, `>> Device state JOB error ${error}`);
  }

  logger.log(
    level.info,
    `>> Device state JOB executed successfully at ${moment().format()}`
  );
});

const updateValveState = async (idealValves) => {
  // update vstate=0

  for (const valveDoc of idealValves) {
    if (!valveDoc.valveCurrentstate) {
      let updateDeviceData = await Devices.updateData(
        {
          vmac: valveDoc.vmac,
        },
        { vstate: 2 }
      );
      // await DeviceSrv.addDeviceHistoryData(updateDeviceData);
    }
  }
  logger.log(level.info, `>> ${idealValves.length} valve state updated`);
};

const updatePumpState = async (idealPumps) => {
  // update pstate=0

  for (const pumpDoc of idealPumps) {
    if (!pumpDoc.pumpCurrentstate) {
      let updateDeviceData = await Devices.updateData(
        {
          pmac: pumpDoc.pmac,
        },
        { pstate: 2 }
      );
      // await DeviceSrv.addDeviceHistoryData(updateDeviceData);
    }
  }
  logger.log(level.info, `>> ${idealPumps.length} pump state updated`);
};
// if pump or valve is off from last 15 minutes then offline pump and valve hardware status (pstate:2/vstate:2)
