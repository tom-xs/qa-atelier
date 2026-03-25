plugins {
    kotlin("jvm") version "2.0.0" apply false
}

subprojects {
    repositories {
        mavenCentral()
        google()
    }
}

// Convenience tasks to run all tests from the root
tasks.register("testAll") {
    dependsOn(
        ":web:test",
        ":android:test"
    )
}

tasks.register("smokeAll") {
    dependsOn(
        ":web:test",
        ":android:test"
    )
    gradle.startParameter.projectProperties["tags"] = "smoke"
}
