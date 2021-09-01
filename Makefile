.PHONY: all
all: dist
	npx prettier --write "backend/**/*.js" "*.json" "*.js" "frontend/src/**/*.{html,jsx,scss}"
	npx eslint "**/*.js"
	npx sass frontend/src/main.scss:frontend/dist/main.css --no-source-map --quiet
	NODE_ENV=production npx postcss frontend/dist/main.css --replace
	cp frontend/src/*.html frontend/dist
	cp frontend/src/favicon.png frontend/dist
	cp frontend/src/sitemap.xml frontend/dist
	cp frontend/src/robots.txt frontend/dist
	npx babel --presets react-app/prod -o frontend/dist/signup.js frontend/src/signup.jsx

.PHONY: dist
dist:
	mkdir -p frontend/dist

.PHONY: clean
clean:
	rm -rf frontend/dist
