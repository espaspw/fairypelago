import { Job } from '../../types/job.js'

const attemptClientReconnections: Job = {
  name: 'attempt-client-reconnections',
  intervalMs: 30 * 60 * 1000, // 30 minutes
  async do({ }) { },
}

export default attemptClientReconnections
