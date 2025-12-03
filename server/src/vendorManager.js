const VendorAdapter = require("./vendorAdapter");
// concrete adapters
let DataimpulseAdapter;
try { DataimpulseAdapter = require('./adapters/dataimpulseAdapter'); } catch(e) { DataimpulseAdapter = null; }

class VendorManager {
  constructor(configs = [], tokenManager) {
    this.tokenManager = tokenManager;
    this.adapters = new Map();
    configs.forEach((cfg) => this.register(cfg));
  }

  register(cfg) {
    // Instantiate concrete adapter when available (by slug), otherwise use base adapter
    let adapter;
    if (cfg.slug === 'dataimpulse' && DataimpulseAdapter) {
      adapter = new DataimpulseAdapter(cfg, this.tokenManager);
    } else {
      // In future support different concrete adapter classes by cfg.adapterType
      adapter = new VendorAdapter(cfg, this.tokenManager);
    }
    this.adapters.set(cfg.id, adapter);
    return adapter;
  }

  getAdapter(vendorId) {
    return this.adapters.get(vendorId);
  }

  list() {
    return Array.from(this.adapters.values()).map((a) => a.config);
  }
}

module.exports = VendorManager;
