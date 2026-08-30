// Claude 환경의 window.storage API를 브라우저 localStorage로 흉내내는 어댑터.
// 배포된 사이트에서는 이 파일이 기록을 브라우저(기기)별로 저장합니다.
window.storage = {
  async get(key) {
    const raw = window.localStorage.getItem(key);
    if (raw === null) throw new Error('not found');
    return { key, value: raw, shared: false };
  },
  async set(key, value) {
    window.localStorage.setItem(key, value);
    return { key, value, shared: false };
  },
  async delete(key) {
    window.localStorage.removeItem(key);
    return { key, deleted: true, shared: false };
  },
  async list(prefix) {
    const keys = Object.keys(window.localStorage).filter((k) => !prefix || k.startsWith(prefix));
    return { keys, prefix, shared: false };
  },
};
