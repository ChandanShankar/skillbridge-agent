/**
 * @typedef {Object} StoreEntry
 * @property {Array<Record<string, any>>} messages
 * @property {number} timestamp
 */

/**
 * In-memory conversation history store with TTL-based cleanup.
 */
export class ConversationStore {
  /**
   * @param {number} [ttlSeconds=86400]
   * @param {number} [maxConversations=1000]
   * @param {number} [maxMessages=12]
   */
  constructor(ttlSeconds = 86400, maxConversations = 1000, maxMessages = 12) {
    /** @type {Map<string, StoreEntry>} */
    this._store = new Map();
    /** @private @type {number} */
    this._ttlSeconds = ttlSeconds;
    /** @private @type {number} */
    this._maxConversations = maxConversations;
    /** @private @type {number} */
    this._maxMessages = maxMessages;
  }

  /**
   * @param {string} channelId
   * @param {string} threadTs
   * @returns {Array<Record<string, any>> | null}
   */
  getHistory(channelId, threadTs) {
    const key = `${channelId}:${threadTs}`;
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this._ttlSeconds * 1000) {
      this._store.delete(key);
      return null;
    }
    return entry.messages;
  }

  /**
   * @param {string} channelId
   * @param {string} threadTs
   * @param {Array<Record<string, any>>} messages
   * @returns {void}
   */
  setHistory(channelId, threadTs, messages) {
    const key = `${channelId}:${threadTs}`;
    this._store.set(key, {
      messages: messages.slice(-this._maxMessages),
      timestamp: Date.now(),
    });
    this._cleanup();
  }

  /**
   * @param {string} channelId
   * @param {string} threadTs
   * @returns {void}
   */
  deleteHistory(channelId, threadTs) {
    const key = `${channelId}:${threadTs}`;
    this._store.delete(key);
  }

  /**
   * @private
   * @returns {void}
   */
  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this._store) {
      if (now - entry.timestamp > this._ttlSeconds * 1000) {
        this._store.delete(key);
      }
    }
    if (this._store.size > this._maxConversations) {
      const sorted = [...this._store.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sorted.slice(0, this._store.size - this._maxConversations);
      for (const [key] of toRemove) {
        this._store.delete(key);
      }
    }
  }
}
