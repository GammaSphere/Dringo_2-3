// Marks the time this process started. Used to ignore stale updates received after downtime.
export const BOOT_TIME = Math.floor(Date.now() / 1000); // Telegram dates are seconds

export function isUpdateStale(updateDateSeconds) {
    if (!updateDateSeconds || typeof updateDateSeconds !== 'number') return false;
    // If the update was created before bot booted, consider it stale
    return updateDateSeconds < BOOT_TIME;
}


