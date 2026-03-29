import axios, { type AxiosInstance } from 'axios'
import { sleep } from './helpers'

export interface UserInfo {
  pk: string
  username: string
  full_name: string
  is_private: boolean
  follower_count?: number
}

export interface FollowersPage {
  users: UserInfo[]
  next_max_id?: string
}

export interface FriendshipStatus {
  following: boolean
  followed_by: boolean
  outgoing_request: boolean
}

const WEB_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const MOBILE_UA =
  'Instagram 319.0.0.34.109 Android (31/12; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 553532124)'

export class InstagramClient {
  private webClient: AxiosInstance
  private mobileClient: AxiosInstance
  private sessionId: string
  private csrfToken: string = ''
  private extraCookies: Record<string, string> = {}

  constructor(sessionId: string) {
    this.sessionId = sessionId

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
    })

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
    })
  }

  private buildCookieHeader(extra: Record<string, string> = {}): string {
    const jar: Record<string, string> = {
      sessionid: this.sessionId,
      ...this.extraCookies,
      ...extra,
    }
    if (this.csrfToken) jar['csrftoken'] = this.csrfToken
    return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ')
  }

  private extractCookiesFromResponse(headers: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {}
    const raw = headers['set-cookie']
    if (!raw) return result
    const list = Array.isArray(raw) ? raw : [raw as string]
    for (const line of list) {
      const m = line.match(/^([^=]+)=([^;]*)/)
      if (m) result[m[1].trim()] = m[2].trim()
    }
    return result
  }

  async initializeSession(): Promise<void> {
    const res = await axios.get('https://www.instagram.com/', {
      headers: {
        'User-Agent': WEB_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: `sessionid=${this.sessionId}`,
      },
      timeout: 20000,
      validateStatus: () => true,
    })

    this.extraCookies = this.extractCookiesFromResponse(res.headers as Record<string, unknown>)
    this.csrfToken = this.extraCookies['csrftoken'] ?? ''
    delete this.extraCookies['csrftoken']

    if (!this.csrfToken) {
      const m = (res.data as string).match(/"csrf_token"\s*:\s*"([^"]+)"/)
      if (m?.[1]) this.csrfToken = m[1]
    }

    const cookieHeader = this.buildCookieHeader()
    this.webClient.defaults.headers.common['Cookie'] = cookieHeader
    this.webClient.defaults.headers.common['X-CSRFToken'] = this.csrfToken
    this.mobileClient.defaults.headers.common['Cookie'] = cookieHeader
    this.mobileClient.defaults.headers.common['X-CSRFToken'] = this.csrfToken
  }

  async fetchUserProfile(username: string, maxAttempts = 3): Promise<UserInfo> {
    // Step 1: get pk via search (low rate-limit)
    const searchRes = await this.executeWithRetry(
      () => this.mobileClient.get('/api/v1/users/search/', {
        params: { q: username, count: 10 },
        headers: { Cookie: this.buildCookieHeader() },
      }),
      maxAttempts
    )

    type SearchUser = { pk: string; username: string }
    const searchData = searchRes.data as { users?: SearchUser[] }
    const match = (searchData.users ?? []).find(u => u.username.toLowerCase() === username.toLowerCase())
    if (!match) throw new Error(`Usuário "${username}" não encontrado.`)

    // Step 2: fetch full profile by pk (includes follower_count)
    const infoRes = await this.executeWithRetry(
      () => this.mobileClient.get(`/api/v1/users/${match.pk}/info/`, {
        headers: { Cookie: this.buildCookieHeader() },
      }),
      maxAttempts
    )

    const infoData = infoRes.data as { user: { pk: string; username: string; full_name: string; is_private: boolean; follower_count: number } }
    if (!infoData?.user) throw new Error('Resposta inesperada de /users/{pk}/info/.')
    const u = infoData.user
    return { pk: String(u.pk), username: u.username, full_name: u.full_name, is_private: u.is_private, follower_count: u.follower_count }
  }

  async fetchFollowersPage(userId: string, maxId?: string): Promise<FollowersPage> {
    const params: Record<string, string | number> = { count: 50 }
    if (maxId) params['max_id'] = maxId

    const res = await this.executeWithRetry(() =>
      this.mobileClient.get(`/api/v1/friendships/${userId}/followers/`, {
        params,
        headers: { Cookie: this.buildCookieHeader() },
      })
    )

    const data = res.data as { users: UserInfo[]; next_max_id?: string }
    return { users: data.users ?? [], next_max_id: data.next_max_id }
  }

  async fetchFriendshipStatus(userId: string, maxAttempts = 3): Promise<FriendshipStatus> {
    const res = await this.executeWithRetry(() =>
      this.mobileClient.get(`/api/v1/friendships/show/${userId}/`, {
        headers: { Cookie: this.buildCookieHeader() },
      }),
      maxAttempts
    )

    const data = res.data as { following?: boolean; followed_by?: boolean; outgoing_request?: boolean }
    return {
      following: data.following ?? false,
      followed_by: data.followed_by ?? false,
      outgoing_request: data.outgoing_request ?? false,
    }
  }

  async followUser(userId: string): Promise<boolean> {
    const uuid = this.generateUUID()
    const body = `_uuid=${uuid}&_uid=${userId}&user_id=${userId}&radio_type=wifi-none`

    const res = await this.executeWithRetry(() =>
      this.mobileClient.post(`/api/v1/friendships/create/${userId}/`, body, {
        headers: { Cookie: this.buildCookieHeader(), 'X-CSRFToken': this.csrfToken },
      })
    )

    const data = res.data as { friendship_status?: { following?: boolean } }
    return data.friendship_status?.following === true
  }

  onRetry?: (status: number, waitSec: number, attempt: number) => void

  private async executeWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
    let lastErr: unknown
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (err) {
        lastErr = err
        const status = (err as { response?: { status?: number } }).response?.status
        if (status === 429 || status === 503) {
          const waitSec = attempt * 30
          this.onRetry?.(status, waitSec, attempt)
          await sleep(waitSec * 1000)
          continue
        }
        throw err
      }
    }
    throw lastErr
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }
}
