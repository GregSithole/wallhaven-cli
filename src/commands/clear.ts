import ora from 'ora';
import conf from 'conf';
import { ICacheParameters } from '../models/ICacheParameters';

export async function clearCache(args: ICacheParameters) {
	const spinner = ora('Beginning to clear cache...').start();

	if (args.all) {
		await clearCacheKey('user-configuration');
		await clearCacheKey('user-search');
		await clearCacheKey('downloaded-list');
	}

	if (args.user) {
		await clearCacheKey('user-configuration');
	}

	if (args.search) {
		await clearCacheKey('user-search');
	}

	if (args.downloads) {
		await clearCacheKey('downloaded-list');
		await clearCacheKey('cachedDownloads');
	}

	spinner.succeed('Successfully cleared cache');
}

async function clearCacheKey(key) {
	const configuration = new conf({ projectName: 'wallhaven-cli' });
	configuration.delete(key);
}
