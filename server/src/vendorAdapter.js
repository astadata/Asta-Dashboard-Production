const axios = require("axios");

class VendorAdapter {
  constructor(config, tokenManager) {
    this.config = config;
    this.tokenManager = tokenManager;
    this.http = axios.create({ baseURL: config.api_base_url });
  }

  async getAuthHeaders() {
    const authType = this.config.auth_type;
    if (authType === "oauth2_client_credentials") {
      const token = await this.tokenManager.getToken(this.config.id, async () => {
        // default fetch: application/x-www-form-urlencoded client credentials
        const resp = await axios.post(this.config.token_endpoint, new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.config.credentials.clientId,
          client_secret: this.config.credentials.clientSecret
        }).toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return { access_token: resp.data.access_token, expires_in: resp.data.expires_in };
      }, { ttlField: this.config.token_ttl_field || 'expires_in' });

      return { Authorization: `Bearer ${token}` };
    }

    if (authType === "api_key") {
      // config.credentials: { headerName: 'Authorization', apiKey: 'xxx' }
      const hname = this.config.credentials.headerName || 'Authorization';
      const val = this.config.credentials.apiKey;
      return { [hname]: val };
    }

    // default: no auth
    return {};
  }

  // fetchData: path and params are vendor-specific; adapters can override
  async fetchData(path = "/", params = {}) {
    const headers = await this.getAuthHeaders();
    const resp = await this.http.get(path, { headers: { ...this.config.default_headers, ...headers }, params });
    return this.normalize(resp.data);
  }

  // default normalization: return raw
  normalize(raw) {
    return raw;
  }
}

module.exports = VendorAdapter;
