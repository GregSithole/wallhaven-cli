export interface IDownloadParameters {
	apikey: string;
	q: string;
	categories: string;
	purity: string;
	sorting: string;
	order: string;
	topRange?: string;
	ratio?: string;
	resolutions?: string;
	page?: number;
}
