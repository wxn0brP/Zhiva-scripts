import { styleText } from "util";

type Format = Parameters<typeof styleText>[0];

const paint = (format: Format, text: string) => styleText(format, text);

export const red = (text: string) => paint("red", text);
export const green = (text: string) => paint("green", text);
export const yellow = (text: string) => paint("yellow", text);
export const cyan = (text: string) => paint("cyan", text);
export const dim = (text: string) => paint("dim", text);
export const bold = (text: string) => paint("bold", text);
