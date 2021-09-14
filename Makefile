# Common paths.
FRONTEND_SRC=./src/frontend
BACKEND_SRC=./src/backend
FRONTEND_DIST=./dist/frontend
BACKEND_DIST=./dist/backend

.PHONY: all
all: content eslint prettier dist scripts styles

.PHONY: check
check:
	npx jest --runInBand tests

.PHONY: clean
clean:
	@echo -n "WARNING: Cleaning will remove production database. Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	rm -rf ./dist

.PHONY: content
content: dist
	cp $(FRONTEND_SRC)/*.html $(FRONTEND_DIST)
	cp $(FRONTEND_SRC)/favicon.png $(FRONTEND_DIST)
	cp $(FRONTEND_SRC)/sitemap.xml $(FRONTEND_DIST)
	cp $(FRONTEND_SRC)/robots.txt $(FRONTEND_DIST)

.PHONY: eslint
eslint: prettier
	npx eslint "$(FRONTEND_SRC)/**/*.jsx" "$(BACKEND_SRC)/**/*.ts"

.PHONY: prettier
prettier:
	npx prettier --write "./*.json" "./*.js" "$(FRONTEND_SRC)" "$(BACKEND_SRC)/**/*.ts"

.PHONY: dist
dist:
	mkdir -p $(FRONTEND_DIST)
	mkdir -p $(BACKEND_DIST)

.PHONY: scripts
scripts: prettier dist
	npx babel --presets react-app/prod -o $(FRONTEND_DIST)/signup.js $(FRONTEND_SRC)/signup.jsx
	npx tsc
	cp -r $(BACKEND_SRC)/tables $(BACKEND_DIST)

.PHONY: styles
styles: prettier dist
	npx sass $(FRONTEND_SRC)/main.scss:$(FRONTEND_DIST)/main.css --no-source-map --quiet
	NODE_ENV=production npx postcss $(FRONTEND_DIST)/main.css --replace
