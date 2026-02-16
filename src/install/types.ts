export interface InstallationResult {
	name: string;
	dir?: string;
}

export interface InstallOptions {
	name: string;
}

export interface InstallationContext extends InstallOptions {
	input: string;
	previousCwd: string;
}

export type InstallationStrategy = (context: InstallationContext) => Promise<InstallationResult>;
