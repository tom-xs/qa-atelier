plugins {
    kotlin("jvm")
}

dependencies {
    implementation(project(":shared"))

    // Automatically downloads and manages browser drivers
    testImplementation("io.github.bonigarcia:webdrivermanager:5.9.1")

    testImplementation("org.junit.jupiter:junit-jupiter:5.10.3")
    testImplementation("io.qameta.allure:allure-junit5:2.27.0")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.test {
    useJUnitPlatform()

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

    testLogging {
        events("passed", "skipped", "failed")
    }
}
