.PHONY: test-android test-playwright test-cypress test-selenium test-api test-all

test-android:
	cd android && ./gradlew connectedAndroidTest

test-playwright:
	cd web/playwright && npx playwright test

test-cypress:
	cd web/cypress && npx cypress run

test-selenium:
	cd web/selenium && pytest tests/ -v

# Requires RWA running locally: cd apps/rwa && yarn start
test-api:
	cd api && npm test

test-all: test-playwright test-cypress test-selenium test-android
