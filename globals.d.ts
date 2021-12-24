import {
  $,
  argv as _argv,
  nothrow,
  question,
  sleep,
  YZX,
} from "."

declare global {
  var $: $
  var argv: typeof _argv
  var nothrow: nothrow
  var question: question
  var sleep: sleep
  var YZX: YZX
}
