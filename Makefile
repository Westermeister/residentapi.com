.PHONY: all
all:
	npx prettier --write "backend/**/*.js" "*.json"
	npx eslint "**/*.js"
