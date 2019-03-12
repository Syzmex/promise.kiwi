// @flow

import { fork } from 'child_process';
import { RESTART, setProcessName, send }  from './send';
import { log }  from './print';


// nodejs 调试参数 --inspect-brk 程序开始短点
//                 --inspect

let usedPorts = [];
function forkChild( path: string, name: string ): void {

  // from af-webpack / fork
  // 重置调试器端口
  // 我感觉这个估计用不到
  const execArgv = process.execArgv.slice( 0 );
  const inspectArgvIndex = execArgv.findIndex( argv =>
    argv.includes( '--inspect-brk' ),
  );

  // 重置端口加一
  if ( inspectArgvIndex > -1 ) {
    const inspectArgv = execArgv[inspectArgvIndex];
    execArgv.splice( inspectArgvIndex, 1, inspectArgv.replace(
      /--inspect-brk=(.*)/,
      ( match_, s1 ) => {
        let port;
        try {
          port = parseInt( s1 ) + 1;
        } catch ( e ) {
          port = 9230; // node default inspect port plus 1.
        }
        if ( usedPorts.includes( port )) {
          port++;
        }
        usedPorts.push( port );
        return `--inspect-brk=${port}`;
      })
    );
  }

  // 获取参数从第二个字符串开始
  const argvs = process.argv.slice( 2 );

  // 调试功能
  if ( process.env.NODE_ENV === 'development' ) {

    log( `Forking ${process.env.NODE_ENV} server: ${name}` );

    // 找 name 参数
    const pName = `-name=${name}`;
    const nameArgvIndex = argvs.findIndex(
      argv => argv.includes( '-name=' )
    );

    if ( nameArgvIndex > -1 ) {
      argvs.splice(
        nameArgvIndex, 1, argvs[nameArgvIndex].replace( /^-name=/, pName )
      );
    }

    // 没有就添加
    else if ( nameArgvIndex === -1 ) {
      argvs.push( pName );
    }

    // 设置进程名字方便调试
    setProcessName( name );
  }

  const childProcess = fork( path, argvs, { execArgv });
  childProcess.on( 'message', ( data ) => {
    // 如果自己用不上就向父进程传递消息
    // 对消息做出相应的操作
    if ( data?.type === RESTART ) {
      childProcess.kill();
      forkChild( path, name );
    }
    send( data );
  });

}

export default forkChild;
