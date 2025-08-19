import { Job } from '../../types/job'

const attemptClientReconnections: Job = {
  name: 'attempt-client-reconnections',
  intervalMs: 30 * 60 * 1000, // 30 minutes
  async do({ archClients }) {
    await archClients.startAllClients();
  },
}

export default attemptClientReconnections
