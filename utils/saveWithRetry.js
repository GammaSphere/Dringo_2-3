/**
 * Utility function to save a document with retry logic for version conflicts
 * @param {Object} document - The mongoose document to save
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise} - Promise that resolves when save is successful
 */
export default async function saveWithRetry(document, maxRetries = 3) {
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            await document.save();
            return; // Success, exit the function
        } catch (error) {
            if (error.name === 'VersionError' && retries < maxRetries - 1) {
                console.log(`Version conflict detected (attempt ${retries + 1}/${maxRetries}), retrying...`);
                await document.reload(); // Reload the document to get the latest version
                retries++;
            } else {
                // If it's not a version error or we've exceeded max retries, throw the error
                if (error.name === 'VersionError') {
                    console.error(`Failed to save after ${maxRetries} attempts due to version conflicts`);
                } else {
                    console.error('Error saving document:', error);
                }
                throw error;
            }
        }
    }
}
