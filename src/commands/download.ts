import ora from 'ora';
import conf from 'conf';
import inquirer from 'inquirer';
import axios from 'axios';
import fs from 'fs';
import clear from 'clear';
import ProgressBar from 'progress';
import { IDownloadParameters } from '../models/IDownloadParameters.js';
import { IUserConfiguration } from '../models/IUserConfiguration.js';
import { promptConfiguration, createSearchConfigurationPrompts, processSearchConfigurationPrompts } from './config.js';
import util from 'util';
import stream from 'stream';
import { getFigletCLIName, getFilename } from './utils.js';

const configuration = new conf({ projectName: 'wallhaven-cli' });
const pipeline = util.promisify(stream.pipeline);

export async function promptDownload() {
	await checkUserConfiguration();
}

async function checkUserConfiguration() {
	const spinner = ora('Checking for user configuration...').start();
	const userConfiguration: IUserConfiguration = configuration.get('user-configuration') as IUserConfiguration;

	if (userConfiguration === undefined || !userConfiguration.hasOwnProperty('apiKey')) {
		spinner.fail("You currently don't have an API Key stored.");
		await promptConfiguration({});
		spinner.succeed(`Successfully created configuration`);
	} else {
		spinner.succeed(`Successfully found user configuration`);
	}

	spinner.start('Checking for user search configuration');
	const searchConfiguration = await checkUserSavedSearch();

	spinner.succeed('Successfully processed search configuration');

	const params = await setDownloadParameters(userConfiguration, searchConfiguration);
	const downloadList = [];

	spinner.start('Retrieveing download list...');
	await getDownloadList(+userConfiguration.downloadLimit, params, downloadList);
	spinner.succeed('Successfully retrieved download list');
	spinner.info('Beginning to download wallpapers...');
	await downloadWallpapers(downloadList, userConfiguration.downloadDirectory);
}

async function checkUserSavedSearch() {
	const searchConfiguration = configuration.get('user-search');
	if (searchConfiguration === undefined || !searchConfiguration.hasOwnProperty('query')) {
		const questions = await createSearchConfigurationPrompts();
		const response = await inquirer.prompt(questions);
		const results = await processSearchConfigurationPrompts(response);

		const searchResponse = await inquirer.prompt({
			type: 'confirm',
			name: 'search',
			message: 'Would you like to save this search configuration?',
		});

		if (searchResponse) {
			configuration.set('user-search', {
				...results,
			});

			return configuration.get('user-search');
		} else {
			return results;
		}
	} else {
		return configuration.get('user-search');
	}
}

async function getDownloadList(downloadLimit, params, downloadList) {
	if (!params.page) {
		params.page = 1;
	}

	const wallhavenResults = await axios.get(`https://wallhaven.cc/api/v1/search`, {
		params: params,
		headers: {
			'Accept-Encoding': '*',
		},
	});

	for (const wallpaper of wallhavenResults.data.data) {
		const cachedDownloads: Array<string> = (configuration.get('downloaded-list') as Array<string>) || [];

		const filename = getFilename(wallpaper.path);
		if (!cachedDownloads.includes(filename)) {
			downloadList.push(wallpaper.path);
		}

		if (downloadList.length === downloadLimit) {
			break;
		}
	}

	if (downloadList.length < downloadLimit) {
		params.page++;
		await getDownloadList(downloadLimit, params, downloadList);
	}

	return downloadList;
}

async function setDownloadParameters(userConfiguration, searchConfiguration) {
	const params: IDownloadParameters = {
		apikey: userConfiguration.apiKey,
		q: searchConfiguration.query,
		categories: searchConfiguration.category,
		purity: searchConfiguration.purity,
		sorting: searchConfiguration.sorting,
		order: searchConfiguration.order,
	};

	if (searchConfiguration.sorting === 'toplist') {
		params.topRange = searchConfiguration.topRange;
	}

	if (searchConfiguration.ratio) {
		params.ratio = searchConfiguration.ratio;
	}

	if (searchConfiguration.resolution) {
		params.resolutions = searchConfiguration.resolution;
	}

	return params;
}

async function downloadWallpapers(downloadList: string[], downloadDirectory: string) {
	let downloadNumber = 1;
	const cachedDownloads: Array<string> = (configuration.get('downloaded-list') as Array<string>) || [];

	for (const url of downloadList) {
		clear();
		getFigletCLIName();
		console.log(`Downloading file ${downloadNumber} of ${downloadList.length}`);
		const filename = getFilename(url);
		const { data, headers } = await axios({
			url,
			method: 'GET',
			responseType: 'stream',
		});

		const totalLength = headers['content-length'];

		const progressBar = new ProgressBar('-> downloading [:bar] :percent :etas', {
			width: 40,
			complete: '=',
			incomplete: ' ',
			renderThrottle: 1,
			total: parseInt(totalLength),
		});

		await data.on('data', async (chunk) => progressBar.tick(chunk.length));
		await pipeline(data, fs.createWriteStream(`${downloadDirectory}/${filename}`));
		console.log(`Successfully downloaded ${downloadNumber} of ${downloadList.length}`);
		clear();
		cachedDownloads.push(filename);
		downloadNumber++;
	}

	configuration.set('downloaded-list', cachedDownloads);
	getFigletCLIName();
	ora().succeed(`Successfully downloaded wallpapers`);
}
