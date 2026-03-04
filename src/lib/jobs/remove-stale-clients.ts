import { Job } from '../../types/job.js'

const removeStaleClients: Job = {
  name: 'remove-stale-clients',
  intervalMs: 30 * 60 * 1000, // 30 minutes
  async do({ }) { },
}

export default removeStaleClients
