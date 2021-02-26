const filters = [
    {
        expressions: [
            /^go-cqhttp版本:/,
            /^运行环境:/,
            /^连接方式:/,
            /^使用协议:/,
        ],
        required: true,
        description: '无法检测到您的环境信息。环境信息对于 Bug 调试非常重要，缺少这些信息将极大提高调试难度。请重新创建 Issue 并包含所有必需的环境信息。'
    },
    {
        expressions: [
            /^\*\*复现方法\*\*$/
        ],
        required: false,
        description: '没有在问题描述中找到对应复现方法。清晰明了的复现方法有助于快速定位问题。请尝试复现并补全复现方法。'
    }
]

module.exports = function checkRequiredFields(issue) {
    const body = issue.body
    const hits = []
    for (const f of filters) {
        for (const exp of f.expressions) {
            if (!exp.test(body)) {
                hits.push(f)
                break
            }
        }
    }
    if (hits.length > 0) {
        let problem = [], required = false
        for (const p of hits) {
            problem.push(p.description)
            if (p.required) required = true
        }
        return {
            hit: true,
            break: false,
            problem,
            want_close: required,
            want_not_close: false,
            want_tag: 'invalid'
        }
    } else {
        return {
            hit: false
        }
    }
}
