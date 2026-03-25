plugins {
    kotlin("jvm")
}

dependencies {
    // Appium Java client covers both AppiumDriver and UIAutomator2
    implementation("io.appium:java-client:9.3.0")

    // Selenium 4 — also pulled transitively by Appium, but declared
    // explicitly so the version is pinned here, not left to Appium
    implementation("org.seleniumhq.selenium:selenium-java:4.21.0")

    // HOCON config — used for per-environment capability files
    implementation("com.typesafe:config:1.4.3")

    // AssertJ — fluent assertions shared across both test modules
    implementation("org.assertj:assertj-core:3.26.0")
}
