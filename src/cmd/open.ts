import { openWindow } from "@wxn0brp/zhiva-base-lib/openWindow";

export default (args: string[]) => {
    openWindow(args[0], args[1] || "Zhiva");
}