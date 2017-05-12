DIST := dist
FILEBASE := min-vid
VERSION := `cat install.rdf | tr '\n' ' ' | sed "s/.*<em:version>\(.*\)<\/em:version>.*/\1/"`
PWD := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
FILENAME := "addon.xpi"
XPI := $(PWD)/$(DIST)/$(FILENAME)`""`
ADDON_DIR := addon

all:
	@$(MAKE) build

build:
	@mkdir -p $(DIST)
	@rm -f $(XPI)
	@zip -r $(XPI) . -x locales/\* -x frontend/\* -x webextension/lib/\* -x webextension/background.js -x LICENSE -x Makefile -x stories/\* -x dist/\* -x webpack.config.js -x docs/\* -x node_modules/\* -x bin/\* -x .git/\* -x .\* -x \*.md -x index.html > /dev/null
	@echo "Built: $(XPI)"
