#!/usr/bin/env node
import { program } from 'commander';
import figlet from 'figlet';
import { promptConfiguration } from './commands/config.js';

//Displaying CLI Title
console.log(figlet.textSync('Wallhaven CLI'));

// Download command
program
	.command('download')
	.alias('d')
	.description('ownload Wallpapers from Wallhaven')
	.action(async (args) => { });

// Configuration command
program
	.command('config')
	.alias('c')
	.description('Setup configuration for Wallhaven CLI')
	.action(async (args) => {
		await promptConfiguration(args);
	});

program.parse(process.argv);

if (!program.args.length) {
	program.help();
}
