const core = require('@actions/core')

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
    for (const k of keywords) {
        if (k.test(title)) {
            const link = core.getInput('discussion_link_for_feature_request')
            return {
                hit: true,
                bail: true,
                problem: `这是一个新功能需求，请在 [对应版块](${link}) 提出。此处仅处理程序运行中出现的问题。`,
                want_close: true,
                want_lock: true,
                want_tag: 'enhancement'
            }
        }
    } 

    return {
        hit: false
    }
}
