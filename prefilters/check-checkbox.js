const checkboxes = [
    /^- \[(\s|x)\] 我已经阅读"提问前需知 \[图\+文\]": `Mrs4s\/go-cqhttp\/issues\/633`$/,
]

const PROBLEM = {
    missing: '无法检测到某些确认教程已阅的候选框。请重新创建 Issue 并确保您没有删除或修改这些确认框。',
    not_ticked: '检测到您没有勾选部分确认教程已阅的候选框。请重新创建 Issue、仔细阅读教程并遵守相关发帖格式。'
}

module.exports = function checkCheckbox(issue) {
    const body = issue.body
    let missing = false, not_ticked = false
    for (const cb of checkboxes) {
        const matches = cb.exec(body)
        if (matches !== null) {
            const ticked = matches[1]
            if (ticked !== 'x') {
                not_ticked = true
            } 
        } else {
            missing = true
        }
    }
    if (missing || not_ticked) {
        let problem = []
        if (missing) problem.push(PROBLEM.missing)
        if (not_ticked) problem.push(PROBLEM.not_ticked)
        return {
            hit: true,
            break: false,
            want_close: true,
            want_not_close: false,
            problem,
            want_tag: ['invalid']
        }
    } else {
        return {
            hit: false
        }
    }

}
