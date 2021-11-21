import {
  $,
  argv as _argv,
  chalk as _chalk,
  fs as _fs,
  globby as _globby,
  nothrow,
  os as _os,
  path as _path,
  question,
  sleep,
  YZX,
} from '.'

declare global {
  var $: $
  var argv: typeof _argv
  var chalk: typeof _chalk
  var fs: typeof _fs
  var globby: typeof _globby.globby & typeof _globby
  var glob: typeof _globby.globby & typeof _globby
  var nothrow: nothrow
  var os: typeof _os
  var path: typeof _path
  var question: question
  var sleep: sleep
  var YZX: YZX
}
