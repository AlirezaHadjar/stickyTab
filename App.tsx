import { StyleSheet } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { snapPoint } from "react-native-redash";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import React from "react";
import {
  CONTAINER_WIDTH,
  MAX_WIDTH,
  SIZE_WIDTH,
  StickyTab,
  TAB_PADDING,
  CONTAINER_BORDER_WIDTH,
} from "./StickyTab";

const MAX_DRAG =
  CONTAINER_WIDTH - 2 * TAB_PADDING - SIZE_WIDTH - CONTAINER_BORDER_WIDTH * 2;

export default function App() {
  const sticked = useSharedValue(true);
  const position = useSharedValue(0);
  const sticking = useDerivedValue(() => withSpring(sticked.value ? 1 : 0));
  const translateX = useSharedValue(0);
  const tabTranslation = useDerivedValue(
    () =>
      sticked.value
        ? position.value
        : position.value + (1 - sticking.value) * translateX.value,
    [sticked.value, position.value, translateX.value]
  );
  const progress = useDerivedValue(
    () =>
      sticking.value *
      interpolate(
        translateX.value,
        [-MAX_WIDTH, 0, MAX_WIDTH],
        [-1, 0, 1],
        Extrapolate.CLAMP
      )
  );
  const panGesture = Gesture.Pan()
    .onBegin(({ translationX }) => {
      // cancelAnimation(translateX);
      // translateX.value = translationX;
    })
    .onChange(({ translationX }) => {
      // console.log("change", translationX, offsetX.value);
      translateX.value = translationX;
      if (Math.abs(translationX) > MAX_WIDTH) {
        sticked.value = false;
      }
    })
    .onEnd(({ velocityX: velocity }) => {
      const dest = snapPoint(translateX.value + position.value, velocity, [
        0,
        MAX_DRAG,
      ]);

      const finalDest = sticked.value ? 0 : dest - position.value;
      translateX.value = withSpring(finalDest, { velocity }, () => {
        position.value = sticked.value ? position.value : dest;
        translateX.value = 0;
        sticked.value = true;
      });
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={styles.container}>
        <StickyTab
          progress={progress}
          translateX={tabTranslation}
          panGesture={panGesture}
        />
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
