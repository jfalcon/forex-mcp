import { startServer, stopServer } from './server';

export async function shutdown(code?: number | string) {
	try {
		await stopServer();
	} catch (err) {
		console.error('Error while stopping server:', err);
	} finally {
		if (typeof code !== 'undefined') {
			const exitCode = typeof code === 'number' ? code : 0;
			process.exit(exitCode);
		}
	}
}

// attempt a clean stop before Node exits
process.on('beforeExit', async () => await shutdown());
process.on('SIGABRT', async () => await shutdown('SIGABRT'));
process.on('SIGBREAK', async () => await shutdown('SIGBREAK'));
process.on('SIGBUS', async () => await shutdown('SIGBUS'));
process.on('SIGHUP', async () => await shutdown('SIGHUP'));
process.on('SIGINT', async () => await shutdown('SIGINT'));
process.on('SIGSEGV', async () => await shutdown('SIGSEGV'));
process.on('SIGTERM', async () => await shutdown('SIGTERM'));
process.on('SIGUSR1', async () => await shutdown('SIGUSR1'));
process.on('SIGUSR2', async () => await shutdown('SIGUSR2'));

process.on('uncaughtException', async (err) => {
  console.error(err);
	await shutdown(1);
});

const isSse = process.argv.includes('--sse');
await startServer(isSse);
