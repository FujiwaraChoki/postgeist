#!/bin/bash

# Postgeist Installation Script
# Builds and installs the postgeist binary to your system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Detect platform
detect_platform() {
    local os=$(uname -s)
    local arch=$(uname -m)

    case $os in
        Darwin*)
            if [[ $arch == "arm64" ]]; then
                echo "macos-arm64"
            else
                echo "macos"
            fi
            ;;
        Linux*)
            echo "linux"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            echo "windows"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Print banner
print_banner() {
    echo -e "${CYAN}"
    echo "🚀 Postgeist Installation Script"
    echo "================================="
    echo -e "${NC}"
}

# Check if bun is installed
check_bun() {
    if ! command -v bun &> /dev/null; then
        echo -e "${RED}❌ Bun is not installed!${NC}"
        echo -e "${YELLOW}Please install Bun first: https://bun.sh${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Bun found: $(bun --version)${NC}"
}

# Build binary
build_binary() {
    local platform=$1
    echo -e "${BLUE}📦 Building binary for $platform...${NC}"

    case $platform in
        macos-arm64)
            bun run build:macos-arm
            BINARY_NAME="postgeist-macos-arm64"
            ;;
        macos)
            bun run build:macos
            BINARY_NAME="postgeist-macos"
            ;;
        linux)
            bun run build:linux
            BINARY_NAME="postgeist-linux"
            ;;
        windows)
            bun run build:windows
            BINARY_NAME="postgeist-windows.exe"
            ;;
        *)
            echo -e "${RED}❌ Unsupported platform: $platform${NC}"
            exit 1
            ;;
    esac

    if [[ ! -f "dist/$BINARY_NAME" ]]; then
        echo -e "${RED}❌ Build failed! Binary not found at dist/$BINARY_NAME${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Binary built successfully!${NC}"
}

# Install binary
install_binary() {
    local platform=$1
    local install_dir="/usr/local/bin"
    local binary_path="dist/$BINARY_NAME"
    local target_name="postgeist"

    # Check if we need sudo
    if [[ ! -w "$install_dir" ]]; then
        echo -e "${YELLOW}🔒 Installing to $install_dir requires sudo...${NC}"
        sudo cp "$binary_path" "$install_dir/$target_name"
        sudo chmod +x "$install_dir/$target_name"
    else
        cp "$binary_path" "$install_dir/$target_name"
        chmod +x "$install_dir/$target_name"
    fi

    echo -e "${GREEN}✅ Postgeist installed to $install_dir/$target_name${NC}"
}

# Verify installation
verify_installation() {
    if command -v postgeist &> /dev/null; then
        echo -e "${GREEN}✅ Installation verified!${NC}"
        echo -e "${CYAN}📋 Version: $(postgeist --version)${NC}"
        echo ""
        echo -e "${YELLOW}🎉 Installation complete!${NC}"
        echo -e "${BLUE}💡 Run 'postgeist --setup' to get started${NC}"
        echo -e "${BLUE}💡 Run 'postgeist --help' for usage information${NC}"
    else
        echo -e "${RED}❌ Installation verification failed!${NC}"
        echo -e "${YELLOW}You may need to restart your terminal or add /usr/local/bin to your PATH${NC}"
        exit 1
    fi
}

# Main installation process
main() {
    print_banner

    echo -e "${BLUE}🔍 Checking requirements...${NC}"
    check_bun

    local platform=$(detect_platform)
    echo -e "${BLUE}🖥️  Detected platform: $platform${NC}"

    if [[ $platform == "unknown" ]]; then
        echo -e "${RED}❌ Unsupported platform!${NC}"
        echo -e "${YELLOW}Supported platforms: macOS, Linux, Windows${NC}"
        exit 1
    fi

    # Create dist directory if it doesn't exist
    mkdir -p dist

    # Build and install
    build_binary "$platform"
    install_binary "$platform"
    verify_installation
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Postgeist Installation Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --uninstall    Uninstall postgeist"
        echo ""
        echo "This script will:"
        echo "  1. Detect your platform (macOS/Linux/Windows)"
        echo "  2. Build the appropriate binary using Bun"
        echo "  3. Install it to /usr/local/bin"
        echo ""
        exit 0
        ;;
    --uninstall)
        echo -e "${YELLOW}🗑️  Uninstalling postgeist...${NC}"
        if [[ -f "/usr/local/bin/postgeist" ]]; then
            if [[ -w "/usr/local/bin" ]]; then
                rm "/usr/local/bin/postgeist"
            else
                sudo rm "/usr/local/bin/postgeist"
            fi
            echo -e "${GREEN}✅ Postgeist uninstalled successfully!${NC}"
        else
            echo -e "${YELLOW}⚠️  Postgeist is not installed in /usr/local/bin${NC}"
        fi
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        echo "Run '$0 --help' for usage information"
        exit 1
        ;;
esac
