const VendorAdapter = require("../vendorAdapter");
const axios = require("axios");

class DataimpulseAdapter extends VendorAdapter {
  constructor(config, tokenManager) {
    super(config, tokenManager);
    // DataImpulse uses custom auth, override http client
    this.http = axios.create({ baseURL: config.api_base_url });
  }

  // Override getAuthHeaders to use DataImpulse's custom token endpoint
  async getAuthHeaders() {
    const token = await this.tokenManager.getToken(this.config.id, async () => {
      console.log('[DataImpulse] Fetching new token...');
      
      try {
        // DataImpulse token fetch: POST with login/password in body (not username!)
        const resp = await axios.post(this.config.token_endpoint, {
          login: this.config.credentials.username,
          password: this.config.credentials.password
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 // 10 second timeout
        });

        console.log('[DataImpulse] Token response status:', resp.status);
        console.log('[DataImpulse] Token response data:', JSON.stringify(resp.data).substring(0, 200));

        // DataImpulse returns token directly or in a wrapper
        // DataImpulse tokens are valid for 24 hours
        const tokenData = resp.data;
        const accessToken = tokenData.token || tokenData.access_token || tokenData.data?.token;
        const expiresIn = tokenData.expires_in || tokenData.ttl || 86400; // 24 hours default

        if (!accessToken) {
          console.error('[DataImpulse] No token found in response:', tokenData);
          throw new Error('No access token in response');
        }

        console.log('[DataImpulse] Token acquired, expires in:', expiresIn, 'seconds (24 hours)');
        return { access_token: accessToken, expires_in: expiresIn };
      } catch (err) {
        console.error('[DataImpulse] Token fetch error:', err.message);
        if (err.response) {
          console.error('[DataImpulse] Response status:', err.response.status);
          console.error('[DataImpulse] Response data:', err.response.data);
        }
        throw err;
      }
    }, { ttlField: 'expires_in' });

    // DataImpulse expects token in Authorization header or query param
    // Based on their API docs, typically: Authorization: Bearer <token>
    return { Authorization: `Bearer ${token}` };
  }

  // fetch usage data from Dataimpulse API and normalize to canonical shape
  // params: { subuserId, period } where period = day|week|month|3months|6months|year|2years
  // returns array of { date, trafficGb, requests, service, vendor }
  async fetchUsage(params = {}) {
    const { subuserId, period = 'week' } = params;
    
    if (!subuserId) {
      throw new Error('subuserId is required for DataImpulse usage fetch');
    }

    console.log(`[DataImpulse] Fetching usage for subuser ${subuserId}, period: ${period}`);

    // DataImpulse usage endpoint
    const path = '/reseller/sub-user/usage-stat/get';
    const queryParams = {
      subuser_id: subuserId,
      period: period
    };

    try {
      const headers = await this.getAuthHeaders();
      console.log('[DataImpulse] Calling API:', this.config.api_base_url + path);
      console.log('[DataImpulse] Query params:', queryParams);
      
      const resp = await this.http.get(path, { 
        headers: { ...this.config.default_headers, ...headers }, 
        params: queryParams,
        timeout: 15000 // 15 second timeout
      });

      console.log('[DataImpulse] Usage response status:', resp.status);
      console.log('[DataImpulse] Usage response data structure:', Object.keys(resp.data));

      return this.normalizeUsage(resp.data, params);
    } catch (err) {
      console.error('[DataImpulse] Usage fetch error:', err.message);
      if (err.response) {
        console.error('[DataImpulse] Response status:', err.response.status);
        console.error('[DataImpulse] Response data:', JSON.stringify(err.response.data));
      }
      throw err;
    }
  }

  normalizeUsage(raw, params = {}) {
    // DataImpulse response structure:
    // { usage: [{ traffic: 1776, request: 27831, d_usage: "2025-11-24" }], total: {...} }
    
    let rows = [];
    
    if (raw && raw.usage && Array.isArray(raw.usage)) {
      rows = raw.usage;
    } else if (raw && raw.data && raw.data.usage && Array.isArray(raw.data.usage)) {
      rows = raw.data.usage;
    } else if (raw && raw.data && Array.isArray(raw.data)) {
      rows = raw.data;
    } else if (raw && Array.isArray(raw)) {
      rows = raw;
    }

    return rows.map((r) => {
      // DataImpulse actual field names from API:
      // traffic: in MB, request: count, d_usage: "YYYY-MM-DD"
      const date = r.d_usage || r.date || r.timestamp || r.time || r.day || r.period;
      
      // Convert traffic from MB to GB
      const trafficMb = r.traffic || 0;
      const trafficGb = (trafficMb / 1000).toFixed(2); // Convert MB to GB
      
      const requests = r.request || r.requests || r.request_count || r.hits || r.queries || 0;
      // Use service from params (passed from frontend) or fallback to API response
      const service = params.service || r.service || r.type || r.product || r.plan || 'N/A';

      return {
        date,
        trafficGb: Number(trafficGb),
        requests: typeof requests === 'number' ? requests : Number(String(requests).replace(/[^0-9]/g, '')) || 0,
        service,
        vendor: this.config.name || this.config.slug
      };
    });
  }

  // Optional: Add method to fetch raw data if needed
  async fetchRaw(params = {}) {
    const { subuserId, period = 'week' } = params;
    
    if (!subuserId) {
      throw new Error('subuserId is required for DataImpulse raw data fetch');
    }

    const path = '/reseller/sub-user/usage-stat/get';
    const queryParams = {
      subuser_id: subuserId,
      period: period
    };

    const headers = await this.getAuthHeaders();
    const resp = await this.http.get(path, { 
      headers: { ...this.config.default_headers, ...headers }, 
      params: queryParams 
    });

    return resp.data;
  }
}

module.exports = DataimpulseAdapter;
