const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

const validateBranchName = ({branchName}) =>
    (/^[a-zA-z0-9_\-./]+$/.test(branchName));


const validateDirectoryName = ({workingDirectory}) =>
    (/^[a-zA-z0-9_\-./]+$/.test(workingDirectory));

async function run() {

    const baseBranch = core.getInput('base-branch', {required: true});
    const targetBranch = core.getInput('target-branch', {required: true});
    const ghToken = core.getInput('gh-token', {required: true});
    const workingDirectory = core.getInput('working-directory', {required: true});
    const debug = core.getBooleanInput('debug', {required: true});
    const commonExecOpts = { cwd: workingDirectory};

    core.setSecret('gh-token', ghToken);

    if (!validateBranchName({branchName: baseBranch})) {
        core.setFailed('Invalid base branch name. Branch name should include only letters, numbers, and special characters');
        return;
    }

    if (!validateBranchName({branchName: targetBranch})) {
        core.setFailed('Invalid target branch name. Branch name should include only letters, numbers, and special characters');
        return;
    }

    if (!validateDirectoryName({workingDirectory})) {
        core.setFailed('Invalid working directory name. Directory name should include only letters, numbers, and special characters');
        return;
    }

    core.info(`[js-dependency-update]: base branch is ${baseBranch}`);
    core.info(`[js-dependency-update]: target branch is ${targetBranch}`);
    core.info(`[js-dependency-update]: working directory is ${workingDirectory}`);
    core.info(`[js-dependency-update]: github token is ${ghToken}`);


    await exec.exec('npm update', [], {
        cwd: commonExecOpts,
    });

    const gitStatus = await exec.getExecOutput('git status -s package*.json', [], {
        cwd: commonExecOpts,
    });

    if (gitStatus.stdout.trim() === '') {
        core.info('[js-dependency-update]: No updates found');
    }
    else{
        core.info('[js-dependency-update]: Updates found')
        await exec.exec('git config --global user.name "gh-automation"', [], {
            cwd: commonExecOpts
        });

        await exec.exec('git config --global user.email "gh-automation@github.com"', [], {
            cwd: commonExecOpts
        });

        await exec.exec(`git checkout -b ${targetBranch}`, [], {
            cwd: commonExecOpts
        });

        await exec.exec('git add package*.json', [], {
            cwd: commonExecOpts
        });

        await exec.exec('git commit -m "Update NPM dependencies"', [], {
            cwd: commonExecOpts
        });

        await exec.exec(`git push origin ${targetBranch}`, [], {
            cwd: commonExecOpts
        });

        const octokit = github.getOctokit(ghToken);

        try {
            const { data: pullRequest } = await octokit.rest.pulls.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                title: `Update NPM dependencies`,
                body: `This pull request updates NPM packages`,
                base: baseBranch,
                head: targetBranch
            });
            core.info(`Pull request created: ${pullRequest.html_url}`);
        } catch (e) {
            core.error('[js-dependency-update] : Something went wrong while creating the PR. Check logs below.')
            core.setFailed(e.message);
            core.error(e);
        }

    }




    /*
    1. Parse inputs:
    1.1 base-branch from which to check for updates
    1.2 target-branch to which to create the PR
    1.3 Github Token for authentication to create PRs
    1.4 working-directory in which to run the action and check for dependency updates

    2. Execute npm update command within working directory
    3. Check if there are any updates to the package.json files
    4. If there are updates, create a PR with the updated package.json files to the base branch using
    the target branch
    5. Commit files to the target branch
    6. If there are no updates, exit the action
     */

    // core.info('I am a custom JS action');
}

run();