const test = require('ava');
const clearModule = require('clear-module');
const {stub} = require('sinon');

test.beforeEach(t => {
  // Clear npm cache to refresh the module state
  clearModule('..');
  t.context.m = require('..');
  // Stub the logger
  t.context.log = stub();
  t.context.logger = {log: t.context.log};
});

test('Skip patch', async t => {
  const context = {
    commits: [],
    logger: t.context.logger,
  };

  const releaseType = await t.context.m.analyzeCommits({}, context);

  t.is(releaseType, null);
  t.is(t.context.log.args[2][0], 'Skip patch and no releases');
});

test('Skip no releases', async t => {
  const context = {
    commits: [
      {
        message: 'fix: xxx'
      }
    ],
    lastRelease: {},
    logger: t.context.logger,
  };

  const releaseType = await t.context.m.analyzeCommits({}, context);

  t.is(releaseType, 'patch');
  t.is(t.context.log.args[4][0], 'Skip patch and no releases');
});

test('Skip initial release', async t => {
  const context = {
    commits: [
      {
        message: 'feat: init'
      }
    ],
    lastRelease: {},
    logger: t.context.logger,
  };

  const releaseType = await t.context.m.analyzeCommits({}, context);

  t.is(releaseType, 'minor');
  t.is(t.context.log.args[4][0], 'Skip initial release');
});

test('Skip major version greater than 0', async t => {
  const context = {
    commits: [
      {
        message: 'feat: init'
      }
    ],
    lastRelease: {
      version: '1.0.0'
    },
    logger: t.context.logger,
  };

  const releaseType = await t.context.m.analyzeCommits({}, context);

  t.is(releaseType, 'minor');
  t.is(t.context.log.args[4][0], 'Skip major version greater than 0');
});

test('Skip message contains [release 1.0.0]', async t => {
  const context = {
    commits: [
      {
        message: 'feat: release [release 1.0.0]'
      }
    ],
    lastRelease: {
      version: '0.9.0'
    },
    logger: t.context.logger,
  };

  const releaseType = await t.context.m.analyzeCommits({}, context);

  t.is(releaseType, 'major');
  t.is(t.context.log.args[4][0], 'Bump to 1.0.0');
});

test('Downgrade release type to minor', async t => {
  const context = {
    commits: [
      {
        message: 'feat: add something\n\nBREAKING CHANGE: change something',
      }
    ],
    lastRelease: {
      version: '0.9.0'
    },
    logger: t.context.logger,
  };

  const releaseType = await t.context.m.analyzeCommits({}, context);

  t.is(releaseType, 'minor');
  t.deepEqual(t.context.log.args[4], ['Downgrade release type to', 'minor']);
});

test('Downgrade release type to patch', async t => {
  const context = {
    commits: [
      {
        message: 'feat: add something'
      }
    ],
    lastRelease: {
      version: '0.9.0'
    },
    logger: t.context.logger,
  };

  const releaseType = await t.context.m.analyzeCommits({}, context);

  t.is(releaseType, 'patch');
  t.deepEqual(t.context.log.args[4], ['Downgrade release type to', 'patch']);
});