#!/usr/bin/env node

const spawn = require('child_process').spawn
const readline = require('readline')
const split = require('split')

const program = require('commander')


function list(val) {
  return val.split(',')
}

program
  .version('0.0.1')
  .usage('[options]')
  .description('Automate removal of now deployments.')
  .option('-y, --yes', 'automatically confirm removal')
  .option('-o, --old', 'ignore latest deployment of each project')
  .option('-k, --keep <projects/hashes>', 'ignore specified projects and deployments', list)
  .option('-v, --verbose', 'show additional output')

program.on('--help', () => {
  console.log(`
  Examples:

    Prompt for each deployment individually:
      $ notnow

    Remove all deployments:
      $ notnow --yes

    Remove all deployments except those specified:
      $ notnow --yes --keep <project1>,<hash1>,<hash2>

  `)
})

program.parse(process.argv)


const lsOut = []

const ls = spawn('now', ['ls'])

ls.stdout
  .pipe(split())
  .on('data', data => {
    lsOut.push(data.toString().trim().split(/\s+/))   // split on whitespace
    if (program.verbose) console.log(`${data}`)
  })

ls.stderr.on('data', data => {
  console.error(`now ls error: ${data}`)
})

ls.on('close', code => {
  if (code !== 0) {
    console.error(`now ls exited with code ${code}`)
    process.exit(1)
  }

  // build projects data structure
  const projects = {}
  let currentProject
  lsOut
    .filter(line => line[0] !== '')   // remove blank lines
    .forEach(deployment => {
      if (deployment.length === 1) {
        currentProject = deployment
        projects[currentProject] = []
      } else {
        projects[currentProject].push(deployment[0])
      }
    })

  if (program.old) {
    for (const project in projects) {
      if (!projects.hasOwnProperty(project)) continue
      projects[project].shift()
    }
  }

  if (program.keep) {
    // remove projects specified in --keep
    program.keep.forEach(project => delete projects[project])

    // remove deployments specified in --keep
    for (const project in projects) {
      if (!projects.hasOwnProperty(project)) continue
      projects[project] = projects[project].filter(deployment =>
        program.keep.indexOf(deployment[0]) === -1
      )
    }
  }

  // remove any projects that are now empty
  for (const project in projects) {
    if (!projects.hasOwnProperty(project)) continue
    if (projects[project].length === 0) delete projects[project]
  }


  // iterate through remaining projects in a weird async way
  let result = Promise.resolve()
  for (const project in projects) {
    if (!projects.hasOwnProperty(project)) continue
    result = result.then(() => {
      console.log(`\n${project}\n`)
      return Promise.resolve()
    })
    projects[project].forEach(deployment => {
      result = result.then(() => removeDeployment(deployment))
    })
  }
  result
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
})


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
rl.on('SIGINT', () => process.exit(1))

function removeDeployment(deployment) {
  return new Promise((resolve, reject) => {
    const rm = spawn('now', ['rm', deployment])

    let done = false

    rm.stdout
      .pipe(split('[yN] '))
      .on('data', data => {
        if (!done) {
          done = true
          const lines = data.split('\n')
          if (program.verbose) console.log(lines[0])
          console.log(lines[1])
          if (program.yes)
            rm.stdin.end('y')
          else
            rl.question(program.verbose ? `${lines[2]}[yN] ` : 'Remove? [yN] ', input => rm.stdin.end(`${input}\m`))
        } else {
          if (program.verbose) console.log(data)
        }
      })

    rm.stderr.on('data', data => {
      console.error(`now rm error: ${data}`)
    })

    rm.on('close', code => {
      if (code !== 0) return reject(`now rm exited with code ${code}`)
      return resolve()
    })

  })
}
