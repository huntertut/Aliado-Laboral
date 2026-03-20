# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Stripe SDK - mantener todas las clases de Stripe
-keep class com.stripe.** { *; }
-keep class com.reactnativestripesdk.** { *; }

# Stripe Push Provisioning (tarjetas NFC fisicas - no usada en esta app)
# R8 reporta esta clase como faltante porque es un modulo opcional de Stripe.
# Se suprime el warning para que el build continue.
-dontwarn com.stripe.android.pushProvisioning.**
-dontwarn com.reactnativestripesdk.pushprovisioning.**

# Add any project specific keep options here:
