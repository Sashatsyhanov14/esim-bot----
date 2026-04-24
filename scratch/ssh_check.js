
const { spawn } = require('child_process');

const password = '9qJ1SFL5tT4olz0';
const ssh = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', '-p', '22667', 'root@178.210.161.187', 'ls -la /etc/nginx/sites-enabled/'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

ssh.stdout.on('data', (data) => {
    console.log(`STDOUT: ${data}`);
});

ssh.stderr.on('data', (data) => {
    const output = data.toString();
    console.log(`STDERR: ${output}`);
    if (output.toLowerCase().includes('password:')) {
        ssh.stdin.write(password + '\n');
    }
});

ssh.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
});
