// Shared vendor and service configuration used across dashboard and admin
export const VENDORS = [
  "all",
  "Astadata",
  "Dataimpulse",
  "Decodo",
  "Geonode",
  "Hydraproxy",
  "Infatica",
  "Luna Proxy",
  "Netnut",
  "Novada",
  "Oxylabs",
  "Packet Stream",
  "Proxies.fo",
  "Proxy Cheap",
  "PyProxy",
  "Rayobyte",
  "Scraper API",
  "SOAX"
];

export const SERVICES = [
  "all",
  "Data Center Proxy",
  "ISP",
  "Mobile Proxy",
  "Residential Proxy",
  "web Scraper API",
  "Web Unblocker"
];

// Non-"all" vendors and services for customer mappings (excludes the "all" option)
export const CUSTOMER_VENDORS = VENDORS.filter(v => v !== "all");
export const CUSTOMER_SERVICES = SERVICES.filter(s => s !== "all");
