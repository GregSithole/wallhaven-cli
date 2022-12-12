#!/usr/bin/env node
import { program } from 'commander';
import { clearCache } from './commands/clear.js';
import { promptConfiguration } from './commands/config.js';
import { promptDownload } from './commands/download.js';
import { getFigletCLIName } from './commands/utils.js';

//Displaying CLI Title
getFigletCLIName();

// Download command
program
	.command('download')
	.alias('d')
	.description('Download Wallpapers from Wallhaven')
	.action(async () => {
		await promptDownload();
	});

// Configuration command
program
	.command('config')
	.alias('c')
	.description('Setup configuration for Wallhaven CLI')
	.action(async (args) => {
		await promptConfiguration(args);
	});

// Clear cache command
program
	.command('clear')
	.alias('cl')
	.description('Clear cacehd configuration for Wallhaven CLI')
	.option('--all', 'Clear all cached informtation')
	.option('--user', 'Clear cached user information')
	.option('--search', 'Clear cached search information')
	.option('--downloads', 'Clear cached download list information')
	.action(async (args) => {
		await clearCache(args);
	});

program.parse(process.argv);

if (!program.args.length) {
	program.help();
}
