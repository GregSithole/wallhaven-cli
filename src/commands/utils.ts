import figlet from 'figlet';

export function getUserHome() {
	return process.env.HOME || process.env.USERPROFILE;
}

export function getFilename(url) {
	return url.substring(url.lastIndexOf('/') + 1);
}

export function getFigletCLIName() {
	console.log(figlet.textSync('Wallhaven CLI'));
}
