import { StatusBar } from "expo-status-bar";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolate,
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Path, Svg } from "react-native-svg";
import { snapPoint } from "react-native-redash";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import React from "react";
import { MAX_WIDTH, SIZE_WIDTH, StickyTab } from "./StickyTab";

const { width, height } = Dimensions.get("window");

export default function App() {
  const isOnEnd = useSharedValue(true);
  const sticked = useSharedValue(true);
  const sticking = useDerivedValue(() => withSpring(sticked.value ? 1 : 0));
  const translateX = useSharedValue(0);
  const progress = useDerivedValue(
    () =>
      sticking.value *
      interpolate(translateX.value, [0, MAX_WIDTH], [0, 1], Extrapolate.CLAMP)
  );
  const panGesture = Gesture.Pan()
    .onBegin(({ translationX }) => {
      cancelAnimation(translateX);
      translateX.value = translationX;
    })
    .onChange(({ translationX }) => {
      translateX.value = translationX;
      if (translateX.value > MAX_WIDTH) {
        sticked.value = false;
      }
    })
    .onEnd(({ velocityX: velocity }) => {
      const dest = snapPoint(translateX.value, velocity, [
        0,
        width - SIZE_WIDTH,
      ]);
      translateX.value = withSpring(dest, { velocity }, () => {
        sticked.value = true;
        if (dest !== 0) {
          isOnEnd.value = !isOnEnd.value;
          translateX.value = 0;
        }
      });
    });

  const container = useAnimatedStyle(() => ({
    transform: [{ rotate: isOnEnd.value ? "0deg" : "180deg" }],
  }));
  const style = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: (1 - sticking.value) * translateX.value,
        },
      ],
      justifyContent: "center",
    };
  });
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={[styles.container, container]}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[StyleSheet.absoluteFill, style]}>
            <StickyTab progress={progress} />
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
