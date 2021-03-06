
import { existsSync } from 'fs';
import { Left, Right } from 'data.either';
import { map } from 'control.monads';
import chalk from 'chalk';
import assert from 'assert';
import detect from 'detect-port';
import flatten from 'arr-flatten';

import is from './utils/is';
import paths from './utils/paths';
import print from './utils/print';
import compose from './utils/compose';
import getConfig from './utils/getConfig';
import compiler from './compiler';


const DEFAULT_PORT = 8000;
const { SEVER_CONFIG, WEBPACK_DEV_CONFIG, appSeverConfig, appWebpackDevConfig } = paths;
const watchFiles = [appSeverConfig];

const server = {
  paths,
  watchFiles,
  port: DEFAULT_PORT,
  env: process.env.NODE_ENV,
  isInteractive: process.stdout.isTTY
};

// read config for develop server
function readServerConfig( server ) {
  try {
    const severConfig = getConfig( appSeverConfig );
    return Right( Object.assign( server, severConfig ));
  } catch ( e ) {
    print(
      chalk.red( `Failed to read ${SEVER_CONFIG}.` ),
      e.message
    );
    print();
    return Left( null );
  }
}

// read config for webpack dev server
function readWebpackConfig( server ) {

  const devConfig = server.webpackConfig && server.webpackConfig.dev;
  const configFile = paths.resolveApp( devConfig ) || appWebpackDevConfig;

  try {

    assert(
      existsSync( configFile ),
      `File ${devConfig || WEBPACK_DEV_CONFIG} is not exsit.`
    );

    const wpConfig = getConfig( configFile );

    // plugins: function
    if ( is.Function( wpConfig.plugins )) {
      wpConfig.plugins = wpConfig.plugins( wpConfig );
    }

    // plugins: not array
    if ( !is.Array( wpConfig.plugins )) {
      wpConfig.plugins = [wpConfig.plugins];
    }

    // plugins: array in array
    wpConfig.plugins = flatten( wpConfig.plugins.map(( plugin ) => {
      return is.Function( plugin ) ? plugin( wpConfig ) : plugin;
    }));

    server.webpackDevConfig = wpConfig;
    watchFiles.push( configFile );

    return Right( server );
  } catch ( e ) {
    print(
      chalk.red( `Failed to read ${devConfig || WEBPACK_DEV_CONFIG}.` ),
      e.message
    );
    print();
    return Left( null );
  }
}

// check port
function portChecker( server ) {
  return ( result ) => {
    detect( server.port ).then(( port ) => {
      if ( port === server.port ) {
        result( server );
      } else {
        print( chalk.yellow( `Something is already running on port ${server.port}.` ));
        print();
      }
    });
  };
}

export default ( devServer ) => {
  compose( map( portChecker ), readServerConfig )( server ).map(
    ( callback ) => callback( compose( map( devServer ), map( compiler ), readWebpackConfig ))
  );
};

