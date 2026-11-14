import { supabase } from '../lib/supabase'

/**
 * Increment the usage_count for a workflow by 1.
 * Uses an atomic Supabase RPC to prevent race conditions.
 * @param {string} id
 * @returns {Promise<{ error: object|null }>}
 */
export async function incrementUsage(id) {
  const { error } = await supabase.rpc(
    'increment_workflow_usage',
    { workflow_id: id }
  )

  if (error) {
    console.error('Failed to increment workflow usage:', error)
  }

  return { error }
}

/**
 * Subscribe to realtime updates for a specific workflow's usage_count.
 * Returns the channel object — call supabase.removeChannel(channel) to unsubscribe.
 * @param {string} workflowId
 * @param {(payload: object) => void} callback
 * @returns {RealtimeChannel}
 */
export function subscribeToWorkflow(workflowId, callback) {
  const channel = supabase
    .channel(`workflow-usage-${workflowId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'workflows',
        filter: `id=eq.${workflowId}`,
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to realtime updates for ALL public workflows (for library page).
 * Returns the channel object — call supabase.removeChannel(channel) to unsubscribe.
 * @param {(payload: object) => void} callback
 * @returns {RealtimeChannel}
 */
export function subscribeToAllWorkflows(callback) {
  const channel = supabase
    .channel('workflow-usage-all')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'workflows',
      },
      (payload) => {
        callback(payload)
      }
    )
    .subscribe()

  return channel
}
