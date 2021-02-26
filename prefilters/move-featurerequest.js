const keywords = [
    /new feature/i,
    /feat/i,
    /新功能/,
    /建议/,
    /提议/,
    /能否支持/,
    /可否支持/,
]

const problem = '这是一个新功能需求，已为您移动到对应版块。'

module.exports = function moveFeatureRequest(issue) {
    const title = issue.title
    for (const k of keywords) {
        if (k.test(title)) {
            return {
                hit: true,
                break: true,
                problem,
                want_close: false,
                want_not_close: true,
                want_tag: 'feature request'
            }
        }
    } 

    return {
        hit: false
    }
}
