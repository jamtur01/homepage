---
title: Redis
description: Redis Widget Configuration
---

Learn more about [Redis](https://redis.io/).

This widget connects directly to Redis using the Redis Serialization Protocol (RESP) to display key metrics from your Redis server.

Allowed fields: `["connected_clients", "total_keys", "used_memory", "ops_per_second", "uptime_days", "version"]`.

```yaml
widget:
  type: redis
  url: http://localhost:6379  # Direct connection to Redis
  key: your-redis-password  # Optional - only if Redis requires authentication
  fields:
    - connected_clients
    - total_keys
    - used_memory
    - ops_per_second
```

### Fields

- `connected_clients`: Number of client connections to the Redis server
- `total_keys`: Total number of keys across all databases
- `used_memory`: Memory used by the Redis server
- `ops_per_second`: Operations per second (instantaneous)
- `uptime_days`: Number of days the Redis server has been running
- `version`: Redis server version
