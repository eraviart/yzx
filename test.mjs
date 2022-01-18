// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { strict as assert } from "assert"
import { createReadStream, createWriteStream } from "fs"
import fs from "fs/promises"
import path from "path"

import chalk from "chalk"

{
  // Only stdout is used during command substitution
  let hello = await $`echo Error >&2; echo Hello`
  let len = +(await $`echo ${hello} | wc -c`)
  assert(len === 6)
}

{
  // Pass env var
  process.env.FOO = "foo"
  let foo = await $`echo $FOO`
  assert(foo.stdout === "foo\n")
}

{
  // Arguments are quoted
  let bar = 'bar"";baz!$#^$\'&*~*%)({}||\\/'
  assert((await $`echo ${bar}`).stdout.trim() === bar)
}

{
  // Undefined and empty string correctly quoted
  $`echo ${undefined}`
  $`echo ${""}`
}

{
  // Can create a dir with a space in the name
  let name = "foo bar"
  try {
    await $`mkdir /tmp/${name}`
  } finally {
    await fs.rmdir("/tmp/" + name)
  }
}

{
  // Pipefail is on
  let p
  try {
    p = await $`cat /dev/not_found | sort`
  } catch (e) {
    console.log("Caught an exception -> ok")
    p = e
  }
  assert(p.exitCode !== 0)
}

{
  // Env vars is safe to pass
  process.env.FOO = "hi; exit 1"
  await $`echo $FOO`
}

{
  // Globals are defined
  console.log(__filename, __dirname)
}

{
  // toString() is called on arguments
  let foo = 0
  let p = await $`echo ${foo}`
  assert(p.stdout === "0\n")
}

{
  // Can use array as an argument
  try {
    let files = ["./index.mjs", "./yzx.mjs", "./package.json"]
    await $`tar czf archive ${files}`
  } finally {
    await $`rm archive`
  }
}

{
  // Scripts with no extension are working
  await $`node yzx.mjs tests/no-extension`
}

{
  // require() is working from stdin
  await $`node yzx.mjs <<< 'require("./package.json").name'`
}

{
  // Markdown scripts are working
  await $`node yzx.mjs docs/markdown.md`
}

{
  // Scripts with several instances of $ are working
  await $`node yzx.mjs tests/multiple.mjs`
}

{
  // TypeScript scripts are working
  let { stderr } = await $`node yzx.mjs tests/typescript.ts`
  assert.match(stderr, /Hello from TypeScript/)
}

{
  // Quiet mode is working
  let { stdout } = await $`node yzx.mjs --quiet docs/markdown.md`
  assert(!stdout.includes("whoami"))
}

{
  // Pipes are working
  let { stdout } = await $`echo "hello"`
    .pipe($`awk '{print $1" world"}'`)
    .pipe($`tr '[a-z]' '[A-Z]'`)
  assert(stdout === "HELLO WORLD\n")

  try {
    let w = await $`echo foo`.pipe(createWriteStream("/tmp/output.txt"))
    assert((await fs.readFile("/tmp/output.txt")).toString() === "foo\n")

    let r = $`cat`
    createReadStream("/tmp/output.txt").pipe(r.stdin)
    assert((await r).stdout === "foo\n")
  } finally {
    await fs.rm("/tmp/output.txt", { force: true })
  }
}

{
  // ProcessOutput thrown as error
  let err
  try {
    await $`wtf`
  } catch (p) {
    err = p
  }
  console.log(err)
  assert(err.exitCode > 0)
  console.log("☝️ Error above is expected")
}

{
  // The pipe() throws if already resolved
  let out,
    p = $`echo "Hello"`
  await p
  try {
    out = await p.pipe($`less`)
  } catch (err) {
    console.log(err)
    assert.equal(
      err.message,
      `The pipe() method shouldn't be called after promise is already resolved!`,
    )
    console.log("☝️ Error above is expected")
  }
  if (out) {
    assert.fail("Expected failure!")
  }
}

{
  // ProcessOutput::exitCode doesn't throw
  assert((await $`grep qwerty README.md`.exitCode) !== 0)
  assert((await $`[[ -f ${__filename} ]]`.exitCode) === 0)
}

{
  // nothrow() doesn't throw
  let { exitCode } = await nothrow($`exit 42`)
  assert(exitCode === 42)
}

{
  // Executes a script from PATH.
  const isWindows = process.platform === "win32"
  const oldPath = process.env.PATH

  const envPathSeparator = isWindows ? ";" : ":"
  process.env.PATH += envPathSeparator + path.resolve("/tmp/")

  const toPOSIXPath = (_path) => _path.split(path.sep).join(path.posix.sep)

  const zxPath = path.resolve("./yzx.mjs")
  const zxLocation = isWindows ? toPOSIXPath(zxPath) : zxPath
  const scriptCode = `#!/usr/bin/env ${zxLocation}\nconsole.log('The script from path runs.')`

  try {
    await $`echo ${scriptCode}`.pipe(
      createWriteStream("/tmp/script-from-path", { mode: 0o744 }),
    )
    await $`script-from-path`
  } finally {
    process.env.PATH = oldPath
    await fs.rm("/tmp/script-from-path")
  }
}

{
  // CommonJS is working
  let { stdout } = await $`node tests/commonjs.cjs`
  assert.match(stdout, /Hello from CommonJS/)
}

{ // The kill() method works.
  let p = $`sleep 1000`
  setTimeout(() => {
    p.kill()
  }, 100)
}

{
  // require() is working in ESM
  const { name, version } = require("./package.json")
  assert(typeof name === "string")
  console.log(chalk.black.bgYellowBright(` ${name} version is ${version} `))
}

console.log(chalk.greenBright(" 🍺 Success!"))
