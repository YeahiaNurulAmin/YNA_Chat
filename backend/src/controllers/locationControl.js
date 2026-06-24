import { getLocationService } from "../services/location/locationService.js";

export async function getLocationConfig(req, res) {
  try {
    const config = getLocationService().getClientConfig();
    res.status(200).json(config);
  } catch (error) {
    console.error("Error in getLocationConfig:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendStaticLocation(req, res) {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const service = getLocationService();

    const result = await service.sendStaticLocation({
      senderId,
      receiverId,
      rawLocation: req.body.location ?? req.body,
    });

    if (result.error) {
      return res.status(result.status || 400).json({ message: result.error });
    }

    res.status(201).json({
      message: result.message,
      location: result.location,
    });
  } catch (error) {
    console.error("Error in sendStaticLocation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getActiveLiveSession(req, res) {
  try {
    const session = await getLocationService().getActiveSession(req.user._id);
    res.status(200).json({ session });
  } catch (error) {
    console.error("Error in getActiveLiveSession:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function startLiveSession(req, res) {
  try {
    const senderId = req.user._id;
    const { receiverId, intervalMs } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    const result = await getLocationService().startLiveSession({
      senderId,
      receiverId,
      intervalMs,
    });

    if (result.error) {
      return res.status(result.status || 400).json({ message: result.error });
    }

    res.status(201).json({ session: result.session });
  } catch (error) {
    console.error("Error in startLiveSession:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function pingLiveSession(req, res) {
  try {
    const senderId = req.user._id;
    const { sessionId } = req.params;
    const force = req.body.force === true || req.body.force === "true";

    const result = await getLocationService().pingLiveSession({
      senderId,
      sessionId,
      rawLocation: req.body.location ?? req.body,
      force,
    });

    if (result.error) {
      return res.status(result.status || 400).json({ message: result.error });
    }

    if (result.skipped) {
      return res.status(200).json({ skipped: true, session: result.session });
    }

    res.status(201).json({
      message: result.message,
      session: result.session,
      location: result.location,
    });
  } catch (error) {
    console.error("Error in pingLiveSession:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function stopLiveSession(req, res) {
  try {
    const senderId = req.user._id;
    const { sessionId } = req.params;
    const sendEndMessage =
      req.body.sendEndMessage !== false && req.body.sendEndMessage !== "false";

    const result = await getLocationService().stopLiveSession({
      senderId,
      sessionId,
      sendEndMessage,
    });

    if (result.error) {
      return res.status(result.status || 400).json({ message: result.error });
    }

    res.status(200).json({
      session: result.session,
      endMessage: result.endMessage,
    });
  } catch (error) {
    console.error("Error in stopLiveSession:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
