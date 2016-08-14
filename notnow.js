const spawn = require('child_process').spawn
const readline = require('readline')
const split = require('split')

const program = require('commander')


function list(val) {
  return val.split(',').forEach(str => str.trim())
}

program
  .version('0.0.1')
  .usage('[options]')
  .description('Automate romoval of now deployments.')
  .option('-a, --all', 'remove all deployments except those specified by --keep')
  .option('-r, --remove <hashes>', 'comma separated list of deployments to remove', list)
  .option('-k, --keep <hashes>', 'comma separated list of deployments to keep', list)
  .option('-o, --old', 'only consider deployments older than the most recent for removal')
  .option('-v, --verbose', 'show additional output')

program.on('--help', () => {
  console.log(`
  Examples:

    Prompt for each deployment individually:
      $ notnow

    Remove all deployments:
      $ notnow --all

    Remove only the deployments specified:
      $ notnow --remove <hash1>,<hash2>

    Remove all deployments except those specified:
      $ notnow --all --keep <hash1>,<hash2>

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

  hashes = hashes.slice(3, -2)

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
