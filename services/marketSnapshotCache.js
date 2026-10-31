const createMarketSnapshotCache = () => {
    let marketStatus = null;
    let snapshot = null;
    let marketStatusPromise = null;
    let refreshPromise = null;

    const isFresh = (entry, now, maxAge) => {
        if (!entry) {
            return false;
        }

        const expiresAt = maxAge === undefined ? entry.expiresAt : entry.fetchedAt + maxAge;
        return now < expiresAt;
    };

    return {
        clear() {
            marketStatus = null;
            snapshot = null;
            marketStatusPromise = null;
            refreshPromise = null;
        },
        getMarketStatus(now, maxAge) {
            return isFresh(marketStatus, now, maxAge) ? marketStatus : null;
        },
        getMarketStatusPromise() {
            return marketStatusPromise;
        },
        getRefreshPromise() {
            return refreshPromise;
        },
        getSnapshot(now, maxAge) {
            return isFresh(snapshot, now, maxAge) ? snapshot : null;
        },
        setMarketStatus(value, fetchedAt, expiresAt) {
            marketStatus = { value, fetchedAt, expiresAt };
            return marketStatus;
        },
        setMarketStatusPromise(promise) {
            marketStatusPromise = promise;
        },
        setRefreshPromise(promise) {
            refreshPromise = promise;
        },
        setSnapshot(value) {
            snapshot = value;
            return snapshot;
        },
        clearMarketStatusPromise(promise) {
            if (marketStatusPromise === promise) {
                marketStatusPromise = null;
            }
        },
        clearRefreshPromise(promise) {
            if (refreshPromise === promise) {
                refreshPromise = null;
            }
        },
    };
};

module.exports = createMarketSnapshotCache();
module.exports.createMarketSnapshotCache = createMarketSnapshotCache;
