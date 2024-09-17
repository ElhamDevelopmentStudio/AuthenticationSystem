class AdvancedStore {
  constructor(windowMs) {
    this.windowMs = windowMs;
    this.store = new Map();
  }

  // Increment the hit count for a key
  async increment(key) {
    const now = Date.now();
    let data = this.store.get(key);

    if (!data) {
      data = { startTime: now, totalHits: 0 };
      this.store.set(key, data);
    }

    // Check if the time window has expired
    if (now - data.startTime > this.windowMs) {
      data = { startTime: now, totalHits: 0 };
      this.store.set(key, data);
    }

    data.totalHits += 1;
    console.log(`Incremented key: ${key}, totalHits: ${data.totalHits}`);
    return data.totalHits;
  }

  // Get the hit count for a key
  async get(key) {
    const data = this.store.get(key);
    const totalHits = data ? data.totalHits : 0;
    console.log(`Retrieved key: ${key}, totalHits: ${totalHits}`);
    return totalHits;
  }

  // Reset the hit count for a key
  async resetKey(key) {
    this.store.delete(key);
    console.log(`Reset key: ${key}`);
  }
}

module.exports = AdvancedStore;
