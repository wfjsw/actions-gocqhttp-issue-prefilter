const core = require('@actions/core')
const github = require('@actions/github')
const util = require('util')

const prefilters = {
    // 'tag-feature-request': require('./prefilters/tag-featurerequest'),
    'bail-featurerequest': require('./prefilters/bail-featurerequest'),
    'check-checkbox': require('./prefilters/check-checkbox'),
    'check-frontmatter': require('./prefilters/check-requiredfields'),
}

// most @actions toolkit packages have async methods
async function run() {
    try {
        const token = core.getInput('token')
        const [owner, repo] = core.getInput('repository').split('/')
        const issue_number = core.getInput('issue_number')
        const event = core.getInput('event')
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

        let is_recheck = false, old_comment_id = 0, old_comment_body = ''

        if (event === 'edited') {
            if (!Array.isArray(issue.labels)) return
            if (issue.labels.some(n => n.name === 'Issuebot: Pending Recheck')) {
                is_recheck = true
            } else {
                return
            }
        }

        if (is_recheck) {
            const { data: comments } = await octokit.issues.listComments({
                owner, repo, issue_number,
                page: 1,
                per_page: 10,
                sort: 'created',
                direction: 'asc'
            })

            const old_comment = comments.find(n => n.body.startsWith('<!-- Issuebot Comment -->'))
            if (old_comment) {
                old_comment_id = old_comment.id
                old_comment_body = old_comment.body
            }
        }

        let want_close = false, want_lock = false, want_tag = new Set(), problems = new Set(), triggered = new Set()
        for (const [n, pf] of Object.entries(prefilters)) {
            const result = pf(issue)
            if (result.hit) {
                triggered.add(n)
                if (typeof result.problem === 'string') {
                    problems.add(result.problem)
                } else if (Array.isArray(result.problem) && result.problem.length > 0) {
                    for (const p of result.problem) {
                        problems.add(p)
                    }
                }
                if (result.want_close) want_close = true
                if (result.want_not_close) want_close = false
                if (result.want_lock) want_lock = true
                if (result.want_not_lock) want_lock = false
                if (typeof result.want_tag === 'string') {
                    want_tag.add(result.want_tag)
                }
                else if (Array.isArray(result.want_tag) && result.want_tag.length > 0) {
                    for (const t of result.want_tag) {
                        want_tag.add(t)
                    }
                }
                if (result.bail) break
            }
        }

        if (triggered.size > 0) {

            if (problems.size > 0) {
                const guide_link = core.getInput('guide_link')
                const body = `<!-- Issuebot Comment --> 我们在您的 Issue 中发现了如下问题：\n\n${[...problems].map(n => `- ${n}`).join('\n')}\n\n${want_close ? `因此您的 Issue 已被关闭${want_lock ? '并锁定' : ''}。请${guide_link ? `参照 [相关教程](${guide_link}) ` : '自行'}${want_lock ? '修复上述问题后重新创建新 Issue。' : '按照上述要求对 Issue 进行修改。'}` : `请${guide_link ? `参照 [相关教程](${guide_link}) ` : '自行'}按照上述要求对 Issue 进行修改。`}`
                if (old_comment_id === 0) {
                    await octokit.issues.createComment({
                        owner, repo, issue_number, body
                    })
                } else if (body !== old_comment_body) {
                    await octokit.issues.updateComment({
                        owner, repo, issue_number,
                        comment_id: old_comment_id,
                        body
                    })
                }
            }

            if (want_tag.size > 0) {
                await octokit.issues.addLabels({
                    owner, repo, issue_number,
                    labels: [...want_tag]
                })
            }

            if (want_close && issue.state === 'open') {
                await octokit.issues.update({
                    owner, repo, issue_number,
                    state: 'closed'
                })
            }

            if (want_lock && !issue.locked) {
                await octokit.issues.lock({
                    owner, repo, issue_number,
                    lock_reason: 'off-topic'
                })
            }

            if (want_close && !want_lock && !is_recheck) {
                // eligible for recheck
                await octokit.issues.addLabels({
                    owner, repo, issue_number,
                    labels: ['Issuebot: Pending Recheck']
                })
            }

            if (is_recheck) {
                if (!want_close && issue.state === 'closed') {
                    // here we reopen it

                    await octokit.issues.update({
                        owner, repo, issue_number,
                        state: 'open'
                    })
                }
            }

            core.setOutput('prefilter_triggered', [...triggered].join('\n'))
        } else {
            // nothing is triggered
            if (is_recheck) {
                if (issue.state === 'closed') {
                    // here we reopen it

                    await octokit.issues.update({
                        owner, repo, issue_number,
                        state: 'open'
                    })

                    // remove pending recheck label
                    await octokit.issues.removeLabel({
                        owner, repo, issue_number,
                        name: 'Issuebot: Pending Recheck'
                    })
                }


                // remove comments
                if (old_comment_id > 0) {
                    await octokit.issues.deleteComment({
                        owner, repo, comment_id: old_comment_id
                    })
                }
            }

        }

    } catch (error) {
        core.error(error.stack)
        core.setFailed(error.message)
    }
}

run()
