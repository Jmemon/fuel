# Fuel v1.8 - OAuth Integration System

**Base Version:** v1.5 (see fuel-v1-5.md)
**Purpose:** Add comprehensive OAuth authentication system for external service integrations
**Timeline:** Version 1.8 upgrade from v1.5

## Overview

This version adds a generic OAuth 2.0 system to enable Fuel to connect with external services. The OAuth system supports multiple providers simultaneously and provides secure token storage and refresh management for a single user.

## New Features in v1.8

### 1. Multi-Provider OAuth System (New)
- Generic OAuth 2.0 flow implementation
- Support for multiple OAuth providers simultaneously
- Secure token storage and refresh management
- Provider-specific configuration and scopes

### 2. OAuth Token Management (New)
- Automatic token refresh before expiration
- Secure encrypted storage of access/refresh tokens
- Provider-specific scope management
- Token revocation and re-authorization flows

### 3. Provider Configuration System (New)
- Dynamic provider registration
- Configurable OAuth endpoints and parameters
- PKCE support for enhanced security
- Extensible provider system for future integrations

## Database Schema Changes from v1.5

### New Table: `oauth_providers`
```sql
CREATE TABLE oauth_providers (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- 'github', 'twitter', 'custom'
    display_name VARCHAR(100) NOT NULL, -- 'GitHub', 'Twitter/X', 'Custom Service'
    client_id VARCHAR(255) NOT NULL,
    client_secret_encrypted TEXT NOT NULL,
    authorization_url VARCHAR(500) NOT NULL,
    token_url VARCHAR(500) NOT NULL,
    redirect_uri VARCHAR(500) NOT NULL,
    scope VARCHAR(500),
    use_pkce BOOLEAN DEFAULT false,
    additional_params JSONB, -- provider-specific OAuth parameters
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### New Table: `oauth_tokens`
```sql
CREATE TABLE oauth_tokens (
    id UUID PRIMARY KEY,
    provider_id UUID REFERENCES oauth_providers(id),
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_type VARCHAR(50) DEFAULT 'bearer',
    expires_at TIMESTAMP,
    scope VARCHAR(500),
    provider_user_id VARCHAR(255), -- external service user ID
    provider_username VARCHAR(255), -- external service username
    provider_data JSONB, -- additional provider-specific data
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW(),
    INDEX (provider_id),
    INDEX (expires_at),
    INDEX (is_active)
);
```

### New Table: `oauth_states`
```sql
CREATE TABLE oauth_states (
    id UUID PRIMARY KEY,
    state_token VARCHAR(255) UNIQUE NOT NULL,
    provider_id UUID REFERENCES oauth_providers(id),
    code_verifier VARCHAR(255), -- for PKCE flows
    redirect_after_auth VARCHAR(500),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX (state_token),
    INDEX (expires_at)
);
```

## API Changes from v1.5

### OAuth Management Endpoints

**List Available Providers**
- `GET /api/oauth/providers`
- Response: `{ providers: Array<OAuthProvider> }`

**Initiate OAuth Flow**
- `GET /api/oauth/:provider/authorize`
- Query Params: `redirect_uri?: string`
- Response: Redirects to provider authorization URL

**Handle OAuth Callback**
- `GET /api/oauth/:provider/callback`
- Query Params: `code: string, state: string`
- Response: Redirects to success/error page or API response

**List Connections**
- `GET /api/oauth/connections`
- Response: `{ connections: Array<OAuthConnection> }`

**Disconnect Provider**
- `DELETE /api/oauth/:provider/disconnect`
- Response: `{ success: boolean }`

**Refresh Token**
- `POST /api/oauth/:provider/refresh`
- Response: `{ success: boolean, expires_at: string }`

**Test Connection**
- `GET /api/oauth/:provider/test`
- Response: `{ success: boolean, profile?: object }`

## OAuth Integration Architecture

### OAuth Service Layer
```javascript
class OAuthService {
  async initiateFlow(providerName, redirectUri) {
    const provider = await this.getProviderByName(providerName);

    // Generate secure state token
    const state = await this.generateSecureState();

    // Handle PKCE if required
    let codeVerifier, codeChallenge;
    if (provider.use_pkce) {
      codeVerifier = this.generateCodeVerifier();
      codeChallenge = this.generateCodeChallenge(codeVerifier);
    }

    // Store state for verification
    await this.storeOAuthState({
      state,
      providerId: provider.id,
      codeVerifier,
      redirectUri,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

    // Build authorization URL
    const authUrl = this.buildAuthorizationUrl(provider, {
      state,
      codeChallenge
    });

    return { authorizationUrl: authUrl, state };
  }

  async handleCallback(providerName, code, state) {
    // Verify and retrieve state
    const stateData = await this.verifyAndRetrieveState(state);
    const provider = await this.getProviderById(stateData.providerId);

    if (!stateData || provider.name !== providerName) {
      throw new Error('Invalid or expired state');
    }

    // Exchange code for tokens
    const tokenData = await this.exchangeCodeForTokens(
      provider,
      code,
      stateData.codeVerifier
    );

    // Get user profile from provider (if profile endpoint configured)
    let profile = {};
    if (provider.profile_url) {
      profile = await this.fetchUserProfile(provider, tokenData.access_token);
    }

    // Store encrypted tokens
    await this.storeTokens(provider.id, tokenData, profile);

    // Clean up state
    await this.cleanupState(state);

    return {
      success: true,
      provider: provider.name,
      profile,
      redirectUri: stateData.redirectUri
    };
  }

  async refreshTokens(providerName) {
    const provider = await this.getProviderByName(providerName);
    const tokenData = await this.getTokensByProviderId(provider.id);

    if (!this.isTokenExpiringSoon(tokenData)) {
      return tokenData;
    }

    if (!tokenData.refresh_token) {
      throw new Error('No refresh token available');
    }

    const newTokens = await this.refreshProviderTokens(
      provider,
      tokenData.refresh_token
    );

    await this.updateTokens(provider.id, newTokens);
    return newTokens;
  }
}
```

### Token Encryption System
```javascript
class TokenEncryption {
  constructor(encryptionKey) {
    this.algorithm = 'aes-256-gcm';
    this.key = crypto.scryptSync(encryptionKey, 'oauth-salt', 32);
  }

  encrypt(plaintext) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key, { iv });

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(this.algorithm, this.key, {
      iv: Buffer.from(encryptedData.iv, 'hex')
    });

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### Provider Configuration System
```javascript
class OAuthProviderManager {
  async registerProvider(config) {
    const encryptedSecret = this.encryption.encrypt(config.client_secret);

    return await this.db.oauth_providers.create({
      name: config.name,
      display_name: config.display_name,
      client_id: config.client_id,
      client_secret_encrypted: JSON.stringify(encryptedSecret),
      authorization_url: config.authorization_url,
      token_url: config.token_url,
      redirect_uri: config.redirect_uri,
      scope: config.scope,
      use_pkce: config.use_pkce || false,
      additional_params: config.additional_params || {}
    });
  }

  async getProviderByName(name) {
    const provider = await this.db.oauth_providers.findOne({ name, is_active: true });
    if (!provider) {
      throw new Error(`OAuth provider '${name}' not found or inactive`);
    }

    return {
      ...provider,
      client_secret: this.encryption.decrypt(
        JSON.parse(provider.client_secret_encrypted)
      )
    };
  }

  async getProviderById(id) {
    const provider = await this.db.oauth_providers.findOne({ id, is_active: true });
    if (!provider) {
      throw new Error(`OAuth provider '${id}' not found or inactive`);
    }

    return {
      ...provider,
      client_secret: this.encryption.decrypt(
        JSON.parse(provider.client_secret_encrypted)
      )
    };
  }

  buildAuthorizationUrl(provider, params) {
    const url = new URL(provider.authorization_url);

    // Standard OAuth parameters
    url.searchParams.set('client_id', provider.client_id);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', provider.redirect_uri);
    url.searchParams.set('state', params.state);

    if (provider.scope) {
      url.searchParams.set('scope', provider.scope);
    }

    // PKCE parameters
    if (provider.use_pkce && params.codeChallenge) {
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }

    // Provider-specific additional parameters
    if (provider.additional_params) {
      for (const [key, value] of Object.entries(provider.additional_params)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }
}
```

## User Interface Changes from v1.5

### OAuth Connections Management
```
┌─────────────────────────────────────────────────────────┐
│ OAuth Connections                                       │
├─────────────────────────────────────────────────────────┤
│ Connected Services:                                     │
│                                                         │
│ 🔗 GitHub                                              │
│    john@example.com • Connected Jan 15, 2024           │
│    Scope: repo, user                                    │
│    [Test] [Refresh] [Disconnect]                        │
│                                                         │
│ 🔗 Custom Service                                      │
│    user123 • Connected Jan 14, 2024                    │
│    Scope: read, write                                   │
│    [Test] [Refresh] [Disconnect]                        │
│                                                         │
│ Available Providers:                                    │
│ [+ Connect to GitHub] [+ Connect to Twitter]           │
│ [+ Connect to Custom Service]                           │
└─────────────────────────────────────────────────────────┘
```

### OAuth Authorization Flow UI
- Clean redirect to provider authorization page
- Success/error page after callback handling
- Connection status indicators
- Token expiration warnings and refresh prompts

## Security Requirements for v1.8

### OAuth Security
- **State Parameter**: Cryptographically secure state tokens for CSRF protection
- **PKCE Support**: Code challenge/verifier for enhanced security
- **Token Encryption**: All access/refresh tokens encrypted at rest using AES-256-GCM
- **Secure Redirects**: Validate redirect URIs against configured values
- **Token Rotation**: Automatic refresh token rotation where supported

### API Security
- **Rate Limiting**: Per-provider rate limits for OAuth operations
- **Input Validation**: Comprehensive validation of all OAuth parameters
- **Audit Logging**: Log all OAuth events for security monitoring
- **Session Security**: Secure state token management

### Data Protection
- **Minimal Data Storage**: Only store necessary token and profile information
- **Data Retention**: Automatic cleanup of expired tokens and states
- **Secure Communication**: Validate all provider HTTPS endpoints
- **Provider Isolation**: Separate encryption contexts per provider

## Performance Requirements for v1.8

### OAuth Operations
- **Authorization Flow**: < 2 seconds for URL generation and redirect
- **Token Exchange**: < 3 seconds for code-to-token exchange
- **Token Refresh**: < 2 seconds for automatic token refresh
- **Connection Testing**: < 2 seconds for connection validation

### Background Processing
- **Token Maintenance**: Automatic refresh 5 minutes before expiration
- **Cleanup Operations**: Daily cleanup of expired states and tokens
- **Health Monitoring**: Connection health checks every 30 minutes

## Configuration for v1.8

### Environment Variables
```
# OAuth System Configuration
OAUTH_ENCRYPTION_KEY=your-oauth-encryption-key-32-chars
OAUTH_STATE_EXPIRY_MINUTES=15
OAUTH_REDIRECT_BASE_URL=http://localhost:3000
OAUTH_TOKEN_REFRESH_BUFFER_MINUTES=5

# Security
ENABLE_OAUTH_AUDIT_LOGGING=true
OAUTH_RATE_LIMIT_PER_HOUR=100
MAX_OAUTH_CONNECTIONS=10
```

### Database Indexes
```sql
-- OAuth performance indexes
CREATE INDEX idx_oauth_tokens_provider_id ON oauth_tokens(provider_id);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX idx_oauth_states_token ON oauth_states(state_token);
CREATE INDEX idx_oauth_states_expires_at ON oauth_states(expires_at);
CREATE INDEX idx_oauth_providers_name ON oauth_providers(name);
CREATE INDEX idx_oauth_providers_is_active ON oauth_providers(is_active);
```

## Testing Requirements for v1.8

### OAuth Flow Testing
- Complete OAuth flows for different provider configurations
- PKCE implementation testing
- State parameter validation and CSRF protection
- Token encryption/decryption verification
- Automatic token refresh scenarios

### Integration Testing
- Multiple provider connections simultaneously
- Token expiration and refresh handling
- Provider disconnection and cleanup
- Error handling for various OAuth failure scenarios

## v1.8 Success Criteria

### Functional Success
- Generic OAuth system supporting multiple providers
- Reliable token refresh and management
- Secure token storage and encryption
- Clean provider registration and management

### Technical Success
- Extensible OAuth abstraction for future providers
- Robust error handling for provider failures
- Comprehensive audit logging
- Performance targets met for all operations

### Security Success
- CSRF protection working correctly in all flows
- Encrypted token storage verified secure
- Rate limiting preventing abuse
- Secure provider configuration management

This OAuth system provides a solid foundation for integrating with any OAuth 2.0 compliant service while maintaining security and extensibility.