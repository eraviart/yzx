import {
  $,
  argv as _argv,
  globby as _globby,
  nothrow,
  question,
  sleep,
  YZX,
} from '.'

declare global {
  var $: $
  var argv: typeof _argv
  var globby: typeof _globby.globby & typeof _globby
  var glob: typeof _globby.globby & typeof _globby
  var nothrow: nothrow
  var question: question
  var sleep: sleep
  var YZX: YZX
}
