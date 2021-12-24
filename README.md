# ⑂🐚 yzx

_yzx is a fork of [zx](https://github.com/google/zx) that can be executed concurrently (in web servers for example). See [zx issue 252](https://github.com/google/zx/issues/252) for the reason of the fork. It is called yzx because 'Y' looks like both the symbol of a fork and the symbol of concurrency._

```js
#!/usr/bin/env yzx

await $`cat package.json | grep name`

let branch = await $`git branch --show-current`
await $`dep deploy --branch=${branch}`

await Promise.all([
  $`sleep 1; echo 1`,
  $`sleep 2; echo 2`,
  $`sleep 3; echo 3`,
])

let name = 'foo bar'
await $`mkdir /tmp/${name}`
```

Bash is great, but when it comes to writing scripts, 
people usually choose a more convenient programming language.
JavaScript is a perfect choice, but standard Node.js library 
requires additional hassle before using. The `yzx` package provides
useful wrappers around `child_process`, escapes arguments and
gives sensible defaults.

## Install

```bash
npm i -g yzx
```

### Requirement

Node.js >= 14.13.1

## Documentation

Write your scripts in a file with `.mjs` extension in order to 
be able to use `await` on top level. If you prefer the `.js` extension,
wrap your scripts in something like `void async function () {...}()`.

Add the following shebang to the beginning of your `yzx` scripts:
```bash
#!/usr/bin/env yzx
```

Now you will be able to run your script like so:
```bash
chmod +x ./script.mjs
./script.mjs
```

Or via the `yzx` executable:

```bash
yzx ./script.mjs
```

All functions (`$`, `sleep`, etc) are available straight away 
without any imports. 

Or import globals explicitly (for better autocomplete in VS Code).

```js
import 'yzx/globals'
```

### ``$`command` ``

Executes a given string using the `spawn` function from the
`child_process` package and returns `ProcessPromise<ProcessOutput>`.

Everything passed through `${...}` will be automatically escaped and quoted.

```js
let name = 'foo & bar'
await $`mkdir ${name}`
```

**There is no need to add extra quotes.** Read more about it in 
[quotes](docs/quotes.md).

You can pass an array of arguments if needed:

```js
let flags = [
  '--oneline',
  '--decorate',
  '--color',
]
await $`git log ${flags}`
```

If the executed program returns a non-zero exit code,
`ProcessOutput` will be thrown.

```js
try {
  await $`exit 1`
} catch (p) {
  console.log(`Exit code: ${p.exitCode}`)
  console.log(`Error: ${p.stderr}`)
}
```

#### `ProcessPromise`

```ts
class ProcessPromise<T> extends Promise<T> {
  readonly stdin: Writable
  readonly stdout: Readable
  readonly stderr: Readable
  readonly exitCode: Promise<number>
  pipe(dest): ProcessPromise<T>
  kill(signal = 'SIGTERM'): Promise<void>
}
```

The `pipe()` method can be used to redirect stdout:

```js
await $`cat file.txt`.pipe(process.stdout)
```

Read more about [pipelines](docs/pipelines.md).

#### `ProcessOutput`

```ts
class ProcessOutput {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number
  toString(): string
}
```

### Methods

#### `$.cd()`

Changes the current working directory.

```js
$.cd('/tmp')
await $`pwd` // outputs /tmp
```

### Functions

#### `question()`

A wrapper around the [readline](https://nodejs.org/api/readline.html) package.

Usage:

```js
let bear = await question('What kind of bear is best? ')
let token = await question('Choose env variable: ', {
  choices: Object.keys(process.env)
})
```

In second argument, array of choices for Tab autocompletion can be specified.
  
```ts
function question(query?: string, options?: QuestionOptions): Promise<string>
type QuestionOptions = { choices: string[] }
```

#### `sleep()`

A wrapper around the `setTimeout` function.

```js
await sleep(1000)
```

#### `nothrow()`

Changes behavior of `$` to not throw an exception on non-zero exit codes.

```ts
function nothrow<P>(p: P): P
```

Usage:

```js
await nothrow($`grep something from-file`)

// Inside a pipe():

await $`find ./examples -type f -print0`
  .pipe(nothrow($`xargs -0 grep something`))
  .pipe($`wc -l`)
```

If only the `exitCode` is needed, you can use the next code instead:

```js
if (await $`[[ -d path ]]`.exitCode == 0) {
  ...
}

// Equivalent of:

if ((await nothrow($`[[ -d path ]]`)).exitCode == 0) {
  ...
}
```

### Configuration

#### `$.shell`

Specifies what shell is used. Default is `which bash`.

```js
$.shell = '/usr/bin/bash'
```

Or use a CLI argument: `--shell=/bin/bash`

#### `$.prefix`

Specifies the command that will be prefixed to all commands run.

Default is `set -euo pipefail;`.

Or use a CLI argument: `--prefix='set -e;'`

#### `$.quote`

Specifies a function for escaping special characters during 
command substitution.

#### `$.verbose`

Specifies verbosity. Default is `true`.

In verbose mode, the `yzx` prints all executed commands alongside with their 
outputs.

Or use a CLI argument `--quiet` to set `$.verbose = false`.

### Polyfills 

#### `__filename` & `__dirname`

In [ESM](https://nodejs.org/api/esm.html) modules, Node.js does not provide
`__filename` and `__dirname` globals. As such globals are really handy in scripts,
`yzx` provides these for use in `.mjs` files (when using the `yzx` executable).

#### `require()`

In [ESM](https://nodejs.org/api/modules.html#modules_module_createrequire_filename)
modules, the `require()` function is not defined.
The `yzx` provides `require()` function, so it can be used with imports in `.mjs`
files (when using `yzx` executable).

```js
let {version} = require('./package.json')
```

### FAQ

#### Passing env variables

```js
process.env.FOO = 'bar'
await $`echo $FOO`
```

#### Passing array of values

If array of values passed as argument to `$`, items of the array will be escaped
individually and concatenated via space.

Example:
```js
let files = [...]
await $`tar cz ${files}`
```

#### Importing from other scripts

It is possible to make use of `$` and other functions via explicit imports:

```js
#!/usr/bin/env node
import {$} from 'yzx'
await $`date`
```

#### Scripts without extensions

If script does not have a file extension (like `.git/hooks/pre-commit`), yzx
assumes that it is an [ESM](https://nodejs.org/api/modules.html#modules_module_createrequire_filename)
module.

#### Markdown scripts

The `yzx` can execute scripts written in markdown 
([docs/markdown.md](docs/markdown.md)):

```bash
yzx docs/markdown.md
```

#### TypeScript scripts
 
```ts
import {$} from 'yzx'
// Or 
import 'yzx/globals'

void async function () {
  await $`ls -la`
}()
```

Compile the TypeScript to JS and run it. Or use something like ts-node.

```bash
ts-node script.ts
```

#### Executing remote scripts

If the argument to the `yzx` executable starts with `https://`, the file will be
downloaded and executed.

```bash
yzx https://medv.io/example-script.mjs
```

```bash
yzx https://medv.io/game-of-life.mjs
```

#### Executing scripts from stdin

The `yzx` supports executing scripts from stdin.

```js
yzx <<'EOF'
await $`pwd`
EOF
```

#### Using in a concurrent environnement (web servers, etc)

To be able to `yzx` in a web server, the `$` object must not be a global shared object, because each request may need its own current working directory (for example). So `yzx` exports a global function `YZX` to create new instances of `$`.

```js
import { YZX } from 'yzx'

const $ = YZX()
await $`pwd`
...
```

## License

[Apache-2.0](LICENSE)
