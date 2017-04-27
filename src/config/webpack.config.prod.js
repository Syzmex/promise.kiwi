
import { paths, getEntry, getOutput, getSVGRules, getFontRules,
  loaders, plugins, combine } from 'kiwiai';

const { /*getDefaultLoaderOptions,*/ extractTextExtract } = plugins;
const { styleLoader, cssLoader, postcssLoader, lessLoader, urlLoader,
  babelLoader, /* fileLoader,*/ jsonLoader, typescriptLoader } = loaders;

const staticFileName = 'static/[name].$[chunkhash:4].[ext]';
const cssModules = {
  modules: true,
  localIdentName: '[local]_[sha512:hash:base64:5]'
};
const output = {
  filename: '[name].$[chunkhash:4].js',
  chunkFilename: '[name].$[chunkhash:4].chunk.js'
};
const lessTheme = {
  // modifyVar: JSON.stringify( theme )
};
const svgRules = Object.values( getSVGRules({
  fileName: staticFileName
  // svgSpriteDirs: [
  //   require.resolve( 'antd-mobile' ).replace( /warn\.js$/, '' ),
  //   paths.resolveApp( 'src/assets/svg' )
  // ]
}));
const fontRules = Object.values( getFontRules({
  fileName: staticFileName
}));
// const { babel } = getDefaultLoaderOptions(['babel']);
// babel.plugins.push( 'dva-hmr' );
// babel.plugins.push( 'transform-runtime' );
// babel.plugins.push([ 'import', { libraryName: 'antd', style: true }]);

export default {
  bail: true,
  entry: getEntry(['./src/index.js']),
  output: getOutput( output ),
  resolve: {
    extensions: [
      '.web.js', '.web.jsx', '.web.ts', '.web.tsx',
      '.js', '.json', '.jsx', '.ts', '.tsx'
    ]
  },
  module: {
    noParse: [/moment.js/],
    rules: [{
      exclude: [
        /\.html$/,
        /\.(js|jsx)$/,
        /\.(css|less)$/,
        /\.json$/,
        /\.svg$/,
        /\.tsx?$/
      ],
      use: [urlLoader({ name: staticFileName })]
    }, {
      test: /\.(js|jsx)$/,
      include: paths.appSrc,
      use: [babelLoader()]
    }, {
      test: /\.tsx?$/,
      include: paths.appSrc,
      use: [ babelLoader(), typescriptLoader() ]
    }, {
      test: /\.css$/,
      include: paths.appSrc,
      use: extractTextExtract({
        fallback: [styleLoader()],
        use: [ cssLoader( cssModules ), postcssLoader() ]
      })
    }, {
      test: /\.less$/,
      include: paths.appSrc,
      use: extractTextExtract({
        fallback: [styleLoader()],
        use: [ cssLoader( cssModules ), postcssLoader(), lessLoader( lessTheme ) ]
      })
    }, {
      test: /\.css$/,
      include: paths.appNodeModules,
      use: extractTextExtract({
        fallback: [styleLoader()],
        use: [ cssLoader(), postcssLoader() ]
      })
    }, {
      test: /\.less$/,
      include: paths.appNodeModules,
      use: extractTextExtract({
        fallback: [styleLoader()],
        use: [ cssLoader(), postcssLoader(), lessLoader( lessTheme ) ]
      })
    }, /* , {
      test: /\.html$/,
      use: [fileLoader()]
    }*/ {
      test: /\.json$/,
      use: [jsonLoader()]
    }]
    .concat( svgRules )
    .concat( fontRules )
  },
  plugins: combine(
    plugins.Define(),
    plugins.LoaderOptions( /*null, { babel }*/),
    plugins.CopyPublic(),
    plugins.UglifyJs(),
    plugins.Visualizer(),
    plugins.ExtractText(),
    plugins.HtmlWebpack(),
    plugins.CommonsChunk()
  ),
  // externals: config.externals,
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
