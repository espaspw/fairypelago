import { Job } from '../../types/job'

const removeStaleClients: Job = {
  name: 'remove-stale-clients',
  intervalMs: 30 * 60 * 1000, // 30 minutes
  async do({ archClients }) {
    await archClients.removeStaleClients();
  },
}

export default removeStaleClients
