# Zhiva Scripts

This module contains a collection of utility scripts for managing the Zhiva development environment and applications.

## Role in the Zhiva Project

The `scripts` module provides the command-line tools that power the Zhiva ecosystem. These scripts automate common tasks such as installation, environment setup, and application management, making it easier for both developers and users to work with Zhiva.

## Primary Responsibilities

-   **Environment Setup**: Prepares the local environment by installing necessary dependencies like `bun` and cloning required repositories.
-   **Application Installation**: Provides a command-line tool (`zhiva-install`) for installing Zhiva applications from Git repositories.
-   **Application Lifecycle**: Includes scripts for starting (`zhiva-startup`) and managing Zhiva applications.
-   **Dependency Management**: Helps in keeping the core components of Zhiva up to date.

## Usage

The scripts are designed to be run from the command line. The main entry points are `prepare.sh` (for Linux/macOS) and `prepare.ps1` (for Windows), which set up the environment and the other scripts.

Example of installing and running an application:

```bash
# Install the store-app
~/.zhiva/bin/zhiva-install Zhiva-store-app

# Run the store-app
~/.zhiva/bin/zhiva-startup Zhiva-store-app
```