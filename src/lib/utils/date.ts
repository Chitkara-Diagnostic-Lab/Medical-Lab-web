//Check if a time slot is in the future

export function isSlotInFuture(date: Date | string, startTime: string): boolean {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
  const slotDateTime = new Date(`${dateStr}T${startTime}:00`)
  return slotDateTime > new Date()
}
//Format slot date and time for display

export function formatSlotDateTime(date: Date | string, startTime: string): string {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
  const slotDateTime = new Date(`${dateStr}T${startTime}:00`)
  
  return slotDateTime.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}