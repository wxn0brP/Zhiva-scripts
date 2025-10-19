#!/bin/bash

if ! command -v bun &> /dev/null; then
    echo "bun is not installed."
    read -p "Do you want to install bun? (y/n): " choice
    if [[ "$choice" =~ ^[Yy]$ ]]; then
        echo "Installing bun..."
        curl -fsSL https://bun.sh/install | bash

        export PATH="$HOME/.bun/bin:$PATH"
        echo "Added ~/.bun/bin to PATH for current session."
        echo "💜 Don't forget to add 'export PATH=\"\$HOME/.bun/bin:\$PATH\"' to your ~/.bashrc or ~/.zshrc."
    else
        echo "Skipped bun installation."
        exit 1
    fi
else
    echo "💜 bun is installed."
fi

if ! command -v git &> /dev/null; then
    echo "Error: git is not installed. Please install git manually."
    exit 1
else
    echo "💜 git is installed."
fi

mkdir -p $HOME/.zhiva/bin
if [ ! -d $HOME/.zhiva/scripts ]; then
    git clone https://github.com/wxn0brP/Zhiva-scripts.git $HOME/.zhiva/scripts
else
    git -C $HOME/.zhiva/scripts pull
fi
cd $HOME/.zhiva/scripts/zhiva
bun install --production
echo "💜 Zhiva-scripts is installed."

ln -s $HOME/.zhiva/scripts/zhiva/startup.ts $HOME/.zhiva/bin/zhiva-startup
ln -s $HOME/.zhiva/scripts/zhiva/install.ts $HOME/.zhiva/bin/zhiva-install
chmod +x $HOME/.zhiva/bin/*

echo "💜 Zhiva-startup is installed."