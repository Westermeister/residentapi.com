.PHONY: all
all: content eslint prettier dist scripts styles

.PHONY: clean
clean:
	rm -rf ./frontend/dist
	rm -rf ./backend/dist

.PHONY: content
content: dist
	cp frontend/src/*.html frontend/dist
	cp frontend/src/favicon.png frontend/dist
	cp frontend/src/sitemap.xml frontend/dist
	cp frontend/src/robots.txt frontend/dist

.PHONY: eslint
eslint: prettier
	npx eslint "./frontend/src/**/*.tsx" "./backend/src/**/*.ts"

.PHONY: prettier
prettier:
	npx prettier --write "./*.json" "./*.js" "./frontend/src" "./backend/src/**/*.ts"

.PHONY: dist
dist:
	mkdir -p frontend/dist
	mkdir -p backend/dist

.PHONY: scripts
scripts: prettier dist
	npx babel --presets react-app/prod -o frontend/dist/signup.js frontend/src/signup.jsx
	npx tsc
	cp -r ./backend/src/tables ./backend/dist

.PHONY: styles
styles: prettier dist
	npx sass frontend/src/main.scss:frontend/dist/main.css --no-source-map --quiet
	NODE_ENV=production npx postcss frontend/dist/main.css --replace
