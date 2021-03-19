const keywords = [
    /new feature/i,
    /feat/i,
    /新功能/,
    /建议/,
    /提议/,
    /希望/,
    /能否支持/,
    /可否支持/,
]

module.exports = function moveFeatureRequest(issue) {
    const title = issue.title

    if (Array.isArray(issue.labels) && issue.labels.some(n => n.name === 'feature request')) {
        return {
            hit: false
        }
    }

    for (const k of keywords) {
        if (k.test(title)) {
            return {
                hit: true,
                bail: true,
                want_tag: 'feature request'
            }
        }
    }

    return {
        hit: false
    }
}
