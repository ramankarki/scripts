const { Octokit } = require('@octokit/core'); // eslint-disable-line
const fs = require('fs'); // eslint-disable-line

const localEnvFile = fs.readFileSync('local.env').toString().split('\n');
const token = localEnvFile
  .find((kv) => kv.startsWith('GH_PERSONAL_TOKEN'))
  ?.split('=')
  .at(-1);
const owner = 'shrig-Solutions';
const repo = 'saro-backend';
const octokit = new Octokit({ auth: token });
const prefix = process.argv[2]?.toUpperCase();

/**
 *
 * @usage pnpm ghsd prefix
 */
async function main() {
  const {
    data: { secrets, total_count },
  } = await octokit.request(`GET /repos/${owner}/${repo}/actions/secrets`, {
    owner,
    repo,
    per_page: 100,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  console.log({ total_count });

  for (let { name } of secrets) {
    if (!name.startsWith(prefix)) continue;
    await octokit.request(
      `DELETE /repos/${owner}/${repo}/actions/secrets/${name}`,
    );
    console.log(name);
  }
}

main();
