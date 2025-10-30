#!/usr/bin/env bun

console.log(`
Zhiva CLI - A tool for managing Zhiva applications
--------------------------------------------------

Usage:
  zhiva <command> [options]

Commands:
  start <app-name>           Start an application
  install <app-name>         Install an application from a GitHub repository
  uninstall <app-name>       Uninstall an installed application
  list                       List installed applications
  help                       Show this help message

--------------------------------------------------
Command Details:

  start <app-name>           Start a Zhiva application
    Aliases:  run, startup, o, r
    Options:
      -h, --help             Show help for the start command
      -e, --engine <mode>    Update Zhiva engine
      -d, --deps <mode>      Update Zhiva dependencies

    Examples:
      zhiva start Zhiva-store-app
      zhiva start username/my-repo
      zhiva start init -e 2 -d 2

  install <app-name>         Install an application
    Aliases:  i, add

    Examples:
      zhiva install Zhiva-store-app
      zhiva install username/repo

  uninstall <app-name>       Remove an installed application
    Aliases:  rm, remove

    Examples:
      zhiva uninstall Zhiva-store-app
      zhiva uninstall username/repo

  list                       List installed applications
    Aliases:  l, ls
`.trimStart());
