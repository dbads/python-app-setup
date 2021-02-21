/**
 * Runs when using `npm version <type>`
 * Checks changelog added and on latest commit compared to origin
 * Moves unreleased section to new version section
 */
import fs from 'fs';
import moment from 'moment';
import { execSync } from 'child_process';
import { version } from '../../../node-app-setup/package.json';

function check() {
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  const isPreRelease = /^[\d.]+-.*$/.test(version);
  const isRelease = /^[\d.]+$/.test(version);
  if (!isRelease && !isPreRelease) {
    throw new Error(`Invalid Version Tag: ${version}`);
  }
  if (isRelease && branch !== 'master') {
    throw new Error(
      `\n------------------------------------------------------\
      \nRelease tag can only be made on "master" branch.\
      \nPlease revert change in package.json\
      \n------------------------------------------------------\n`,
    );
  }
  if (isPreRelease && branch !== 'dev') {
    throw new Error(
      `\n------------------------------------------------------\
      \nPre-release tag can only be made on "dev" branch.\
      \nPlease revert change in package.json\
      \n------------------------------------------------------\n`,
    );
  }

  // Updating remote
  execSync('git remote update');

  const status = execSync('git status -uno').toString().trim();
  const isBehind = status.match(/Your branch is behind .+ by (.+) commit.+/gim);
  const isDiff = status.match(
    /Your branch and .+ have diverged,[\s\n\r]+and have (.+) and (.+) different commits each.+/gim,
  );

  if (isBehind) {
    throw new Error(
      `\n------------------------------------------------------\
      \n${isBehind[0]}\
      \nPlease revert change in package.json\
      \n------------------------------------------------------\n`,
    );
  }

  if (isDiff) {
    throw new Error(
      `\n------------------------------------------------------\
      \n${isDiff[0]}\
      \nPlease revert change in package.json\
      \n------------------------------------------------------\n`,
    );
  }

  const UNRELEASED = '[Unreleased]\n\n> NOTE: ⬇⬇ Add below this ⬇⬇';
  const UNRELEASED_END = '\n> NOTE: ⬆⬆ And above this ⬆⬆';

  const changelogFile = fs.readFileSync('CHANGELOG.md').toString();
  const changelogStart = changelogFile.indexOf(UNRELEASED) + UNRELEASED.length;
  const changelogEnd = changelogFile.indexOf(UNRELEASED_END, changelogStart);
  const changelog = changelogFile.slice(changelogStart, changelogEnd).trim();

  if (!changelog.length) {
    throw new Error(
      `\n------------------------------------------------------\
      \nPlease add a changelog entry\
      \nPlease revert change in package.json\
      \n------------------------------------------------------\n`,
    );
  }

  const deployNotesSection = changelogFile.indexOf('## Deploy Notes');
  const deployNotesStart =
    changelogFile.indexOf(UNRELEASED, deployNotesSection) + UNRELEASED.length;
  const deployNotesEnd = changelogFile.indexOf(UNRELEASED_END, deployNotesStart);
  const deployNotes = changelogFile.slice(deployNotesStart, deployNotesEnd).trim();

  console.info(
    `\n------------------CHANGELOG-------------------------\
    \n${changelog}
    \n------------------------------------------------------\n`,
    `\n----------------DEPLOY--NOTES------------------------\
    \n${deployNotes}
    \n------------------------------------------------------\n`,
  );

  if (isPreRelease) return;

  const UNRELEASED_LINK = `---\n\n[unreleased]`;
  const unreleasedLinkStart = changelogFile.indexOf(UNRELEASED_LINK) + UNRELEASED_LINK.length;
  const unreleasedLinkEnd = changelogFile.indexOf('\n', unreleasedLinkStart) + 1;
  const unreleasedLink = changelogFile.slice(unreleasedLinkStart, unreleasedLinkEnd);
  const prevVersion = unreleasedLink.match(/v([\d.]+)\.\.\./)?.[1];

  let updatedChangelog = `${changelogFile.slice(
    0,
    changelogStart,
  )}\n${UNRELEASED_END}\n\n## [${version}] - ${moment().format(
    'YYYY-MM-DD',
  )}\n\n${changelog}${changelogFile.slice(changelogEnd + UNRELEASED_END.length, deployNotesStart)}`;

  if (deployNotes.length) {
    updatedChangelog += `\n${UNRELEASED_END}\n\n### [${version}]\n\n${deployNotes}${changelogFile.slice(
      deployNotesEnd + UNRELEASED_END.length,
      unreleasedLinkStart,
    )}`;
  } else {
    updatedChangelog += changelogFile.slice(deployNotesStart, unreleasedLinkStart);
  }

  const versionCompare = (from, to) =>
    `https://github.com/dbads/node-app-setup/compare/v${from}...${to ? `v${to}` : 'dev'}`;

  updatedChangelog += `: ${versionCompare(version)}\n[${version}]: ${versionCompare(
    prevVersion,
    version,
  )}\n${changelogFile.slice(unreleasedLinkEnd)}`;

  fs.writeFileSync('CHANGELOG.md', updatedChangelog);
  execSync('git add CHANGELOG.md');
}

if (require.main?.filename === __filename) {
  check();
}
