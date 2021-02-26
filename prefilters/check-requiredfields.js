const filters = [
    {
        expressions: [
            /^go-cqhttp版本:\s?.{2,}$/m,
            /^运行环境:\s?.{2,}/m,
            /^连接方式:\s?.{2,}/m,
            /^使用协议:\s?.{2,}/m,
        ],
        required: true,
        description: '您的问题中缺少必要的环境信息。环境信息对于 Bug 调试非常重要，缺少这些信息将极大提高调试难度。请重新创建 Issue 并包含所有必需的环境信息。'
    },
    {
        expressions: [
            /^\*\*复现方法\*\*$/m
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
            want_tag: 'invalid'
        }
    } else {
        return {
            hit: false
        }
    }
}
