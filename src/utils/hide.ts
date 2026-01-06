import { dlopen, FFIType } from "bun:ffi";

export function hideWindowsConsole() {
    if (process.env.ZHIVA_DO_NOT_HIDE_CONSOLE) return;

    const kernel32 = dlopen("kernel32.dll", {
        GetConsoleWindow: {
            args: [],
            returns: FFIType.ptr,
        },
    });

    const user32 = dlopen("user32.dll", {
        ShowWindow: {
            args: [FFIType.ptr, FFIType.i32],
            returns: FFIType.i32,
        },
    });

    const SW_HIDE = 0;

    const hwnd = kernel32.symbols.GetConsoleWindow();
    if (!hwnd) return

    user32.symbols.ShowWindow(hwnd, SW_HIDE);
}