const core = require('@actions/core')
const github = require('@actions/github')
const util = require('util')

const prefilters = {
    'move-feature-request': require('./prefilters/move-featurerequest'),
    'check-frontmatter': require('./prefilters/check-requiredfields'),
}

// most @actions toolkit packages have async methods
async function run() {
    try {
        const token = core.getInput('token')
        const [owner, repo] = core.getInput('repo').split('/')
        const issue_number = core.getInput('issue_number')
        const octokit = github.getOctokit(token)

        core.debug(util.inspect({ token, repo, issue_number }))

        const { data: issue } = await octokit.issues.get({
            owner,
            repo,
            issue_number
        })

        if ('pull_request' in issue) {
            core.info('This issue is a Pull Request. Skipping...')
            return
        }

        let want_close = false, want_tag = new Set(), problems = new Set(), triggered = new Set()
        for (const [n, pf] of Object.entries(prefilters)) {
            const result = pf(issue)
            if (result.hit) {
                triggered.push(n)
                if (result.break) break
                if (result.problem) problems.add(result.problem)
                if (result.want_close) want_close = true
                if (result.want_not_close) want_close = false
                if (typeof result.want_tag === 'string') want_tag.add(result.want_tag)
                else if (Array.isArray(result.want_tag) && result.want_tag.length > 0) {
                    for (const t of result.want_tag) {
                        want_tag.add(t)
                    }
                }
            }
        }

        if (triggered.length > 0) {

            if (problems.length > 0) {
                const guide_link = core.getInput('guide_link')
                const body = `我们在您的 Issue 中发现了如下问题：\n\n${problems.map(n => `- ${n}`).join('\n')}\n\n${want_close ? '因此您的 Issue 已被关闭。请修复上述问题后重新创建新 Issue。' : `请${guide_link ? `参照 [相关教程](${guide_link}) `:'自行'}按照上述要求对 Issue 进行修改。`}`
                await octokit.issues.createComment({
                    owner,
                    repo,
                    issue_number,
                    body
                })
            }

            if (want_tag.length > 0) {
                await octokit.issues.addLabels({
                    owner, repo, issue_number,
                    labels: want_tag
                })
            }

            if (want_close) {
                await octokit.issues.update({
                    owner, repo, issue_number,
                    state: 'closed'
                })
            }

            core.setOutput('prefilter_triggered', triggered.join('\n'))
        }

    } catch (error) {
        core.error(error.stack)
        core.setFailed(error.message)
    }
}

run()
