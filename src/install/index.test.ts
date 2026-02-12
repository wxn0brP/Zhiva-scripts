import { test, expect } from "bun:test";
import {
	isArchiveInput,
	isHttpGitInput,
} from "./strategy";

test("Installation strategy detection", () => {
	const strategies: ((input: string) => boolean)[] = [
		isArchiveInput,
		isHttpGitInput,
		() => true
	];

	function testExpect(input: string) {
		for (let i = 0; i < strategies.length; i++) {
			if (strategies[i](input)) return i;
		}
	}

	expect(testExpect("https://example.com/app.zip")).toBe(0);
	expect(testExpect("file.tar.gz")).toBe(0);
	expect(testExpect("https://github.com/user/repo.git")).toBe(1);
	expect(testExpect("https://github.com/user/repo.git#branch")).toBe(1);
	expect(testExpect("https://github.com/user/repo")).toBe(1);
	expect(testExpect("https://github.com/user/repo#branch")).toBe(1);
	expect(testExpect("repo")).toBe(2);
	expect(testExpect("user/repo")).toBe(2);
})
