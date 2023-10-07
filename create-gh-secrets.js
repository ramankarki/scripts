const sodium = require('libsodium-wrappers'); // eslint-disable-line
const fs = require('fs'); // eslint-disable-line
const { Octokit } = require('@octokit/core'); // eslint-disable-line

const env = process.argv[2];
const envFile = fs.readFileSync(`${env}.env`);

const owner = 'shrig-Solutions';
const repo = 'saro-backend';
const localEnvFile = fs.readFileSync('local.env').toString().split('\n');
const token = localEnvFile
  .find((kv) => kv.startsWith('GH_PERSONAL_TOKEN'))
  ?.split('=')
  .at(-1);

/**
 *
 * @usage pnpm ghsc env_file_name
 */
async function main() {
  await sodium.ready;
  const envFileLines = envFile.toString().split('\n').filter(Boolean);
  const octokit = new Octokit({ auth: token });
  const {
    data: { key: pubkey, key_id },
  } = await octokit.request(
    `GET /repos/${owner}/${repo}/actions/secrets/public-key`,
    {
      owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  for (let line of envFileLines) {
    if (line.startsWith('#')) continue;

    try {
      const [key, ...value] = line.split('=');
      const finalValue = value.join('=');
      const envKey = `${env.toUpperCase()}_${key}`;
      let binkey = sodium.from_base64(pubkey, sodium.base64_variants.ORIGINAL);
      let binsec = sodium.from_string(finalValue);
      let encBytes = sodium.crypto_box_seal(binsec, binkey);
      let encryptedValue = sodium.to_base64(
        encBytes,
        sodium.base64_variants.ORIGINAL,
      );

      await octokit.request(
        `PUT /repos/${owner}/${repo}/actions/secrets/${envKey}`,
        {
          owner,
          repo,
          secret_name: envKey,
          encrypted_value: encryptedValue,
          key_id,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );
      console.log({ envKey, encryptedValue });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
}

main();
