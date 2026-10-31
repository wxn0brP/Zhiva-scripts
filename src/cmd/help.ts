import { bold, cyan, dim } from "../utils/color";

console.log(
	`
${bold("Zhiva CLI")} - A tool for managing Zhiva applications
${dim("--------------------------------------------------")}

${bold("Usage:")}
  zhiva <command> [options]

${bold("Commands:")}
  ${cyan("start")} [app-name]            Start an application
  ${cyan("install")} <app-name>          Install an application from a GitHub repository
  ${cyan("create")} [name]               Create a new application from the template
  ${cyan("uninstall")} <app-name>        Uninstall an installed application
  ${cyan("list")}                        List installed applications
  ${cyan("open")} <link>                 Open an application in the browser
  ${cyan("self")}                        Update Zhiva
  ${cyan("update")}                      Update Zhiva applications
  ${cyan("guess")} [app-name]            Find an app by name
  ${cyan("search")} [query]              Search for apps
  ${cyan("cdf")} <app-name>              Create desktop file for an installed application
  ${cyan("db")} <...args>                Interact with Zhiva database
  ${cyan("protocol")} <url>              Zhiva protocol handler
  ${cyan("doctor")}                      Check the Zhiva installation
  ${cyan("version")}                     Show version information
  ${cyan("help")}                        Show this help message

${dim("--------------------------------------------------")}
${bold("Command Details:")}

  ${cyan("start")} <app-name>            Start a Zhiva application
    ${dim("Aliases:")}  run, startup, o, r
    ${dim("Options:")}
      -h, --help              Show help for the start command
      -e, --engine <mode>     Update Zhiva engine (default: 0)
      -d, --deps <mode>       Update Zhiva dependencies (default: 0)
      -u, --update            Force engine and deps update

    ${dim("Mode:")}
      0 = auto (at most once per hour)
      1 = skip
      2 = force

    ${dim("Examples:")}
      zhiva start Zhiva-store-app
      zhiva start username/my-repo
      zhiva start . --update

  ${cyan("install")} <app-name>          Install an application
    ${dim("Aliases:")}  i, add
    ${dim("Options:")}
      --shortcut, -s <value>  Control desktop shortcuts
         "m" - menu
         "d" - desktop
         "n" - no shortcut
         or absolute path
      --name, -n <name>       Set the app name (required only for archives
                              when it cannot be derived from the file name)

    ${dim("Examples:")}
      zhiva install Zhiva-store-app
      zhiva install username/repo
      zhiva install ./my-app.zip

  ${cyan("create")} [name]               Create a new application from the template
    ${dim("Aliases:")}  new
    ${dim("Options:")}
      --template, -t <url>     Template repository (default: Zhiva-template-app)
      --author, -a <name>      Author name (default: git user.name)
      --display-name <name>    Display name (default: derived from app name)
      --description <text>     Description (default: display name)
      --no-install             Skip dependency installation
      --no-input               Do not ask questions
      -h, --help               Show help for the create command

    When the name is omitted, create asks for the directory. Without metadata
    flags, it also asks for the display name, author and description.

    ${dim("Examples:")}
      zhiva create my-app
      zhiva create my-app --author wxn0brP --description "My first app"
      zhiva create my-app --template https://github.com/user/repo.git

  ${cyan("uninstall")} <app-name>        Remove an installed application
    ${dim("Aliases:")}  rm, remove

    ${dim("Examples:")}
      zhiva uninstall Zhiva-store-app
      zhiva uninstall username/repo

  ${cyan("list")}                        List installed applications
    ${dim("Aliases:")}  l, ls
    ${dim("Options:")}
      --json                  Output as JSON

  ${cyan("open")} <link>                 Open an application in the browser
    ${dim("Aliases:")}  link

    ${dim("Examples:")}
      zhiva open https://github.com/wxn0brP/Zhiva-store-app
      zhiva link https://wxn0brp.github.io

  ${cyan("self")}                        Update Zhiva
    ${dim("Aliases:")}  update-self, self-update

  ${cyan("update")}                      Update Zhiva applications
    ${dim("Aliases:")}  u, up
    ${dim("Options:")}
      --json                  Output as JSON (try mode)

    ${dim("Examples:")}
      zhiva update
      zhiva update --json

  ${cyan("guess")} [name]                Find an app by name (fuzzy match, data from local apps)
    ${dim("Aliases:")}  find

    ${dim("Examples:")}
      zhiva guess
      zhiva guess Zhiva

  ${cyan("search")} [query]              Search for apps by name (fuzzy match, data from GitHub)
    ${dim("Aliases:")}  s

    ${dim("Options:")}
      --json                  Output as JSON
      --pretty                Output as pretty JSON

    ${dim("Examples:")}
      zhiva search
      zhiva search Zhiva-store-app

  ${cyan("cdf")} <app-name> <flags>      Create desktop file for an installed application
    ${dim("Aliases:")}  create-desktop-file
    ${dim("Flags:")}
      d                       Desktop
      m                       Menu

    ${dim("Examples:")}
      zhiva create-desktop-file Zhiva-store-app
      zhiva cdf username/repo d
      zhiva cdf username/repo dm

  ${cyan("doctor")}                      Check the Zhiva installation
    Verifies bun, git, the native webview libraries, PATH, the engine,
    the protocol handler and the local database.

  ${cyan("version")}                     Show version information
    ${dim("Aliases:")}  --version, -v, v
    ${dim("Options:")}
      --json                  Output as JSON

`.trimStart(),
);

export default () => {};
