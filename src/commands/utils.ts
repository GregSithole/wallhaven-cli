export function getUserHome() {
	return process.env.HOME || process.env.USERPROFILE;
}
