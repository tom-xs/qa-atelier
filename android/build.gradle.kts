plugins {
    kotlin("jvm")
}

dependencies {
    implementation(project(":shared"))

    testImplementation("org.junit.jupiter:junit-jupiter:5.10.3")
    testImplementation("io.qameta.allure:allure-junit5:2.27.0")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.test {
    useJUnitPlatform()

    // Pass -Dtags="smoke" from the command line to filter by tag
    val tags = System.getProperty("tags")
    if (tags != null) {
        useJUnitPlatform {
            includeTags(tags)
        }
    }

    systemProperty(
        "allure.results.directory",
        layout.buildDirectory.dir("allure-results").get().asFile.absolutePath
    )

    // Print test names to console during the run
    testLogging {
        events("passed", "skipped", "failed")
    }
}
