import {TokenCache} from "./tokenCache"
import { env } from "../_generated/server"


const cache = new TokenCache()

export interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

const fetchToken = async (): Promise<TokenResponse> => {
    const issuer = env.IOTEC_AUTH_ISSUER
    const clientId = env.IOTEC_AUTH_CLIENT_ID
    const clientSecret = env.IOTEC_AUTH_CLIENT_SECRET
    if (!issuer || !clientId || !clientSecret) {
        throw new Error("iotecPay credentials are not configured")
    }
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const tokenUrl = `${issuer}/protocol/openid-connect/token`
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
    })

    if (!response.ok) {
        console.error('Failed to fetch iotec auth token:', response.statusText);
        throw new Error(`iotecPay authentication failed (HTTP ${response.statusText}).`);
    }

    return await response.json() as Promise<TokenResponse>
}

export const getToken = async (): Promise<string> => {
    const cachedToken = cache.get('iotec-token')

    if (cachedToken) {
        return cachedToken
    }

    const newToken = await fetchToken()
    cache.set('iotec-token', newToken.access_token, Math.max(0, newToken.expires_in - 60) * 1000)
    return newToken.access_token
}
