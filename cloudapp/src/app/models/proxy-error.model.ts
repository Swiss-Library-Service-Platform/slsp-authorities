export interface ProxyError {
	errorsExist: boolean;
	errorList: ProxyErrorList;
}

export interface ProxyErrorList {
	error: ProxyErrorItem[];
}

export interface ProxyErrorItem {
	errorCode: string;
	errorMessage: string;
	trackingId: string;
}
