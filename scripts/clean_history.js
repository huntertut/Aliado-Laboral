const { execSync } = require('child_process');

const commits = [
    '32dc98b618fb9d9fc41d6fa2b27697c3ee3467ed',
    '38eafe571d4b2182c3f9f4e80d7ffdbf6500f999',
    'bcdbcc5e01d91d82deddb7ee0c94fc5047f39818',
    '78a013c5f47261a899944928bb06a55de27140df',
    'eeafb91d9cde126414f7665be85bb057a32634be',
    '7b0abb3da97f91c9e8d376aa4f7cdf50ce93de83',
    'd794bf840ef0b831acb4d7cd73bf7016bec72d6f',
    '5a67f771dff38e75495cfa74895c07eb5b970ea6',
    '27d59b1535492749016805234ada448fbe7b7e07',
    '365a27931471a5c54a30c3e4d0d97cd3011f0ae5',
    '75f0b14db487b3e190fa1cf8b1ad48ca4e1436cc',
    'b00aad4593d9d31eea00515378b641e70e88b1d0',
    '41f4f0e8c6d6a743995cc49d6f3f9d0fe9e31451',
    'fafde42b6a76c9cfee377a13e73e9df1f14e3395',
    '1cf925fcf29966e7bb40ab15c63997ee8f42d31f',
    '6c5421fb8f526573f28001060b3c21d9e7a9b783'
];

try {
    console.log('Stashing any leftover changes...');
    try { execSync('git stash', { stdio: 'inherit' }); } catch(e) {}

    console.log('Creating clean-history branch from origin/main...');
    execSync('git checkout -B clean-history origin/main', { stdio: 'inherit' });

    for (const hash of commits) {
        console.log(`\nProcessing commit ${hash}...`);
        try {
            // Cherry pick without committing
            execSync(`git cherry-pick -n ${hash}`, { stdio: 'inherit' });
            
            // Remove large files and secrets from index if they were added
            try {
                execSync('git reset HEAD backend-patch.tar.gz backend-patch2.tar.gz backend-patch3.tar.gz backend-patch4.tar.gz deployer/git_push.js deployer/get_logs.js deployer/check_js.js', { stdio: 'ignore' });
            } catch (e) {}

            // Commit reusing metadata
            execSync(`git commit -C ${hash}`, { stdio: 'inherit' });
            console.log(`Commit ${hash} applied cleanly.`);
        } catch (err) {
            console.log(`Conflict or issue in ${hash}, attempting to resolve by ignoring patches...`);
            // If it failed due to some other reason, we might need manual intervention, 
            // but usually this works if patches are the only issue.
            execSync('git reset HEAD backend-patch.tar.gz backend-patch2.tar.gz backend-patch3.tar.gz backend-patch4.tar.gz', { stdio: 'ignore' });
            try {
                execSync(`git commit -a -C ${hash}`, { stdio: 'inherit' });
            } catch (innerErr) {
                console.log(`Manual commit failed, skipping if no changes: ${innerErr.message}`);
            }
        }
    }

    console.log('\nHistory reconstruction complete. Reviewing changes...');
    execSync('git log --oneline -n 20', { stdio: 'inherit' });

} catch (globalErr) {
    console.error('Global failure:', globalErr.message);
}
