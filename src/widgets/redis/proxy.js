import getServiceWidget from "utils/config/service-helpers";
import createLogger from "utils/logger";
import { getRedisInfo } from "./resp-client";

const proxyName = "redisProxyHandler";
const logger = createLogger(proxyName);

export default async function redisProxyHandler(req, res) {
  const { group, service, index } = req.query;

  if (!group || !service) {
    logger.error("Invalid or missing service '%s' or group '%s'", service, group);
    return res.status(400).json({ error: "Invalid proxy service type" });
  }

  const widget = await getServiceWidget(group, service, index);
  if (!widget) {
    logger.error("Invalid or missing widget for service '%s' in group '%s'", service, group);
    return res.status(400).json({ error: "Invalid widget configuration" });
  }

  try {
    // Make sure widget.url is defined
    if (!widget.url) {
      logger.error("Missing URL in widget configuration");
      return res.status(400).json({ error: "Missing URL in widget configuration" });
    }

    // Parse the URL to get host and port
    const urlObj = new URL(widget.url);
    const host = urlObj.hostname;
    const port = urlObj.port || 6379; // Default Redis port if not specified

    // Get Redis INFO using our RESP client
    const redisInfo = await getRedisInfo(host, port, widget.key);

    // Calculate total keys
    let totalKeys = 0;
    for (const key in redisInfo) {
      if (key.startsWith('db')) {
        const match = redisInfo[key].match(/keys=(\d+)/);
        if (match && match[1]) {
          totalKeys += parseInt(match[1], 10);
        }
      }
    }

    // Extract and format the Redis metrics
    const metrics = {
      connected_clients: parseInt(redisInfo.connected_clients || 0, 10),
      used_memory_human: redisInfo.used_memory_human || "0B",
      total_keys: totalKeys,
      uptime_days: Math.floor(parseInt(redisInfo.uptime_in_seconds || 0, 10) / 86400),
      ops_per_second: parseInt(redisInfo.instantaneous_ops_per_sec || 0, 10),
      version: redisInfo.redis_version || "unknown",
    };

    return res.status(200).json(metrics);
  } catch (error) {
    logger.error("Exception calling Redis: %s", error.message);
    return res.status(500).json({ error: "Redis Error", message: error.message });
  }
}