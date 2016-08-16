const spawn = require('child_process').spawn
const readline = require('readline')
const split = require('split')
const _ = require('lodash')

const program = require('commander')


function list(val) {
  return val.split(',')
}

program
  .version('0.0.1')
  .usage('[options]')
  .description('Automate removal of now deployments.')
  .option('-y, --yes', 'automatically confirm removal')
  .option('-o, --old', 'keep the most recent deployment')
  .option('-k, --keep <hashes>', 'comma separated list of deployments to keep', list)
  .option('-v, --verbose', 'show additional output')

program.on('--help', () => {
  console.log(`
  Examples:

    Prompt for each deployment individually:
      $ notnow

    Remove all deployments:
      $ notnow --yes

    Remove all deployments except those specified:
      $ notnow --yes --keep <hash1>,<hash2>

  `)
})

program.parse(process.argv)

let hashes = []


const nowls = spawn('now', ['ls'])

nowls.stdout
  .pipe(split())
  .on('data', data => {
    hashes.push(data.toString().slice(2, 26))
    if (program.verbose) console.log(`${data}`)
  })

nowls.stderr.on('data', data => {
  console.error(`now ls stderr: ${data}`)
})

nowls.on('close', code => {
  if (code !== 0) {
    console.error(`now ls exited with code ${code}`)
    process.exit(1)
  }

  if (program.old) hashes = hashes.slice(4, -2)
  else             hashes = hashes.slice(3, -2)

  if (program.keep) hashes = _.difference(hashes, program.keep)

  var result = Promise.resolve()
  hashes.forEach(hash => {
    result = result.then(() => removeDeployment(hash))
  })
  result
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      process.exit(1)}
    )
})


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
rl.on('SIGINT', () => process.exit(1))

function removeDeployment(hash) {
  return new Promise((resolve, reject) => {
    const nowrm = spawn('now', ['rm', hash])

    let done = false

    nowrm.stdout
      .pipe(split('[yN] '))
      .on('data', data => {
        if (!done) {
          done = true
          const lines = data.split('\n')
          if (program.verbose) console.log(lines[0])
          console.log(lines[1])
          if (program.yes)
            nowrm.stdin.end('y')
          else
            rl.question(program.verbose ? `${lines[2]}[yN] ` : 'Remove? [yN] ', input => nowrm.stdin.end(input))
        } else {
          if (program.verbose) console.log(data)
        }
      })

    nowrm.stderr.on('data', data => {
      return reject(`now rm stderr: ${data}`)
    })

    nowrm.on('close', code => {
      if (code !== 0) return reject(`now rm exited with code ${code}`)
      return resolve()
    })

  })
}
