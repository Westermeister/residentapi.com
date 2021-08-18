.PHONY: all
all: dist
	npx prettier --write "backend/**/*.js" "*.json" "*.js" "frontend/src/**/*.{html,jsx,scss}"
	npx eslint "**/*.js"
	npx sass frontend/src/main.scss:frontend/dist/main.css --no-source-map --quiet
	NODE_ENV=production npx postcss frontend/dist/main.css --replace
	cp frontend/src/*.html frontend/dist
	cp frontend/src/favicon.png frontend/dist

.PHONY: dist
dist:
	mkdir -p frontend/dist

.PHONY: clean
clean:
	rm -rf frontend/dist
