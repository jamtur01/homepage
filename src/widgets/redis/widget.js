import redisProxyHandler from "./proxy";

const widget = {
  // No API endpoint needed - connect directly to Redis
  proxyHandler: redisProxyHandler,
};

export default widget;