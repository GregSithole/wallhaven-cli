import ora from 'ora';
import inquirer from 'inquirer';
import conf from 'conf';

const configuration = new conf();

export async function config(args: any) {
	await checkUserConfigurationValues(args);
}

async function checkUserConfigurationValues(options: any) {
	const questions = [];

	if (!options.apiKey) {
		questions.push({
			type: 'invisible',
			name: 'apiKey',
			message: 'Please enter your Wallhaven API Key?',
		});
	}

	if (!options.downloadDirectory) {
		questions.push({
			type: 'text',
			name: 'downloadDirectory',
			message: 'Please enter the download Directory?',
		});
	}

	if (!options.downloadLimit) {
		questions.push({
			type: 'text',
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
