import fs from 'node:fs/promises'
import path from 'node:path'
import { Client } from 'discord.js'

import { Job, Jobs } from '../types/job'
import { ArchipelagoClientManager } from './archipelago-client-manager'
import { consoleLogger, fileLogger } from './util/logger'

let jobs: Jobs = {}

export async function loadJobs() {
  jobs = {}
  const files = await fs.readdir(path.join(import.meta.dirname, 'jobs'))
  for (const file of files) {
    try {
      const job = (await import(`./jobs/${file.replace('.ts', '')}`)).default as Job
      jobs[job.name] = job
    } catch(err) {
      console.error(err)
    }
  }
}

export function scheduleJobs(archClients: ArchipelagoClientManager, discordClient: Client) {
  for (const [jobName, jobDetails] of Object.entries(jobs)) {
    setInterval(async () => {
      try {
        consoleLogger.info(`Running job "${jobName}".`)
        await jobDetails.do({ archClients, discordClient })
      } catch (err) {
        consoleLogger.error(err)
        fileLogger.error(err)
      }
    }, jobDetails.intervalMs)
  }
}
