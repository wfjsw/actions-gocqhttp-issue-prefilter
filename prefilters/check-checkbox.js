const checkboxes = [
    /^- \[(\s|x)\] 我已经仔细阅读上述教程和"提问前需知 \[图\+文\]": https:\/\/github\.com\/Mrs4s\/go-cqhttp\/issues\/633$/m,
    /^- \[(\s|x)\] 我已知晓并同意，如果我不遵循以下格式提交 Issue，或者我使用的并非最新版本，或者我没有提供足够的环境信息，则我的 Issue 可能会被无条件自动关闭和锁定。/m,
    /^- \[(\s|x)\] 我已知晓并同意，我仅需要把选项前的 \[ \] 替换为 \[x\]。如果我删除、修改这些复选框的其他部分，或是在 x 之前或之后留了空格，则我的 Issue 可能会被无条件自动关闭和锁定。$/m,
    /^- \[(\s|x)\] 我已知晓并同意，此处仅用于汇报程序中存在的问题。若这个 Issue 是关于其他非程序本身问题或是新功能需求，则我的 Issue 可能会被无条件自动关闭和锁定。（这些问题应当在 Discussion 板块提出。）$/m,

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
            bail: false,
            want_close: true,
            want_lock: false,
            problem,
        }
    } else {
        return {
            hit: false
        }
    }

}
