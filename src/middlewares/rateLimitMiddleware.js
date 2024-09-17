const { rateLimit } = require("express-rate-limit");
const { PrismaClient } = require("@prisma/client");
const NodeCache = require("node-cache");
const prisma = new PrismaClient();
const cache = new NodeCache({ stdTTL: 900, checkperiod: 120 }); // 15 minutes TTL

class PrismaStore {
  constructor(windowMs) {
    this.windowMs = windowMs;
  }

  async increment(key) {
    const now = new Date();
    const resetTime = new Date(now.getTime() + this.windowMs);

    let record = cache.get(key);

    if (!record) {
      // Try to fetch from the database
      record = await prisma.rateLimit.findUnique({ where: { key } });

      // If the record exists and is not expired
      if (record && record.resetTime < now) {
        record = null;
      }
    }

    if (record) {
      record.count++;
      record.resetTime = resetTime;
    } else {
      record = { count: 1, resetTime };
    }

    // Update cache
    cache.set(key, record, this.windowMs / 1000);

    // Update database
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: record.count, resetTime: record.resetTime },
      create: { key, count: record.count, resetTime: record.resetTime },
    });

    return record;
  }

  async decrement(key) {
    const record = cache.get(key);
    if (record && record.count > 0) {
      record.count--;
      cache.set(key, record);
      // Update the database to decrement the count
      await prisma.rateLimit.update({
        where: { key },
        data: { count: record.count > 0 ? record.count : 0 },
      });
    }
  }

  async resetKey(key) {
    // Remove from cache
    cache.del(key);

    // Remove from the database
    await prisma.rateLimit.delete({ where: { key } });
  }
}

const createAdvancedLimiter = (options) => {
  const store = new PrismaStore(options.windowMs);
  return rateLimit({
    ...options,
    store,
    keyGenerator: (req) => {
      return req.ip + ":" + req.path;
    },
  });
};

// Login limiter: 5 requests per 15 minutes
const loginLimiter = createAdvancedLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: "Too many login attempts, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// General limiter: 100 requests per 15 minutes
const generalLimiter = createAdvancedLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, generalLimiter };
