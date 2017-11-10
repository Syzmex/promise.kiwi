#!/usr/bin/env node

'use strict';

var script = process.argv[2];
var args = process.argv.slice(3);
var spawn = require( 'cross-spawn' );
var chalk = require( 'chalk' );

switch ( script ) {
  case '-v':
  case '--version':
    console.log( require( '../package.json' ).version );
    break;
  case 'build':
  case 'server':
  case 'test':
  case 'dll':
    var result = spawn.sync(
      'node',
      [require.resolve( '../lib/' + script )].concat( args ),
      { stdio: 'inherit' }
    );
    if ( result.signal ) {
      if ( result.signal === 'SIGKILL' ) {
        console.log(
          'The build failed because the process exited too early. ' +
            'This probably means the system ran out of memory or someone called ' +
            '`kill -9` on the process.'
        );
      } else if ( result.signal === 'SIGTERM' ) {
        console.log(
          'The build failed because the process exited too early. ' +
            'Someone might have called `kill` or `killall`, or the system could ' +
            'be shutting down.'
        );
      }
      process.exit( 1 );
    }
    process.exit( result.status );
    break;
  default:
    if ( script ) {
      console.log('Unknown script "' + script + '".');
      console.log('Perhaps you need to update kiwiai?');
    } else {
      console.log('Do you mean ' + chalk.gray('kiwiai server') + '?');
      console.log(chalk.gray('Also you can try:'));
      console.log(chalk.gray('kiwiai build'));
      console.log(chalk.gray('kiwiai test'));
      console.log(chalk.gray('kiwiai dll'));
    }
    break;
}
