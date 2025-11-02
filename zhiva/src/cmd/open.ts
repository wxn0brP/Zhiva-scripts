#!/usr/bin/env bun

import { openWindow } from "@wxn0brp/zhiva-base-lib/openWindow";

openWindow(process.argv[2], process.argv[3] || "Zhiva");