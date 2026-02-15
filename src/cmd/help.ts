console.log(`
Zhiva CLI - A tool for managing Zhiva applications
--------------------------------------------------

Usage:
  zhiva <command> [options]

Commands:
  start [app-name]            Start an application
  install <app-name>          Install an application from a GitHub repository
  uninstall <app-name>        Uninstall an installed application
  list                        List installed applications
  open <link>                 Open an application in the browser
  self                        Update Zhiva
  update                      Update Zhiva applications
  guess [app-name]            Find an app by name
  search [query]              Search for apps
  cdf <app-name>              Create desktop file for an installed application
  db <...args>                Interact with Zhiva database
  protocol <url>              Zhiva protocol handler
  help                        Show this help message

--------------------------------------------------
Command Details:

  start <app-name>            Start a Zhiva application
    Aliases:  run, startup, o, r
    Options:
      -h, --help              Show help for the start command
      -e, --engine <mode>     Update Zhiva engine
      -d, --deps <mode>       Update Zhiva dependencies

    Examples:
      zhiva start Zhiva-store-app
      zhiva start username/my-repo
      zhiva start init -e 2 -d 2

  install <app-name>          Install an application
    Aliases:  i, add
    Options:
      --shortcut, -s <value>  Control desktop shortcuts
         "m" - menu
         "d" - desktop
         or absolute path

    Examples:
      zhiva install Zhiva-store-app
      zhiva install username/repo

  uninstall <app-name>        Remove an installed application
    Aliases:  rm, remove

    Examples:
      zhiva uninstall Zhiva-store-app
      zhiva uninstall username/repo

  list                        List installed applications
    Aliases:  l, ls
    Options:
      --json                  Output as JSON

  open <link>                 Open an application in the browser
    Aliases:  link

    Examples:
      zhiva open https://github.com/wxn0brP/Zhiva-store-app
      zhiva link https://wxn0brp.github.io

  self                        Update Zhiva
    Aliases:  update-self, self-update

  update                      Update Zhiva applications
    Aliases:  u, up
    Options:
      --json                  Output as JSON (try mode)

    Examples:
      zhiva update
      zhiva update --json

  guess [name]                Find an app by name (fuzzy match, data from local apps)
    Aliases:  find

    Examples:
      zhiva guess
      zhiva guess Zhiva

  search [query]              Search for apps by name (fuzzy match, data from GitHub)
    Aliases:  s

    Options:
      --json                  Output as JSON
      --pretty                Output as pretty JSON

    Examples:
      zhiva search
      zhiva search Zhiva-store-app

  cdf <app-name> <flags>      Create desktop file for an installed application
    Aliases:  create-desktop-file
    Flags:
      d                       Desktop
      m                       Menu

    Examples:
      zhiva create-desktop-file Zhiva-store-app
      zhiva cdf username/repo d
      zhiva cdf username/repo dm

`.trimStart());

export default () => { }
