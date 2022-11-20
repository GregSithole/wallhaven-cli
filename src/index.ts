#!/usr/bin/env node
import { program } from 'commander';
import figlet from 'figlet';

//Displaying CLI Title
console.log(figlet.textSync('Wallhaven CLI'));

// Download command
program
	.command('download')
	.alias('d')
	.description('Start the download process')
	.action(async (args) => { });

// Configuration command
program
	.command('config')
	.alias('c')
	.description('Setup the configuration settings')
	.action(async (args) => { });

if (!program.args.length) {
	program.help();
}
