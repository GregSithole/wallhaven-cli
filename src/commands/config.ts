import ora from 'ora';
import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import conf from 'conf';
import { getUserHome } from './utils.js';
import {
	CATEGORY,
	ORDER,
	PURITY,
	RATIOS,
	SIZE,
	RESOLUTIONS,
	SORTING,
	TOPRANGE,
	COLOUR,
} from '../constants/wallhaven.js';

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

const configuration = new conf({ projectName: 'wallhaven-cli' });

export async function promptConfiguration(args: any) {
	await checkUserConfigurationValues(args);
	await checkUserSearchConfiguration(args);
}

async function checkUserConfigurationValues(options: any) {
	const questions = [];

	if (!options.apiKey) {
		questions.push({
			type: 'password',
			name: 'apiKey',
			message: 'Please enter your Wallhaven API Key?',
		});
	}

	if (!options.downloadDirectory) {
		questions.push({
			type: 'file-tree-selection',
			name: 'downloadDirectory',
			onlyShowDir: true,
			message: 'Please select the download Directory?',
			root: getUserHome(),
		});
	}

	if (!options.downloadLimit) {
		questions.push({
			type: 'input',
			name: 'downloadLimit',
			message: 'Please enter a download limitation?',
		});
	}

	const response = await inquirer.prompt(questions);
	const spinner = ora('Storing API Key').start();
	configuration.set('user-configuration', {
		...response,
	});

	spinner.succeed('Successfully stored API Key');
}

async function checkUserSearchConfiguration(options) {
	const spinner = ora('Checking for previous search configuration').start();
	const userSearch = configuration.get('user-search');
	if (userSearch === undefined || !userSearch.hasOwnProperty('query')) {
		spinner.fail('Search configuration does not exists');
		const searchResponse = await inquirer.prompt({
			type: 'confirm',
			name: 'search',
			message: 'Would you like to create and save a search configuration?',
		});

		if (searchResponse.search === true) {
			await createUserSearchConfiguration();
		}
	} else {
		spinner.succeed('Search configuration found successfully');
		const searchResponse = await inquirer.prompt({
			type: 'confirm',
			name: 'search',
			message: 'Would you like to change your saved search configuration?',
		});

		if (searchResponse.search === true) {
			await createUserSearchConfiguration();
		}
	}
}

export async function createUserSearchConfiguration() {
	const questions = await createSearchConfigurationPrompts();
	const response = await inquirer.prompt(questions);
	const results = await processSearchConfigurationPrompts(response);
	const spinner = ora('Saving user search configuration...').start();

	configuration.set('user-search', {
		...results,
	});

	spinner.succeed('Successfully updated user search configuration');
}

export async function createSearchConfigurationPrompts() {
	return [
		{
			type: 'input',
			name: 'query',
			message: 'Please enter your search query?',
		},
		{
			type: 'checkbox',
			name: 'category',
			message: 'Please select your search category?',
			choices: CATEGORY,
			hint: '- Space to select. Return to submit',
		},
		{
			type: 'checkbox',
			name: 'purity',
			message: 'Please select your search purity?',
			choices: PURITY,
			hint: '- Space to select. Return to submit',
		},
		{
			type: 'list',
			name: 'sorting',
			message: "Please select your search's sort criteria?",
			choices: SORTING,
		},
		{
			when: function (answers) {
				return answers.sorting === 'toplist';
			},
			type: 'list',
			name: 'topRange',
			message: "Please select your search's toplist range?",
			choices: TOPRANGE,
		},
		{
			type: 'list',
			name: 'order',
			message: "Please select your search's order criteria?",
			choices: ORDER,
		},
		{
			type: 'list',
			name: 'size',
			message: 'How would you like to determine the size of the wallpaper?',
			choices: SIZE,
		},
		{
			when: function (answers) {
				return answers.size === 'resolution';
			},
			type: 'list',
			name: 'resolution',
			message: "Please select your search's resolution criteria?",
			choices: RESOLUTIONS,
		},
		{
			when: function (answers) {
				return answers.size === 'ratio';
			},
			type: 'list',
			name: 'ratio',
			message: "Please select your search's ratio criteria?",
			choices: RATIOS,
		},
		{
			type: 'confirm',
			name: 'colorQuestion',
			message: 'Would you like to specify a colour for your search criteria?',
		},
		{
			when: function (answers) {
				return answers.colorQuestion;
			},
			type: 'list',
			name: 'colors',
			message: "Please select your search's color criteria?",
			choices: COLOUR,
		},
	];
}

export async function processSearchConfigurationPrompts(response) {
	if (response.category) {
		const category = response.category;
		const generalResult = category.includes('general') ? 1 : 0;
		const animeResult = category.includes('anime') ? 1 : 0;
		const peopleResult = category.includes('people') ? 1 : 0;
		response.category = `${generalResult}${animeResult}${peopleResult}`;
	}

	if (response.purity) {
		const purity = response.purity;
		const sfwResult = purity.includes('sfw') ? 1 : 0;
		const sketchyResult = purity.includes('sketchy') ? 1 : 0;
		const nsfwResult = purity.includes('nsfw') ? 1 : 0;
		response.purity = `${sfwResult}${sketchyResult}${nsfwResult}`;
	}

	delete response.size;
	delete response.colorQuestion;

	return response;
}
