#!/usr/bin/env node


const pathUtil = require('path');
const minimist = require('minimist');
const range = require('lodash.range');


process.on('unhandledRejection', err => {
  throw err;
});

main();


function main() {
  const { _: [command, ...args], ...opts } = minimist(process.argv.slice(2));
  const cmdPath = pathUtil.join(__dirname, 'command', command);
  try {
    require.resolve(cmdPath);
  } catch (e) {
    console.log(`invalid command: ${command}`);
    return -1;
  }

  const cmd = require(cmdPath);
  const cmdArgs = range(cmd.length - 1).map((v, index) => args[index]);
  return cmd(...cmdArgs, opts);
}
