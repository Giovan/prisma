import { Command, Env, arg, format } from '@prisma/cli'
import { LiftEngine } from '@prisma/lift'
import { isError } from 'util'
import { promptInteractively } from '../prompt'
import { introspect } from '../introspect/util'
import chalk from 'chalk'
import figures = require('figures')
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

export class Init implements Command {
  lift: LiftEngine
  static new(env: Env): Init {
    return new Init(env)
  }

  private constructor(private readonly env: Env) {
    this.lift = new LiftEngine({
      projectDir: env.cwd,
    })
  }

  async parse(argv: string[]): Promise<any> {
    // parse the arguments according to the spec
    const args = arg(argv, {})

    if (isError(args)) {
      return null
    }

    const outputDirName = args._[0]
    const outputDir = outputDirName ? join(process.cwd(), outputDirName) : process.cwd()

    if (outputDirName) {
      try {
        // Create the output directories if needed (mkdir -p)
        mkdirSync(outputDir, { recursive: true })
      } catch (e) {
        if (e.code !== 'EEXIST') throw e
      }
    }

    if (args['--help']) {
      return this.help()
    }

    try {
      const result = await promptInteractively(introspect, 'init')

      writeFileSync(join(outputDir, 'datamodel.prisma'), result.introspectionResult.sdl)
      writeFileSync(join(outputDir, 'main.ts'), '')
      writeFileSync(join(outputDir, 'tsconfig.json'), '')

      this.printFinishMessage()
    } catch {}

    process.exit(0)
  }

  printFinishMessage() {
    console.log(
      format(`
${chalk.green(`${figures.tick} Your all set!`)}

  ${'─'.repeat(50)}

  ${chalk.bold('We created the following files for you:')}

  ${chalk.bold('datamodel.prisma')}    ${chalk.dim('The datamodel describes your database schema')}
  ${chalk.bold('main.ts')}             ${chalk.dim('A simple script to get you started')}
  ${chalk.bold('tsconfig.json')}       ${chalk.dim('TypeScript configuration')}
  ${chalk.bold('/node_modules')}       ${chalk.dim('Required Node dependencies (includes Photon)')}

  ${'─'.repeat(50)}

  ${chalk.bold('Run the following commands to start developing')}

  $ cd hello-world
  $ prisma dev

  Learn more about using Photon and Lift at
  https://www.prisma.io/docs/...
    `),
    )
  }

  help() {
    return console.log(
      format(`
Usage: prisma init

Initialize a new service
    `),
    )
  }
}

// async function run() {
//   const env = await Env.load(process.env, process.cwd())
//   if (isError(env)) {
//     console.error(env)
//     return 1
//   }
//   // create a new CLI with our subcommands
//   const cli = Init.new(env)
//   // parse the arguments
//   const result = await cli.parse(process.argv.slice(2))
// }

// run()