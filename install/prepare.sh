#!/bin/bash

if ! command -v bun &> /dev/null; then
    echo "[Z-SCR-5-01] bun is not installed."
    read -p "Do you want to install bun? (y/n): " choice
    if [[ "$choice" =~ ^[Yy]$ ]]; then
        echo "[Z-SCR-5-02] Installing bun..."
        curl -fsSL https://bun.sh/install | bash

        export PATH="$HOME/.bun/bin:$PATH"
        echo "[Z-SCR-5-03] Added ~/.bun/bin to PATH for current session."
        echo "[Z-SCR-5-04] 💜 Don't forget to add 'export PATH=\"\$HOME/.bun/bin:\$PATH\"' to your ~/.bashrc or ~/.zshrc."
    else
        echo "[Z-SCR-5-05] Skipped bun installation."
        exit 1
    fi
else
    echo "[Z-SCR-5-06] 💜 bun is installed."
fi

if ! command -v git &> /dev/null; then
    echo "[Z-SCR-5-07] Error: git is not installed. Please install git manually."
    exit 1
else
    echo "[Z-SCR-5-08] 💜 git is installed."
fi

mkdir -p $HOME/.zhiva/bin
if [ ! -d $HOME/.zhiva/scripts ]; then
    git clone https://github.com/wxn0brP/Zhiva-scripts.git $HOME/.zhiva/scripts
else
    git -C $HOME/.zhiva/scripts pull
fi
cd $HOME/.zhiva/scripts/zhiva
bun install --production --force
echo "[Z-SCR-5-09] 💜 Zhiva-scripts is installed."

ln -s $HOME/.zhiva/scripts/zhiva/startup.ts $HOME/.zhiva/bin/zhiva-startup
ln -s $HOME/.zhiva/scripts/zhiva/install.ts $HOME/.zhiva/bin/zhiva-install
chmod +x $HOME/.zhiva/bin/*

echo "[Z-SCR-5-10] 💜 Zhiva-startup is installed."