import ora from 'ora';
import inquirer from 'inquirer';
import conf from 'conf';

const configuration = new conf();

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
			type: 'input',
			name: 'downloadDirectory',
			message: 'Please enter the download Directory?',
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
			choices: [
				{ name: 'General', value: 'general' },
				{ name: 'Anime', value: 'anime' },
				{ name: 'People', value: 'people' },
			],
			hint: '- Space to select. Return to submit',
		},
		{
			type: 'checkbox',
			name: 'purity',
			message: 'Please select your search purity?',
			choices: [
				{ name: 'Safe for work', value: 'sfw' },
				{ name: 'Sketchy', value: 'sketchy' },
				{ name: 'Not safe for work', value: 'nsfw' },
			],
			hint: '- Space to select. Return to submit',
		},
		{
			type: 'list',
			name: 'sorting',
			message: "Please select your search's sort criteria?",
			choices: [
				{ name: 'Date Added', value: 'date_added' },
				{ name: 'Relevance', value: 'relevance' },
				{ name: 'Randomly', value: 'random' },
				{ name: 'Number of views', value: 'views' },
				{ name: 'Favorites', value: 'favorites' },
				{ name: 'Top List', value: 'toplist' },
			],
		},
		{
			when: function (answers) {
				return answers.sorting === 'toplist';
			},
			type: 'list',
			name: 'topRange',
			message: "Please select your search's toplist range?",
			choices: [
				{ name: '1 Day ago', value: '1d' },
				{ name: '3 Days ago', value: '3d' },
				{ name: '1 Week ago', value: '1w' },
				{ name: '1 Month ago', value: '1M' },
				{ name: '3 Months ago', value: '3M' },
				{ name: '6 Months ago', value: '6M' },
				{ name: '1 Year ago', value: '1y' },
			],
		},
		{
			type: 'list',
			name: 'order',
			message: "Please select your search's order criteria?",
			choices: [
				{ name: 'Descending', value: 'desc' },
				{ name: 'Ascending', value: 'asc' },
			],
		},
		{
			type: 'list',
			name: 'size',
			message: 'How would you like to determine the size of the wallpaper?',
			choices: [
				{ name: 'Resolution', value: 'resolution' },
				{ name: 'Ratio', value: 'ratio' },
			],
		},
		{
			when: function (answers) {
				return answers.size === 'resolution';
			},
			type: 'list',
			name: 'resolution',
			message: "Please select your search's resolution criteria?",
			choices: [{ name: '1920x1080', value: '1920x1080' }],
		},
		{
			when: function (answers) {
				return answers.size === 'ratio';
			},
			type: 'list',
			name: 'ratio',
			message: "Please select your search's ratio criteria?",
			choices: [
				{ name: '16x9', value: '16x9' },
				{ name: '16x10', value: '16x10' },
			],
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
			choices: [
				{ name: '660000', value: '660000' },
				{ name: '993399', value: '993399' },
			],
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
