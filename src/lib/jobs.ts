import fs from 'node:fs/promises'
import path from 'node:path'
import { Client } from 'discord.js'

import { Job, Jobs } from '../types/job.js'
import { logger } from './util/logger.js'
import { ArchipelagoSessionRegistry } from './archipelago-session-registry.js'

let jobs: Jobs = {}

export async function loadJobs () {
  jobs = {}
  const files = await fs.readdir(path.join(import.meta.dirname, 'jobs'))
  for (const file of files) {
    try {
      const job = (await import(`./jobs/${file.replace('.ts', '')}`)).default as Job
      jobs[job.name] = job
    } catch (err) {
      console.error(err)
    }
  }
}

export function scheduleJobs (sessionRegistry: ArchipelagoSessionRegistry, discordClient: Client) {
  for (const [jobName, jobDetails] of Object.entries(jobs)) {
    setInterval(async () => {
      try {
        logger.info('Running job', { jobName })
        await jobDetails.do({ sessionRegistry, discordClient })
      } catch (err) {
        logger.error(err)
      }
    }, jobDetails.intervalMs)
  }
}
