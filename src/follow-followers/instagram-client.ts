import axios, { AxiosInstance } from 'axios';
import { sleep } from './helpers';

export interface UserInfo {
  pk: string;
  username: string;
  full_name: string;
  is_private: boolean;
  follower_count?: number;
  friendship_status?: {
    following: boolean;
    outgoing_request: boolean;
    followed_by: boolean;
  };
}

export interface FollowersPage {
  users: UserInfo[];
  next_max_id?: string;
}

const WEB_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MOBILE_UA =
  'Instagram 319.0.0.34.109 Android (31/12; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 553532124)';

export class InstagramClient {
  private webClient: AxiosInstance;
  private mobileClient: AxiosInstance;
  private sessionId: string;
  private csrfToken: string = '';
  /** All cookies collected during initializeSession */
  private extraCookies: Record<string, string> = {};

  constructor(sessionId: string) {
    this.sessionId = sessionId;

    this.webClient = axios.create({
      baseURL: 'https://www.instagram.com',
      headers: {
        'User-Agent': WEB_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'X-IG-App-ID': '936619743392459',
        Connection: 'keep-alive',
      },
      timeout: 30000,
    });

    this.mobileClient = axios.create({
      baseURL: 'https://i.instagram.com',
      headers: {
        'User-Agent': MOBILE_UA,
        'Accept-Language': 'en-US',
        'Accept-Encoding': 'gzip, deflate',
        'X-IG-App-ID': '936619743392459',
        'X-IG-Capabilities': '3brTvw==',
        'X-IG-Connection-Type': 'WIFI',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Connection: 'keep-alive',
      },
      timeout: 30000,
    });
  }

  // ── Cookie helpers ────────────────────────────────────────────────────────

  private buildCookieHeader(extra: Record<string, string> = {}): string {
    const jar: Record<string, string> = {
      sessionid: this.sessionId,
      ...this.extraCookies,
      ...extra,
    };
    if (this.csrfToken) jar['csrftoken'] = this.csrfToken;
    return Object.entries(jar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  private extractCookiesFromResponse(headers: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    const raw = headers['set-cookie'];
    if (!raw) return result;
    const list = Array.isArray(raw) ? raw : [raw as string];
    for (const line of list) {
      const m = line.match(/^([^=]+)=([^;]*)/);
      if (m) result[m[1].trim()] = m[2].trim();
    }
    return result;
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  async initializeSession(): Promise<void> {
    const res = await axios.get('https://www.instagram.com/', {
      headers: {
        'User-Agent': WEB_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: `sessionid=${this.sessionId}`,
      },
      timeout: 20000,
      validateStatus: () => true,
    });

    // Capture ALL cookies from the response
    this.extraCookies = this.extractCookiesFromResponse(res.headers as Record<string, unknown>);
    this.csrfToken = this.extraCookies['csrftoken'] ?? '';
    delete this.extraCookies['csrftoken']; // will be added by buildCookieHeader

    // Fallback: extract csrf from page JSON
    if (!this.csrfToken) {
      const m = (res.data as string).match(/"csrf_token"\s*:\s*"([^"]+)"/);
      if (m) this.csrfToken = m[1];
    }

    if (!this.csrfToken) {
      console.warn('[warn] csrftoken not found — follow actions may fail.');
    }

    const cookieHeader = this.buildCookieHeader();
    this.webClient.defaults.headers.common['Cookie'] = cookieHeader;
    this.webClient.defaults.headers.common['X-CSRFToken'] = this.csrfToken;
    this.mobileClient.defaults.headers.common['Cookie'] = cookieHeader;
    this.mobileClient.defaults.headers.common['X-CSRFToken'] = this.csrfToken;
  }

  // ── User info — three strategies ──────────────────────────────────────────

  async fetchUserProfile(username: string): Promise<UserInfo> {
    const strategies: Array<() => Promise<UserInfo>> = [
      () => this.fetchUserBySearchEndpoint(username),
      () => this.fetchUserByHtmlScraping(username),
      () => this.fetchUserByWebProfileApi(username),
    ];

    let lastError: unknown;
    for (const strategy of strategies) {
      try {
        return await strategy();
      } catch (err) {
        lastError = err;
        const status = (err as { response?: { status?: number } }).response?.status;
        // Don't bother falling through on auth errors
        if (status === 401 || status === 403) throw err;
      }
    }
    throw lastError;
  }

  /** Strategy 1 — mobile search endpoint (least rate-limited) */
  private async fetchUserBySearchEndpoint(username: string): Promise<UserInfo> {
    const cookie = this.buildCookieHeader();
    const res = await this.executeWithRetry(
      () =>
        this.mobileClient.get('/api/v1/users/search/', {
          params: { q: username, count: 10 },
          headers: { Cookie: cookie },
        }),
      2 // fewer retries so we fall through to next strategy faster
    );

    type SearchUser = {
      pk: string;
      username: string;
      full_name: string;
      is_private: boolean;
      follower_count?: number;
    };
    const data = res.data as { users?: SearchUser[] };
    const match = (data.users ?? []).find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!match) throw new Error(`"${username}" not in search results.`);

    return {
      pk: match.pk,
      username: match.username,
      full_name: match.full_name,
      is_private: match.is_private,
      follower_count: match.follower_count,
    };
  }

  /** Strategy 2 — scrape the public profile HTML */
  private async fetchUserByHtmlScraping(username: string): Promise<UserInfo> {
    const cookie = this.buildCookieHeader();
    const res = await this.executeWithRetry(
      () =>
        axios.get(`https://www.instagram.com/${username}/`, {
          headers: {
            'User-Agent': WEB_UA,
            'Accept-Language': 'en-US,en;q=0.9',
            Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
            Cookie: cookie,
          },
          timeout: 20000,
        }),
      2
    );

    const html = res.data as string;

    // Look for the server-side data blob Instagram embeds in <script> tags
    const patterns = [
      // modern: {"user":{"id":"...","username":"..."}}
      /"id"\s*:\s*"(\d+)"[^}]*"username"\s*:\s*"([^"]+)"/,
      // old sharedData style
      /"owner"\s*:\s*\{[^}]*"id"\s*:\s*"(\d+)"[^}]*"username"\s*:\s*"([^"]+)"/,
    ];

    let userId = '';
    for (const pat of patterns) {
      const m = html.match(pat);
      if (m) { userId = m[1]; break; }
    }

    // Also try extracting is_private and follower count
    const isPrivateMatch = html.match(/"is_private"\s*:\s*(true|false)/);
    const followerMatch = html.match(/"edge_followed_by"\s*:\s*\{"count"\s*:\s*(\d+)\}/);
    const fullNameMatch = html.match(/"full_name"\s*:\s*"([^"]+)"/);

    if (!userId) {
      throw new Error('Could not extract user ID from profile page.');
    }

    return {
      pk: userId,
      username,
      full_name: fullNameMatch?.[1] ?? '',
      is_private: isPrivateMatch?.[1] === 'true',
      follower_count: followerMatch ? parseInt(followerMatch[1], 10) : undefined,
    };
  }

  /** Strategy 3 — web_profile_info endpoint (most rate-limited, last resort) */
  private async fetchUserByWebProfileApi(username: string): Promise<UserInfo> {
    const cookie = this.buildCookieHeader();
    const res = await this.executeWithRetry(
      () =>
        this.webClient.get('/api/v1/users/web_profile_info/', {
          params: { username },
          headers: {
            Referer: `https://www.instagram.com/${username}/`,
            Cookie: cookie,
            'X-Requested-With': 'XMLHttpRequest',
          },
        }),
      3
    );

    const data = res.data as {
      data: {
        user: {
          id: string;
          username: string;
          full_name: string;
          is_private: boolean;
          edge_followed_by: { count: number };
        };
      };
    };

    if (!data?.data?.user) {
      throw new Error('web_profile_info returned unexpected structure.');
    }

    const u = data.data.user;
    return {
      pk: u.id,
      username: u.username,
      full_name: u.full_name,
      is_private: u.is_private,
      follower_count: u.edge_followed_by.count,
    };
  }

  // ── Followers ─────────────────────────────────────────────────────────────

  async fetchFollowersPage(userId: string, maxId?: string): Promise<FollowersPage> {
    const params: Record<string, string | number> = { count: 50 };
    if (maxId) params['max_id'] = maxId;

    const res = await this.executeWithRetry(() =>
      this.mobileClient.get(`/api/v1/friendships/${userId}/followers/`, {
        params,
        headers: { Cookie: this.buildCookieHeader() },
      })
    );

    const data = res.data as { users: UserInfo[]; next_max_id?: string };
    return {
      users: data.users ?? [],
      next_max_id: data.next_max_id,
    };
  }

  // ── Friendship status ─────────────────────────────────────────────────────

  async fetchFriendshipStatus(userId: string): Promise<{ following: boolean; followed_by: boolean; outgoing_request: boolean }> {
    const res = await this.executeWithRetry(() =>
      this.mobileClient.get(`/api/v1/friendships/show/${userId}/`, {
        headers: { Cookie: this.buildCookieHeader() },
      })
    );

    const data = res.data as {
      following?: boolean;
      followed_by?: boolean;
      outgoing_request?: boolean;
    };

    return {
      following: data.following ?? false,
      followed_by: data.followed_by ?? false,
      outgoing_request: data.outgoing_request ?? false,
    };
  }

  // ── Follow ────────────────────────────────────────────────────────────────

  async followUser(userId: string): Promise<boolean> {
    const uuid = this.generateRequestUUID();
    const body = `_uuid=${uuid}&_uid=${userId}&user_id=${userId}&radio_type=wifi-none`;

    const res = await this.executeWithRetry(() =>
      this.mobileClient.post(`/api/v1/friendships/create/${userId}/`, body, {
        headers: {
          Cookie: this.buildCookieHeader(),
          'X-CSRFToken': this.csrfToken,
        },
      })
    );

    const data = res.data as { friendship_status?: { following?: boolean } };
    return data.friendship_status?.following === true;
  }

  // ── Retry wrapper ─────────────────────────────────────────────────────────

  private async executeWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 429 || status === 503) {
          const backoff = attempt * 30_000;
          console.log(
            `[rate-limit] HTTP ${status}. Waiting ${backoff / 1000}s (attempt ${attempt}/${maxAttempts})...`
          );
          await sleep(backoff);
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private generateRequestUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}
