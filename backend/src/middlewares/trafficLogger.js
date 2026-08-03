import SystemTrafficLog from "../models/systemTrafficLog.model.js";

export const trafficLogger = async (req, res, next) => {
  res.on('finish', async () => {
    try {
      const endpoint = req.route ? req.route.path : req.path;
      const method = req.method;
      
      // Group by current hour
      const now = new Date();
      now.setMinutes(0, 0, 0);

      await SystemTrafficLog.findOneAndUpdate(
        { endpoint, method, timestampHour: now },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Traffic Logger Error:", error);
    }
  });

  next();
};
