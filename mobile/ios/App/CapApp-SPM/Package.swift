// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.3.4"),
        .package(name: "CapacitorCommunityAppleSignIn", path: "../../../node_modules/.pnpm/@capacitor-community+apple-sign-in@7.1.0_patch_hash=28573c99dd9ec8f13261292e64a7a530c46_8da6504712260f152653a29b8fd980a3/node_modules/@capacitor-community/apple-sign-in"),
        .package(name: "CapacitorFirebaseMessaging", path: "../../../node_modules/.pnpm/@capacitor-firebase+messaging@8.2.0_@capacitor+core@8.3.4_firebase@12.14.0/node_modules/@capacitor-firebase/messaging"),
        .package(name: "CapacitorApp", path: "../../../node_modules/.pnpm/@capacitor+app@8.1.0_@capacitor+core@8.3.4/node_modules/@capacitor/app"),
        .package(name: "CapacitorBrowser", path: "../../../node_modules/.pnpm/@capacitor+browser@8.0.3_@capacitor+core@8.3.4/node_modules/@capacitor/browser"),
        .package(name: "CapacitorCamera", path: "../../../node_modules/.pnpm/@capacitor+camera@8.2.0_@capacitor+core@8.3.4/node_modules/@capacitor/camera"),
        .package(name: "CapacitorGeolocation", path: "../../../node_modules/.pnpm/@capacitor+geolocation@8.2.0_@capacitor+core@8.3.4/node_modules/@capacitor/geolocation"),
        .package(name: "CapacitorPreferences", path: "../../../node_modules/.pnpm/@capacitor+preferences@8.0.1_@capacitor+core@8.3.4/node_modules/@capacitor/preferences")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorCommunityAppleSignIn", package: "CapacitorCommunityAppleSignIn"),
                .product(name: "CapacitorFirebaseMessaging", package: "CapacitorFirebaseMessaging"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorBrowser", package: "CapacitorBrowser"),
                .product(name: "CapacitorCamera", package: "CapacitorCamera"),
                .product(name: "CapacitorGeolocation", package: "CapacitorGeolocation"),
                .product(name: "CapacitorPreferences", package: "CapacitorPreferences")
            ]
        )
    ]
)
