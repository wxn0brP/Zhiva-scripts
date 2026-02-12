export interface InstallationResult {
	name: string;
	dir?: string;
}

export interface InstallationContext {
	input: string;
	previousCwd: string;
}

export type InstallationStrategy = (context: InstallationContext) => Promise<InstallationResult>;
