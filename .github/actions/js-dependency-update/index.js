const core = require('@actions/core');
const exec = require('@actions/exec');

const validateBranchName = ({branchName}) =>
    (/^[a-zA-z0-9_\-./]+$/.test(branchName));


const validateDirectoryName = ({workingDirectory}) =>
    (/^[a-zA-z0-9_\-./]+$/.test(workingDirectory));

async function run() {

    const baseBranch = core.getInput('base-branch');
    const targetBranch = core.getInput('target-branch');
    const ghToken = core.getInput('gh-token');
    const workingDirectory = core.getInput('working-directory');
    const debug = core.getBooleanInput('debug');

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

    await exec.execu('npm update', [], {
        cwd: workingDirectory
    });

    const gitSttaus = await exec.getExecOutput('git status -s package*.json', [], {
        cwd: workingDirectory
    });

    if (gitSttaus.stdout.trim() === '') {
        core.info('[js-dependency-update]: No updates found')
        return;
    }
    else{
        core.info('[js-dependency-update]: Updates found')
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

    core.info('I am a custom JS action');
}

run();