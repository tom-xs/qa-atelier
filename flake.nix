{
  description = "QA Atelier — Android & Web Test Automation";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
            android_sdk.accept_license = true;
          };
        };

        pythonEnv = pkgs.python3.withPackages (
          ps: with ps; [
            selenium
            pytest
            requests
          ]
        );

        androidPkgs = pkgs.androidenv.composeAndroidPackages {
          platformVersions = [ "33" ];
          abiVersions = [ "x86_64" ];
          includeEmulator = true;
          includeSystemImages = true;
          includeNDK = false;
        };

        androidSdk = androidPkgs.androidsdk;
      in
      {
        devShells.default = pkgs.mkShell {
          name = "qa-atelier";

          packages = with pkgs; [
            nodejs_22
            yarn # add yarn here
            playwright-driver

            playwright-driver
            cypress
            pythonEnv
            chromedriver
            chromium
            jdk17
            gradle
            android-tools
            androidSdk
            git
            jq
            curl
          ];

          shellHook = ''
            export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
            export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
            export CYPRESS_RUN_BINARY="${pkgs.cypress}/bin/Cypress"
            export ANDROID_HOME="${androidSdk}/libexec/android-sdk"
            export ANDROID_SDK_ROOT="$ANDROID_HOME"
            export JAVA_HOME="${pkgs.jdk17}"
            export PATH="$ANDROID_HOME/platform-tools:$PATH"

            echo ""
            echo "  QA Atelier devShell ready"
            echo "  node $(node -v) | python $(python --version) | java $(java -version 2>&1 | head -1)"
            echo ""
          '';
        };
      }
    );
}
