const semver = require('semver');
const {analyzeCommits: commitAnalyzerAnalyzeCommits} = require('@semantic-release/commit-analyzer');

async function analyzeCommits(pluginConfig, context) {
  const {logger} = context;

  const releaseType = await commitAnalyzerAnalyzeCommits(pluginConfig, context);

  logger.log('Trying to downgrade release type for zero major version');

  if (!['major', 'minor'].includes(releaseType)) {
    logger.log('Skip patch and no releases');
    return releaseType;
  }

  if (!context.lastRelease) {
    logger.log('Skip initial release');
    return releaseType;
  }

  if (semver.parse(context.lastRelease.version).major !== 0) {
    logger.log('Skip major version greater than 0');
    return releaseType;
  }

  if (context.commits.find(commit => commit.message.includes('[release 1.0.0]'))) {
    logger.log('Skip message contains [release 1.0.0]');
    return releaseType;
  }

  const result = {'major': 'minor', 'minor': 'patch'}[releaseType]
  logger.log('Downgrade release type to', result);
  return result;
}

module.exports = {analyzeCommits};